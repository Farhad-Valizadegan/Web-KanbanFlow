import { useWorkspacePermissions } from '../../workspaces/useWorkspacePermissions';
import {
    closestCorners,
    DndContext,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    arrayMove,
    horizontalListSortingStrategy,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { moveTask } from '../../tasks/api';
import CreateTaskForm from '../../tasks/components/CreateTaskForm';
import TaskList from '../../tasks/components/TaskList';
import type { Task } from '../../tasks/types';
import {
    deleteColumn,
    getColumns,
    moveColumn,
    updateColumn,
} from '../api';
import type {
    Column,
    UpdateColumnInput,
} from '../types';

type BoardViewMode =
    | 'detailed'
    | 'overview';

interface ColumnListProps {
    workspaceId: number;
    projectId: number;
    boardId: number;
    viewMode: BoardViewMode;
}

interface EditColumnFormState {
    name: string;
    wip_limit: string;
}

interface MoveTaskVariables {
    sourceColumnId: number;
    destinationColumnId: number;
    taskId: number;
    position: number;
}

interface MoveColumnVariables {
    columnId: number;
    position: number;
}

interface ApiErrorResponse {
    message?: string;
    errors?: Record<string, string[]>;
}

interface SortableColumnCardProps {
    column: Column;
    workspaceId: number;
    projectId: number;
    boardId: number;
    viewMode: BoardViewMode;
    disabled: boolean;
    isDeleting: boolean;
    isTaskFormVisible: boolean;
    onToggleTaskForm: (
        columnId: number,
    ) => void;
    onEdit: (column: Column) => void;
    onDelete: (column: Column) => void;
}

function SortableColumnCard({
    column,
    workspaceId,
    projectId,
    boardId,
    viewMode,
    disabled,
    isDeleting,
    isTaskFormVisible,
    onToggleTaskForm,
    onEdit,
    onDelete,
}: SortableColumnCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: column.id,
        data: {
            type: 'column',
            columnId: column.id,
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

    const isOverview =
        viewMode === 'overview';

    return (
        <article
            ref={setNodeRef}
            style={style}
            data-tone={column.position % 4}
            className={
                isOverview
                    ? 'kanban-column w-64 shrink-0 border border-slate-800 bg-slate-900 p-3'
                    : 'kanban-column w-96 shrink-0 border border-slate-800 bg-slate-900 p-5'
            }
        >
            <div className="column-heading flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3
                        className={
                            isOverview
                                ? 'truncate text-sm font-semibold text-slate-100'
                                : 'text-lg font-semibold text-slate-100'
                        }
                        title={column.name}
                    >
                        {column.name}
                    </h3>

                    <p
                        className={
                            isOverview
                                ? 'mt-1 text-xs text-slate-500'
                                : 'mt-1 text-sm text-slate-500'
                        }
                    >
                        Position{' '}
                        <span className="text-slate-300">
                            {column.position}
                        </span>
                    </p>
                </div>

                <span
                    className={
                        isOverview
                            ? 'shrink-0 border border-slate-700 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-300'
                            : 'shrink-0 border border-slate-700 px-2 py-1 text-xs uppercase tracking-wide text-slate-300'
                    }
                >
                    {column.wip_limit === null
                        ? 'No limit'
                        : `WIP ${column.wip_limit}`}
                </span>
            </div>

            <button
                type="button"
                ref={setActivatorNodeRef}
                aria-label={`Move ${column.name} column`}
                title="Drag to reorder column"
                disabled={disabled}
                {...attributes}
                {...listeners}
                className={
                    isOverview
                        ? 'mt-3 w-full cursor-grab border border-slate-700 px-2 py-1.5 text-xs font-medium text-slate-300 hover:border-blue-500 hover:text-blue-300 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50'
                        : 'mt-4 w-full cursor-grab border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 hover:border-blue-500 hover:text-blue-300 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50'
                }
            >
                Move column
            </button>

            <div
                className={
                    isOverview
                        ? 'mt-3'
                        : 'mt-5'
                }
            >
                <button
                    type="button"
                    onClick={() =>
                        onToggleTaskForm(column.id)
                    }
                    disabled={disabled}
                    className={
                        isOverview
                            ? 'w-full border border-blue-700 px-2 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-50'
                            : 'w-full border border-blue-700 px-3 py-2 text-sm font-medium text-blue-400 hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-50'
                    }
                >
                    {isTaskFormVisible
                        ? 'Close task form'
                        : 'Add task'}
                </button>

                {isTaskFormVisible && (
                    <CreateTaskForm
                        workspaceId={workspaceId}
                        projectId={projectId}
                        boardId={boardId}
                        columnId={column.id}
                    />
                )}
            </div>

            <TaskList
                workspaceId={workspaceId}
                projectId={projectId}
                boardId={boardId}
                columnId={column.id}
                viewMode={viewMode}
            />

            <div
                className={
                    isOverview
                        ? 'mt-3 flex flex-wrap gap-2 border-t border-slate-800 pt-3'
                        : 'mt-5 flex gap-3 border-t border-slate-800 pt-4'
                }
            >
                <button
                    type="button"
                    onClick={() => onEdit(column)}
                    disabled={disabled}
                    className={
                        isOverview
                            ? 'border border-blue-700 px-2 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-50'
                            : 'border border-blue-700 px-3 py-2 text-sm font-medium text-blue-400 hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-50'
                    }
                >
                    Edit
                </button>

                <button
                    type="button"
                    onClick={() =>
                        onDelete(column)
                    }
                    disabled={disabled}
                    className={
                        isOverview
                            ? 'border border-red-800 px-2 py-1.5 text-xs font-medium text-red-400 hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-50'
                            : 'border border-red-800 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-50'
                    }
                >
                    {isDeleting
                        ? 'Deleting...'
                        : 'Delete'}
                </button>
            </div>
        </article>
    );
}

function ColumnList({
    workspaceId,
    projectId,
    boardId,
    viewMode,
}: ColumnListProps) {
    const queryClient = useQueryClient();
    const { canManage } = useWorkspacePermissions(workspaceId);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const [editingColumnId, setEditingColumnId] =
        useState<number | null>(null);

    const [
        showTaskFormColumnId,
        setShowTaskFormColumnId,
    ] = useState<number | null>(null);

    const [editForm, setEditForm] =
        useState<EditColumnFormState>({
            name: '',
            wip_limit: '',
        });

    const [errorMessage, setErrorMessage] =
        useState<string | null>(null);

    const columnsQueryKey = [
        'columns',
        workspaceId,
        projectId,
        boardId,
    ];

    function taskQueryKey(columnId: number) {
        return [
            'tasks',
            workspaceId,
            projectId,
            boardId,
            columnId,
        ];
    }

    const columnsQuery = useQuery({
        queryKey: columnsQueryKey,
        queryFn: () =>
            getColumns(
                workspaceId,
                projectId,
                boardId,
            ),
        retry: false,
    });

    const moveColumnMutation = useMutation({
        mutationFn: ({
            columnId,
            position,
        }: MoveColumnVariables) =>
            moveColumn(
                workspaceId,
                projectId,
                boardId,
                columnId,
                {
                    position,
                },
            ),

        onMutate: async ({
            columnId,
            position,
        }) => {
            await queryClient.cancelQueries({
                queryKey: columnsQueryKey,
            });

            const previousColumns =
                queryClient.getQueryData<Column[]>(
                    columnsQueryKey,
                );

            if (previousColumns) {
                const oldIndex =
                    previousColumns.findIndex(
                        column =>
                            column.id === columnId,
                    );

                const newIndex = position - 1;

                if (oldIndex !== -1) {
                    const reordered = arrayMove(
                        previousColumns,
                        oldIndex,
                        newIndex,
                    ).map(
                        (column, index) => ({
                            ...column,
                            position: index + 1,
                        }),
                    );

                    queryClient.setQueryData(
                        columnsQueryKey,
                        reordered,
                    );
                }
            }

            return {
                previousColumns,
            };
        },

        onSuccess: async () => {
            setErrorMessage(null);

            await queryClient.invalidateQueries({
                queryKey: columnsQueryKey,
            });
        },

        onError: (
            error: AxiosError<ApiErrorResponse>,
            _variables,
            context,
        ) => {
            if (context?.previousColumns) {
                queryClient.setQueryData(
                    columnsQueryKey,
                    context.previousColumns,
                );
            }

            if (error.response?.status === 403) {
                setErrorMessage(
                    'You do not have permission to move this column.',
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
                    'Unable to move the column.',
            );
        },
    });

    const moveTaskMutation = useMutation({
        mutationKey: ['move-task', workspaceId, projectId, boardId],
        mutationFn: ({
            sourceColumnId,
            destinationColumnId,
            taskId,
            position,
        }: MoveTaskVariables) =>
            moveTask(
                workspaceId,
                projectId,
                boardId,
                sourceColumnId,
                taskId,
                {
                    column_id:
                        destinationColumnId,
                    position,
                },
            ),

        onMutate: async ({ sourceColumnId, destinationColumnId, taskId, position }) => {
            const prefix = ['tasks', workspaceId, projectId, boardId];
            await queryClient.cancelQueries({ queryKey: prefix });
            const snapshots = queryClient.getQueriesData<Task[]>({ queryKey: prefix });
            const source = queryClient.getQueryData<Task[]>(taskQueryKey(sourceColumnId));
            const destination = queryClient.getQueryData<Task[]>(taskQueryKey(destinationColumnId));
            const task = source?.find(item => item.id === taskId);
            if (task && source && destination) {
                const remaining = source.filter(item => item.id !== taskId);
                const target = sourceColumnId === destinationColumnId ? remaining : [...destination];
                target.splice(Math.min(position - 1, target.length), 0, { ...task, column_id: destinationColumnId });
                const normalize = (items: Task[]) => items.map((item, index) => ({ ...item, position: index + 1 }));
                if (sourceColumnId !== destinationColumnId) {
                    queryClient.setQueryData(taskQueryKey(sourceColumnId), normalize(remaining));
                }
                queryClient.setQueryData(taskQueryKey(destinationColumnId), normalize(target));
            }
            return { snapshots };
        },
        onSuccess: () => setErrorMessage(null),
        onSettled: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId, projectId, boardId] }),
                queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] }),
                queryClient.invalidateQueries({ queryKey: ['workspace-activities', workspaceId] }),
            ]);
        },

        onError: (
            error: AxiosError<ApiErrorResponse>,
            _variables,
            context,
        ) => {
            for (const [key, data] of context?.snapshots ?? []) {
                queryClient.setQueryData(key, data);
            }
            if (error.response?.status === 403) {
                setErrorMessage(
                    'You do not have permission to move this task.',
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
                    'Unable to move the task.',
            );
        },
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
                queryKey: columnsQueryKey,
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
                queryKey: columnsQueryKey,
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

        if (!name) {
            setErrorMessage(
                'Column name is required.',
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

    function handleColumnDragEnd(
        event: DragEndEvent,
    ) {
        const { active, over } = event;

        if (
            !over ||
            moveColumnMutation.isPending
        ) {
            return;
        }

        const columns =
            queryClient.getQueryData<Column[]>(
                columnsQueryKey,
            ) ?? [];

        const activeColumnId = Number(
            active.data.current?.columnId ??
                active.id,
        );

        let overColumnId: number;

        if (
            over.data.current?.type === 'task'
        ) {
            overColumnId = Number(
                over.data.current.columnId,
            );
        } else {
            overColumnId = Number(
                over.data.current?.columnId ??
                    over.id,
            );
        }

        if (
            !Number.isInteger(activeColumnId) ||
            !Number.isInteger(overColumnId) ||
            activeColumnId === overColumnId
        ) {
            return;
        }

        const oldIndex = columns.findIndex(
            column =>
                column.id === activeColumnId,
        );

        const newIndex = columns.findIndex(
            column =>
                column.id === overColumnId,
        );

        if (
            oldIndex === -1 ||
            newIndex === -1
        ) {
            return;
        }

        setErrorMessage(null);

        moveColumnMutation.mutate({
            columnId: activeColumnId,
            position: newIndex + 1,
        });
    }

    function handleTaskDragEnd(
        event: DragEndEvent,
    ) {
        const { active, over } = event;

        if (
            !over ||
            moveTaskMutation.isPending
        ) {
            return;
        }

        const activeData =
            active.data.current;

        const overData =
            over.data.current;

        const taskId = Number(
            activeData?.taskId,
        );

        const sourceColumnId = Number(
            activeData?.columnId,
        );

        if (
            !Number.isInteger(taskId) ||
            !Number.isInteger(
                sourceColumnId,
            )
        ) {
            return;
        }

        let destinationColumnId:
            | number
            | null = null;

        let destinationPosition:
            | number
            | null = null;

        if (overData?.type === 'task') {
            destinationColumnId = Number(
                overData.columnId,
            );

            const destinationTasks =
                queryClient.getQueryData<Task[]>(
                    taskQueryKey(
                        destinationColumnId,
                    ),
                ) ?? [];

            const overTaskId = Number(
                overData.taskId,
            );

            const overTaskIndex =
                destinationTasks.findIndex(
                    task =>
                        task.id === overTaskId,
                );

            if (overTaskIndex === -1) {
                return;
            }

            destinationPosition =
                overTaskIndex + 1;
        } else if (
            overData?.type === 'column'
        ) {
            destinationColumnId = Number(
                overData.columnId,
            );

            const destinationTasks =
                queryClient.getQueryData<Task[]>(
                    taskQueryKey(
                        destinationColumnId,
                    ),
                ) ?? [];

            destinationPosition =
                destinationTasks.length + 1;
        }

        if (
            destinationColumnId === null ||
            destinationPosition === null ||
            !Number.isInteger(
                destinationColumnId,
            ) ||
            !Number.isInteger(
                destinationPosition,
            )
        ) {
            return;
        }

        const sourceTasks =
            queryClient.getQueryData<Task[]>(
                taskQueryKey(
                    sourceColumnId,
                ),
            ) ?? [];

        const activeTask =
            sourceTasks.find(
                task => task.id === taskId,
            );

        if (!activeTask) {
            return;
        }

        if (
            sourceColumnId ===
                destinationColumnId &&
            activeTask.position ===
                destinationPosition
        ) {
            return;
        }

        setErrorMessage(null);

        moveTaskMutation.mutate({
            sourceColumnId,
            destinationColumnId,
            taskId,
            position:
                destinationPosition,
        });
    }

    function handleDragEnd(
        event: DragEndEvent,
    ) {
        const activeType =
            event.active.data.current?.type;

        if (activeType === 'column') {
            handleColumnDragEnd(event);
            return;
        }

        if (activeType === 'task') {
            handleTaskDragEnd(event);
        }
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

    const interactionDisabled =
        updateMutation.isPending ||
        deleteMutation.isPending ||
        moveTaskMutation.isPending ||
        moveColumnMutation.isPending;

    return (
        <div
            className={
                viewMode === 'overview'
                    ? 'mt-4'
                    : 'mt-6'
            }
        >
            {errorMessage && (
                <p className="mb-4 border border-red-900 bg-red-950/40 p-4 text-sm text-red-400">
                    {errorMessage}
                </p>
            )}

            {moveColumnMutation.isPending && (
                <p className="mb-4 border border-blue-900 bg-blue-950/40 p-4 text-sm text-blue-300">
                    Moving column...
                </p>
            )}

            {moveTaskMutation.isPending && (
                <p className="mb-4 border border-blue-900 bg-blue-950/40 p-4 text-sm text-blue-300">
                    Moving task...
                </p>
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={
                    closestCorners
                }
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={columns.map(
                        column => column.id,
                    )}
                    strategy={
                        horizontalListSortingStrategy
                    }
                >
                    <div
                        className={
                            viewMode === 'overview'
                                ? 'kanban-track flex gap-2 overflow-x-auto pb-4'
                                : 'kanban-track flex gap-4 overflow-x-auto pb-6'
                        }
                    >
                        {columns.map((column) => {
                            const isEditing =
                                editingColumnId ===
                                column.id;

                            const isSaving =
                                updateMutation.isPending &&
                                updateMutation.variables
                                    ?.columnId ===
                                    column.id;

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
                                        className={
                                            viewMode ===
                                            'overview'
                                                ? 'w-64 shrink-0 border border-blue-700 bg-slate-900 p-3'
                                                : 'w-96 shrink-0 border border-blue-700 bg-slate-900 p-5'
                                        }
                                    >
                                        <label className="block">
                                            <span className="text-sm font-medium text-slate-300">
                                                Column name
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
                                                    handleSave(
                                                        column,
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
                                <SortableColumnCard
                                    key={column.id}
                                    column={column}
                                    workspaceId={
                                        workspaceId
                                    }
                                    projectId={
                                        projectId
                                    }
                                    boardId={
                                        boardId
                                    }
                                    viewMode={
                                        viewMode
                                    }
                                    disabled={!canManage ||
                                        interactionDisabled
                                    }
                                    isDeleting={
                                        isDeleting
                                    }
                                    isTaskFormVisible={
                                        isTaskFormVisible
                                    }
                                    onToggleTaskForm={
                                        toggleTaskForm
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

export default ColumnList;
