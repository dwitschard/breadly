import { Request, Response, Router } from 'express';
import {
  createReminder,
  listReminders,
  cancelReminder,
  sendReminderEmail,
  processBatchReminders,
} from './reminder.service.js';
import { CreateReminderDto, SendReminderPayload, BatchReminderPayload } from '../../app/generated/api/index.js';
import { validate } from '../../common/validation.middleware.js';
import { CreateReminderDtoSchema, SendReminderPayloadSchema, BatchReminderPayloadSchema } from '../../common/validation-schemas.js';

const reminderController = Router();

reminderController.get('/', async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const nextToken = req.query['nextToken'] as string | undefined;
  const result = await listReminders(userId, nextToken);
  res.status(200).json(result);
});

reminderController.post(
  '/',
  validate(CreateReminderDtoSchema),
  async (req: Request<Record<string, never>, unknown, CreateReminderDto>, res: Response) => {
    const userId = req.user!.sub;
    const userEmail = req.user!.email ?? '';
    const created = await createReminder(userId, userEmail, req.body);
    res.status(201).json(created);
  },
);

reminderController.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
  const userId = req.user!.sub;
  await cancelReminder(userId, req.params.id);
  res.status(204).end();
});

export { reminderController };

const internalReminderController = Router();

internalReminderController.post(
  '/send',
  validate(SendReminderPayloadSchema),
  async (req: Request<Record<string, never>, unknown, SendReminderPayload>, res: Response) => {
    await sendReminderEmail(req.body);
    res.status(200).json({ message: 'Reminder email sent' });
  },
);

internalReminderController.post(
  '/batch',
  validate(BatchReminderPayloadSchema),
  async (req: Request<Record<string, never>, unknown, BatchReminderPayload>, res: Response) => {
    await processBatchReminders(req.body);
    res.status(200).json({ message: 'Batch emails processed' });
  },
);

export { internalReminderController };
