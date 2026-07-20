import { apiClient } from '../../api/client';
import type {
    CreateTaskCommentInput,
    CreateTaskInput,
    Task,
    TaskComment,
    UpdateTaskCommentInput,
    UpdateTaskInput,
} from './types';

interface TaskResponse {
    message?: string;
    data: Task;
}

interface TaskListResponse {
    data: Task[];
}

interface TaskCommentResponse {
    message?: string;
    data: TaskComment;
}

interface TaskCommentListResponse {
    data: TaskComment[];
}

export interface MoveTaskInput {
    column_id: number;
    position: number;
}

function taskBaseUrl(
    workspaceId: number,
    projectId: number,
    boardId: number,
    columnId: number,
    taskId?: number,
): string {
    const base =
        `/api/workspaces/${workspaceId}` +
        `/projects/${projectId}` +
        `/boards/${boardId}` +
        `/columns/${columnId}` +
        '/tasks';

    if (taskId === undefined) {
        return base;
    }

    return `${base}/${taskId}`;
}

export async function getTasks(
    workspaceId: number,
    projectId: number,
    boardId: number,
    columnId: number,
): Promise<Task[]> {
    const response =
        await apiClient.get<TaskListResponse>(
            taskBaseUrl(
                workspaceId,
                projectId,
                boardId,
                columnId,
            ),
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
            taskBaseUrl(
                workspaceId,
                projectId,
                boardId,
                columnId,
                taskId,
            ),
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
            taskBaseUrl(
                workspaceId,
                projectId,
                boardId,
                columnId,
            ),
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
            taskBaseUrl(
                workspaceId,
                projectId,
                boardId,
                columnId,
                taskId,
            ),
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
            `${taskBaseUrl(
                workspaceId,
                projectId,
                boardId,
                sourceColumnId,
                taskId,
            )}/move`,
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
        taskBaseUrl(
            workspaceId,
            projectId,
            boardId,
            columnId,
            taskId,
        ),
    );
}

export async function getTaskComments(
    workspaceId: number,
    projectId: number,
    boardId: number,
    columnId: number,
    taskId: number,
): Promise<TaskComment[]> {
    const response =
        await apiClient.get<TaskCommentListResponse>(
            `${taskBaseUrl(
                workspaceId,
                projectId,
                boardId,
                columnId,
                taskId,
            )}/comments`,
        );

    return response.data.data;
}

export async function createTaskComment(
    workspaceId: number,
    projectId: number,
    boardId: number,
    columnId: number,
    taskId: number,
    input: CreateTaskCommentInput,
): Promise<TaskComment> {
    const response =
        await apiClient.post<TaskCommentResponse>(
            `${taskBaseUrl(
                workspaceId,
                projectId,
                boardId,
                columnId,
                taskId,
            )}/comments`,
            input,
        );

    return response.data.data;
}

export async function updateTaskComment(
    workspaceId: number,
    projectId: number,
    boardId: number,
    columnId: number,
    taskId: number,
    commentId: number,
    input: UpdateTaskCommentInput,
): Promise<TaskComment> {
    const response =
        await apiClient.patch<TaskCommentResponse>(
            `${taskBaseUrl(
                workspaceId,
                projectId,
                boardId,
                columnId,
                taskId,
            )}/comments/${commentId}`,
            input,
        );

    return response.data.data;
}

export async function deleteTaskComment(
    workspaceId: number,
    projectId: number,
    boardId: number,
    columnId: number,
    taskId: number,
    commentId: number,
): Promise<void> {
    await apiClient.delete(
        `${taskBaseUrl(
            workspaceId,
            projectId,
            boardId,
            columnId,
            taskId,
        )}/comments/${commentId}`,
    );
}