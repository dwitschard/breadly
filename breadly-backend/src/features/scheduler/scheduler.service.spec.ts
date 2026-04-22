import {
  SchedulerClient,
  CreateScheduleCommand,
  DeleteScheduleCommand,
  ListSchedulesCommand,
} from '@aws-sdk/client-scheduler';
import {
  createSchedule,
  deleteSchedule,
  listSchedules,
  setClient,
} from './scheduler.service.js';

describe('scheduler.service', () => {
  const mockSend = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    const mockClient = { send: mockSend } as unknown as SchedulerClient;
    setClient(mockClient);
  });

  describe('createSchedule', () => {
    it('creates a schedule with correct parameters', async () => {
      mockSend.mockResolvedValueOnce({});

      await createSchedule({
        name: 'test-schedule',
        scheduleExpression: 'at(2026-04-25T13:00:00)',
        targetMethod: 'POST',
        targetPath: '/api/internal/reminders/send',
        payload: { recipientEmail: 'test@example.com' },
        groupName: 'test-group',
        roleArn: 'arn:aws:iam::123456789012:role/test-role',
        apiGatewayEndpoint: 'arn:aws:execute-api:eu-central-1:123456789012:abc123',
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      const command = mockSend.mock.calls[0][0];
      expect(command).toBeInstanceOf(CreateScheduleCommand);
      expect(command.input.Name).toBe('test-schedule');
      expect(command.input.GroupName).toBe('test-group');
      expect(command.input.ScheduleExpression).toBe('at(2026-04-25T13:00:00)');
    });

    it('propagates SDK errors', async () => {
      mockSend.mockRejectedValueOnce(new Error('SDK error'));

      await expect(
        createSchedule({
          name: 'fail-schedule',
          scheduleExpression: 'at(2026-04-25T13:00:00)',
          targetMethod: 'POST',
          targetPath: '/api/internal/reminders/send',
          payload: {},
          groupName: 'test-group',
          roleArn: 'arn:aws:iam::123456789012:role/test-role',
          apiGatewayEndpoint: 'arn:aws:execute-api:eu-central-1:123456789012:abc123',
        }),
      ).rejects.toThrow('SDK error');
    });
  });

  describe('deleteSchedule', () => {
    it('deletes a schedule with correct name and group', async () => {
      mockSend.mockResolvedValueOnce({});

      await deleteSchedule('test-schedule', 'test-group');

      expect(mockSend).toHaveBeenCalledTimes(1);
      const command = mockSend.mock.calls[0][0];
      expect(command).toBeInstanceOf(DeleteScheduleCommand);
      expect(command.input.Name).toBe('test-schedule');
      expect(command.input.GroupName).toBe('test-group');
    });
  });

  describe('listSchedules', () => {
    it('lists schedules with prefix filter', async () => {
      mockSend.mockResolvedValueOnce({
        Schedules: [
          { Name: 'local-reminder-user1-abc' },
          { Name: 'local-reminder-user1-def' },
        ],
        NextToken: 'next-page',
      });

      const result = await listSchedules({
        namePrefix: 'local-reminder-user1',
        groupName: 'test-group',
      });

      expect(result.schedules).toHaveLength(2);
      expect(result.nextToken).toBe('next-page');

      const command = mockSend.mock.calls[0][0];
      expect(command).toBeInstanceOf(ListSchedulesCommand);
      expect(command.input.NamePrefix).toBe('local-reminder-user1');
    });

    it('returns empty array when no schedules exist', async () => {
      mockSend.mockResolvedValueOnce({ Schedules: [], NextToken: undefined });

      const result = await listSchedules({
        namePrefix: 'local-reminder-nobody',
        groupName: 'test-group',
      });

      expect(result.schedules).toEqual([]);
      expect(result.nextToken).toBeUndefined();
    });
  });
});
