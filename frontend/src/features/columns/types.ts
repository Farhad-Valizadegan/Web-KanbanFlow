import type { Board } from '../boards/types';

export interface Column {
    id: number;
    board_id: number;
    name: string;
    position: number;
    wip_limit: number | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    board?: Board;
}

export interface CreateColumnInput {
    name: string;
    wip_limit?: number | null;
}

export interface UpdateColumnInput {
    name?: string;
    position?: number;
    wip_limit?: number | null;
}