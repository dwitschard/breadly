import { randomUUID } from 'crypto';
import { loadTemplate, interpolate, sendEmail } from './email.helper.js';
import { env } from '../../config/env.js';
import { ApplicationError } from '../../domain/error.types.js';
import { logger } from '../../common/logger.js';
import {
  CreateReminderDto,
  Reminder,
  ReminderList,
  SendReminderPayload,
  BatchReminderPayload,
} from '../../app/generated/api/index.js';
import { ActionAfterCompletion } from '@aws-sdk/client-scheduler';
import * as reminderRepository from './reminder.repository.js';
import * as schedulerService from '../scheduler/scheduler.service.js';

const MAX_REMINDERS_PER_USER = 10;

const buildScheduleName = (userId: string): string => {
  const uuid = randomUUID();
  return `${env.ENV_NAME}-reminder-${userId}-${uuid}`;
};

const parseScheduleName = (name: string): { userId: string } | null => {
  const parts = name.split('-reminder-');
  if (parts.length < 2) return null;
  const rest = parts[1];
  const uuidLength = 36;
  if (rest.length < uuidLength + 1) return null;
  const userId = rest.substring(0, rest.length - uuidLength - 1);
  return { userId };
};

const toUtcScheduleExpression = (isoString: string): string => {
  const date = new Date(isoString);
  return `at(${date.toISOString().replace(/\.\d{3}Z$/, '')})`;
};

export const createReminder = async (
  userId: string,
  userEmail: string,
  dto: CreateReminderDto,
): Promise<Reminder> => {
  const scheduledAt = new Date(dto.scheduledAt);
  if (isNaN(scheduledAt.getTime())) {
    throw new ApplicationError('Invalid scheduledAt datetime', 400);
  }
  if (scheduledAt.getTime() <= Date.now()) {
    throw new ApplicationError('scheduledAt must be in the future', 400);
  }

  const existing = await reminderRepository.listByUser(userId);
  const activeCount = existing.filter((r) => r.status === 'active').length;
  if (activeCount >= MAX_REMINDERS_PER_USER) {
    throw new ApplicationError(
      `Maximum of ${MAX_REMINDERS_PER_USER} active reminders per user reached`,
      409,
    );
  }

  const scheduleName = buildScheduleName(userId);
  const scheduleExpression = toUtcScheduleExpression(dto.scheduledAt);
  const title = dto.title ?? 'tbd';
  const message = dto.message ?? 'tbd';

  const payload: SendReminderPayload = {
    recipientEmail: userEmail,
    recipeId: dto.recipeId,
    recipeName: dto.title ?? 'your recipe',
    title: dto.title,
    message: dto.message,
    appUrl: env.APP_URL,
    userId,
    scheduleId: scheduleName,
  };

  await reminderRepository.createRecord({
    userId,
    scheduleId: scheduleName,
    recipeId: dto.recipeId,
    scheduledAt: scheduledAt.toISOString(),
    title,
    message,
  });

  try {
    await schedulerService.createSchedule({
      name: scheduleName,
      scheduleExpression,
      targetMethod: 'POST',
      targetPath: `/api/internal/reminders/send`,
      payload: payload as unknown as Record<string, unknown>,
      groupName: env.SCHEDULER_GROUP_NAME,
      roleArn: env.SCHEDULER_ROLE_ARN,
      apiGatewayEndpoint: env.API_GATEWAY_ENDPOINT,
      actionAfterCompletion: ActionAfterCompletion.DELETE,
    });
  } catch (err) {
    await reminderRepository.deleteRecord(userId, scheduleName);
    throw err;
  }

  return {
    id: scheduleName,
    recipeId: dto.recipeId,
    scheduledAt: scheduledAt.toISOString(),
    title: dto.title,
    message: dto.message,
    status: 'active',
  };
};

export const listReminders = async (userId: string): Promise<ReminderList> => {
  const items = await reminderRepository.listByUser(userId);
  return { items };
};

export const cancelReminder = async (
  userId: string,
  reminderId: string,
): Promise<void> => {
  const parsed = parseScheduleName(reminderId);
  if (!parsed || parsed.userId !== userId) {
    throw new ApplicationError('Not authorized to delete this reminder', 403);
  }

  try {
    await schedulerService.deleteSchedule(reminderId, env.SCHEDULER_GROUP_NAME);
  } catch {
    try {
      await schedulerService.deleteSchedule(reminderId, env.SCHEDULER_GROUP_NAME);
    } catch (retryErr) {
      logger.error({ reminderId, error: retryErr }, 'EventBridge delete failed after retry');
      throw new ApplicationError('Failed to cancel reminder', 500);
    }
  }

  await reminderRepository.deleteRecord(userId, reminderId);
};

export const sendReminderEmail = async (payload: SendReminderPayload): Promise<void> => {
  if (payload.userId && payload.scheduleId) {
    try {
      await reminderRepository.updateStatus(payload.userId, payload.scheduleId, 'disabled');
    } catch (err) {
      logger.error({ err, scheduleId: payload.scheduleId }, 'Failed to update reminder status in DynamoDB');
    }
  }

  const template = loadTemplate('reminder');
  const html = interpolate(template, {
    userName: 'Breadly User',
    recipeName: payload.recipeName,
    recipeUrl: `${payload.appUrl ?? ''}/recipes/${payload.recipeId}`,
    appUrl: payload.appUrl ?? '',
    title: payload.title ?? 'Recipe Reminder',
    message: payload.message ?? `Time to cook ${payload.recipeName}!`,
  });

  const subject = interpolate(payload.title ?? 'Recipe Reminder: {{recipeName}}', {
    recipeName: payload.recipeName,
  });

  await sendEmail({
    to: payload.recipientEmail,
    subject,
    htmlBody: html,
  });
};

export const processBatchReminders = async (payload: BatchReminderPayload): Promise<void> => {
  const templateName = payload.template ?? payload.type;
  const subject = payload.subject ?? `Breadly: ${payload.type}`;
  const template = loadTemplate(templateName);

  for (const userId of payload.userIds) {
    try {
      const html = interpolate(template, {
        userName: 'Breadly User',
        appUrl: env.APP_URL,
      });

      await sendEmail({
        to: userId,
        subject,
        htmlBody: html,
      });
    } catch (error) {
      logger.error({ userId, error }, 'Failed to send batch email');
    }
  }
};

export const migrateExistingReminders = async (): Promise<void> => {
  try {
    const namePrefix = `${env.ENV_NAME}-reminder-`;
    const result = await schedulerService.listSchedules({
      namePrefix,
      groupName: env.SCHEDULER_GROUP_NAME,
    });

    for (const schedule of result.schedules) {
      const name = schedule.Name ?? '';
      const parsed = parseScheduleName(name);
      if (!parsed) continue;

      const { userId } = parsed;
      const existing = await reminderRepository.getRecord(userId, name);
      if (existing) continue;

      await reminderRepository.createRecord({
        userId,
        scheduleId: name,
        recipeId: '',
        scheduledAt: new Date().toISOString(),
        title: 'tbd',
        message: 'tbd',
      });
      logger.info({ scheduleName: name }, 'Migrated reminder shadow record');
    }
  } catch (err) {
    logger.error({ err }, 'Reminder migration failed');
  }
};
