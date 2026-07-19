import type { User } from '../auth/types';
import type { Project } from '../projects/types';

export type BoardVisibility =
    | 'workspace'
    | 'private';

export interface Board {
    id: number;
    project_id: number;
    created_by: number;
    name: string;
    slug: string;
    description: string | null;
    visibility: BoardVisibility;
    position: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    project?: Project;
    creator?: User;
}

export interface CreateBoardInput {
    name: string;
    description?: string | null;
    visibility: BoardVisibility;
}

export interface UpdateBoardInput {
    name?: string;
    description?: string | null;
    visibility?: BoardVisibility;
    position?: number;
}