import Modal from '../../../components/ui/Modal';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createWorkspace } from '../api';
import type {
    CreateWorkspaceInput,
    WorkspaceVisibility,
} from '../types';

interface CreateWorkspaceFormProps {
    onClose: () => void;
}

function CreateWorkspaceForm({
    onClose,
}: CreateWorkspaceFormProps) {
    const queryClient = useQueryClient();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [visibility, setVisibility] =
        useState<WorkspaceVisibility>('private');

    const createMutation = useMutation({
        mutationFn: (input: CreateWorkspaceInput) =>
            createWorkspace(input),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ['workspaces'],
            });

            onClose();
        },
    });

    function handleSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        createMutation.mutate({
            name: name.trim(),
            description: description || undefined,
            visibility,
        });
    }

    return (
        <Modal title="Create workspace" onClose={onClose} busy={createMutation.isPending}>
            <section className="w-full max-w-lg border border-slate-700 bg-slate-900 p-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-100">
                            Create workspace
                        </h2>

                        <p className="mt-1 text-sm text-slate-400">
                            Create a workspace for your projects and team.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose} disabled={createMutation.isPending}
                        className="border border-slate-700 px-3 py-1 text-slate-300 hover:border-slate-500"
                    >
                        Close
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="mt-6 space-y-5"
                >
                    <div>
                        <label
                            htmlFor="workspace-name"
                            className="block text-sm font-medium text-slate-300"
                        >
                            Name
                        </label>

                        <input
                            id="workspace-name"
                            autoFocus
                            type="text"
                            required
                            maxLength={255}
                            value={name}
                            onChange={(event) =>
                                setName(event.target.value)
                            }
                            className="mt-2 w-full border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="workspace-description"
                            className="block text-sm font-medium text-slate-300"
                        >
                            Description
                        </label>

                        <textarea
                            id="workspace-description"
                            rows={4}
                            value={description}
                            onChange={(event) =>
                                setDescription(event.target.value)
                            }
                            className="mt-2 w-full resize-none border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="workspace-visibility"
                            className="block text-sm font-medium text-slate-300"
                        >
                            Visibility
                        </label>

                        <select
                            id="workspace-visibility"
                            value={visibility}
                            onChange={(event) =>
                                setVisibility(
                                    event.target
                                        .value as WorkspaceVisibility,
                                )
                            }
                            className="mt-2 w-full border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
                        >
                            <option value="private">
                                Private
                            </option>

                            <option value="public">
                                Public
                            </option>
                        </select>
                    </div>

                    {createMutation.isError && (
                        <p className="text-sm text-red-400">
                            Unable to create the workspace.
                        </p>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose} disabled={createMutation.isPending}
                            className="border border-slate-700 px-4 py-2 text-slate-300 hover:border-slate-500"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={
                                createMutation.isPending ||
                                name.trim() === ''
                            }
                            className="border border-blue-500 bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {createMutation.isPending
                                ? 'Creating...'
                                : 'Create workspace'}
                        </button>
                    </div>
                </form>
            </section>
        </Modal>
    );
}

export default CreateWorkspaceForm;
