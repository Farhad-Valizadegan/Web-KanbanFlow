import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { deleteProject, getProjects } from '../api';
import type { Project } from '../types';

interface ProjectListProps {
    workspaceId: number;
}

function formatDate(value: string | null): string {
    if (!value) {
        return 'Not set';
    }

    return new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date(value));
}

function ProjectList({ workspaceId }: ProjectListProps) {
    const queryClient = useQueryClient();

    const projectsQuery = useQuery({
        queryKey: ['projects', workspaceId],
        queryFn: () => getProjects(workspaceId),
        retry: false,
    });

    const deleteMutation = useMutation({
        mutationFn: (projectId: number) =>
            deleteProject(workspaceId, projectId),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ['projects', workspaceId],
            });
        },
    });

    function handleDelete(project: Project) {
        const confirmed = window.confirm(
            `Delete project "${project.name}"?`,
        );

        if (!confirmed) {
            return;
        }

        deleteMutation.mutate(project.id);
    }

    if (projectsQuery.isPending) {
        return (
            <p className="mt-6 text-slate-400">
                Loading projects...
            </p>
        );
    }

    if (projectsQuery.isError) {
        return (
            <p className="mt-6 text-red-400">
                Unable to load projects.
            </p>
        );
    }

    const projects = projectsQuery.data;

    if (projects.length === 0) {
        return (
            <p className="mt-6 border border-slate-800 bg-slate-900 p-6 text-slate-400">
                No projects have been created in this workspace.
            </p>
        );
    }

    return (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
                <article
                    key={project.id}
                    className="border border-slate-800 bg-slate-900 p-6"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-100">
                                {project.name}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                {project.slug}
                            </p>
                        </div>

                        <span className="border border-slate-700 px-2 py-1 text-xs uppercase tracking-wide text-slate-300">
                            {project.status}
                        </span>
                    </div>

                    <p className="mt-4 min-h-12 text-sm leading-6 text-slate-400">
                        {project.description ||
                            'No project description.'}
                    </p>

                    <dl className="mt-5 space-y-2 text-sm">
                        <div className="flex justify-between gap-4">
                            <dt className="text-slate-500">
                                Start date
                            </dt>

                            <dd className="text-slate-300">
                                {formatDate(project.start_date)}
                            </dd>
                        </div>

                        <div className="flex justify-between gap-4">
                            <dt className="text-slate-500">
                                Due date
                            </dt>

                            <dd className="text-slate-300">
                                {formatDate(project.due_date)}
                            </dd>
                        </div>
                    </dl>

                    <button
                        type="button"
                        onClick={() => handleDelete(project)}
                        disabled={deleteMutation.isPending}
                        className="mt-6 border border-red-800 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {deleteMutation.isPending
                            ? 'Deleting...'
                            : 'Delete'}
                    </button>
                </article>
            ))}
        </div>
    );
}

export default ProjectList;