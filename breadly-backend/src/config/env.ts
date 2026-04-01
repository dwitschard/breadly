const required = (key: string): string => {
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
  MONGODB_CONNECTION_STRING: required('MONGODB_CONNECTION_STRING'),
  COGNITO_ISSUER: process.env['COGNITO_ISSUER'],
  COGNITO_CLIENT_ID: process.env['COGNITO_CLIENT_ID'],
  PREVIEW_PATH_PREFIX: process.env['PREVIEW_PATH_PREFIX'],
};
