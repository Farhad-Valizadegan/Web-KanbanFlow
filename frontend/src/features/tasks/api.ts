import { apiClient } from '../../api/client';
import type {
    CreateTaskInput,
    Task,
    UpdateTaskInput,
} from './types';

interface TaskResponse {
    message?: string;
    data: Task;
}

interface TaskListResponse {
    data: Task[];
}

export interface MoveTaskInput {
    column_id: number;
    position: number;
}

export async function getTasks(
    workspaceId: number,
    projectId: number,
    boardId: number,
    columnId: number,
): Promise<Task[]> {
    const response =
        await apiClient.get<TaskListResponse>(
            `/api/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/columns/${columnId}/tasks`,
        );

    return response.data.data;
}

export async function getTask(
    workspaceId: number,
    projectId: number,
    boardId: number,
    columnId: number,
    taskId: number,
): Promise<Task> {
    const response =
        await apiClient.get<TaskResponse>(
            `/api/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}`,
        );

    return response.data.data;
}

export async function createTask(
    workspaceId: number,
    projectId: number,
    boardId: number,
    columnId: number,
    input: CreateTaskInput,
): Promise<Task> {
    const response =
        await apiClient.post<TaskResponse>(
            `/api/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/columns/${columnId}/tasks`,
            input,
        );

    return response.data.data;
}

export async function updateTask(
    workspaceId: number,
    projectId: number,
    boardId: number,
    columnId: number,
    taskId: number,
    input: UpdateTaskInput,
): Promise<Task> {
    const response =
        await apiClient.patch<TaskResponse>(
            `/api/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}`,
            input,
        );

    return response.data.data;
}

export async function moveTask(
    workspaceId: number,
    projectId: number,
    boardId: number,
    sourceColumnId: number,
    taskId: number,
    input: MoveTaskInput,
): Promise<Task> {
    const response =
        await apiClient.patch<TaskResponse>(
            `/api/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/columns/${sourceColumnId}/tasks/${taskId}/move`,
            input,
        );

    return response.data.data;
}

export async function deleteTask(
    workspaceId: number,
    projectId: number,
    boardId: number,
    columnId: number,
    taskId: number,
): Promise<void> {
    await apiClient.delete(
        `/api/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}`,
    );
}