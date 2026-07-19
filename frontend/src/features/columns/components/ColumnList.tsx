import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useState } from 'react';
import CreateTaskForm from '../../tasks/components/CreateTaskForm';
import TaskList from '../../tasks/components/TaskList';
import {
    deleteColumn,
    getColumns,
    updateColumn,
} from '../api';
import type {
    Column,
    UpdateColumnInput,
} from '../types';

interface ColumnListProps {
    workspaceId: number;
    projectId: number;
    boardId: number;
}

interface EditColumnFormState {
    name: string;
    position: string;
    wip_limit: string;
}

interface ApiErrorResponse {
    message?: string;
    errors?: Record<string, string[]>;
}

function ColumnList({
    workspaceId,
    projectId,
    boardId,
}: ColumnListProps) {
    const queryClient = useQueryClient();

    const [editingColumnId, setEditingColumnId] =
        useState<number | null>(null);

    const [showTaskFormColumnId, setShowTaskFormColumnId] =
        useState<number | null>(null);

    const [editForm, setEditForm] =
        useState<EditColumnFormState>({
            name: '',
            position: '0',
            wip_limit: '',
        });

    const [errorMessage, setErrorMessage] =
        useState<string | null>(null);

    const columnsQuery = useQuery({
        queryKey: [
            'columns',
            workspaceId,
            projectId,
            boardId,
        ],
        queryFn: () =>
            getColumns(
                workspaceId,
                projectId,
                boardId,
            ),
        retry: false,
    });

    const updateMutation = useMutation({
        mutationFn: ({
            columnId,
            input,
        }: {
            columnId: number;
            input: UpdateColumnInput;
        }) =>
            updateColumn(
                workspaceId,
                projectId,
                boardId,
                columnId,
                input,
            ),

        onSuccess: async () => {
            setEditingColumnId(null);
            setErrorMessage(null);

            await queryClient.invalidateQueries({
                queryKey: [
                    'columns',
                    workspaceId,
                    projectId,
                    boardId,
                ],
            });
        },

        onError: (
            error: AxiosError<ApiErrorResponse>,
        ) => {
            if (error.response?.status === 403) {
                setErrorMessage(
                    'You do not have permission to edit this column.',
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
                    'Unable to update the column.',
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (columnId: number) =>
            deleteColumn(
                workspaceId,
                projectId,
                boardId,
                columnId,
            ),

        onSuccess: async () => {
            setErrorMessage(null);

            await queryClient.invalidateQueries({
                queryKey: [
                    'columns',
                    workspaceId,
                    projectId,
                    boardId,
                ],
            });
        },

        onError: (
            error: AxiosError<ApiErrorResponse>,
        ) => {
            if (error.response?.status === 403) {
                setErrorMessage(
                    'You do not have permission to delete this column.',
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
                    'Unable to delete the column.',
            );
        },
    });

    function beginEditing(column: Column) {
        setEditingColumnId(column.id);
        setShowTaskFormColumnId(null);
        setErrorMessage(null);

        setEditForm({
            name: column.name,
            position: String(column.position),
            wip_limit:
                column.wip_limit === null
                    ? ''
                    : String(column.wip_limit),
        });
    }

    function cancelEditing() {
        setEditingColumnId(null);
        setErrorMessage(null);
    }

    function toggleTaskForm(columnId: number) {
        setShowTaskFormColumnId(
            currentColumnId =>
                currentColumnId === columnId
                    ? null
                    : columnId,
        );
    }

    function handleSave(column: Column) {
        setErrorMessage(null);

        const name = editForm.name.trim();
        const position = Number(
            editForm.position,
        );

        if (!name) {
            setErrorMessage(
                'Column name is required.',
            );
            return;
        }

        if (
            !Number.isInteger(position) ||
            position < 0
        ) {
            setErrorMessage(
                'Position must be a non-negative whole number.',
            );
            return;
        }

        let parsedWipLimit: number | null = null;

        if (editForm.wip_limit !== '') {
            parsedWipLimit = Number(
                editForm.wip_limit,
            );

            if (
                !Number.isInteger(
                    parsedWipLimit,
                ) ||
                parsedWipLimit < 1
            ) {
                setErrorMessage(
                    'WIP limit must be a positive whole number.',
                );
                return;
            }
        }

        updateMutation.mutate({
            columnId: column.id,
            input: {
                name,
                position,
                wip_limit: parsedWipLimit,
            },
        });
    }

    function handleDelete(column: Column) {
        const confirmed = window.confirm(
            `Delete column "${column.name}"?`,
        );

        if (!confirmed) {
            return;
        }

        setErrorMessage(null);
        deleteMutation.mutate(column.id);
    }

    if (columnsQuery.isPending) {
        return (
            <p className="mt-6 text-slate-400">
                Loading columns...
            </p>
        );
    }

    if (columnsQuery.isError) {
        return (
            <p className="mt-6 border border-red-900 bg-red-950/40 p-4 text-red-400">
                Unable to load columns.
            </p>
        );
    }

    const columns = columnsQuery.data;

    if (columns.length === 0) {
        return (
            <p className="mt-6 border border-slate-800 bg-slate-900 p-6 text-slate-400">
                No columns have been created on this board.
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

            <div className="flex gap-4 overflow-x-auto pb-6">
                {columns.map((column) => {
                    const isEditing =
                        editingColumnId === column.id;

                    const isSaving =
                        updateMutation.isPending &&
                        updateMutation.variables
                            ?.columnId === column.id;

                    const isDeleting =
                        deleteMutation.isPending &&
                        deleteMutation.variables ===
                            column.id;

                    const isTaskFormVisible =
                        showTaskFormColumnId ===
                        column.id;

                    if (isEditing) {
                        return (
                            <article
                                key={column.id}
                                className="w-96 shrink-0 border border-blue-700 bg-slate-900 p-5"
                            >
                                <label className="block">
                                    <span className="text-sm font-medium text-slate-300">
                                        Column name
                                    </span>

                                    <input
                                        type="text"
                                        value={editForm.name}
                                        maxLength={255}
                                        onChange={(
                                            event,
                                        ) =>
                                            setEditForm(
                                                current => ({
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
                                        Position
                                    </span>

                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={
                                            editForm.position
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setEditForm(
                                                current => ({
                                                    ...current,
                                                    position:
                                                        event
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
                                        WIP limit
                                    </span>

                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={
                                            editForm.wip_limit
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setEditForm(
                                                current => ({
                                                    ...current,
                                                    wip_limit:
                                                        event
                                                            .target
                                                            .value,
                                                }),
                                            )
                                        }
                                        placeholder="No limit"
                                        className="mt-2 w-full border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
                                    />
                                </label>

                                <div className="mt-5 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleSave(column)
                                        }
                                        disabled={
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
                                        disabled={
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
                            key={column.id}
                            className="w-96 shrink-0 border border-slate-800 bg-slate-900 p-5"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-100">
                                        {column.name}
                                    </h3>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Position:{' '}
                                        <span className="text-slate-300">
                                            {column.position}
                                        </span>
                                    </p>
                                </div>

                                <span className="border border-slate-700 px-2 py-1 text-xs uppercase tracking-wide text-slate-300">
                                    {column.wip_limit ===
                                    null
                                        ? 'No limit'
                                        : `WIP ${column.wip_limit}`}
                                </span>
                            </div>

                            <div className="mt-5">
                                <button
                                    type="button"
                                    onClick={() =>
                                        toggleTaskForm(
                                            column.id,
                                        )
                                    }
                                    className="w-full border border-blue-700 px-3 py-2 text-sm font-medium text-blue-400 hover:bg-blue-950"
                                >
                                    {isTaskFormVisible
                                        ? 'Close task form'
                                        : 'Add task'}
                                </button>

                                {isTaskFormVisible && (
                                    <CreateTaskForm
                                        workspaceId={
                                            workspaceId
                                        }
                                        projectId={
                                            projectId
                                        }
                                        boardId={boardId}
                                        columnId={
                                            column.id
                                        }
                                    />
                                )}
                            </div>

                            <TaskList
                                workspaceId={
                                    workspaceId
                                }
                                projectId={projectId}
                                boardId={boardId}
                                columnId={column.id}
                            />

                            <div className="mt-5 flex gap-3 border-t border-slate-800 pt-4">
                                <button
                                    type="button"
                                    onClick={() =>
                                        beginEditing(column)
                                    }
                                    disabled={
                                        updateMutation.isPending ||
                                        deleteMutation.isPending
                                    }
                                    className="border border-blue-700 px-3 py-2 text-sm font-medium text-blue-400 hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Edit column
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleDelete(column)
                                    }
                                    disabled={
                                        updateMutation.isPending ||
                                        deleteMutation.isPending
                                    }
                                    className="border border-red-800 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isDeleting
                                        ? 'Deleting...'
                                        : 'Delete column'}
                                </button>
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}

export default ColumnList;