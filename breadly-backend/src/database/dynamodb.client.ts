import { DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { env } from '../config/env.js';

let baseClient: DynamoDBClient | undefined;
let docClient: DynamoDBDocumentClient | undefined;

const getBaseClient = (): DynamoDBClient => {
  if (!baseClient) {
    baseClient = new DynamoDBClient({ region: env.AWS_REGION });
  }
  return baseClient;
};

export const getDynamoClient = (): DynamoDBDocumentClient => {
  if (!docClient) {
    docClient = DynamoDBDocumentClient.from(getBaseClient(), {
      marshallOptions: { removeUndefinedValues: true },
    });
  }
  return docClient;
};

export const setDynamoClient = (client: DynamoDBDocumentClient): void => {
  docClient = client;
};

export const tableName = (): string => env.DYNAMODB_TABLE_NAME;

export const pingDynamoDB = async (): Promise<boolean> => {
  try {
    await getBaseClient().send(new DescribeTableCommand({ TableName: tableName() }));
    return true;
  } catch {
    return false;
  }
};
