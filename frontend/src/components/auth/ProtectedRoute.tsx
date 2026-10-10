import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Navigate, Outlet } from 'react-router-dom';
import { getCurrentUser } from '../../features/auth/api';

function ProtectedRoute() {
    const userQuery = useQuery({
        queryKey: ['current-user'],
        queryFn: getCurrentUser,
        retry: false,
    });

    if (userQuery.isPending) {
        return <main role="status" className="state-screen"><p className="loading-state">Loading session…</p></main>;
    }

    if (userQuery.isError) {
        if (isAxiosError(userQuery.error) && userQuery.error.response?.status === 401) {
            return <Navigate to="/login" replace />;
        }
        return (
            <main className="state-screen" role="alert">
                <h1>Unable to check your session</h1>
                <p>We couldn’t reach your account. Check your connection and try again.</p>
                <button className="primary-button" disabled={userQuery.isFetching}
                    onClick={() => void userQuery.refetch()}>
                    {userQuery.isFetching ? 'Checking…' : 'Try again'}
                </button>
            </main>
        );
    }

    return <Outlet />;
}

export default ProtectedRoute;
