import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useState } from 'react';
import {
    createTaskComment,
    deleteTaskComment,
    getTaskComments,
    updateTaskComment,
} from '../api';
import type { TaskComment } from '../types';

type BoardViewMode =
    | 'detailed'
    | 'overview';

interface TaskCommentsProps {
    workspaceId: number;
    projectId: number;
    boardId: number;
    columnId: number;
    taskId: number;
    viewMode: BoardViewMode;
}

interface UpdateCommentVariables {
    commentId: number;
    body: string;
}

interface ApiErrorResponse {
    message?: string;
    errors?: Record<string, string[]>;
}

function formatCommentDate(
    value: string,
): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString();
}

function getApiErrorMessage(
    error: AxiosError<ApiErrorResponse>,
    fallbackMessage: string,
): string {
    if (error.response?.status === 401) {
        return 'Your session has expired. Please sign in again.';
    }

    if (error.response?.status === 403) {
        return 'You do not have permission to perform this action.';
    }

    const validationErrors =
        error.response?.data.errors;

    if (validationErrors) {
        const firstError =
            Object.values(
                validationErrors,
            )[0]?.[0];

        if (firstError) {
            return firstError;
        }
    }

    return (
        error.response?.data.message ??
        fallbackMessage
    );
}

function TaskComments({
    workspaceId,
    projectId,
    boardId,
    columnId,
    taskId,
    viewMode,
}: TaskCommentsProps) {
    const queryClient = useQueryClient();

    const isOverview =
        viewMode === 'overview';

    const [isOpen, setIsOpen] =
        useState(false);

    const [newCommentBody, setNewCommentBody] =
        useState('');

    const [
        editingCommentId,
        setEditingCommentId,
    ] = useState<number | null>(null);

    const [editBody, setEditBody] =
        useState('');

    const [errorMessage, setErrorMessage] =
        useState<string | null>(null);

    const commentsQueryKey = [
        'task-comments',
        workspaceId,
        projectId,
        boardId,
        columnId,
        taskId,
    ];

    const commentsQuery = useQuery({
        queryKey: commentsQueryKey,
        queryFn: () =>
            getTaskComments(
                workspaceId,
                projectId,
                boardId,
                columnId,
                taskId,
            ),
        enabled: isOpen,
        retry: false,
    });

    const createMutation = useMutation({
        mutationFn: (body: string) =>
            createTaskComment(
                workspaceId,
                projectId,
                boardId,
                columnId,
                taskId,
                {
                    body,
                },
            ),

        onSuccess: async () => {
            setNewCommentBody('');
            setErrorMessage(null);

            await queryClient.invalidateQueries({
                queryKey: commentsQueryKey,
            });
        },

        onError: (
            error: AxiosError<ApiErrorResponse>,
        ) => {
            setErrorMessage(
                getApiErrorMessage(
                    error,
                    'Unable to create the comment.',
                ),
            );
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({
            commentId,
            body,
        }: UpdateCommentVariables) =>
            updateTaskComment(
                workspaceId,
                projectId,
                boardId,
                columnId,
                taskId,
                commentId,
                {
                    body,
                },
            ),

        onSuccess: async () => {
            setEditingCommentId(null);
            setEditBody('');
            setErrorMessage(null);

            await queryClient.invalidateQueries({
                queryKey: commentsQueryKey,
            });
        },

        onError: (
            error: AxiosError<ApiErrorResponse>,
        ) => {
            setErrorMessage(
                getApiErrorMessage(
                    error,
                    'Unable to update the comment.',
                ),
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (commentId: number) =>
            deleteTaskComment(
                workspaceId,
                projectId,
                boardId,
                columnId,
                taskId,
                commentId,
            ),

        onSuccess: async () => {
            setErrorMessage(null);

            await queryClient.invalidateQueries({
                queryKey: commentsQueryKey,
            });
        },

        onError: (
            error: AxiosError<ApiErrorResponse>,
        ) => {
            setErrorMessage(
                getApiErrorMessage(
                    error,
                    'Unable to delete the comment.',
                ),
            );
        },
    });

    function toggleComments() {
        setIsOpen(current => !current);
        setErrorMessage(null);
    }

    function handleCreateComment() {
        const body =
            newCommentBody.trim();

        if (!body) {
            setErrorMessage(
                'Comment body is required.',
            );
            return;
        }

        if (body.length > 5000) {
            setErrorMessage(
                'Comment body cannot exceed 5000 characters.',
            );
            return;
        }

        setErrorMessage(null);
        createMutation.mutate(body);
    }

    function beginEditing(
        comment: TaskComment,
    ) {
        setEditingCommentId(comment.id);
        setEditBody(comment.body);
        setErrorMessage(null);
    }

    function cancelEditing() {
        setEditingCommentId(null);
        setEditBody('');
        setErrorMessage(null);
    }

    function handleUpdateComment(
        commentId: number,
    ) {
        const body =
            editBody.trim();

        if (!body) {
            setErrorMessage(
                'Comment body is required.',
            );
            return;
        }

        if (body.length > 5000) {
            setErrorMessage(
                'Comment body cannot exceed 5000 characters.',
            );
            return;
        }

        setErrorMessage(null);

        updateMutation.mutate({
            commentId,
            body,
        });
    }

    function handleDeleteComment(
        comment: TaskComment,
    ) {
        const confirmed =
            window.confirm(
                'Delete this comment?',
            );

        if (!confirmed) {
            return;
        }

        setErrorMessage(null);
        deleteMutation.mutate(comment.id);
    }

    const comments =
        commentsQuery.data ?? [];

    return (
        <section
            className={
                isOverview
                    ? 'mt-2 border-t border-slate-800 pt-2'
                    : 'mt-4 border-t border-slate-800 pt-3'
            }
        >
            <button
                type="button"
                onClick={toggleComments}
                className={
                    isOverview
                        ? 'text-[10px] font-medium text-blue-400 hover:text-blue-300'
                        : 'text-xs font-medium text-blue-400 hover:text-blue-300'
                }
            >
                {isOpen
                    ? 'Hide comments'
                    : 'Comments'}
            </button>

            {isOpen && (
                <div
                    className={
                        isOverview
                            ? 'mt-2 space-y-2'
                            : 'mt-3 space-y-3'
                    }
                >
                    {errorMessage && (
                        <p
                            className={
                                isOverview
                                    ? 'border border-red-900 bg-red-950/40 p-2 text-[10px] text-red-400'
                                    : 'border border-red-900 bg-red-950/40 p-3 text-xs text-red-400'
                            }
                        >
                            {errorMessage}
                        </p>
                    )}

                    <div>
                        <textarea
                            rows={
                                isOverview ? 2 : 3
                            }
                            maxLength={5000}
                            value={newCommentBody}
                            onChange={event =>
                                setNewCommentBody(
                                    event.target
                                        .value,
                                )
                            }
                            placeholder="Write a comment..."
                            className={
                                isOverview
                                    ? 'w-full resize-y border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-blue-500'
                                    : 'w-full resize-y border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500'
                            }
                        />

                        <button
                            type="button"
                            onClick={
                                handleCreateComment
                            }
                            disabled={
                                createMutation.isPending
                            }
                            className={
                                isOverview
                                    ? 'mt-1.5 border border-blue-600 bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50'
                                    : 'mt-2 border border-blue-600 bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50'
                            }
                        >
                            {createMutation.isPending
                                ? 'Posting...'
                                : 'Post comment'}
                        </button>
                    </div>

                    {commentsQuery.isPending && (
                        <p className="text-xs text-slate-500">
                            Loading comments...
                        </p>
                    )}

                    {commentsQuery.isError && (
                        <p className="text-xs text-red-400">
                            Unable to load comments.
                        </p>
                    )}

                    {!commentsQuery.isPending &&
                        !commentsQuery.isError &&
                        comments.length === 0 && (
                            <p className="text-xs text-slate-500">
                                No comments yet.
                            </p>
                        )}

                    {comments.map(comment => {
                        const isEditing =
                            editingCommentId ===
                            comment.id;

                        const isUpdating =
                            updateMutation.isPending &&
                            updateMutation.variables
                                ?.commentId ===
                                comment.id;

                        const isDeleting =
                            deleteMutation.isPending &&
                            deleteMutation.variables ===
                                comment.id;

                        return (
                            <article
                                key={comment.id}
                                className={
                                    isOverview
                                        ? 'border border-slate-800 bg-slate-900 p-2'
                                        : 'border border-slate-800 bg-slate-900 p-3'
                                }
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p
                                            className={
                                                isOverview
                                                    ? 'truncate text-[10px] font-semibold text-slate-300'
                                                    : 'text-xs font-semibold text-slate-300'
                                            }
                                        >
                                            {comment.user
                                                ?.name ??
                                                'Unknown user'}
                                        </p>

                                        <p
                                            className={
                                                isOverview
                                                    ? 'mt-0.5 text-[9px] text-slate-600'
                                                    : 'mt-1 text-[10px] text-slate-600'
                                            }
                                        >
                                            {formatCommentDate(
                                                comment.created_at,
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {isEditing ? (
                                    <div className="mt-2">
                                        <textarea
                                            rows={
                                                isOverview
                                                    ? 2
                                                    : 3
                                            }
                                            maxLength={
                                                5000
                                            }
                                            value={
                                                editBody
                                            }
                                            onChange={event =>
                                                setEditBody(
                                                    event
                                                        .target
                                                        .value,
                                                )
                                            }
                                            className="w-full resize-y border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-blue-500"
                                        />

                                        <div className="mt-2 flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleUpdateComment(
                                                        comment.id,
                                                    )
                                                }
                                                disabled={
                                                    updateMutation.isPending
                                                }
                                                className="border border-blue-600 bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {isUpdating
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
                                                className="border border-slate-700 px-2 py-1 text-[10px] text-slate-300 hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <p
                                            className={
                                                isOverview
                                                    ? 'mt-2 whitespace-pre-wrap text-[10px] leading-4 text-slate-400'
                                                    : 'mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-400'
                                            }
                                        >
                                            {
                                                comment.body
                                            }
                                        </p>

                                        <div className="mt-2 flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    beginEditing(
                                                        comment,
                                                    )
                                                }
                                                disabled={
                                                    updateMutation.isPending ||
                                                    deleteMutation.isPending
                                                }
                                                className="text-[10px] font-medium text-blue-400 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Edit
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDeleteComment(
                                                        comment,
                                                    )
                                                }
                                                disabled={
                                                    updateMutation.isPending ||
                                                    deleteMutation.isPending
                                                }
                                                className="text-[10px] font-medium text-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {isDeleting
                                                    ? 'Deleting...'
                                                    : 'Delete'}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

export default TaskComments;