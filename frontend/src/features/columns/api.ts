import { apiClient } from '../../api/client';
import type {
    Column,
    CreateColumnInput,
    MoveColumnInput,
    UpdateColumnInput,
} from './types';

interface ColumnResponse {
    message?: string;
    data: Column;
}

interface ColumnListResponse {
    data: Column[];
}

export async function getColumns(
    workspaceId: number,
    projectId: number,
    boardId: number,
): Promise<Column[]> {
    const response =
        await apiClient.get<ColumnListResponse>(
            `/api/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/columns`,
        );

    return response.data.data;
}

export async function getColumn(
    workspaceId: number,
    projectId: number,
    boardId: number,
    columnId: number,
): Promise<Column> {
    const response =
        await apiClient.get<ColumnResponse>(
            `/api/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/columns/${columnId}`,
        );

    return response.data.data;
}

export async function createColumn(
    workspaceId: number,
    projectId: number,
    boardId: number,
    input: CreateColumnInput,
): Promise<Column> {
    const response =
        await apiClient.post<ColumnResponse>(
            `/api/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/columns`,
            input,
        );

    return response.data.data;
}

export async function updateColumn(
    workspaceId: number,
    projectId: number,
    boardId: number,
    columnId: number,
    input: UpdateColumnInput,
): Promise<Column> {
    const response =
        await apiClient.patch<ColumnResponse>(
            `/api/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/columns/${columnId}`,
            input,
        );

    return response.data.data;
}

export async function moveColumn(
    workspaceId: number,
    projectId: number,
    boardId: number,
    columnId: number,
    input: MoveColumnInput,
): Promise<Column> {
    const response =
        await apiClient.patch<ColumnResponse>(
            `/api/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/columns/${columnId}/move`,
            input,
        );

    return response.data.data;
}

export async function deleteColumn(
    workspaceId: number,
    projectId: number,
    boardId: number,
    columnId: number,
): Promise<void> {
    await apiClient.delete(
        `/api/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/columns/${columnId}`,
    );
}