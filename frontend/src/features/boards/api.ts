import { apiClient } from '../../api/client';
import type {
    Board,
    CreateBoardInput,
    MoveBoardInput,
    UpdateBoardInput,
} from './types';

interface BoardResponse {
    message?: string;
    data: Board;
}

interface BoardListResponse {
    data: Board[];
}

export async function getBoards(
    workspaceId: number,
    projectId: number,
): Promise<Board[]> {
    const response =
        await apiClient.get<BoardListResponse>(
            `/api/workspaces/${workspaceId}/projects/${projectId}/boards`,
        );

    return response.data.data;
}

export async function getBoard(
    workspaceId: number,
    projectId: number,
    boardId: number,
): Promise<Board> {
    const response =
        await apiClient.get<BoardResponse>(
            `/api/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}`,
        );

    return response.data.data;
}

export async function createBoard(
    workspaceId: number,
    projectId: number,
    input: CreateBoardInput,
): Promise<Board> {
    const response =
        await apiClient.post<BoardResponse>(
            `/api/workspaces/${workspaceId}/projects/${projectId}/boards`,
            input,
        );

    return response.data.data;
}

export async function updateBoard(
    workspaceId: number,
    projectId: number,
    boardId: number,
    input: UpdateBoardInput,
): Promise<Board> {
    const response =
        await apiClient.patch<BoardResponse>(
            `/api/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}`,
            input,
        );

    return response.data.data;
}

export async function moveBoard(
    workspaceId: number,
    projectId: number,
    boardId: number,
    input: MoveBoardInput,
): Promise<Board> {
    const response =
        await apiClient.patch<BoardResponse>(
            `/api/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/move`,
            input,
        );

    return response.data.data;
}

export async function deleteBoard(
    workspaceId: number,
    projectId: number,
    boardId: number,
): Promise<void> {
    await apiClient.delete(
        `/api/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}`,
    );
}