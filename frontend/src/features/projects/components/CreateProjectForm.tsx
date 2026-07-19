import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { createProject } from '../api';
import type {
    CreateProjectInput,
    ProjectStatus,
} from '../types';

interface CreateProjectFormProps {
    workspaceId: number;
}

interface FormState {
    name: string;
    description: string;
    status: ProjectStatus;
    start_date: string;
    due_date: string;
}

const initialFormState: FormState = {
    name: '',
    description: '',
    status: 'active',
    start_date: '',
    due_date: '',
};

function CreateProjectForm({
    workspaceId,
}: CreateProjectFormProps) {
    const queryClient = useQueryClient();

    const [form, setForm] =
        useState<FormState>(initialFormState);

    const [errorMessage, setErrorMessage] =
        useState<string | null>(null);

    const createMutation = useMutation({
        mutationFn: (input: CreateProjectInput) =>
            createProject(workspaceId, input),
        onSuccess: async () => {
            setForm(initialFormState);
            setErrorMessage(null);

            await queryClient.invalidateQueries({
                queryKey: ['projects', workspaceId],
            });
        },
        onError: () => {
            setErrorMessage(
                'Unable to create the project. Check the submitted values.',
            );
        },
    });

    function handleSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setErrorMessage(null);

        if (!form.name.trim()) {
            setErrorMessage('Project name is required.');
            return;
        }

        if (
            form.start_date &&
            form.due_date &&
            form.due_date < form.start_date
        ) {
            setErrorMessage(
                'Due date cannot be before the start date.',
            );
            return;
        }

        createMutation.mutate({
            name: form.name.trim(),
            description:
                form.description.trim() || undefined,
            status: form.status,
            start_date: form.start_date || null,
            due_date: form.due_date || null,
        });
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="mt-6 border border-slate-800 bg-slate-900 p-6"
        >
            <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                    <span className="text-sm font-medium text-slate-300">
                        Project name
                    </span>

                    <input
                        type="text"
                        value={form.name}
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                name: event.target.value,
                            }))
                        }
                        className="mt-2 w-full border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
                        placeholder="Website redesign"
                    />
                </label>

                <label className="block">
                    <span className="text-sm font-medium text-slate-300">
                        Status
                    </span>

                    <select
                        value={form.status}
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                status: event.target
                                    .value as ProjectStatus,
                            }))
                        }
                        className="mt-2 w-full border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
                    >
                        <option value="active">
                            Active
                        </option>
                        <option value="completed">
                            Completed
                        </option>
                        <option value="archived">
                            Archived
                        </option>
                    </select>
                </label>

                <label className="block">
                    <span className="text-sm font-medium text-slate-300">
                        Start date
                    </span>

                    <input
                        type="date"
                        value={form.start_date}
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                start_date:
                                    event.target.value,
                            }))
                        }
                        className="mt-2 w-full border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
                    />
                </label>

                <label className="block">
                    <span className="text-sm font-medium text-slate-300">
                        Due date
                    </span>

                    <input
                        type="date"
                        value={form.due_date}
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                due_date:
                                    event.target.value,
                            }))
                        }
                        className="mt-2 w-full border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
                    />
                </label>
            </div>

            <label className="mt-5 block">
                <span className="text-sm font-medium text-slate-300">
                    Description
                </span>

                <textarea
                    value={form.description}
                    onChange={(event) =>
                        setForm((current) => ({
                            ...current,
                            description: event.target.value,
                        }))
                    }
                    rows={4}
                    className="mt-2 w-full border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
                    placeholder="Describe the project goals and scope."
                />
            </label>

            {errorMessage && (
                <p className="mt-4 text-sm text-red-400">
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
                    : 'Create project'}
            </button>
        </form>
    );
}

export default CreateProjectForm;