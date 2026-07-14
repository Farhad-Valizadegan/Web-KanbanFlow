import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
    getCurrentUser,
    logoutUser,
} from '../features/auth/api';

function DashboardPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const userQuery = useQuery({
        queryKey: ['current-user'],
        queryFn: getCurrentUser,
        retry: false,
    });

    const logoutMutation = useMutation({
        mutationFn: logoutUser,
        onSuccess: () => {
            queryClient.removeQueries({
                queryKey: ['current-user'],
            });

            navigate('/login');
        },
    });

    if (userQuery.isPending) {
        return (
            <main className="min-h-screen bg-slate-950 p-8 text-slate-300">
                Loading your dashboard...
            </main>
        );
    }

    if (userQuery.isError) {
        return (
            <main className="min-h-screen bg-slate-950 p-8 text-red-400">
                Unable to load the authenticated user.
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
            <section className="mx-auto max-w-5xl border border-slate-800 bg-slate-900 p-8">
                <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
                            KanbanFlow
                        </p>

                        <h1 className="mt-3 text-3xl font-bold">
                            Dashboard
                        </h1>

                        <p className="mt-2 text-slate-400">
                            Welcome, {userQuery.data.name}.
                        </p>
                    </div>

                    <button
                        type="button"
                        disabled={logoutMutation.isPending}
                        onClick={() => logoutMutation.mutate()}
                        className="border border-slate-700 bg-slate-950 px-4 py-2 font-medium hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {logoutMutation.isPending
                            ? 'Signing out...'
                            : 'Sign out'}
                    </button>
                </div>

                <div className="mt-8 border border-slate-700 bg-slate-950 p-5">
                    <h2 className="font-semibold">
                        Account information
                    </h2>

                    <dl className="mt-4 space-y-3 text-sm">
                        <div>
                            <dt className="text-slate-500">Name</dt>
                            <dd className="text-slate-200">
                                {userQuery.data.name}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-slate-500">Email</dt>
                            <dd className="text-slate-200">
                                {userQuery.data.email}
                            </dd>
                        </div>
                    </dl>
                </div>

                {logoutMutation.isError && (
                    <p className="mt-4 text-sm text-red-400">
                        Logout failed. Please try again.
                    </p>
                )}
            </section>
        </main>
    );
}

export default DashboardPage;