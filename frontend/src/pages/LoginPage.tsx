import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../features/auth/api';
import {
    loginSchema,
    type LoginFormData,
} from '../features/auth/schemas';

interface ValidationErrorResponse {
    message?: string;
    errors?: Record<string, string[]>;
}

function LoginPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
            remember: false,
        },
    });

    const loginMutation = useMutation({
        mutationFn: loginUser,
        onSuccess: (user) => {
            queryClient.setQueryData(['current-user'], user);
            navigate('/dashboard');
        },
        onError: (error: AxiosError<ValidationErrorResponse>) => {
            const responseErrors = error.response?.data.errors;

            if (responseErrors?.email?.[0]) {
                setError('email', {
                    type: 'server',
                    message: responseErrors.email[0],
                });

                return;
            }

            setError('root', {
                type: 'server',
                message:
                    error.response?.data.message ??
                    'Login failed. Please try again.',
            });
        },
    });

    const onSubmit = (data: LoginFormData) => {
        loginMutation.mutate(data);
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-slate-100">
            <section className="w-full max-w-md border border-slate-800 bg-slate-900 p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
                    KanbanFlow
                </p>

                <h1 className="mt-3 text-3xl font-bold">
                    Sign in
                </h1>

                <p className="mt-2 text-sm text-slate-400">
                    Access your workspaces, projects, and tasks.
                </p>

                <form
                    className="mt-8 space-y-5"
                    onSubmit={handleSubmit(onSubmit)}
                    noValidate
                >
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
                            autoComplete="current-password"
                            {...register('password')}
                            className="mt-2 w-full border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-blue-500"
                        />

                        {errors.password && (
                            <p className="mt-2 text-sm text-red-400">
                                {errors.password.message}
                            </p>
                        )}
                    </div>

                    <label className="flex items-center gap-3 text-sm text-slate-300">
                        <input
                            type="checkbox"
                            {...register('remember')}
                            className="h-4 w-4"
                        />
                        Remember me
                    </label>

                    {errors.root && (
                        <p className="text-sm text-red-400">
                            {errors.root.message}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loginMutation.isPending}
                        className="w-full bg-blue-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loginMutation.isPending
                            ? 'Signing in...'
                            : 'Sign in'}
                    </button>
                </form>

                <p className="mt-6 text-sm text-slate-400">
                    Do not have an account?{' '}
                    <Link
                        to="/register"
                        className="font-medium text-blue-400 hover:text-blue-300"
                    >
                        Register
                    </Link>
                </p>
            </section>
        </main>
    );
}

export default LoginPage;