import { apiClient } from '../../api/client';
import type {
    AppNotification,
    NotificationListResponse,
    NotificationUnreadCountResponse,
} from './types';

export interface NotificationFilters {
    limit?: number;
    unread_only?: boolean;
}

interface NotificationResponse {
    message: string;
    data: AppNotification;
}

interface MessageResponse {
    message: string;
}

export async function getNotifications(
    filters: NotificationFilters = {},
): Promise<NotificationListResponse> {
    const response =
        await apiClient.get<NotificationListResponse>(
            '/api/notifications',
            {
                params: filters,
            },
        );

    return response.data;
}

export async function getUnreadNotificationCount(): Promise<number> {
    const response =
        await apiClient.get<NotificationUnreadCountResponse>(
            '/api/notifications/unread-count',
        );

    return response.data.data.unread_count;
}

export async function markNotificationAsRead(
    notificationId: string,
): Promise<AppNotification> {
    const response =
        await apiClient.patch<NotificationResponse>(
            `/api/notifications/${notificationId}/read`,
        );

    return response.data.data;
}

export async function markAllNotificationsAsRead(): Promise<void> {
    await apiClient.patch<MessageResponse>(
        '/api/notifications/read-all',
    );
}

export async function deleteNotification(
    notificationId: string,
): Promise<void> {
    await apiClient.delete<MessageResponse>(
        `/api/notifications/${notificationId}`,
    );
}