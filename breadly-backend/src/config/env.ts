const lazy = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const optional = (key: string, fallback: string): string => {
  return process.env[key] ?? fallback;
};

export const env = {
  PORT: optional('PORT', '3000'),
  get MONGODB_CONNECTION_STRING(): string { return lazy('MONGODB_CONNECTION_STRING'); },
  get COGNITO_ISSUER(): string | undefined { return process.env['COGNITO_ISSUER']; },
  get COGNITO_USERINFO_URL(): string | undefined { return process.env['COGNITO_USERINFO_URL']; },
  COGNITO_CLIENT_ID: process.env['COGNITO_CLIENT_ID'],
  PREVIEW_PATH_PREFIX: process.env['PREVIEW_PATH_PREFIX'],
  ENV_NAME: optional('ENV_NAME', 'local'),
  AWS_REGION: optional('AWS_REGION', 'eu-central-1'),
  SCHEDULER_GROUP_NAME: optional('SCHEDULER_GROUP_NAME', 'breadly-schedules'),
  SCHEDULER_ROLE_ARN: optional('SCHEDULER_ROLE_ARN', ''),
  API_GATEWAY_ENDPOINT: optional('API_GATEWAY_ENDPOINT', ''),
  SES_SENDER_EMAIL: optional('SES_SENDER_EMAIL', 'floete-argon.8h@icloud.com'),
  get SES_CONFIGURATION_SET(): string | undefined { return process.env['SES_CONFIGURATION_SET']; },
  get SENDER_DISPLAY_NAME(): string {
    return env.ENV_NAME === 'production' ? 'Breadly' : 'Breadly Dev';
  },
  APP_URL: optional('APP_URL', 'http://localhost:4200'),
  DYNAMODB_TABLE_NAME: optional('DYNAMODB_TABLE_NAME', 'breadly-local'),
};
