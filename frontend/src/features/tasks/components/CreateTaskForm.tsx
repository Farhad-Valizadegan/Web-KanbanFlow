import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useState } from 'react';
import { getWorkspaceMembers } from '../../workspaces/api';
import { createTask } from '../api';
import type {
    CreateTaskInput,
    TaskPriority,
} from '../types';

interface CreateTaskFormProps {
    workspaceId: number;
    projectId: number;
    boardId: number;
    columnId: number;
}

interface ApiErrorResponse {
    message?: string;
    errors?: Record<string, string[]>;
}

function CreateTaskForm({
    workspaceId,
    projectId,
    boardId,
    columnId,
}: CreateTaskFormProps) {
    const queryClient = useQueryClient();

    const [title, setTitle] = useState('');
    const [description, setDescription] =
        useState('');
    const [priority, setPriority] =
        useState<TaskPriority>('medium');
    const [assignedTo, setAssignedTo] =
        useState('');
    const [dueDate, setDueDate] = useState('');
    const [isCompleted, setIsCompleted] =
        useState(false);
    const [errorMessage, setErrorMessage] =
        useState<string | null>(null);

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

    const createMutation = useMutation({
        mutationFn: (input: CreateTaskInput) =>
            createTask(
                workspaceId,
                projectId,
                boardId,
                columnId,
                input,
            ),

        onSuccess: async () => {
            setTitle('');
            setDescription('');
            setPriority('medium');
            setAssignedTo('');
            setDueDate('');
            setIsCompleted(false);
            setErrorMessage(null);

            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: [
                        'tasks',
                        workspaceId,
                        projectId,
                        boardId,
                        columnId,
                    ],
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
                    'You do not have permission to create tasks in this column.',
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
                    'Unable to create the task.',
            );
        },
    });

    function handleSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();
        setErrorMessage(null);

        const trimmedTitle = title.trim();

        if (!trimmedTitle) {
            setErrorMessage(
                'Task title is required.',
            );
            return;
        }

        createMutation.mutate({
            title: trimmedTitle,
            description:
                description.trim() || null,
            priority,
            assigned_to:
                assignedTo === ''
                    ? null
                    : Number(assignedTo),
            due_date: dueDate || null,
            completed_at: isCompleted
                ? new Date().toISOString()
                : null,
        });
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="mt-4 border border-slate-700 bg-slate-950 p-4"
        >
            <label className="block">
                <span className="text-sm font-medium text-slate-300">
                    Task title
                </span>

                <input
                    type="text"
                    value={title}
                    maxLength={255}
                    onChange={(event) =>
                        setTitle(event.target.value)
                    }
                    placeholder="Implement login page"
                    className="mt-2 w-full border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
                />
            </label>

            <label className="mt-4 block">
                <span className="text-sm font-medium text-slate-300">
                    Priority
                </span>

                <select
                    value={priority}
                    onChange={(event) =>
                        setPriority(
                            event.target
                                .value as TaskPriority,
                        )
                    }
                    className="mt-2 w-full border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
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

            <label className="mt-4 block">
                <span className="text-sm font-medium text-slate-300">
                    Assignee
                </span>

                <select
                    value={assignedTo}
                    onChange={(event) =>
                        setAssignedTo(
                            event.target.value,
                        )
                    }
                    disabled={
                        membersQuery.isPending ||
                        membersQuery.isError
                    }
                    className="mt-2 w-full border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <option value="">
                        Unassigned
                    </option>

                    {membersQuery.data?.map(
                        (member) => (
                            <option
                                key={member.id}
                                value={member.id}
                            >
                                {member.name} —{' '}
                                {member.email}
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

            <label className="mt-4 block">
                <span className="text-sm font-medium text-slate-300">
                    Due date
                </span>

                <input
                    type="date"
                    value={dueDate}
                    onChange={(event) =>
                        setDueDate(
                            event.target.value,
                        )
                    }
                    className="mt-2 w-full border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
                />
            </label>

            <label className="mt-4 block">
                <span className="text-sm font-medium text-slate-300">
                    Description
                </span>

                <textarea
                    rows={3}
                    value={description}
                    onChange={(event) =>
                        setDescription(
                            event.target.value,
                        )
                    }
                    placeholder="Describe the work required for this task."
                    className="mt-2 w-full resize-y border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
                />
            </label>

            <label className="mt-4 flex items-center gap-3">
                <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={(event) =>
                        setIsCompleted(
                            event.target.checked,
                        )
                    }
                    className="h-4 w-4"
                />

                <span className="text-sm text-slate-300">
                    Mark as completed
                </span>
            </label>

            {errorMessage && (
                <p className="mt-4 border border-red-900 bg-red-950/40 p-3 text-sm text-red-400">
                    {errorMessage}
                </p>
            )}

            <button
                type="submit"
                disabled={
                    createMutation.isPending ||
                    membersQuery.isPending
                }
                className="mt-5 border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {createMutation.isPending
                    ? 'Creating...'
                    : 'Create task'}
            </button>
        </form>
    );
}

export default CreateTaskForm;