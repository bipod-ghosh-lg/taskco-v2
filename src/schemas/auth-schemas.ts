import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email format').max(254, 'Email must be 254 characters or less'),
  password: z.string().min(1, 'Password is required').max(72, 'Password must be 72 characters or less'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format').max(254, 'Email must be 254 characters or less'),
  password: z.string().min(1, 'Password is required').max(72, 'Password must be 72 characters or less'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
