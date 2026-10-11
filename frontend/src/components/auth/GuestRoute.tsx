import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Navigate, Outlet } from 'react-router-dom';
import { getCurrentUser } from '../../features/auth/api';

export default function GuestRoute() {
    const session = useQuery({
        queryKey: ['current-user'], queryFn: getCurrentUser, retry: false,
    });
    if (session.isPending) return <main className="state-screen" role="status"><p className="loading-state">Checking your session…</p></main>;
    if (session.isSuccess) return <Navigate to="/dashboard" replace />;
    if (isAxiosError(session.error) && session.error.response?.status === 401) return <Outlet />;
    return <main className="state-screen" role="alert"><h1>Unable to connect</h1>
        <p>We couldn’t check your session. Check your connection and try again. For local development, the API and database both need to be running.</p>
        <button className="primary-button" disabled={session.isFetching} onClick={() => void session.refetch()}>{session.isFetching ? 'Checking…' : 'Try again'}</button>
    </main>;
}
