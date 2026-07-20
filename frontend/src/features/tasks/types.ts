import type { User } from '../auth/types';
import type { Column } from '../columns/types';

export type TaskPriority =
    | 'low'
    | 'medium'
    | 'high'
    | 'urgent';

export interface Task {
    id: number;
    column_id: number;
    created_by: number;
    assigned_to: number | null;
    title: string;
    description: string | null;
    priority: TaskPriority;
    position: number;
    due_date: string | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    column?: Column;
    creator?: User;
    assignee?: User | null;
}

export interface TaskComment {
    id: number;
    task_id: number;
    user_id: number;
    body: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    user?: User;
}

export interface CreateTaskInput {
    title: string;
    description?: string | null;
    priority: TaskPriority;
    assigned_to?: number | null;
    due_date?: string | null;
    completed_at?: string | null;
}

export interface UpdateTaskInput {
    title?: string;
    description?: string | null;
    priority?: TaskPriority;
    assigned_to?: number | null;
    due_date?: string | null;
    completed_at?: string | null;
}

export interface CreateTaskCommentInput {
    body: string;
}

export interface UpdateTaskCommentInput {
    body: string;
}