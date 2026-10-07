import { useQuery } from '@tanstack/react-query';
import { Navigate, Outlet } from 'react-router-dom';
import { getCurrentUser } from '../../features/auth/api';

function ProtectedRoute() {
    const userQuery = useQuery({
        queryKey: ['current-user'],
        queryFn: getCurrentUser,
        retry: false,
    });

    if (userQuery.isPending) {
        return (
            <main role="status" className="min-h-screen bg-slate-950 p-8 text-slate-300">
                Loading session...
            </main>
        );
    }

    if (userQuery.isError) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}

export default ProtectedRoute;