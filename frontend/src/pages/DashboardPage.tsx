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
import Icon from '../components/ui/Icon';

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
                    <header className="page-heading border border-slate-800 bg-slate-900 p-8">
                        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                            <div>
                                <h1 className="text-3xl font-bold">
                                    Dashboard
                                </h1>

                                <div className="account-chip mt-4"><span className="workspace-avatar" aria-hidden="true">{userQuery.data.name.slice(0, 1).toUpperCase()}</span><p className="text-slate-400">
                                    Welcome back,{' '}
                                    {
                                        userQuery.data
                                            .name
                                    }
                                    .
                                </p></div>
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
                                    className="secondary-button disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {logoutMutation.isPending
                                        ? 'Signing out...'
                                        : 'Sign out'}
                                    <Icon name="logout" size={16} />
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
                        <div className="section-toolbar floating-toolbar mb-5">
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
                                className="primary-button"
                            >
                                <Icon name="plus" size={18} /> Create workspace
                            </button>
                        </div>

                        {workspacesQuery.isPending && (
                            <div role="status" className="skeleton-list"><span className="sr-only">Loading workspaces...</span>{[0, 1].map(key => <div className="skeleton-card" key={key} aria-hidden="true"><div className="skeleton-line" /><div className="skeleton-line" /><div className="skeleton-line" /></div>)}</div>
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
