import {
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useState } from 'react';
import { createColumn } from '../api';
import type { CreateColumnInput } from '../types';

interface CreateColumnFormProps {
    workspaceId: number;
    projectId: number;
    boardId: number;
}

interface ApiErrorResponse {
    message?: string;
    errors?: Record<string, string[]>;
}

function CreateColumnForm({
    workspaceId,
    projectId,
    boardId,
}: CreateColumnFormProps) {
    const queryClient = useQueryClient();

    const [name, setName] = useState('');
    const [wipLimit, setWipLimit] = useState('');
    const [errorMessage, setErrorMessage] =
        useState<string | null>(null);

    const createMutation = useMutation({
        mutationFn: (input: CreateColumnInput) =>
            createColumn(
                workspaceId,
                projectId,
                boardId,
                input,
            ),

        onSuccess: async () => {
            setName('');
            setWipLimit('');
            setErrorMessage(null);

            await queryClient.invalidateQueries({
                queryKey: [
                    'columns',
                    workspaceId,
                    projectId,
                    boardId,
                ],
            });
        },

        onError: (
            error: AxiosError<ApiErrorResponse>,
        ) => {
            if (error.response?.status === 403) {
                setErrorMessage(
                    'You do not have permission to create columns on this board.',
                );
                return;
            }

            if (error.response?.status === 401) {
                setErrorMessage(
                    'Your session has expired. Please sign in again.',
                );
                return;
            }

            const validationErrors =
                error.response?.data.errors;

            if (validationErrors) {
                const firstError =
                    Object.values(
                        validationErrors,
                    )[0]?.[0];

                if (firstError) {
                    setErrorMessage(firstError);
                    return;
                }
            }

            setErrorMessage(
                error.response?.data.message ??
                    'Unable to create the column.',
            );
        },
    });

    function handleSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();
        setErrorMessage(null);

        const trimmedName = name.trim();

        if (!trimmedName) {
            setErrorMessage(
                'Column name is required.',
            );
            return;
        }

        let parsedWipLimit: number | null = null;

        if (wipLimit !== '') {
            parsedWipLimit = Number(wipLimit);

            if (
                !Number.isInteger(parsedWipLimit) ||
                parsedWipLimit < 1
            ) {
                setErrorMessage(
                    'WIP limit must be a positive whole number.',
                );
                return;
            }
        }

        createMutation.mutate({
            name: trimmedName,
            wip_limit: parsedWipLimit,
        });
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="mt-6 border border-slate-800 bg-slate-900 p-6"
        >
            <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                    <span className="text-sm font-medium text-slate-300">
                        Column name
                    </span>

                    <input
                        type="text"
                        value={name}
                        maxLength={255}
                        onChange={(event) =>
                            setName(event.target.value)
                        }
                        placeholder="To Do"
                        className="mt-2 w-full border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
                    />
                </label>

                <label className="block">
                    <span className="text-sm font-medium text-slate-300">
                        WIP limit
                    </span>

                    <input
                        type="number"
                        min="1"
                        step="1"
                        value={wipLimit}
                        onChange={(event) =>
                            setWipLimit(
                                event.target.value,
                            )
                        }
                        placeholder="Optional"
                        className="mt-2 w-full border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
                    />

                    <span className="mt-2 block text-xs text-slate-500">
                        Maximum number of active tasks allowed in this column.
                    </span>
                </label>
            </div>

            {errorMessage && (
                <p className="mt-4 border border-red-900 bg-red-950/40 p-3 text-sm text-red-400">
                    {errorMessage}
                </p>
            )}

            <button
                type="submit"
                disabled={createMutation.isPending}
                className="mt-5 border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {createMutation.isPending
                    ? 'Creating...'
                    : 'Create column'}
            </button>
        </form>
    );
}

export default CreateColumnForm;