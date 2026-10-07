import type { AxiosError } from 'axios';

export function authenticationErrorMessage(error: AxiosError<{ message?: string }>, fallback: string): string {
    if (!error.response) return 'Unable to reach the server. Check that the local backend is running, then try again.';
    if (error.response.status === 419) return 'Your session expired. Please try again to refresh it.';
    if (error.response.status === 429) return 'Too many attempts. Please wait a minute before trying again.';
    if (error.response.status >= 500) return 'The server encountered a problem. Please try again shortly.';
    return error.response.data.message ?? fallback;
}
