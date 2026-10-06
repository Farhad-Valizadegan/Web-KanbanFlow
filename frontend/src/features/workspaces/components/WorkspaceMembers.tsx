import type { AxiosError } from 'axios';
import { useWorkspacePermissions } from '../useWorkspacePermissions';
import { useState } from 'react';
import {
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import {
    addWorkspaceMember,
    removeWorkspaceMember,
    updateWorkspaceMemberRole,
} from '../api';
import type {
    Workspace,
    WorkspaceMember,
    WorkspaceRole,
} from '../types';

interface WorkspaceMembersProps {
    workspace: Workspace;
}

type EditableRole = Exclude<WorkspaceRole, 'owner'>;

function WorkspaceMembers({
    workspace,
}: WorkspaceMembersProps) {
    const queryClient = useQueryClient();
    const { canManage, isOwner } = useWorkspacePermissions(workspace.id);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    function onError(error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>) {
        setErrorMessage(error.response?.status === 403
            ? 'You do not have permission to perform this action.'
            : error.response?.status === 401
              ? 'Your session has expired. Please sign in again.'
              : Object.values(error.response?.data.errors ?? {})[0]?.[0]
                ?? error.response?.data.message ?? 'Unable to update workspace members. Please try again.');
    }

    const [email, setEmail] = useState('');
    const [role, setRole] =
        useState<EditableRole>('member');

    const refreshWorkspace = async () => {
        setErrorMessage(null);
        await queryClient.invalidateQueries({
            queryKey: ['workspace', workspace.id],
        });

        await queryClient.invalidateQueries({
            queryKey: ['workspaces'],
        });
    };

    const addMemberMutation = useMutation({
        mutationFn: () =>
            addWorkspaceMember(workspace.id, {
                email,
                role,
            }),
        onError,
        onSuccess: async () => {
            setEmail('');
            setRole('member');
            await refreshWorkspace();
        },
    });

    const updateRoleMutation = useMutation({
        mutationFn: ({
            member,
            role: nextRole,
        }: {
            member: WorkspaceMember;
            role: EditableRole;
        }) =>
            updateWorkspaceMemberRole(
                workspace.id,
                member.id,
                {
                    role: nextRole,
                },
            ),
        onError,
        onSuccess: refreshWorkspace,
    });

    const removeMemberMutation = useMutation({
        mutationFn: (member: WorkspaceMember) =>
            removeWorkspaceMember(
                workspace.id,
                member.id,
            ),
        onError,
        onSuccess: refreshWorkspace,
    });

    function handleAddMember(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();
        addMemberMutation.mutate();
    }

    return (
        <section className="mt-8 border border-slate-800 bg-slate-900 p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div>
                    <h2 className="text-xl font-bold">
                        Workspace members
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                        Add members and manage their workspace roles.
                    </p>
                </div>

                <form
                    onSubmit={handleAddMember}
                    className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px_auto]"
                >
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(event) =>
                            setEmail(event.target.value)
                        }
                        placeholder="Member email"
                        className="border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
                    />

                    <select
                        value={role}
                        onChange={(event) =>
                            setRole(
                                event.target.value as EditableRole,
                            )
                        }
                        className="border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
                    >
                        <option value="manager">
                            Manager
                        </option>
                        <option value="member">
                            Member
                        </option>
                        <option value="viewer">
                            Viewer
                        </option>
                    </select>

                    <button
                        type="submit"
                        disabled={!canManage || addMemberMutation.isPending ||
                            email.trim() === ''
                        }
                        className="border border-blue-500 bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {addMemberMutation.isPending
                            ? 'Adding...'
                            : 'Add member'}
                    </button>
                </form>
            </div>

            {errorMessage && (<p role="alert" className="mt-4 text-sm text-red-400">{errorMessage}</p>)}

            <div className="mt-6 space-y-3">
                {workspace.members?.map((member) => {
                    const memberIsOwner =
                        member.pivot.role === 'owner';

                    return (
                        <div
                            key={member.id}
                            className="flex flex-col justify-between gap-4 border border-slate-800 bg-slate-950 p-4 lg:flex-row lg:items-center"
                        >
                            <div>
                                <p className="font-medium text-slate-100">
                                    {member.name}
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                    {member.email}
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                {memberIsOwner ? (
                                    <span className="text-sm uppercase tracking-wide text-slate-400">
                                        Owner
                                    </span>
                                ) : (
                                    <>
                                        <select
                                            value={
                                                member.pivot
                                                    .role
                                            }
                                            disabled={!isOwner || updateRoleMutation.isPending
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                updateRoleMutation.mutate(
                                                    {
                                                        member,
                                                        role: event
                                                            .target
                                                            .value as EditableRole,
                                                    },
                                                )
                                            }
                                            className="border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 disabled:opacity-50"
                                        >
                                            <option value="manager">
                                                Manager
                                            </option>
                                            <option value="member">
                                                Member
                                            </option>
                                            <option value="viewer">
                                                Viewer
                                            </option>
                                        </select>

                                        <button
                                            type="button"
                                            disabled={!canManage || removeMemberMutation.isPending
                                            }
                                            onClick={() =>
                                                removeMemberMutation.mutate(
                                                    member,
                                                )
                                            }
                                            className="border border-red-800 px-3 py-2 text-sm text-red-400 hover:border-red-600 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Remove
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}

                {workspace.members?.length === 0 && (
                    <p className="text-slate-400">
                        No members found.
                    </p>
                )}
            </div>

            {(updateRoleMutation.isError ||
                removeMemberMutation.isError) && (
                <p className="mt-4 text-sm text-red-400">
                    The member update failed. You may not have permission to perform this action.
                </p>
            )}
        </section>
    );
}

export default WorkspaceMembers;
