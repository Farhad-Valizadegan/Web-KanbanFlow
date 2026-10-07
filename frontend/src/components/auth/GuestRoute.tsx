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
        <p>We couldn’t check your session. Make sure the local backend is running, then try again.</p>
        <button className="primary-button" onClick={() => void session.refetch()}>Try again</button>
    </main>;
}
