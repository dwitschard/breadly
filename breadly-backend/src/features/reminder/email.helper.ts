import { readFileSync } from 'fs';
import { resolve } from 'path';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { env } from '../../config/env.js';
import { logger } from '../../common/logger.js';

let sesClient: SESClient | undefined;
let templateBaseDir: string | undefined;

const getSesClient = (): SESClient => {
  if (!sesClient) {
    sesClient = new SESClient({ region: env.AWS_REGION });
  }
  return sesClient;
};

export const setTemplateBaseDir = (dir: string): void => {
  templateBaseDir = dir;
};

export const loadTemplate = (templateName: string): string => {
  if (!/^[\w-]+$/.test(templateName)) {
    throw new Error(`Invalid template name: ${templateName}`);
  }
  const baseDir = templateBaseDir ?? resolve(process.cwd(), 'dist', 'templates');
  const templatePath = resolve(baseDir, `${templateName}.html`);
  return readFileSync(templatePath, 'utf-8');
};

export const generateTextBody = (htmlBody: string): string => {
  return htmlBody
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const interpolate = (template: string, variables: Record<string, string>): string => {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return variables[key] ?? match;
  });
};

export const sendEmail = async (params: {
  to: string;
  subject: string;
  htmlBody: string;
  sender?: string;
}): Promise<void> => {
  const sender = params.sender ?? env.SES_SENDER_EMAIL;
  const displayName = env.SENDER_DISPLAY_NAME;

  const command = new SendEmailCommand({
    From: { Email: sender, DisplayName: displayName },
    Destination: { ToAddresses: [params.to] },
    Message: {
      Subject: { Data: params.subject, Charset: 'UTF-8' },
      Body: {
        Html: { Data: params.htmlBody, Charset: 'UTF-8' },
        Text: { Data: generateTextBody(params.htmlBody), Charset: 'UTF-8' },
      },
    },
    ...(env.SES_CONFIGURATION_SET ? { ConfigurationSetName: env.SES_CONFIGURATION_SET } : {}),
  });

  await getSesClient().send(command);
  logger.info({ to: params.to, subject: params.subject }, 'Email sent');
};

export const setSesClient = (c: SESClient): void => {
  sesClient = c;
};
