import type { Task } from '../tasks/types';
import type { User } from '../auth/types';

export type WorkspaceVisibility =
    | 'private'
    | 'public';

export type WorkspaceRole =
    | 'owner'
    | 'manager'
    | 'member'
    | 'viewer';

export type ActivityAction =
    | 'created'
    | 'updated'
    | 'moved'
    | 'deleted'
    | 'commented';

export type ActivitySubjectType =
    | 'workspace'
    | 'project'
    | 'board'
    | 'column'
    | 'task'
    | 'comment';

export interface WorkspaceMember
    extends User {
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

export interface ActivityLog {
    id: number;
    workspace_id: number;
    user_id: number | null;
    action: ActivityAction;
    subject_type: ActivitySubjectType;
    subject_id: number | null;
    subject_name: string;
    properties: Record<
        string,
        unknown
    > | null;
    created_at: string;
    updated_at: string;
    user?: User | null;
}

export interface ActivityLogFilters {
    limit?: number;
    action?: ActivityAction;
    subject_type?: ActivitySubjectType;
}

export interface WorkspaceAnalyticsSummary {
    members: number;
    projects: number;
    boards: number;
    tasks: number;
    open_tasks: number;
    completed_tasks: number;
    overdue_tasks: number;
    due_today_tasks: number;
}

export interface WorkspaceProjectStatusCounts {
    active: number;
    completed: number;
    archived: number;
}

export interface WorkspaceTaskStatusCounts {
    open: number;
    completed: number;
    overdue: number;
    due_today: number;
}

export interface WorkspaceTaskPriorityCounts {
    low: number;
    medium: number;
    high: number;
    urgent: number;
}

export interface WorkspaceAnalytics {
    summary: WorkspaceAnalyticsSummary;
    projects_by_status: WorkspaceProjectStatusCounts;
    tasks_by_status: WorkspaceTaskStatusCounts;
    tasks_by_priority: WorkspaceTaskPriorityCounts;
    upcoming_tasks: Task[];
    assigned_to_me: Task[];
}

export interface WorkspaceAnalyticsFilters {
    upcoming_limit?: number;
    assigned_limit?: number;
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
    role: Exclude<
        WorkspaceRole,
        'owner'
    >;
}

export interface UpdateWorkspaceMemberRoleInput {
    role: Exclude<
        WorkspaceRole,
        'owner'
    >;
}