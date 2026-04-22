import { randomUUID } from 'crypto';
import {
  createSchedule,
  deleteSchedule,
  listSchedules,
} from '../scheduler/scheduler.service.js';
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

const MAX_REMINDERS_PER_USER = 10;

const buildScheduleName = (userId: string): string => {
  const uuid = randomUUID();
  return `${env.ENV_NAME}-reminder-${userId}-${uuid}`;
};

const parseScheduleName = (name: string): { userId: string } | null => {
  const parts = name.split('-reminder-');
  if (parts.length < 2) return null;
  const rest = parts[1];
  const lastDash = rest.lastIndexOf('-');
  if (lastDash === -1) return null;
  // userId is between "reminder-" and the last UUID segment
  // Format: {env}-reminder-{userId}-{uuid}
  // UUID has format xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 chars)
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

  const namePrefix = `${env.ENV_NAME}-reminder-${userId}`;
  const existing = await listSchedules({
    namePrefix,
    groupName: env.SCHEDULER_GROUP_NAME,
  });

  if (existing.schedules.length >= MAX_REMINDERS_PER_USER) {
    throw new ApplicationError(
      `Maximum of ${MAX_REMINDERS_PER_USER} active reminders per user reached`,
      409,
    );
  }

  const scheduleName = buildScheduleName(userId);
  const scheduleExpression = toUtcScheduleExpression(dto.scheduledAt);

  const payload: SendReminderPayload = {
    recipientEmail: userEmail,
    recipeId: dto.recipeId,
    recipeName: dto.title ?? 'your recipe',
    title: dto.title,
    message: dto.message,
    appUrl: env.APP_URL,
  };

  await createSchedule({
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

  return {
    id: scheduleName,
    recipeId: dto.recipeId,
    scheduledAt: scheduledAt.toISOString(),
    title: dto.title,
    message: dto.message,
  };
};

export const listReminders = async (
  userId: string,
  nextToken?: string,
): Promise<ReminderList> => {
  const namePrefix = `${env.ENV_NAME}-reminder-${userId}`;
  const result = await listSchedules({
    namePrefix,
    groupName: env.SCHEDULER_GROUP_NAME,
    nextToken,
  });

  const items: Reminder[] = result.schedules.map((schedule) => {
    const name = schedule.Name ?? '';
    return {
      id: name,
      recipeId: '',
      scheduledAt: '',
    };
  });

  return {
    items,
    nextToken: result.nextToken,
  };
};

export const cancelReminder = async (
  userId: string,
  reminderId: string,
): Promise<void> => {
  const parsed = parseScheduleName(reminderId);
  if (!parsed || parsed.userId !== userId) {
    throw new ApplicationError('Not authorized to delete this reminder', 403);
  }

  await deleteSchedule(reminderId, env.SCHEDULER_GROUP_NAME);
};

export const sendReminderEmail = async (payload: SendReminderPayload): Promise<void> => {
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
