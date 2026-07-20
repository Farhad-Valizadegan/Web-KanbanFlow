import { apiClient } from '../../api/client';
import type {
    ActivityLog,
    ActivityLogFilters,
    AddWorkspaceMemberInput,
    CreateWorkspaceInput,
    UpdateWorkspaceInput,
    UpdateWorkspaceMemberRoleInput,
    Workspace,
    WorkspaceMember,
} from './types';

interface WorkspaceResponse {
    message?: string;
    data: Workspace;
}

interface WorkspaceListResponse {
    data: Workspace[];
}

interface WorkspaceMembersResponse {
    data: WorkspaceMember[];
}

interface ActivityLogListResponse {
    data: ActivityLog[];
}

export async function getWorkspaces(): Promise<Workspace[]> {
    const response =
        await apiClient.get<WorkspaceListResponse>(
            '/api/workspaces',
        );

    return response.data.data;
}

export async function getWorkspace(
    workspaceId: number,
): Promise<Workspace> {
    const response =
        await apiClient.get<WorkspaceResponse>(
            `/api/workspaces/${workspaceId}`,
        );

    return response.data.data;
}

export async function createWorkspace(
    input: CreateWorkspaceInput,
): Promise<Workspace> {
    const response =
        await apiClient.post<WorkspaceResponse>(
            '/api/workspaces',
            input,
        );

    return response.data.data;
}

export async function updateWorkspace(
    workspaceId: number,
    input: UpdateWorkspaceInput,
): Promise<Workspace> {
    const response =
        await apiClient.put<WorkspaceResponse>(
            `/api/workspaces/${workspaceId}`,
            input,
        );

    return response.data.data;
}

export async function deleteWorkspace(
    workspaceId: number,
): Promise<void> {
    await apiClient.delete(
        `/api/workspaces/${workspaceId}`,
    );
}

export async function getWorkspaceMembers(
    workspaceId: number,
): Promise<WorkspaceMember[]> {
    const response =
        await apiClient.get<WorkspaceMembersResponse>(
            `/api/workspaces/${workspaceId}/members`,
        );

    return response.data.data;
}

export async function addWorkspaceMember(
    workspaceId: number,
    input: AddWorkspaceMemberInput,
): Promise<void> {
    await apiClient.post(
        `/api/workspaces/${workspaceId}/members`,
        input,
    );
}

export async function updateWorkspaceMemberRole(
    workspaceId: number,
    userId: number,
    input: UpdateWorkspaceMemberRoleInput,
): Promise<void> {
    await apiClient.patch(
        `/api/workspaces/${workspaceId}/members/${userId}`,
        input,
    );
}

export async function removeWorkspaceMember(
    workspaceId: number,
    userId: number,
): Promise<void> {
    await apiClient.delete(
        `/api/workspaces/${workspaceId}/members/${userId}`,
    );
}

export async function getWorkspaceActivities(
    workspaceId: number,
    filters: ActivityLogFilters = {},
): Promise<ActivityLog[]> {
    const response =
        await apiClient.get<ActivityLogListResponse>(
            `/api/workspaces/${workspaceId}/activities`,
            {
                params: filters,
            },
        );

    return response.data.data;
}