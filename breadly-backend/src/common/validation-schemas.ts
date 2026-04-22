import { z } from 'zod';

export const CreateRecipeDtoSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export const UpdateRecipeDtoSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export const PatchRecipeDtoSchema = z.object({
  name: z.string().min(1, 'Name must not be empty').optional(),
});

export const CreateReminderDtoSchema = z.object({
  recipeId: z.string().min(1, 'recipeId is required'),
  scheduledAt: z.string().min(1, 'scheduledAt is required'),
  title: z.string().optional(),
  message: z.string().optional(),
});

export const SendReminderPayloadSchema = z.object({
  recipientEmail: z.string().min(1, 'recipientEmail is required'),
  recipeId: z.string().min(1, 'recipeId is required'),
  recipeName: z.string().min(1, 'recipeName is required'),
  title: z.string().optional(),
  message: z.string().optional(),
  appUrl: z.string().optional(),
});

export const BatchReminderPayloadSchema = z.object({
  type: z.string().min(1, 'type is required'),
  userIds: z.array(z.string()),
});
