import {
  createReminder,
  listReminders,
  cancelReminder,
  sendReminderEmail,
  processBatchReminders,
} from './reminder.service.js';
import * as schedulerService from '../scheduler/scheduler.service.js';
import * as reminderRepository from './reminder.repository.js';
import * as emailHelper from './email.helper.js';

jest.mock('../scheduler/scheduler.service.js');
jest.mock('./reminder.repository.js');
jest.mock('./email.helper.js');

const mockScheduler = schedulerService as jest.Mocked<typeof schedulerService>;
const mockRepo = reminderRepository as jest.Mocked<typeof reminderRepository>;
const mockEmail = emailHelper as jest.Mocked<typeof emailHelper>;

const activeReminder = {
  id: 'local-reminder-user-123-abc',
  recipeId: 'recipe-1',
  scheduledAt: '2027-01-01T09:00:00.000Z',
  title: 'Test',
  message: 'Msg',
  status: 'active' as const,
};

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
    mockRepo.createRecord.mockResolvedValue(undefined);
    mockRepo.deleteRecord.mockResolvedValue(undefined);
    mockRepo.updateStatus.mockResolvedValue(undefined);
    mockRepo.listByUser.mockResolvedValue([]);
  });

  describe('createReminder', () => {
    it('creates a reminder with correct parameters', async () => {
      mockRepo.listByUser.mockResolvedValueOnce([]);
      mockScheduler.createSchedule.mockResolvedValueOnce(undefined);

      const result = await createReminder('user-123', 'user@example.com', {
        recipeId: 'recipe-456',
        scheduledAt: '2027-01-01T10:00:00+01:00',
        title: 'Bake bread',
        message: 'Start the sourdough',
      });

      expect(result.recipeId).toBe('recipe-456');
      expect(result.title).toBe('Bake bread');
      expect(result.status).toBe('active');
      expect(result.id).toContain('reminder-user-123');
      expect(mockScheduler.createSchedule).toHaveBeenCalledTimes(1);
      expect(mockRepo.createRecord).toHaveBeenCalledTimes(1);
    });

    it('rolls back DynamoDB record if EventBridge creation fails', async () => {
      mockRepo.listByUser.mockResolvedValueOnce([]);
      mockScheduler.createSchedule.mockRejectedValueOnce(new Error('EventBridge down'));

      await expect(
        createReminder('user-123', 'user@example.com', {
          recipeId: 'recipe-456',
          scheduledAt: '2027-01-01T10:00:00Z',
        }),
      ).rejects.toThrow('EventBridge down');

      expect(mockRepo.deleteRecord).toHaveBeenCalledTimes(1);
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

    it('enforces per-user limit of 10 active reminders', async () => {
      mockRepo.listByUser.mockResolvedValueOnce(
        Array(10).fill({ ...activeReminder, status: 'active' as const }),
      );

      await expect(
        createReminder('user-123', 'user@example.com', {
          recipeId: 'recipe-456',
          scheduledAt: '2027-01-01T10:00:00Z',
        }),
      ).rejects.toThrow('Maximum of 10 active reminders per user reached');
    });
  });

  describe('listReminders', () => {
    it('returns reminders from repository', async () => {
      mockRepo.listByUser.mockResolvedValueOnce([activeReminder]);

      const result = await listReminders('user1');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('local-reminder-user-123-abc');
    });
  });

  describe('cancelReminder', () => {
    it('deletes from EventBridge and DynamoDB', async () => {
      mockScheduler.deleteSchedule.mockResolvedValueOnce(undefined);

      const scheduleName = 'local-reminder-user-123-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
      await cancelReminder('user-123', scheduleName);

      expect(mockScheduler.deleteSchedule).toHaveBeenCalledWith(scheduleName, expect.any(String));
      expect(mockRepo.deleteRecord).toHaveBeenCalledWith('user-123', scheduleName);
    });

    it('rejects deletion by non-owner', async () => {
      const scheduleName = 'local-reminder-other-user-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
      await expect(cancelReminder('user-123', scheduleName)).rejects.toThrow(
        'Not authorized to delete this reminder',
      );
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
        expect.objectContaining({ to: 'user@example.com' }),
      );
    });

    it('updates DynamoDB shadow record to disabled before sending', async () => {
      await sendReminderEmail({
        recipientEmail: 'user@example.com',
        recipeId: 'recipe-123',
        recipeName: 'Bread',
        userId: 'user-123',
        scheduleId: 'schedule-abc',
      });

      expect(mockRepo.updateStatus).toHaveBeenCalledWith('user-123', 'schedule-abc', 'disabled');
    });

    it('still sends email even if DynamoDB update fails', async () => {
      mockRepo.updateStatus.mockRejectedValueOnce(new Error('DynamoDB down'));

      await sendReminderEmail({
        recipientEmail: 'user@example.com',
        recipeId: 'recipe-123',
        recipeName: 'Bread',
        userId: 'user-123',
        scheduleId: 'schedule-abc',
      });

      expect(mockEmail.sendEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('processBatchReminders', () => {
    it('sends batch emails to all userIds', async () => {
      await processBatchReminders({
        type: 'greeting',
        userIds: ['user1@example.com', 'user2@example.com'],
      });

      expect(mockEmail.loadTemplate).toHaveBeenCalledWith('greeting');
      expect(mockEmail.sendEmail).toHaveBeenCalledTimes(2);
    });

    it('uses explicit template and subject when provided', async () => {
      await processBatchReminders({
        type: 'greeting',
        template: 'custom-greeting',
        subject: 'Custom Subject',
        userIds: ['user1@example.com'],
      });

      expect(mockEmail.loadTemplate).toHaveBeenCalledWith('custom-greeting');
      expect(mockEmail.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({ subject: 'Custom Subject' }),
      );
    });

    it('falls back to type as template name and generic subject', async () => {
      await processBatchReminders({ type: 'weekly-digest', userIds: ['user1@example.com'] });

      expect(mockEmail.loadTemplate).toHaveBeenCalledWith('weekly-digest');
      expect(mockEmail.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({ subject: 'Breadly: weekly-digest' }),
      );
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
  });
});
