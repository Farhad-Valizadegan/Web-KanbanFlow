import { useState } from 'react';
import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
    getCurrentUser,
    logoutUser,
} from '../features/auth/api';
import NotificationPanel from '../features/notifications/components/NotificationPanel';
import { getWorkspaces } from '../features/workspaces/api';
import CreateWorkspaceForm from '../features/workspaces/components/CreateWorkspaceForm';
import WorkspaceList from '../features/workspaces/components/WorkspaceList';

function DashboardPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [isCreateFormOpen, setIsCreateFormOpen] =
        useState(false);

    const userQuery = useQuery({
        queryKey: ['current-user'],
        queryFn: getCurrentUser,
        retry: false,
    });

    const workspacesQuery = useQuery({
        queryKey: ['workspaces'],
        queryFn: getWorkspaces,
        retry: false,
    });

    const logoutMutation = useMutation({
        mutationFn: logoutUser,

        onSuccess: () => {
            queryClient.clear();
            navigate('/login');
        },
    });

    if (userQuery.isPending) {
        return (
            <main role="status" className="min-h-screen bg-slate-950 p-8 text-slate-300">
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
        <>
            <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
                <section className="mx-auto max-w-6xl">
                    <header className="border border-slate-800 bg-slate-900 p-8">
                        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
                                    KanbanFlow
                                </p>

                                <h1 className="mt-3 text-3xl font-bold">
                                    Dashboard
                                </h1>

                                <p className="mt-2 text-slate-400">
                                    Welcome,{' '}
                                    {
                                        userQuery.data
                                            .name
                                    }
                                    .
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <NotificationPanel />

                                <button
                                    type="button"
                                    disabled={
                                        logoutMutation.isPending
                                    }
                                    onClick={() =>
                                        logoutMutation.mutate()
                                    }
                                    className="border border-slate-700 bg-slate-950 px-4 py-2 font-medium hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {logoutMutation.isPending
                                        ? 'Signing out...'
                                        : 'Sign out'}
                                </button>
                            </div>
                        </div>

                        {logoutMutation.isError && (
                            <p className="mt-4 text-sm text-red-400">
                                Logout failed. Please try again.
                            </p>
                        )}
                    </header>

                    <section className="mt-8">
                        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-100">
                                    Your workspaces
                                </h2>

                                <p className="mt-1 text-sm text-slate-400">
                                    View and manage the workspaces you belong to.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setIsCreateFormOpen(
                                        true,
                                    )
                                }
                                className="border border-blue-500 bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500"
                            >
                                Create workspace
                            </button>
                        </div>

                        {workspacesQuery.isPending && (
                            <div className="border border-slate-800 bg-slate-900 p-8 text-slate-400">
                                Loading workspaces...
                            </div>
                        )}

                        {workspacesQuery.isError && (
                            <div className="border border-red-900 bg-red-950/40 p-8 text-red-400">
                                Unable to load workspaces.
                            </div>
                        )}

                        {workspacesQuery.isSuccess && (
                            <WorkspaceList
                                workspaces={
                                    workspacesQuery.data
                                }
                            />
                        )}
                    </section>
                </section>
            </main>

            {isCreateFormOpen && (
                <CreateWorkspaceForm
                    onClose={() =>
                        setIsCreateFormOpen(
                            false,
                        )
                    }
                />
            )}
        </>
    );
}

export default DashboardPage;