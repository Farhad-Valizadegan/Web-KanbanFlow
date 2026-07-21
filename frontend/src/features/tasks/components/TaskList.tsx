import { useDroppable } from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useState } from 'react';
import { getWorkspaceMembers } from '../../workspaces/api';
import {
    deleteTask,
    getTasks,
    updateTask,
} from '../api';
import type {
    Task,
    TaskPriority,
    UpdateTaskInput,
} from '../types';
import DraggableTask from './DraggableTask';
import TaskComments from './TaskComments';

type BoardViewMode =
    | 'detailed'
    | 'overview';

interface TaskListProps {
    workspaceId: number;
    projectId: number;
    boardId: number;
    columnId: number;
    viewMode: BoardViewMode;
}

interface EditTaskFormState {
    title: string;
    description: string;
    priority: TaskPriority;
    assigned_to: string;
    due_date: string;
    completed: boolean;
}

interface ApiErrorResponse {
    message?: string;
    errors?: Record<string, string[]>;
}

function formatDate(
    value: string | null,
): string {
    if (!value) {
        return 'No due date';
    }

    return value.slice(0, 10);
}

function dateInputValue(
    value: string | null,
): string {
    if (!value) {
        return '';
    }

    return value.slice(0, 10);
}

function TaskList({
    workspaceId,
    projectId,
    boardId,
    columnId,
    viewMode,
}: TaskListProps) {
    const queryClient = useQueryClient();

    const isOverview =
        viewMode === 'overview';

    const {
        setNodeRef: setDroppableNodeRef,
        isOver,
    } = useDroppable({
        id: `column-${columnId}`,
        data: {
            type: 'column',
            columnId,
        },
    });

    const [editingTaskId, setEditingTaskId] =
        useState<number | null>(null);

    const [editForm, setEditForm] =
        useState<EditTaskFormState>({
            title: '',
            description: '',
            priority: 'medium',
            assigned_to: '',
            due_date: '',
            completed: false,
        });

    const [errorMessage, setErrorMessage] =
        useState<string | null>(null);

    const queryKey = [
        'tasks',
        workspaceId,
        projectId,
        boardId,
        columnId,
    ];

    const tasksQuery = useQuery({
        queryKey,
        queryFn: () =>
            getTasks(
                workspaceId,
                projectId,
                boardId,
                columnId,
            ),
        retry: false,
    });

    const membersQuery = useQuery({
        queryKey: [
            'workspace-members',
            workspaceId,
        ],
        queryFn: () =>
            getWorkspaceMembers(workspaceId),
        enabled: Number.isInteger(workspaceId),
        retry: false,
    });

    const updateMutation = useMutation({
        mutationFn: ({
            taskId,
            input,
        }: {
            taskId: number;
            input: UpdateTaskInput;
        }) =>
            updateTask(
                workspaceId,
                projectId,
                boardId,
                columnId,
                taskId,
                input,
            ),

        onSuccess: async () => {
            setEditingTaskId(null);
            setErrorMessage(null);

            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey,
                }),
                queryClient.invalidateQueries({
                    queryKey: [
                        'workspace-analytics',
                        workspaceId,
                    ],
                }),
                queryClient.invalidateQueries({
                    queryKey: [
                        'notifications',
                    ],
                }),
                queryClient.invalidateQueries({
                    queryKey: [
                        'notification-unread-count',
                    ],
                }),
            ]);
        },

        onError: (
            error: AxiosError<ApiErrorResponse>,
        ) => {
            if (error.response?.status === 403) {
                setErrorMessage(
                    'You do not have permission to edit this task.',
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
                    'Unable to update the task.',
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (taskId: number) =>
            deleteTask(
                workspaceId,
                projectId,
                boardId,
                columnId,
                taskId,
            ),

        onSuccess: async () => {
            setErrorMessage(null);

            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey,
                }),
                queryClient.invalidateQueries({
                    queryKey: [
                        'workspace-analytics',
                        workspaceId,
                    ],
                }),
            ]);
        },

        onError: (
            error: AxiosError<ApiErrorResponse>,
        ) => {
            if (error.response?.status === 403) {
                setErrorMessage(
                    'You do not have permission to delete this task.',
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
                    'Unable to delete the task.',
            );
        },
    });

    function beginEditing(task: Task) {
        setEditingTaskId(task.id);
        setErrorMessage(null);

        setEditForm({
            title: task.title,
            description:
                task.description ?? '',
            priority: task.priority,
            assigned_to:
                task.assigned_to === null
                    ? ''
                    : String(task.assigned_to),
            due_date: dateInputValue(
                task.due_date,
            ),
            completed:
                task.completed_at !== null,
        });
    }

    function cancelEditing() {
        setEditingTaskId(null);
        setErrorMessage(null);
    }

    function handleSave(task: Task) {
        setErrorMessage(null);

        const title =
            editForm.title.trim();

        if (!title) {
            setErrorMessage(
                'Task title is required.',
            );
            return;
        }

        updateMutation.mutate({
            taskId: task.id,
            input: {
                title,
                description:
                    editForm.description.trim() ||
                    null,
                priority:
                    editForm.priority,
                assigned_to:
                    editForm.assigned_to === ''
                        ? null
                        : Number(
                              editForm.assigned_to,
                          ),
                due_date:
                    editForm.due_date ||
                    null,
                completed_at:
                    editForm.completed
                        ? task.completed_at ??
                          new Date().toISOString()
                        : null,
            },
        });
    }

    function handleToggleCompletion(
        task: Task,
    ) {
        setErrorMessage(null);

        updateMutation.mutate({
            taskId: task.id,
            input: {
                completed_at:
                    task.completed_at === null
                        ? new Date().toISOString()
                        : null,
            },
        });
    }

    function handleDelete(task: Task) {
        const confirmed = window.confirm(
            `Delete task "${task.title}"?`,
        );

        if (!confirmed) {
            return;
        }

        setErrorMessage(null);
        deleteMutation.mutate(task.id);
    }

    if (tasksQuery.isPending) {
        return (
            <div
                ref={setDroppableNodeRef}
                className={
                    isOverview
                        ? 'mt-3 min-h-16'
                        : 'mt-4 min-h-24'
                }
            >
                <p
                    className={
                        isOverview
                            ? 'text-xs text-slate-500'
                            : 'text-sm text-slate-500'
                    }
                >
                    Loading tasks...
                </p>
            </div>
        );
    }

    if (tasksQuery.isError) {
        return (
            <div
                ref={setDroppableNodeRef}
                className={
                    isOverview
                        ? 'mt-3 min-h-16'
                        : 'mt-4 min-h-24'
                }
            >
                <p
                    className={
                        isOverview
                            ? 'border border-red-900 bg-red-950/40 p-2 text-xs text-red-400'
                            : 'border border-red-900 bg-red-950/40 p-3 text-sm text-red-400'
                    }
                >
                    Unable to load tasks.
                </p>
            </div>
        );
    }

    const tasks = tasksQuery.data;

    const sortableTaskIds =
        tasks.map(
            task => `task-${task.id}`,
        );

    const dragDisabled =
        editingTaskId !== null ||
        updateMutation.isPending ||
        deleteMutation.isPending;

    return (
        <div
            ref={setDroppableNodeRef}
            className={
                isOver
                    ? isOverview
                        ? 'mt-3 min-h-16 border border-blue-500 bg-blue-950/20 p-1'
                        : 'mt-4 min-h-24 border border-blue-500 bg-blue-950/20 p-2'
                    : isOverview
                      ? 'mt-3 min-h-16 border border-transparent p-1'
                      : 'mt-4 min-h-24 border border-transparent p-2'
            }
        >
            {errorMessage && (
                <p
                    className={
                        isOverview
                            ? 'mb-2 border border-red-900 bg-red-950/40 p-2 text-xs text-red-400'
                            : 'mb-4 border border-red-900 bg-red-950/40 p-3 text-sm text-red-400'
                    }
                >
                    {errorMessage}
                </p>
            )}

            <SortableContext
                items={sortableTaskIds}
                strategy={
                    verticalListSortingStrategy
                }
            >
                {tasks.length === 0 ? (
                    <p
                        className={
                            isOverview
                                ? 'border border-dashed border-slate-700 bg-slate-950 p-2 text-center text-xs text-slate-500'
                                : 'border border-dashed border-slate-700 bg-slate-950 p-4 text-center text-sm text-slate-500'
                        }
                    >
                        {isOverview
                            ? 'Drop task here'
                            : 'Drop a task here or create a new task.'}
                    </p>
                ) : (
                    <div
                        className={
                            isOverview
                                ? 'space-y-2'
                                : 'space-y-3'
                        }
                    >
                        {tasks.map((task) => {
                            const isEditing =
                                editingTaskId ===
                                task.id;

                            const isSaving =
                                updateMutation.isPending &&
                                updateMutation.variables
                                    ?.taskId ===
                                    task.id;

                            const isDeleting =
                                deleteMutation.isPending &&
                                deleteMutation.variables ===
                                    task.id;

                            if (isEditing) {
                                return (
                                    <DraggableTask
                                        key={task.id}
                                        taskId={
                                            task.id
                                        }
                                        columnId={
                                            columnId
                                        }
                                        disabled
                                    >
                                        <article
                                            className={
                                                isOverview
                                                    ? 'border border-blue-700 bg-slate-950 p-3'
                                                    : 'border border-blue-700 bg-slate-950 p-4'
                                            }
                                        >
                                            <label className="block">
                                                <span
                                                    className={
                                                        isOverview
                                                            ? 'text-xs font-medium text-slate-300'
                                                            : 'text-sm font-medium text-slate-300'
                                                    }
                                                >
                                                    Task title
                                                </span>

                                                <input
                                                    type="text"
                                                    value={
                                                        editForm.title
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
                                                                title: event
                                                                    .target
                                                                    .value,
                                                            }),
                                                        )
                                                    }
                                                    className="mt-2 w-full border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500"
                                                />
                                            </label>

                                            <label className="mt-3 block">
                                                <span
                                                    className={
                                                        isOverview
                                                            ? 'text-xs font-medium text-slate-300'
                                                            : 'text-sm font-medium text-slate-300'
                                                    }
                                                >
                                                    Priority
                                                </span>

                                                <select
                                                    value={
                                                        editForm.priority
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        setEditForm(
                                                            current => ({
                                                                ...current,
                                                                priority:
                                                                    event
                                                                        .target
                                                                        .value as TaskPriority,
                                                            }),
                                                        )
                                                    }
                                                    className="mt-2 w-full border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500"
                                                >
                                                    <option value="low">
                                                        Low
                                                    </option>

                                                    <option value="medium">
                                                        Medium
                                                    </option>

                                                    <option value="high">
                                                        High
                                                    </option>

                                                    <option value="urgent">
                                                        Urgent
                                                    </option>
                                                </select>
                                            </label>

                                            <label className="mt-3 block">
                                                <span
                                                    className={
                                                        isOverview
                                                            ? 'text-xs font-medium text-slate-300'
                                                            : 'text-sm font-medium text-slate-300'
                                                    }
                                                >
                                                    Assignee
                                                </span>

                                                <select
                                                    value={
                                                        editForm.assigned_to
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        setEditForm(
                                                            current => ({
                                                                ...current,
                                                                assigned_to:
                                                                    event
                                                                        .target
                                                                        .value,
                                                            }),
                                                        )
                                                    }
                                                    disabled={
                                                        membersQuery.isPending ||
                                                        membersQuery.isError
                                                    }
                                                    className="mt-2 w-full border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <option value="">
                                                        Unassigned
                                                    </option>

                                                    {membersQuery.data?.map(
                                                        (
                                                            member,
                                                        ) => (
                                                            <option
                                                                key={
                                                                    member.id
                                                                }
                                                                value={
                                                                    member.id
                                                                }
                                                            >
                                                                {
                                                                    member.name
                                                                }{' '}
                                                                —{' '}
                                                                {
                                                                    member.email
                                                                }
                                                            </option>
                                                        ),
                                                    )}
                                                </select>

                                                {membersQuery.isPending && (
                                                    <span className="mt-2 block text-xs text-slate-500">
                                                        Loading workspace members...
                                                    </span>
                                                )}

                                                {membersQuery.isError && (
                                                    <span className="mt-2 block text-xs text-red-400">
                                                        Unable to load workspace members.
                                                    </span>
                                                )}
                                            </label>

                                            <label className="mt-3 block">
                                                <span
                                                    className={
                                                        isOverview
                                                            ? 'text-xs font-medium text-slate-300'
                                                            : 'text-sm font-medium text-slate-300'
                                                    }
                                                >
                                                    Due date
                                                </span>

                                                <input
                                                    type="date"
                                                    value={
                                                        editForm.due_date
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        setEditForm(
                                                            current => ({
                                                                ...current,
                                                                due_date:
                                                                    event
                                                                        .target
                                                                        .value,
                                                            }),
                                                        )
                                                    }
                                                    className="mt-2 w-full border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500"
                                                />
                                            </label>

                                            <label className="mt-3 block">
                                                <span
                                                    className={
                                                        isOverview
                                                            ? 'text-xs font-medium text-slate-300'
                                                            : 'text-sm font-medium text-slate-300'
                                                    }
                                                >
                                                    Description
                                                </span>

                                                <textarea
                                                    rows={
                                                        isOverview
                                                            ? 2
                                                            : 3
                                                    }
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
                                                    className="mt-2 w-full resize-y border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500"
                                                />
                                            </label>

                                            <label className="mt-3 flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        editForm.completed
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        setEditForm(
                                                            current => ({
                                                                ...current,
                                                                completed:
                                                                    event
                                                                        .target
                                                                        .checked,
                                                            }),
                                                        )
                                                    }
                                                    className="h-4 w-4"
                                                />

                                                <span
                                                    className={
                                                        isOverview
                                                            ? 'text-xs text-slate-300'
                                                            : 'text-sm text-slate-300'
                                                    }
                                                >
                                                    Completed
                                                </span>
                                            </label>

                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleSave(
                                                            task,
                                                        )
                                                    }
                                                    disabled={
                                                        updateMutation.isPending ||
                                                        membersQuery.isPending
                                                    }
                                                    className="border border-blue-600 bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
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
                                                    className="border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </article>
                                    </DraggableTask>
                                );
                            }

                            return (
                                <DraggableTask
                                    key={task.id}
                                    taskId={task.id}
                                    columnId={
                                        columnId
                                    }
                                    disabled={
                                        dragDisabled
                                    }
                                >
                                    <article
                                        className={
                                            isOverview
                                                ? 'border border-slate-700 bg-slate-950 p-3 pr-12'
                                                : 'border border-slate-700 bg-slate-950 p-4 pr-16'
                                        }
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <h4
                                                    className={
                                                        task.completed_at
                                                            ? isOverview
                                                                ? 'truncate text-sm font-semibold text-slate-500 line-through'
                                                                : 'font-semibold text-slate-500 line-through'
                                                            : isOverview
                                                              ? 'truncate text-sm font-semibold text-slate-100'
                                                              : 'font-semibold text-slate-100'
                                                    }
                                                    title={
                                                        task.title
                                                    }
                                                >
                                                    {
                                                        task.title
                                                    }
                                                </h4>

                                                <p
                                                    className={
                                                        isOverview
                                                            ? 'mt-1 text-[10px] text-slate-500'
                                                            : 'mt-1 text-xs text-slate-500'
                                                    }
                                                >
                                                    Position{' '}
                                                    {
                                                        task.position
                                                    }
                                                </p>
                                            </div>

                                            <span
                                                className={
                                                    isOverview
                                                        ? 'shrink-0 border border-slate-700 px-1.5 py-1 text-[9px] uppercase tracking-wide text-slate-300'
                                                        : 'shrink-0 border border-slate-700 px-2 py-1 text-xs uppercase tracking-wide text-slate-300'
                                                }
                                            >
                                                {
                                                    task.priority
                                                }
                                            </span>
                                        </div>

                                        {isOverview ? (
                                            <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
                                                <span className="truncate text-slate-500">
                                                    {task
                                                        .assignee
                                                        ?.name ??
                                                        'Unassigned'}
                                                </span>

                                                <span className="shrink-0 text-slate-400">
                                                    {formatDate(
                                                        task.due_date,
                                                    )}
                                                </span>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="mt-3 text-sm leading-6 text-slate-400">
                                                    {task.description ||
                                                        'No description.'}
                                                </p>

                                                <dl className="mt-3 space-y-2 text-xs">
                                                    <div className="flex justify-between gap-3">
                                                        <dt className="text-slate-500">
                                                            Due
                                                        </dt>

                                                        <dd className="text-slate-300">
                                                            {formatDate(
                                                                task.due_date,
                                                            )}
                                                        </dd>
                                                    </div>

                                                    <div className="flex justify-between gap-3">
                                                        <dt className="text-slate-500">
                                                            Assignee
                                                        </dt>

                                                        <dd className="text-slate-300">
                                                            {task
                                                                .assignee
                                                                ?.name ??
                                                                'Unassigned'}
                                                        </dd>
                                                    </div>

                                                    <div className="flex justify-between gap-3">
                                                        <dt className="text-slate-500">
                                                            Status
                                                        </dt>

                                                        <dd className="text-slate-300">
                                                            {task.completed_at
                                                                ? 'Completed'
                                                                : 'Open'}
                                                        </dd>
                                                    </div>
                                                </dl>
                                            </>
                                        )}

                                        <TaskComments
                                            workspaceId={
                                                workspaceId
                                            }
                                            projectId={
                                                projectId
                                            }
                                            boardId={
                                                boardId
                                            }
                                            columnId={
                                                columnId
                                            }
                                            taskId={
                                                task.id
                                            }
                                            viewMode={
                                                viewMode
                                            }
                                        />

                                        <div
                                            className={
                                                isOverview
                                                    ? 'mt-3 flex flex-wrap gap-1.5 border-t border-slate-800 pt-2'
                                                    : 'mt-4 flex flex-wrap gap-2 border-t border-slate-800 pt-3'
                                            }
                                        >
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleToggleCompletion(
                                                        task,
                                                    )
                                                }
                                                disabled={
                                                    updateMutation.isPending ||
                                                    deleteMutation.isPending
                                                }
                                                className={
                                                    isOverview
                                                        ? 'border border-emerald-800 px-2 py-1 text-[10px] font-medium text-emerald-400 hover:bg-emerald-950 disabled:cursor-not-allowed disabled:opacity-50'
                                                        : 'border border-emerald-800 px-3 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-950 disabled:cursor-not-allowed disabled:opacity-50'
                                                }
                                            >
                                                {isSaving
                                                    ? 'Updating...'
                                                    : task.completed_at
                                                      ? 'Reopen'
                                                      : 'Complete'}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    beginEditing(
                                                        task,
                                                    )
                                                }
                                                disabled={
                                                    updateMutation.isPending ||
                                                    deleteMutation.isPending
                                                }
                                                className={
                                                    isOverview
                                                        ? 'border border-blue-700 px-2 py-1 text-[10px] font-medium text-blue-400 hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-50'
                                                        : 'border border-blue-700 px-3 py-2 text-xs font-medium text-blue-400 hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-50'
                                                }
                                            >
                                                Edit
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDelete(
                                                        task,
                                                    )
                                                }
                                                disabled={
                                                    updateMutation.isPending ||
                                                    deleteMutation.isPending
                                                }
                                                className={
                                                    isOverview
                                                        ? 'border border-red-800 px-2 py-1 text-[10px] font-medium text-red-400 hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-50'
                                                        : 'border border-red-800 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-50'
                                                }
                                            >
                                                {isDeleting
                                                    ? 'Deleting...'
                                                    : 'Delete'}
                                            </button>
                                        </div>
                                    </article>
                                </DraggableTask>
                            );
                        })}
                    </div>
                )}
            </SortableContext>
        </div>
    );
}

export default TaskList;