import type { User } from '../auth/types';
import type { Workspace } from '../workspaces/types';

export type ProjectStatus =
    | 'active'
    | 'completed'
    | 'archived';

export interface Project {
    id: number;
    workspace_id: number;
    created_by: number;
    name: string;
    slug: string;
    description: string | null;
    status: ProjectStatus;
    start_date: string | null;
    due_date: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    workspace?: Workspace;
    creator?: User;
}

export interface CreateProjectInput {
    name: string;
    description?: string;
    status: ProjectStatus;
    start_date?: string | null;
    due_date?: string | null;
}

export interface UpdateProjectInput {
    name?: string;
    description?: string | null;
    status?: ProjectStatus;
    start_date?: string | null;
    due_date?: string | null;
}