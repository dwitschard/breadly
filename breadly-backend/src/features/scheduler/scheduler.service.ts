import {
  SchedulerClient,
  CreateScheduleCommand,
  DeleteScheduleCommand,
  ListSchedulesCommand,
  FlexibleTimeWindowMode,
  ActionAfterCompletion,
  type ScheduleSummary,
} from '@aws-sdk/client-scheduler';
import { env } from '../../config/env.js';
import { logger } from '../../common/logger.js';

export interface CreateScheduleParams {
  name: string;
  scheduleExpression: string;
  targetMethod: string;
  targetPath: string;
  payload: Record<string, unknown>;
  groupName: string;
  roleArn: string;
  apiGatewayEndpoint: string;
  actionAfterCompletion?: ActionAfterCompletion;
}

export interface ListSchedulesParams {
  namePrefix: string;
  groupName: string;
  nextToken?: string;
}

export interface ListSchedulesResult {
  schedules: ScheduleSummary[];
  nextToken?: string;
}

let client: SchedulerClient | undefined;

const getClient = (): SchedulerClient => {
  if (!client) {
    client = new SchedulerClient({ region: env.AWS_REGION });
  }
  return client;
};

export const createSchedule = async (params: CreateScheduleParams): Promise<void> => {
  const command = new CreateScheduleCommand({
    Name: params.name,
    GroupName: params.groupName,
    ScheduleExpression: params.scheduleExpression,
    FlexibleTimeWindow: { Mode: FlexibleTimeWindowMode.OFF },
    ActionAfterCompletion: params.actionAfterCompletion ?? ActionAfterCompletion.NONE,
    Target: {
      Arn: params.apiGatewayEndpoint,
      RoleArn: params.roleArn,
      Input: JSON.stringify(params.payload),
    },
  });

  await getClient().send(command);
  logger.info({ scheduleName: params.name }, 'Schedule created');
};

export const deleteSchedule = async (name: string, groupName: string): Promise<void> => {
  const command = new DeleteScheduleCommand({
    Name: name,
    GroupName: groupName,
  });

  await getClient().send(command);
  logger.info({ scheduleName: name }, 'Schedule deleted');
};

export const listSchedules = async (params: ListSchedulesParams): Promise<ListSchedulesResult> => {
  const command = new ListSchedulesCommand({
    NamePrefix: params.namePrefix,
    GroupName: params.groupName,
    NextToken: params.nextToken,
  });

  const response = await getClient().send(command);

  return {
    schedules: response.Schedules ?? [],
    nextToken: response.NextToken,
  };
};

export const setClient = (c: SchedulerClient): void => {
  client = c;
};
