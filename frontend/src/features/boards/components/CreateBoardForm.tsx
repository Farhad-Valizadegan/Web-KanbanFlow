import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useState } from 'react';
import { createBoard } from '../api';
import type {
    BoardVisibility,
    CreateBoardInput,
} from '../types';

interface CreateBoardFormProps {
    workspaceId: number;
    projectId: number;
}

interface ApiErrorResponse {
    message?: string;
    errors?: Record<string, string[]>;
}

function CreateBoardForm({
    workspaceId,
    projectId,
}: CreateBoardFormProps) {
    const queryClient = useQueryClient();

    const [name, setName] = useState('');
    const [description, setDescription] =
        useState('');
    const [visibility, setVisibility] =
        useState<BoardVisibility>('workspace');
    const [errorMessage, setErrorMessage] =
        useState<string | null>(null);

    const createMutation = useMutation({
        mutationFn: (input: CreateBoardInput) =>
            createBoard(
                workspaceId,
                projectId,
                input,
            ),

        onSuccess: async () => {
            setName('');
            setDescription('');
            setVisibility('workspace');
            setErrorMessage(null);

            await queryClient.invalidateQueries({
                queryKey: [
                    'boards',
                    workspaceId,
                    projectId,
                ],
            });
        },

        onError: (
            error: AxiosError<ApiErrorResponse>,
        ) => {
            if (error.response?.status === 403) {
                setErrorMessage(
                    'You do not have permission to create boards in this project.',
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
                    'Unable to create the board.',
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
                'Board name is required.',
            );
            return;
        }

        createMutation.mutate({
            name: trimmedName,
            description:
                description.trim() || null,
            visibility,
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
                        Board name
                    </span>

                    <input
                        type="text"
                        value={name}
                        maxLength={255}
                        onChange={(event) =>
                            setName(event.target.value)
                        }
                        placeholder="Development board"
                        className="mt-2 w-full border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
                    />
                </label>

                <label className="block">
                    <span className="text-sm font-medium text-slate-300">
                        Visibility
                    </span>

                    <select
                        value={visibility}
                        onChange={(event) =>
                            setVisibility(
                                event.target
                                    .value as BoardVisibility,
                            )
                        }
                        className="mt-2 w-full border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
                    >
                        <option value="workspace">
                            Workspace
                        </option>

                        <option value="private">
                            Private
                        </option>
                    </select>
                </label>
            </div>

            <label className="mt-4 block">
                <span className="text-sm font-medium text-slate-300">
                    Description
                </span>

                <textarea
                    rows={4}
                    value={description}
                    onChange={(event) =>
                        setDescription(
                            event.target.value,
                        )
                    }
                    placeholder="Describe the purpose of this board."
                    className="mt-2 w-full resize-y border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
                />
            </label>

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
                    : 'Create board'}
            </button>
        </form>
    );
}

export default CreateBoardForm;