import { apiClient } from '../../api/client';
import type {
    CreateProjectInput,
    Project,
    UpdateProjectInput,
} from './types';

interface ProjectResponse {
    message?: string;
    data: Project;
}

interface ProjectListResponse {
    data: Project[];
}

export async function getProjects(
    workspaceId: number,
): Promise<Project[]> {
    const response = await apiClient.get<ProjectListResponse>(
        `/api/workspaces/${workspaceId}/projects`,
    );

    return response.data.data;
}

export async function getProject(
    workspaceId: number,
    projectId: number,
): Promise<Project> {
    const response = await apiClient.get<ProjectResponse>(
        `/api/workspaces/${workspaceId}/projects/${projectId}`,
    );

    return response.data.data;
}

export async function createProject(
    workspaceId: number,
    input: CreateProjectInput,
): Promise<Project> {
    const response = await apiClient.post<ProjectResponse>(
        `/api/workspaces/${workspaceId}/projects`,
        input,
    );

    return response.data.data;
}

export async function updateProject(
    workspaceId: number,
    projectId: number,
    input: UpdateProjectInput,
): Promise<Project> {
    const response = await apiClient.patch<ProjectResponse>(
        `/api/workspaces/${workspaceId}/projects/${projectId}`,
        input,
    );

    return response.data.data;
}

export async function deleteProject(
    workspaceId: number,
    projectId: number,
): Promise<void> {
    await apiClient.delete(
        `/api/workspaces/${workspaceId}/projects/${projectId}`,
    );
}