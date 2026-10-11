import { authenticationErrorMessage } from '../features/auth/errorMessage';
import PasswordField from '../components/ui/PasswordField';
import AuthLayout from '../components/auth/AuthLayout';
import Icon from '../components/ui/Icon';
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
                        authenticationErrorMessage(error, 'Unable to create your account. Please try again.'),
                });
            }
        },
    });

    const onSubmit = (data: RegisterFormData) => {
        registerMutation.mutate(data);
    };

    return (
        <AuthLayout>
                <h1 className="text-3xl font-bold">
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
                            aria-invalid={!!errors.name}
                            aria-describedby={errors.name ? 'name-error' : undefined}
                            className="mt-2 w-full border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-blue-500"
                        />

                        {errors.name && (
                            <p id="name-error" role="alert" className="mt-2 text-sm text-red-400">
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
                            autoComplete="new-password"
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

                    <div>
                        <label
                            htmlFor="password_confirmation"
                            className="block text-sm font-medium text-slate-200"
                        >
                            Confirm password
                        </label>

                        <PasswordField id="password_confirmation"
                            type="password"
                            autoComplete="new-password"
                            {...register('password_confirmation')}
                            aria-invalid={!!errors.password_confirmation}
                            aria-describedby={errors.password_confirmation ? 'password_confirmation-error' : undefined}
                            className="mt-2 w-full border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-blue-500"
                        />

                        {errors.password_confirmation && (
                            <p id="password_confirmation-error" role="alert" className="mt-2 text-sm text-red-400">
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
                        className="primary-button w-full disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {registerMutation.isPending
                            ? 'Creating account...'
                            : 'Create account'}
                        {!registerMutation.isPending && <Icon name="arrow" size={18} />}
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
        </AuthLayout>
    );
}

export default RegisterPage;
