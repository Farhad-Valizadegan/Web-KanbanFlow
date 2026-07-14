import { z } from 'zod';

export const loginSchema = z.object({
    email: z.email('Enter a valid email address.'),
    password: z.string().min(1, 'Password is required.'),
    remember: z.boolean().optional(),
});

export const registerSchema = z
    .object({
        name: z
            .string()
            .min(2, 'Name must contain at least 2 characters.')
            .max(255, 'Name must not exceed 255 characters.'),

        email: z.email('Enter a valid email address.'),

        password: z
            .string()
            .min(8, 'Password must contain at least 8 characters.'),

        password_confirmation: z
            .string()
            .min(1, 'Please confirm your password.'),
    })
    .refine(
        (values) => values.password === values.password_confirmation,
        {
            message: 'Passwords do not match.',
            path: ['password_confirmation'],
        },
    );

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;