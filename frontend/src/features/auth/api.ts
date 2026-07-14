import { apiClient } from '../../api/client';
import type { LoginInput, RegisterInput, User } from './types';

interface AuthenticationResponse {
    message: string;
    user: User;
}

export async function getCsrfCookie(): Promise<void> {
    await apiClient.get('/sanctum/csrf-cookie');
}

export async function registerUser(input: RegisterInput): Promise<User> {
    await getCsrfCookie();

    const response = await apiClient.post<AuthenticationResponse>(
        '/register',
        input,
    );

    return response.data.user;
}

export async function loginUser(input: LoginInput): Promise<User> {
    await getCsrfCookie();

    const response = await apiClient.post<AuthenticationResponse>(
        '/login',
        input,
    );

    return response.data.user;
}

export async function logoutUser(): Promise<void> {
    await getCsrfCookie();
    await apiClient.post('/logout');
}

export async function getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/api/user');

    return response.data;
}