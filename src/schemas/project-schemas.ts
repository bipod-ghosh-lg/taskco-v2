import { z } from 'zod';

const colorSchema = z
  .string()
  .max(7)
  .regex(/^#[0-9a-fA-F]{6}$/, 'color must be a valid hex color (e.g. #3b82f6)')
  .optional();

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
  color: colorSchema,
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less').optional(),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
  color: colorSchema,
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field is required',
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
