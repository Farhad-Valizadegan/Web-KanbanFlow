import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    deleteBoard,
    getBoards,
    updateBoard,
} from '../api';
import type {
    Board,
    BoardVisibility,
    UpdateBoardInput,
} from '../types';

interface BoardListProps {
    workspaceId: number;
    projectId: number;
}

interface EditBoardFormState {
    name: string;
    description: string;
    visibility: BoardVisibility;
    position: string;
}

interface ApiErrorResponse {
    message?: string;
    errors?: Record<string, string[]>;
}

function BoardList({
    workspaceId,
    projectId,
}: BoardListProps) {
    const queryClient = useQueryClient();

    const [editingBoardId, setEditingBoardId] =
        useState<number | null>(null);

    const [editForm, setEditForm] =
        useState<EditBoardFormState>({
            name: '',
            description: '',
            visibility: 'workspace',
            position: '0',
        });

    const [errorMessage, setErrorMessage] =
        useState<string | null>(null);

    const boardsQuery = useQuery({
        queryKey: [
            'boards',
            workspaceId,
            projectId,
        ],
        queryFn: () =>
            getBoards(workspaceId, projectId),
        retry: false,
    });

    const updateMutation = useMutation({
        mutationFn: ({
            boardId,
            input,
        }: {
            boardId: number;
            input: UpdateBoardInput;
        }) =>
            updateBoard(
                workspaceId,
                projectId,
                boardId,
                input,
            ),

        onSuccess: async () => {
            setEditingBoardId(null);
            setErrorMessage(null);

            await queryClient.invalidateQueries({
                queryKey: [
                    'boards',
                    workspaceId,
                    projectId,
                ],
            });
        },

        onError: (
            error: AxiosError<ApiErrorResponse>,
        ) => {
            if (error.response?.status === 403) {
                setErrorMessage(
                    'You do not have permission to edit this board.',
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
                    'Unable to update the board.',
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (boardId: number) =>
            deleteBoard(
                workspaceId,
                projectId,
                boardId,
            ),

        onSuccess: async () => {
            setErrorMessage(null);

            await queryClient.invalidateQueries({
                queryKey: [
                    'boards',
                    workspaceId,
                    projectId,
                ],
            });
        },

        onError: (
            error: AxiosError<ApiErrorResponse>,
        ) => {
            if (error.response?.status === 403) {
                setErrorMessage(
                    'You do not have permission to delete this board.',
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
                    'Unable to delete the board.',
            );
        },
    });

    function beginEditing(board: Board) {
        setEditingBoardId(board.id);
        setErrorMessage(null);

        setEditForm({
            name: board.name,
            description:
                board.description ?? '',
            visibility: board.visibility,
            position: String(board.position),
        });
    }

    function cancelEditing() {
        setEditingBoardId(null);
        setErrorMessage(null);
    }

    function handleSave(board: Board) {
        setErrorMessage(null);

        const name = editForm.name.trim();
        const position = Number(editForm.position);

        if (!name) {
            setErrorMessage(
                'Board name is required.',
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

        updateMutation.mutate({
            boardId: board.id,
            input: {
                name,
                description:
                    editForm.description.trim() ||
                    null,
                visibility:
                    editForm.visibility,
                position,
            },
        });
    }

    function handleDelete(board: Board) {
        const confirmed = window.confirm(
            `Delete board "${board.name}"?`,
        );

        if (!confirmed) {
            return;
        }

        setErrorMessage(null);
        deleteMutation.mutate(board.id);
    }

    if (boardsQuery.isPending) {
        return (
            <p className="mt-6 text-slate-400">
                Loading boards...
            </p>
        );
    }

    if (boardsQuery.isError) {
        return (
            <p className="mt-6 border border-red-900 bg-red-950/40 p-4 text-red-400">
                Unable to load boards.
            </p>
        );
    }

    const boards = boardsQuery.data;

    if (boards.length === 0) {
        return (
            <p className="mt-6 border border-slate-800 bg-slate-900 p-6 text-slate-400">
                No boards have been created in this project.
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
                {boards.map((board) => {
                    const isEditing =
                        editingBoardId === board.id;

                    const isSaving =
                        updateMutation.isPending &&
                        updateMutation.variables
                            ?.boardId === board.id;

                    const isDeleting =
                        deleteMutation.isPending &&
                        deleteMutation.variables ===
                            board.id;

                    if (isEditing) {
                        return (
                            <article
                                key={board.id}
                                className="border border-blue-700 bg-slate-900 p-6"
                            >
                                <label className="block">
                                    <span className="text-sm font-medium text-slate-300">
                                        Board name
                                    </span>

                                    <input
                                        type="text"
                                        value={editForm.name}
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
                                                            .value as BoardVisibility,
                                                }),
                                            )
                                        }
                                        className="mt-2 w-full border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
                                    >
                                        <option value="workspace">
                                            Workspace
                                        </option>

                                        <option value="private">
                                            Private
                                        </option>
                                    </select>
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
                                                (
                                                    current,
                                                ) => ({
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
                                            handleSave(board)
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
                            key={board.id}
                            className="border border-slate-800 bg-slate-900 p-6 transition hover:border-blue-500"
                        >
                            <Link
                                to={`/workspaces/${workspaceId}/projects/${projectId}/boards/${board.id}`}
                                className="block"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-100">
                                            {board.name}
                                        </h3>

                                        <p className="mt-1 text-sm text-slate-500">
                                            {board.slug}
                                        </p>
                                    </div>

                                    <span className="border border-slate-700 px-2 py-1 text-xs uppercase tracking-wide text-slate-300">
                                        {
                                            board.visibility
                                        }
                                    </span>
                                </div>

                                <p className="mt-4 min-h-12 text-sm leading-6 text-slate-400">
                                    {board.description ||
                                        'No board description.'}
                                </p>

                                <p className="mt-4 text-sm text-slate-500">
                                    Position:{' '}
                                    <span className="text-slate-300">
                                        {board.position}
                                    </span>
                                </p>
                            </Link>

                            <div className="mt-6 flex gap-3 border-t border-slate-800 pt-4">
                                <button
                                    type="button"
                                    onClick={() =>
                                        beginEditing(board)
                                    }
                                    disabled={
                                        updateMutation.isPending ||
                                        deleteMutation.isPending
                                    }
                                    className="border border-blue-700 px-3 py-2 text-sm font-medium text-blue-400 hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleDelete(board)
                                    }
                                    disabled={
                                        updateMutation.isPending ||
                                        deleteMutation.isPending
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

export default BoardList;