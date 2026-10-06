import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '../auth/api';
import { getWorkspace } from './api';

export function useWorkspacePermissions(workspaceId: number) {
    const user = useQuery({ queryKey: ['current-user'], queryFn: getCurrentUser, retry: false });
    const workspace = useQuery({
        queryKey: ['workspace', workspaceId],
        queryFn: () => getWorkspace(workspaceId),
        enabled: Number.isInteger(workspaceId) && workspaceId > 0,
        retry: false,
    });
    const isOwner = !!user.data && workspace.data?.owner_id === user.data.id;
    const role = workspace.data?.members?.find(member => member.id === user.data?.id)?.pivot.role;
    return { isOwner, canManage: isOwner || role === 'manager' };
}
