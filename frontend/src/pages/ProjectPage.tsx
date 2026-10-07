import { useWorkspacePermissions } from '../features/workspaces/useWorkspacePermissions';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import CreateBoardForm from '../features/boards/components/CreateBoardForm';
import BoardList from '../features/boards/components/BoardList';
import { getProject } from '../features/projects/api';

function ProjectPage() {
    const {
        workspaceId,
        projectId,
    } = useParams();

    const numericWorkspaceId =
        Number(workspaceId);
    const { canManage } = useWorkspacePermissions(numericWorkspaceId);

    const numericProjectId =
        Number(projectId);

    const projectQuery = useQuery({
        queryKey: [
            'project',
            numericWorkspaceId,
            numericProjectId,
        ],
        queryFn: () =>
            getProject(
                numericWorkspaceId,
                numericProjectId,
            ),
        enabled:
            Number.isInteger(
                numericWorkspaceId,
            ) &&
            Number.isInteger(
                numericProjectId,
            ),
        retry: false,
    });

    if (
        !Number.isInteger(
            numericWorkspaceId,
        ) ||
        !Number.isInteger(
            numericProjectId,
        )
    ) {
        return (
            <main className="min-h-screen bg-slate-950 p-8 text-red-400">
                Invalid project identifier.
            </main>
        );
    }

    if (projectQuery.isPending) {
        return (
            <main role="status" className="min-h-screen bg-slate-950 p-8 text-slate-300">
                Loading project...
            </main>
        );
    }

    if (projectQuery.isError) {
        return (
            <main className="min-h-screen bg-slate-950 p-8 text-red-400">
                Unable to load the project.
            </main>
        );
    }

    const project = projectQuery.data;

    return (
        <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
            <section className="mx-auto max-w-6xl">
                <Link
                    to={`/workspaces/${numericWorkspaceId}`}
                    className="text-sm font-medium text-blue-400 hover:text-blue-300"
                >
                    &larr; Back to workspace
                </Link>

                <header className="mt-6 border border-slate-800 bg-slate-900 p-8">
                    <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
                                Project
                            </p>

                            <h1 className="mt-3 text-3xl font-bold">
                                {project.name}
                            </h1>

                            <p className="mt-2 text-slate-500">
                                {project.slug}
                            </p>
                        </div>

                        <span className="border border-slate-700 px-3 py-2 text-xs uppercase tracking-wide text-slate-300">
                            {project.status}
                        </span>
                    </div>

                    <p className="mt-6 max-w-3xl leading-7 text-slate-400">
                        {project.description ||
                            'No description has been added.'}
                    </p>

                    <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4 text-sm">
                        <div>
                            <dt className="text-slate-500">
                                Start date
                            </dt>

                            <dd className="mt-1 text-slate-300">
                                {project.start_date
                                    ? project.start_date.slice(
                                          0,
                                          10,
                                      )
                                    : 'Not set'}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-slate-500">
                                Due date
                            </dt>

                            <dd className="mt-1 text-slate-300">
                                {project.due_date
                                    ? project.due_date.slice(
                                          0,
                                          10,
                                      )
                                    : 'Not set'}
                            </dd>
                        </div>
                    </dl>
                </header>

                <section className="mt-10">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
                            Boards
                        </p>

                        <h2 className="mt-2 text-2xl font-bold">
                            Project boards
                        </h2>

                        <p className="mt-2 text-slate-400">
                            Create and manage boards inside this project.
                        </p>
                    </div>

                    {canManage && (<CreateBoardForm
                        workspaceId={
                            numericWorkspaceId
                        }
                        projectId={
                            numericProjectId
                        }
                    />)}

                    <BoardList
                        workspaceId={
                            numericWorkspaceId
                        }
                        projectId={
                            numericProjectId
                        }
                    />
                </section>
            </section>
        </main>
    );
}

export default ProjectPage;