import { useWorkspacePermissions } from '../../workspaces/useWorkspacePermissions';
import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    deleteProject,
    getProjects,
    updateProject,
} from '../api';
import type {
    Project,
    ProjectStatus,
    UpdateProjectInput,
} from '../types';

interface ProjectListProps {
    workspaceId: number;
}

interface EditFormState {
    name: string;
    description: string;
    status: ProjectStatus;
    start_date: string;
    due_date: string;
}

interface ApiErrorResponse {
    message?: string;
    errors?: Record<string, string[]>;
}

function formatDate(value: string | null): string {
    if (!value) {
        return 'Not set';
    }

    return value.slice(0, 10);
}

function dateInputValue(value: string | null): string {
    if (!value) {
        return '';
    }

    return value.slice(0, 10);
}

function ProjectList({
    workspaceId,
}: ProjectListProps) {
    const queryClient = useQueryClient();
    const { canManage } = useWorkspacePermissions(workspaceId);

    const [editingProjectId, setEditingProjectId] =
        useState<number | null>(null);

    const [editForm, setEditForm] =
        useState<EditFormState>({
            name: '',
            description: '',
            status: 'active',
            start_date: '',
            due_date: '',
        });

    const [errorMessage, setErrorMessage] =
        useState<string | null>(null);

    const projectsQuery = useQuery({
        queryKey: ['projects', workspaceId],
        queryFn: () => getProjects(workspaceId),
        retry: false,
    });

    const deleteMutation = useMutation({
        mutationFn: (projectId: number) =>
            deleteProject(workspaceId, projectId),

        onSuccess: async () => {
            setErrorMessage(null);

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] }),
                queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] }),
            ]);
        },

        onError: (
            error: AxiosError<ApiErrorResponse>,
        ) => {
            if (error.response?.status === 403) {
                setErrorMessage(
                    'Only the workspace owner or a manager can delete projects.',
                );
                return;
            }

            if (error.response?.status === 401) {
                setErrorMessage(
                    'Your session has expired. Please sign in again.',
                );
                return;
            }

            setErrorMessage(
                error.response?.data.message ??
                    'Unable to delete the project.',
            );
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({
            projectId,
            input,
        }: {
            projectId: number;
            input: UpdateProjectInput;
        }) =>
            updateProject(
                workspaceId,
                projectId,
                input,
            ),

        onSuccess: async () => {
            setEditingProjectId(null);
            setErrorMessage(null);

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] }),
                queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] }),
            ]);
        },

        onError: (
            error: AxiosError<ApiErrorResponse>,
        ) => {
            if (error.response?.status === 403) {
                setErrorMessage(
                    'Only the workspace owner or a manager can edit projects.',
                );
                return;
            }

            if (error.response?.status === 401) {
                setErrorMessage(
                    'Your session has expired. Please sign in again.',
                );
                return;
            }

            const validationErrors =
                error.response?.data.errors;

            if (validationErrors) {
                const firstError =
                    Object.values(
                        validationErrors,
                    )[0]?.[0];

                if (firstError) {
                    setErrorMessage(firstError);
                    return;
                }
            }

            setErrorMessage(
                error.response?.data.message ??
                    'Unable to update the project.',
            );
        },
    });

    function beginEditing(project: Project) {
        setEditingProjectId(project.id);
        setErrorMessage(null);

        setEditForm({
            name: project.name,
            description:
                project.description ?? '',
            status: project.status,
            start_date: dateInputValue(
                project.start_date,
            ),
            due_date: dateInputValue(
                project.due_date,
            ),
        });
    }

    function cancelEditing() {
        setEditingProjectId(null);
        setErrorMessage(null);
    }

    function handleSave(project: Project) {
        setErrorMessage(null);

        const name = editForm.name.trim();

        if (!name) {
            setErrorMessage(
                'Project name is required.',
            );
            return;
        }

        if (
            editForm.start_date &&
            editForm.due_date &&
            editForm.due_date <
                editForm.start_date
        ) {
            setErrorMessage(
                'Due date cannot be before the start date.',
            );
            return;
        }

        updateMutation.mutate({
            projectId: project.id,
            input: {
                name,
                description:
                    editForm.description.trim() ||
                    null,
                status: editForm.status,
                start_date:
                    editForm.start_date || null,
                due_date:
                    editForm.due_date || null,
            },
        });
    }

    function handleDelete(project: Project) {
        const confirmed = window.confirm(
            `Delete project "${project.name}"?`,
        );

        if (!confirmed) {
            return;
        }

        setErrorMessage(null);
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
            <p className="mt-6 border border-red-900 bg-red-950/40 p-4 text-red-400">
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
        <div className="mt-6">
            {errorMessage && (
                <p className="mb-4 border border-red-900 bg-red-950/40 p-4 text-sm text-red-400">
                    {errorMessage}
                </p>
            )}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {projects.map((project) => {
                    const isEditing =
                        editingProjectId === project.id;

                    const isDeleting =
                        deleteMutation.isPending &&
                        deleteMutation.variables ===
                            project.id;

                    const isSaving =
                        updateMutation.isPending &&
                        updateMutation.variables
                            ?.projectId === project.id;

                    if (isEditing) {
                        return (
                            <article
                                key={project.id}
                                className="border border-blue-700 bg-slate-900 p-6"
                            >
                                <label className="block">
                                    <span className="text-sm font-medium text-slate-300">
                                        Project name
                                    </span>

                                    <input
                                        type="text"
                                        value={
                                            editForm.name
                                        }
                                        maxLength={255}
                                        onChange={(
                                            event,
                                        ) =>
                                            setEditForm(
                                                (
                                                    current,
                                                ) => ({
                                                    ...current,
                                                    name: event
                                                        .target
                                                        .value,
                                                }),
                                            )
                                        }
                                        className="mt-2 w-full border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
                                    />
                                </label>

                                <label className="mt-4 block">
                                    <span className="text-sm font-medium text-slate-300">
                                        Status
                                    </span>

                                    <select
                                        value={
                                            editForm.status
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setEditForm(
                                                (
                                                    current,
                                                ) => ({
                                                    ...current,
                                                    status: event
                                                        .target
                                                        .value as ProjectStatus,
                                                }),
                                            )
                                        }
                                        className="mt-2 w-full border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
                                    >
                                        <option value="active">
                                            Active
                                        </option>

                                        <option value="completed">
                                            Completed
                                        </option>

                                        <option value="archived">
                                            Archived
                                        </option>
                                    </select>
                                </label>

                                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                    <label className="block">
                                        <span className="text-sm font-medium text-slate-300">
                                            Start date
                                        </span>

                                        <input
                                            type="date"
                                            value={
                                                editForm.start_date
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                setEditForm(
                                                    (
                                                        current,
                                                    ) => ({
                                                        ...current,
                                                        start_date:
                                                            event
                                                                .target
                                                                .value,
                                                    }),
                                                )
                                            }
                                            className="mt-2 w-full border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
                                        />
                                    </label>

                                    <label className="block">
                                        <span className="text-sm font-medium text-slate-300">
                                            Due date
                                        </span>

                                        <input
                                            type="date"
                                            value={
                                                editForm.due_date
                                            }
                                            min={
                                                editForm.start_date ||
                                                undefined
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                setEditForm(
                                                    (
                                                        current,
                                                    ) => ({
                                                        ...current,
                                                        due_date:
                                                            event
                                                                .target
                                                                .value,
                                                    }),
                                                )
                                            }
                                            className="mt-2 w-full border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
                                        />
                                    </label>
                                </div>

                                <label className="mt-4 block">
                                    <span className="text-sm font-medium text-slate-300">
                                        Description
                                    </span>

                                    <textarea
                                        rows={4}
                                        value={
                                            editForm.description
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setEditForm(
                                                (
                                                    current,
                                                ) => ({
                                                    ...current,
                                                    description:
                                                        event
                                                            .target
                                                            .value,
                                                }),
                                            )
                                        }
                                        className="mt-2 w-full resize-y border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
                                    />
                                </label>

                                <div className="mt-5 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleSave(
                                                project,
                                            )
                                        }
                                        disabled={!canManage ||
                                            updateMutation.isPending
                                        }
                                        className="border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {isSaving
                                            ? 'Saving...'
                                            : 'Save'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={
                                            cancelEditing
                                        }
                                        disabled={!canManage ||
                                            updateMutation.isPending
                                        }
                                        className="border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </article>
                        );
                    }

                    return (
                        <article
                            key={project.id}
                            className="border border-slate-800 bg-slate-900 p-6 transition hover:border-blue-500"
                        >
                            <Link
                                to={`/workspaces/${workspaceId}/projects/${project.id}`}
                                className="block"
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
                                            {formatDate(
                                                project.start_date,
                                            )}
                                        </dd>
                                    </div>

                                    <div className="flex justify-between gap-4">
                                        <dt className="text-slate-500">
                                            Due date
                                        </dt>

                                        <dd className="text-slate-300">
                                            {formatDate(
                                                project.due_date,
                                            )}
                                        </dd>
                                    </div>
                                </dl>
                            </Link>

                            <div className="mt-6 flex gap-3 border-t border-slate-800 pt-4">
                                <button
                                    type="button"
                                    onClick={() =>
                                        beginEditing(project)
                                    }
                                    disabled={!canManage ||
                                        deleteMutation.isPending ||
                                        updateMutation.isPending
                                    }
                                    className="border border-blue-700 px-3 py-2 text-sm font-medium text-blue-400 hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleDelete(project)
                                    }
                                    disabled={!canManage ||
                                        deleteMutation.isPending ||
                                        updateMutation.isPending
                                    }
                                    className="border border-red-800 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isDeleting
                                        ? 'Deleting...'
                                        : 'Delete'}
                                </button>
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}

export default ProjectList;