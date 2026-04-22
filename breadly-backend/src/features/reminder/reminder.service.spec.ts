import {
  createReminder,
  listReminders,
  cancelReminder,
  sendReminderEmail,
  processBatchReminders,
} from './reminder.service.js';
import * as schedulerService from '../scheduler/scheduler.service.js';
import * as emailHelper from './email.helper.js';

jest.mock('../scheduler/scheduler.service.js');
jest.mock('./email.helper.js');

const mockScheduler = schedulerService as jest.Mocked<typeof schedulerService>;
const mockEmail = emailHelper as jest.Mocked<typeof emailHelper>;

describe('reminder.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEmail.loadTemplate.mockReturnValue('<html>{{userName}} - {{recipeName}}</html>');
    mockEmail.interpolate.mockImplementation((template, vars) => {
      let result = template;
      for (const [key, value] of Object.entries(vars)) {
        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      }
      return result;
    });
    mockEmail.sendEmail.mockResolvedValue(undefined);
  });

  describe('createReminder', () => {
    it('creates a reminder with correct parameters', async () => {
      mockScheduler.listSchedules.mockResolvedValueOnce({ schedules: [], nextToken: undefined });
      mockScheduler.createSchedule.mockResolvedValueOnce(undefined);

      const result = await createReminder('user-123', 'user@example.com', {
        recipeId: 'recipe-456',
        scheduledAt: '2027-01-01T10:00:00+01:00',
        title: 'Bake bread',
        message: 'Start the sourdough',
      });

      expect(result.recipeId).toBe('recipe-456');
      expect(result.title).toBe('Bake bread');
      expect(result.id).toContain('reminder-user-123');
      expect(mockScheduler.createSchedule).toHaveBeenCalledTimes(1);
    });

    it('rejects scheduledAt in the past', async () => {
      await expect(
        createReminder('user-123', 'user@example.com', {
          recipeId: 'recipe-456',
          scheduledAt: '2020-01-01T10:00:00Z',
        }),
      ).rejects.toThrow('scheduledAt must be in the future');
    });

    it('rejects invalid scheduledAt', async () => {
      await expect(
        createReminder('user-123', 'user@example.com', {
          recipeId: 'recipe-456',
          scheduledAt: 'not-a-date',
        }),
      ).rejects.toThrow('Invalid scheduledAt datetime');
    });

    it('enforces per-user limit of 10', async () => {
      mockScheduler.listSchedules.mockResolvedValueOnce({
        schedules: Array(10).fill({ Name: 'schedule' }),
        nextToken: undefined,
      });

      await expect(
        createReminder('user-123', 'user@example.com', {
          recipeId: 'recipe-456',
          scheduledAt: '2027-01-01T10:00:00Z',
        }),
      ).rejects.toThrow('Maximum of 10 active reminders per user reached');
    });
  });

  describe('listReminders', () => {
    it('returns mapped reminders', async () => {
      mockScheduler.listSchedules.mockResolvedValueOnce({
        schedules: [{ Name: 'local-reminder-user1-abc123' }],
        nextToken: 'next',
      });

      const result = await listReminders('user1');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('local-reminder-user1-abc123');
      expect(result.nextToken).toBe('next');
    });
  });

  describe('cancelReminder', () => {
    it('deletes a reminder owned by the user', async () => {
      mockScheduler.deleteSchedule.mockResolvedValueOnce(undefined);

      // Schedule name format: {env}-reminder-{userId}-{uuid}
      const scheduleName = 'local-reminder-user-123-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
      await cancelReminder('user-123', scheduleName);

      expect(mockScheduler.deleteSchedule).toHaveBeenCalledWith(
        scheduleName,
        expect.any(String),
      );
    });

    it('rejects deletion by non-owner', async () => {
      const scheduleName = 'local-reminder-other-user-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
      await expect(
        cancelReminder('user-123', scheduleName),
      ).rejects.toThrow('Not authorized to delete this reminder');
    });
  });

  describe('sendReminderEmail', () => {
    it('sends an email with interpolated template', async () => {
      await sendReminderEmail({
        recipientEmail: 'user@example.com',
        recipeId: 'recipe-123',
        recipeName: 'Sourdough Bread',
        title: 'Time to bake',
        message: 'Your sourdough is ready',
        appUrl: 'https://breadly.app',
      });

      expect(mockEmail.loadTemplate).toHaveBeenCalledWith('reminder');
      expect(mockEmail.sendEmail).toHaveBeenCalledTimes(1);
      expect(mockEmail.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
        }),
      );
    });
  });

  describe('processBatchReminders', () => {
    it('sends greeting emails to all userIds', async () => {
      await processBatchReminders({
        type: 'greeting',
        userIds: ['user1@example.com', 'user2@example.com'],
      });

      expect(mockEmail.loadTemplate).toHaveBeenCalledWith('greeting');
      expect(mockEmail.sendEmail).toHaveBeenCalledTimes(2);
    });

    it('continues sending even if one fails', async () => {
      mockEmail.sendEmail
        .mockRejectedValueOnce(new Error('SES error'))
        .mockResolvedValueOnce(undefined);

      await processBatchReminders({
        type: 'greeting',
        userIds: ['user1@example.com', 'user2@example.com'],
      });

      expect(mockEmail.sendEmail).toHaveBeenCalledTimes(2);
    });

    it('logs warning for unknown batch type', async () => {
      await processBatchReminders({
        type: 'unknown',
        userIds: ['user1@example.com'],
      });

      expect(mockEmail.sendEmail).not.toHaveBeenCalled();
    });
  });
});
