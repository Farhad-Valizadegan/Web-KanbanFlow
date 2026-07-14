import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../features/auth/api';
import {
    registerSchema,
    type RegisterFormData,
} from '../features/auth/schemas';

interface ValidationErrorResponse {
    message?: string;
    errors?: Record<string, string[]>;
}

function RegisterPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            password_confirmation: '',
        },
    });

    const registerMutation = useMutation({
        mutationFn: registerUser,
        onSuccess: (user) => {
            queryClient.setQueryData(['current-user'], user);
            navigate('/dashboard');
        },
        onError: (error: AxiosError<ValidationErrorResponse>) => {
            const responseErrors = error.response?.data.errors;

            const supportedFields: Array<keyof RegisterFormData> = [
                'name',
                'email',
                'password',
                'password_confirmation',
            ];

            let fieldErrorApplied = false;

            for (const field of supportedFields) {
                const message = responseErrors?.[field]?.[0];

                if (message) {
                    setError(field, {
                        type: 'server',
                        message,
                    });

                    fieldErrorApplied = true;
                }
            }

            if (!fieldErrorApplied) {
                setError('root', {
                    type: 'server',
                    message:
                        error.response?.data.message ??
                        'Registration failed. Please try again.',
                });
            }
        },
    });

    const onSubmit = (data: RegisterFormData) => {
        registerMutation.mutate(data);
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-slate-100">
            <section className="w-full max-w-md border border-slate-800 bg-slate-900 p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
                    KanbanFlow
                </p>

                <h1 className="mt-3 text-3xl font-bold">
                    Create account
                </h1>

                <p className="mt-2 text-sm text-slate-400">
                    Create your account to start managing projects.
                </p>

                <form
                    className="mt-8 space-y-5"
                    onSubmit={handleSubmit(onSubmit)}
                    noValidate
                >
                    <div>
                        <label
                            htmlFor="name"
                            className="block text-sm font-medium text-slate-200"
                        >
                            Name
                        </label>

                        <input
                            id="name"
                            type="text"
                            autoComplete="name"
                            {...register('name')}
                            className="mt-2 w-full border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-blue-500"
                        />

                        {errors.name && (
                            <p className="mt-2 text-sm text-red-400">
                                {errors.name.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-slate-200"
                        >
                            Email
                        </label>

                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            {...register('email')}
                            className="mt-2 w-full border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-blue-500"
                        />

                        {errors.email && (
                            <p className="mt-2 text-sm text-red-400">
                                {errors.email.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-slate-200"
                        >
                            Password
                        </label>

                        <input
                            id="password"
                            type="password"
                            autoComplete="new-password"
                            {...register('password')}
                            className="mt-2 w-full border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-blue-500"
                        />

                        {errors.password && (
                            <p className="mt-2 text-sm text-red-400">
                                {errors.password.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="password_confirmation"
                            className="block text-sm font-medium text-slate-200"
                        >
                            Confirm password
                        </label>

                        <input
                            id="password_confirmation"
                            type="password"
                            autoComplete="new-password"
                            {...register('password_confirmation')}
                            className="mt-2 w-full border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-blue-500"
                        />

                        {errors.password_confirmation && (
                            <p className="mt-2 text-sm text-red-400">
                                {errors.password_confirmation.message}
                            </p>
                        )}
                    </div>

                    {errors.root && (
                        <p className="text-sm text-red-400">
                            {errors.root.message}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={registerMutation.isPending}
                        className="w-full bg-blue-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {registerMutation.isPending
                            ? 'Creating account...'
                            : 'Create account'}
                    </button>
                </form>

                <p className="mt-6 text-sm text-slate-400">
                    Already have an account?{' '}
                    <Link
                        to="/login"
                        className="font-medium text-blue-400 hover:text-blue-300"
                    >
                        Sign in
                    </Link>
                </p>
            </section>
        </main>
    );
}

export default RegisterPage;