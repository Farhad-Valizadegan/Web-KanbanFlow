import { authenticationErrorMessage } from '../features/auth/errorMessage';
import PasswordField from '../components/ui/PasswordField';
import AuthLayout from '../components/auth/AuthLayout';
import Icon from '../components/ui/Icon';
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
                    authenticationErrorMessage(error, 'Unable to sign in. Please try again.'),
            });
        },
    });

    const onSubmit = (data: LoginFormData) => {
        loginMutation.mutate(data);
    };

    return (
        <AuthLayout>
                <h1 className="text-3xl font-bold">
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
                            aria-invalid={!!errors.email}
                            aria-describedby={errors.email ? 'email-error' : undefined}
                            className="mt-2 w-full border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-blue-500"
                        />

                        {errors.email && (
                            <p id="email-error" role="alert" className="mt-2 text-sm text-red-400">
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

                        <PasswordField id="password"
                            type="password"
                            autoComplete="current-password"
                            {...register('password')}
                            aria-invalid={!!errors.password}
                            aria-describedby={errors.password ? 'password-error' : undefined}
                            className="mt-2 w-full border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-blue-500"
                        />

                        {errors.password && (
                            <p id="password-error" role="alert" className="mt-2 text-sm text-red-400">
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
                        className="primary-button w-full disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loginMutation.isPending
                            ? 'Signing in...'
                            : 'Sign in'}
                        {!loginMutation.isPending && <Icon name="arrow" size={18} />}
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
        </AuthLayout>
    );
}

export default LoginPage;
