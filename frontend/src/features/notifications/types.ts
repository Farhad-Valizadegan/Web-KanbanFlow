export interface NotificationData {
    type: string;
    message: string;
    workspace_id?: number;
    workspace_name?: string;
    task_id?: number;
    task_title?: string;
    column_id?: number;
    assigned_by_id?: number;
    assigned_by_name?: string;
}

export interface AppNotification {
    id: string;
    type: string;
    notifiable_type: string;
    notifiable_id: number;
    data: NotificationData;
    read_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface NotificationListResponse {
    data: AppNotification[];
    meta: {
        unread_count: number;
    };
}

export interface NotificationUnreadCountResponse {
    data: {
        unread_count: number;
    };
}