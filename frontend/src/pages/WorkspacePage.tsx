import { useWorkspacePermissions } from '../features/workspaces/useWorkspacePermissions';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import CreateProjectForm from '../features/projects/components/CreateProjectForm';
import ProjectList from '../features/projects/components/ProjectList';
import { getWorkspace } from '../features/workspaces/api';
import WorkspaceActivityFeed from '../features/workspaces/components/WorkspaceActivityFeed';
import WorkspaceAnalyticsDashboard from '../features/workspaces/components/WorkspaceAnalyticsDashboard';
import WorkspaceMembers from '../features/workspaces/components/WorkspaceMembers';

function WorkspacePage() {
    const { workspaceId } = useParams();

    const numericWorkspaceId =
        Number(workspaceId);
    const { canManage } = useWorkspacePermissions(numericWorkspaceId);

    const workspaceQuery = useQuery({
        queryKey: [
            'workspace',
            numericWorkspaceId,
        ],
        queryFn: () =>
            getWorkspace(
                numericWorkspaceId,
            ),
        enabled: Number.isInteger(
            numericWorkspaceId,
        ),
        retry: false,
    });

    if (
        !Number.isInteger(
            numericWorkspaceId,
        )
    ) {
        return (
            <main className="min-h-screen bg-slate-950 p-8 text-red-400">
                Invalid workspace identifier.
            </main>
        );
    }

    if (workspaceQuery.isPending) {
        return (
            <main role="status" className="min-h-screen bg-slate-950 p-8 text-slate-300">
                Loading workspace...
            </main>
        );
    }

    if (workspaceQuery.isError) {
        return (
            <main className="min-h-screen bg-slate-950 p-8 text-red-400">
                Unable to load the workspace.
            </main>
        );
    }

    const workspace =
        workspaceQuery.data;

    return (
        <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
            <section className="mx-auto max-w-6xl">
                <Link
                    to="/dashboard"
                    className="text-sm font-medium text-blue-400 hover:text-blue-300"
                >
                    &larr; Back to dashboard
                </Link>

                <header className="page-heading mt-6 border border-slate-800 bg-slate-900 p-8">
                    <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
                        <div>
                            <h1 className="mt-3 text-3xl font-bold">
                                {
                                    workspace.name
                                }
                            </h1>

                            <p className="mt-2 text-slate-500">
                                {
                                    workspace.slug
                                }
                            </p>
                        </div>

                        <span className="border border-slate-700 px-3 py-2 text-xs uppercase tracking-wide text-slate-300">
                            {
                                workspace.visibility
                            }
                        </span>
                    </div>

                    <p className="mt-6 max-w-3xl leading-7 text-slate-400">
                        {workspace.description ||
                            'No description has been added.'}
                    </p>
                </header>

                <WorkspaceAnalyticsDashboard
                    workspaceId={
                        numericWorkspaceId
                    }
                />

                <section className="mt-10">
                    <div>
                        <h2 className="mt-2 text-2xl font-bold">
                            Workspace projects
                        </h2>

                        <p className="mt-2 text-slate-400">
                            Create and manage projects inside this workspace.
                        </p>
                    </div>

                    {canManage && (<CreateProjectForm
                        workspaceId={
                            numericWorkspaceId
                        }
                    />)}

                    <ProjectList
                        workspaceId={
                            numericWorkspaceId
                        }
                    />
                </section>

                <WorkspaceActivityFeed
                    workspaceId={
                        numericWorkspaceId
                    }
                />

                <WorkspaceMembers
                    workspace={
                        workspace
                    }
                />
            </section>
        </main>
    );
}

export default WorkspacePage;
