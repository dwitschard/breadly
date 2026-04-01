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
