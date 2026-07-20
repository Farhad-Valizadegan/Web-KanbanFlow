import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useState } from 'react';
import {
    deleteNotification,
    getNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
} from '../api';
import type { AppNotification } from '../types';

interface ApiErrorResponse {
    message?: string;
}

function formatNotificationDate(
    value: string,
): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString();
}

function getErrorMessage(
    error: AxiosError<ApiErrorResponse>,
    fallback: string,
): string {
    if (error.response?.status === 401) {
        return 'Your session has expired. Please sign in again.';
    }

    return (
        error.response?.data.message ??
        fallback
    );
}

function NotificationPanel() {
    const queryClient = useQueryClient();

    const [isOpen, setIsOpen] =
        useState(false);

    const [showUnreadOnly, setShowUnreadOnly] =
        useState(false);

    const [errorMessage, setErrorMessage] =
        useState<string | null>(null);

    const notificationsQueryKey = [
        'notifications',
        showUnreadOnly,
    ];

    const notificationsQuery = useQuery({
        queryKey: notificationsQueryKey,
        queryFn: () =>
            getNotifications({
                limit: 50,
                unread_only:
                    showUnreadOnly ||
                    undefined,
            }),
        retry: false,
        refetchInterval: 30000,
    });

    const markReadMutation = useMutation({
        mutationFn: (
            notificationId: string,
        ) =>
            markNotificationAsRead(
                notificationId,
            ),

        onSuccess: async () => {
            setErrorMessage(null);

            await Promise.all([
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
            setErrorMessage(
                getErrorMessage(
                    error,
                    'Unable to mark the notification as read.',
                ),
            );
        },
    });

    const markAllReadMutation =
        useMutation({
            mutationFn:
                markAllNotificationsAsRead,

            onSuccess: async () => {
                setErrorMessage(null);

                await Promise.all([
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
                setErrorMessage(
                    getErrorMessage(
                        error,
                        'Unable to mark all notifications as read.',
                    ),
                );
            },
        });

    const deleteMutation = useMutation({
        mutationFn: (
            notificationId: string,
        ) =>
            deleteNotification(
                notificationId,
            ),

        onSuccess: async () => {
            setErrorMessage(null);

            await Promise.all([
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
            setErrorMessage(
                getErrorMessage(
                    error,
                    'Unable to delete the notification.',
                ),
            );
        },
    });

    function handleMarkAsRead(
        notification: AppNotification,
    ) {
        if (notification.read_at !== null) {
            return;
        }

        markReadMutation.mutate(
            notification.id,
        );
    }

    function handleDelete(
        notification: AppNotification,
    ) {
        const confirmed =
            window.confirm(
                'Delete this notification?',
            );

        if (!confirmed) {
            return;
        }

        deleteMutation.mutate(
            notification.id,
        );
    }

    const response =
        notificationsQuery.data;

    const notifications =
        response?.data ?? [];

    const unreadCount =
        response?.meta.unread_count ?? 0;

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() =>
                    setIsOpen(current => !current)
                }
                className="relative border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500"
            >
                Notifications

                {unreadCount > 0 && (
                    <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white">
                        {unreadCount > 99
                            ? '99+'
                            : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <section className="absolute right-0 z-50 mt-2 w-[min(92vw,28rem)] border border-slate-700 bg-slate-900 shadow-2xl">
                    <header className="border-b border-slate-800 p-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="font-bold text-slate-100">
                                    Notifications
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    {unreadCount}{' '}
                                    unread
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setIsOpen(false)
                                }
                                className="text-sm text-slate-500 hover:text-slate-300"
                            >
                                Close
                            </button>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <label className="flex items-center gap-2 text-xs text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={
                                        showUnreadOnly
                                    }
                                    onChange={event =>
                                        setShowUnreadOnly(
                                            event
                                                .target
                                                .checked,
                                        )
                                    }
                                    className="h-4 w-4"
                                />

                                Unread only
                            </label>

                            <button
                                type="button"
                                onClick={() =>
                                    markAllReadMutation.mutate()
                                }
                                disabled={
                                    unreadCount === 0 ||
                                    markAllReadMutation.isPending
                                }
                                className="text-xs font-medium text-blue-400 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {markAllReadMutation.isPending
                                    ? 'Updating...'
                                    : 'Mark all as read'}
                            </button>
                        </div>
                    </header>

                    {errorMessage && (
                        <p className="m-4 border border-red-900 bg-red-950/40 p-3 text-xs text-red-400">
                            {errorMessage}
                        </p>
                    )}

                    <div className="max-h-[32rem] overflow-y-auto">
                        {notificationsQuery.isPending && (
                            <p className="p-4 text-sm text-slate-500">
                                Loading notifications...
                            </p>
                        )}

                        {notificationsQuery.isError && (
                            <p className="p-4 text-sm text-red-400">
                                Unable to load notifications.
                            </p>
                        )}

                        {!notificationsQuery.isPending &&
                            !notificationsQuery.isError &&
                            notifications.length ===
                                0 && (
                                <p className="p-4 text-sm text-slate-500">
                                    No notifications found.
                                </p>
                            )}

                        {notifications.map(
                            notification => {
                                const isUnread =
                                    notification.read_at ===
                                    null;

                                const isMarking =
                                    markReadMutation.isPending &&
                                    markReadMutation.variables ===
                                        notification.id;

                                const isDeleting =
                                    deleteMutation.isPending &&
                                    deleteMutation.variables ===
                                        notification.id;

                                return (
                                    <article
                                        key={
                                            notification.id
                                        }
                                        className={
                                            isUnread
                                                ? 'border-b border-slate-800 bg-blue-950/20 p-4'
                                                : 'border-b border-slate-800 bg-slate-900 p-4'
                                        }
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p
                                                    className={
                                                        isUnread
                                                            ? 'text-sm font-semibold text-slate-100'
                                                            : 'text-sm text-slate-300'
                                                    }
                                                >
                                                    {
                                                        notification
                                                            .data
                                                            .message
                                                    }
                                                </p>

                                                <p className="mt-2 text-xs text-slate-500">
                                                    {formatNotificationDate(
                                                        notification.created_at,
                                                    )}
                                                </p>

                                                {notification
                                                    .data
                                                    .workspace_name && (
                                                    <p className="mt-1 text-xs text-slate-600">
                                                        Workspace:{' '}
                                                        {
                                                            notification
                                                                .data
                                                                .workspace_name
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            {isUnread && (
                                                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                                            )}
                                        </div>

                                        <div className="mt-3 flex flex-wrap gap-3">
                                            {isUnread && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleMarkAsRead(
                                                            notification,
                                                        )
                                                    }
                                                    disabled={
                                                        markReadMutation.isPending ||
                                                        deleteMutation.isPending
                                                    }
                                                    className="text-xs font-medium text-blue-400 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {isMarking
                                                        ? 'Updating...'
                                                        : 'Mark as read'}
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDelete(
                                                        notification,
                                                    )
                                                }
                                                disabled={
                                                    markReadMutation.isPending ||
                                                    deleteMutation.isPending
                                                }
                                                className="text-xs font-medium text-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {isDeleting
                                                    ? 'Deleting...'
                                                    : 'Delete'}
                                            </button>
                                        </div>
                                    </article>
                                );
                            },
                        )}
                    </div>
                </section>
            )}
        </div>
    );
}

export default NotificationPanel;