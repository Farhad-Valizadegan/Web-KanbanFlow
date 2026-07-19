import type { User } from '../auth/types';

export type WorkspaceVisibility = 'private' | 'public';

export type WorkspaceRole =
    | 'owner'
    | 'manager'
    | 'member'
    | 'viewer';

export interface WorkspaceMember extends User {
    pivot: {
        workspace_id: number;
        user_id: number;
        role: WorkspaceRole;
        created_at: string;
        updated_at: string;
    };
}

export interface Workspace {
    id: number;
    owner_id: number;
    name: string;
    slug: string;
    description: string | null;
    logo_path: string | null;
    visibility: WorkspaceVisibility;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    owner?: User;
    members?: WorkspaceMember[];
}

export interface CreateWorkspaceInput {
    name: string;
    description?: string;
    visibility: WorkspaceVisibility;
}

export interface UpdateWorkspaceInput {
    name?: string;
    description?: string | null;
    visibility?: WorkspaceVisibility;
}

export interface AddWorkspaceMemberInput {
    email: string;
    role: Exclude<WorkspaceRole, 'owner'>;
}

export interface UpdateWorkspaceMemberRoleInput {
    role: Exclude<WorkspaceRole, 'owner'>;
}