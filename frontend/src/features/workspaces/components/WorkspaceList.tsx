import { getCurrentUser } from '../../auth/api';
import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    deleteWorkspace,
    updateWorkspace,
} from '../api';
import type {
    UpdateWorkspaceInput,
    Workspace,
    WorkspaceVisibility,
} from '../types';

interface WorkspaceListProps {
    workspaces: Workspace[];
}

interface EditWorkspaceFormState {
    name: string;
    description: string;
    visibility: WorkspaceVisibility;
}

interface ApiErrorResponse {
    message?: string;
    errors?: Record<string, string[]>;
}

function WorkspaceList({
    workspaces,
}: WorkspaceListProps) {
    const [search, setSearch] = useState('');
    const queryClient = useQueryClient();
    const userQuery = useQuery({ queryKey: ['current-user'], queryFn: getCurrentUser, retry: false });

    const [editingWorkspaceId, setEditingWorkspaceId] =
        useState<number | null>(null);

    const [editForm, setEditForm] =
        useState<EditWorkspaceFormState>({
            name: '',
            description: '',
            visibility: 'private',
        });

    const [errorMessage, setErrorMessage] =
        useState<string | null>(null);

    const deleteMutation = useMutation({
        mutationFn: (workspaceId: number) =>
            deleteWorkspace(workspaceId),

        onSuccess: async () => {
            setErrorMessage(null);

            await queryClient.invalidateQueries({
                queryKey: ['workspaces'],
            });
        },

        onError: (
            error: AxiosError<ApiErrorResponse>,
        ) => {
            if (error.response?.status === 403) {
                setErrorMessage(
                    'Only the workspace owner can delete this workspace.',
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
                    'Unable to delete the workspace.',
            );
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({
            workspaceId,
            input,
        }: {
            workspaceId: number;
            input: UpdateWorkspaceInput;
        }) =>
            updateWorkspace(
                workspaceId,
                input,
            ),

        onSuccess: async () => {
            setEditingWorkspaceId(null);
            setErrorMessage(null);

            await queryClient.invalidateQueries({
                queryKey: ['workspaces'],
            });
        },

        onError: (
            error: AxiosError<ApiErrorResponse>,
        ) => {
            if (error.response?.status === 403) {
                setErrorMessage(
                    'Only the workspace owner can edit this workspace.',
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
                    Object.values(validationErrors)[0]?.[0];

                if (firstError) {
                    setErrorMessage(firstError);
                    return;
                }
            }

            setErrorMessage(
                error.response?.data.message ??
                    'Unable to update the workspace.',
            );
        },
    });

    function beginEditing(workspace: Workspace) {
        setEditingWorkspaceId(workspace.id);
        setErrorMessage(null);

        setEditForm({
            name: workspace.name,
            description:
                workspace.description ?? '',
            visibility: workspace.visibility,
        });
    }

    function cancelEditing() {
        setEditingWorkspaceId(null);
        setErrorMessage(null);
    }

    function handleSave(workspace: Workspace) {
        setErrorMessage(null);

        const name = editForm.name.trim();

        if (!name) {
            setErrorMessage(
                'Workspace name is required.',
            );
            return;
        }

        updateMutation.mutate({
            workspaceId: workspace.id,
            input: {
                name,
                description:
                    editForm.description.trim() ||
                    null,
                visibility:
                    editForm.visibility,
            },
        });
    }

    function handleDelete(
        workspace: Workspace,
    ) {
        const confirmed = window.confirm(
            `Delete workspace "${workspace.name}"? This will also remove its projects, boards, columns, and tasks.`,
        );

        if (!confirmed) {
            return;
        }

        setErrorMessage(null);
        deleteMutation.mutate(workspace.id);
    }

    const visibleItems = workspaces.filter(item => (item.name + ' ' + (item.description ?? '')).toLowerCase().includes(search.trim().toLowerCase()));
    if (workspaces.length === 0) {
        return (
            <div className="border border-dashed border-slate-700 bg-slate-950 p-8 text-center">
                <h2 className="text-lg font-semibold text-slate-200">
                    No workspaces yet
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                    Create your first workspace to start organizing projects.
                </p>
            </div>
        );
    }

    return (
        <div>
            {errorMessage && (
                <p className="mb-4 border border-red-900 bg-red-950/40 p-4 text-sm text-red-400">
                    {errorMessage}
                </p>
            )}

                        <div className="list-toolbar">
                <input type="search" aria-label="Search workspaces" placeholder="Search workspaces…" value={search} onChange={event => setSearch(event.target.value)} />
                <p role="status">{visibleItems.length} of {workspaces.length} workspaces</p>
            </div>
            {visibleItems.length === 0 && <p className="empty-search">No matching workspaces. Try another name or clear your search.</p>}
            <div className="grid gap-4 md:grid-cols-2">
                {visibleItems.map((workspace) => {
                    const isEditing =
                        editingWorkspaceId ===
                        workspace.id;

                    const isDeleting =
                        deleteMutation.isPending &&
                        deleteMutation.variables ===
                            workspace.id;

                    const isSaving =
                        updateMutation.isPending &&
                        updateMutation.variables
                            ?.workspaceId ===
                            workspace.id;

                    if (isEditing) {
                        return (
                            <article
                                key={workspace.id}
                                className="border border-blue-700 bg-slate-950 p-5"
                            >
                                <label className="block">
                                    <span className="text-sm font-medium text-slate-300">
                                        Workspace name
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
                                        className="mt-2 w-full border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
                                    />
                                </label>

                                <label className="mt-4 block">
                                    <span className="text-sm font-medium text-slate-300">
                                        Visibility
                                    </span>

                                    <select
                                        value={
                                            editForm.visibility
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setEditForm(
                                                (
                                                    current,
                                                ) => ({
                                                    ...current,
                                                    visibility:
                                                        event
                                                            .target
                                                            .value as WorkspaceVisibility,
                                                }),
                                            )
                                        }
                                        className="mt-2 w-full border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
                                    >
                                        <option value="private">
                                            Private
                                        </option>

                                        <option value="public">
                                            Public
                                        </option>
                                    </select>
                                </label>

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
                                        className="mt-2 w-full resize-y border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
                                    />
                                </label>

                                <div className="mt-5 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleSave(
                                                workspace,
                                            )
                                        }
                                        disabled={workspace.owner_id !== userQuery.data?.id ||
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
                                        disabled={workspace.owner_id !== userQuery.data?.id ||
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
                            key={workspace.id}
                            className="resource-card border border-slate-800 bg-slate-950 p-5 transition hover:border-blue-500 hover:bg-slate-900"
                        >
                            <Link
                                to={`/workspaces/${workspace.id}`}
                                className="block"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="workspace-avatar" aria-hidden="true">{workspace.name.slice(0, 1).toUpperCase()}</span><div className="min-w-0">
                                        <h2 className="text-lg font-semibold text-slate-100">
                                            {workspace.name}
                                        </h2>

                                        <p className="mt-1 text-sm text-slate-500">
                                            {workspace.slug}
                                        </p>
                                        </div>
                                    </div>

                                    <span className="border border-slate-700 px-2 py-1 text-xs uppercase tracking-wide text-slate-300">
                                        {
                                            workspace.visibility
                                        }
                                    </span>
                                </div>

                                <p className="mt-4 text-sm leading-6 text-slate-400">
                                    {workspace.description ||
                                        'No description has been added.'}
                                </p>
                            </Link>

                            <div className="mt-5 flex flex-col justify-between gap-4 border-t border-slate-800 pt-4 sm:flex-row sm:items-center">
                                <p className="text-sm text-slate-500">
                                    Owner:{' '}
                                    <span className="text-slate-300">
                                        {workspace.owner
                                            ?.name ??
                                            'Unknown'}
                                    </span>
                                </p>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            beginEditing(
                                                workspace,
                                            )
                                        }
                                        disabled={workspace.owner_id !== userQuery.data?.id ||
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
                                            handleDelete(
                                                workspace,
                                            )
                                        }
                                        disabled={workspace.owner_id !== userQuery.data?.id ||
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
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}

export default WorkspaceList;
