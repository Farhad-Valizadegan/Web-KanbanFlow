import {
    closestCenter,
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type {
    DragEndEvent,
    DraggableAttributes,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type {
    CSSProperties,
    SyntheticEvent,
} from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    deleteBoard,
    getBoards,
    moveBoard,
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
}

interface MoveBoardVariables {
    boardId: number;
    position: number;
}

interface ApiErrorResponse {
    message?: string;
    errors?: Record<string, string[]>;
}

interface SortableBoardCardProps {
    board: Board;
    workspaceId: number;
    projectId: number;
    disabled: boolean;
    isDeleting: boolean;
    onEdit: (board: Board) => void;
    onDelete: (board: Board) => void;
}

interface DragHandleProps {
    attributes: DraggableAttributes;
    listeners:
        | Record<string, unknown>
        | undefined;
}

function DragHandle({
    attributes,
    listeners,
}: DragHandleProps) {
    function stopPropagation(
        event: SyntheticEvent,
    ) {
        event.stopPropagation();
    }

    return (
        <button
            type="button"
            aria-label="Drag board"
            title="Drag to reorder"
            onClick={stopPropagation}
            {...attributes}
            {...listeners}
            className="cursor-grab border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-blue-500 hover:text-blue-300 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
        >
            Move
        </button>
    );
}

function SortableBoardCard({
    board,
    workspaceId,
    projectId,
    disabled,
    isDeleting,
    onEdit,
    onDelete,
}: SortableBoardCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: board.id,
        data: {
            type: 'board',
            boardId: board.id,
        },
        disabled,
    });

    const style: CSSProperties = {
        transform: CSS.Transform.toString(
            transform,
        ),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : undefined,
    };

    return (
        <article
            ref={setNodeRef}
            style={style}
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
                        {board.visibility}
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

            <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-800 pt-4">
                <DragHandle
                    attributes={attributes}
                    listeners={listeners}
                />

                <button
                    type="button"
                    onClick={() => onEdit(board)}
                    disabled={disabled}
                    className="border border-blue-700 px-3 py-2 text-sm font-medium text-blue-400 hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Edit
                </button>

                <button
                    type="button"
                    onClick={() =>
                        onDelete(board)
                    }
                    disabled={disabled}
                    className="border border-red-800 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isDeleting
                        ? 'Deleting...'
                        : 'Delete'}
                </button>
            </div>
        </article>
    );
}

function BoardList({
    workspaceId,
    projectId,
}: BoardListProps) {
    const queryClient = useQueryClient();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
    );

    const [editingBoardId, setEditingBoardId] =
        useState<number | null>(null);

    const [editForm, setEditForm] =
        useState<EditBoardFormState>({
            name: '',
            description: '',
            visibility: 'workspace',
        });

    const [errorMessage, setErrorMessage] =
        useState<string | null>(null);

    const boardsQueryKey = [
        'boards',
        workspaceId,
        projectId,
    ];

    const boardsQuery = useQuery({
        queryKey: boardsQueryKey,
        queryFn: () =>
            getBoards(
                workspaceId,
                projectId,
            ),
        retry: false,
    });

    const moveMutation = useMutation({
        mutationFn: ({
            boardId,
            position,
        }: MoveBoardVariables) =>
            moveBoard(
                workspaceId,
                projectId,
                boardId,
                {
                    position,
                },
            ),

        onMutate: async ({
            boardId,
            position,
        }) => {
            await queryClient.cancelQueries({
                queryKey: boardsQueryKey,
            });

            const previousBoards =
                queryClient.getQueryData<Board[]>(
                    boardsQueryKey,
                );

            if (previousBoards) {
                const oldIndex =
                    previousBoards.findIndex(
                        board =>
                            board.id === boardId,
                    );

                const newIndex = position - 1;

                if (oldIndex !== -1) {
                    const reordered = arrayMove(
                        previousBoards,
                        oldIndex,
                        newIndex,
                    ).map(
                        (board, index) => ({
                            ...board,
                            position: index + 1,
                        }),
                    );

                    queryClient.setQueryData(
                        boardsQueryKey,
                        reordered,
                    );
                }
            }

            return {
                previousBoards,
            };
        },

        onSuccess: async () => {
            setErrorMessage(null);

            await queryClient.invalidateQueries({
                queryKey: boardsQueryKey,
            });
        },

        onError: (
            error: AxiosError<ApiErrorResponse>,
            _variables,
            context,
        ) => {
            if (context?.previousBoards) {
                queryClient.setQueryData(
                    boardsQueryKey,
                    context.previousBoards,
                );
            }

            if (error.response?.status === 403) {
                setErrorMessage(
                    'You do not have permission to move this board.',
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
                    'Unable to move the board.',
            );
        },
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
                queryKey: boardsQueryKey,
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
                queryKey: boardsQueryKey,
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
        });
    }

    function cancelEditing() {
        setEditingBoardId(null);
        setErrorMessage(null);
    }

    function handleSave(board: Board) {
        setErrorMessage(null);

        const name = editForm.name.trim();

        if (!name) {
            setErrorMessage(
                'Board name is required.',
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

    function handleDragEnd(
        event: DragEndEvent,
    ) {
        const { active, over } = event;

        if (
            !over ||
            active.id === over.id ||
            moveMutation.isPending
        ) {
            return;
        }

        const boards =
            queryClient.getQueryData<Board[]>(
                boardsQueryKey,
            ) ?? [];

        const oldIndex = boards.findIndex(
            board => board.id === active.id,
        );

        const newIndex = boards.findIndex(
            board => board.id === over.id,
        );

        if (
            oldIndex === -1 ||
            newIndex === -1
        ) {
            return;
        }

        const boardId = Number(active.id);

        if (!Number.isInteger(boardId)) {
            return;
        }

        setErrorMessage(null);

        moveMutation.mutate({
            boardId,
            position: newIndex + 1,
        });
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

    const interactionDisabled =
        updateMutation.isPending ||
        deleteMutation.isPending ||
        moveMutation.isPending;

    return (
        <div className="mt-6">
            {errorMessage && (
                <p className="mb-4 border border-red-900 bg-red-950/40 p-4 text-sm text-red-400">
                    {errorMessage}
                </p>
            )}

            {moveMutation.isPending && (
                <p className="mb-4 border border-blue-900 bg-blue-950/40 p-4 text-sm text-blue-300">
                    Moving board...
                </p>
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={boards.map(
                        board => board.id,
                    )}
                    strategy={
                        verticalListSortingStrategy
                    }
                >
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {boards.map((board) => {
                            const isEditing =
                                editingBoardId ===
                                board.id;

                            const isSaving =
                                updateMutation.isPending &&
                                updateMutation.variables
                                    ?.boardId ===
                                    board.id;

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
                                                value={
                                                    editForm.name
                                                }
                                                maxLength={
                                                    255
                                                }
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
                                                        current => ({
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
                                                        current => ({
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
                                                        board,
                                                    )
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
                                <SortableBoardCard
                                    key={board.id}
                                    board={board}
                                    workspaceId={
                                        workspaceId
                                    }
                                    projectId={
                                        projectId
                                    }
                                    disabled={
                                        interactionDisabled
                                    }
                                    isDeleting={
                                        isDeleting
                                    }
                                    onEdit={
                                        beginEditing
                                    }
                                    onDelete={
                                        handleDelete
                                    }
                                />
                            );
                        })}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}

export default BoardList;