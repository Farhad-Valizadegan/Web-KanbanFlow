import { Link } from 'react-router-dom';
import type { Workspace } from '../types';

interface WorkspaceListProps {
    workspaces: Workspace[];
}

function WorkspaceList({ workspaces }: WorkspaceListProps) {
    if (workspaces.length === 0) {
        return (
            <div className="border border-dashed border-slate-700 bg-slate-950 p-8 text-center">
                <h2 className="text-lg font-semibold text-slate-200">
                    No workspaces yet
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                    Create your first workspace to start organizing projects.
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {workspaces.map((workspace) => (
                <Link
                    key={workspace.id}
                    to={`/workspaces/${workspace.id}`}
                    className="block border border-slate-800 bg-slate-950 p-5 transition hover:border-blue-500 hover:bg-slate-900"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-100">
                                {workspace.name}
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                {workspace.slug}
                            </p>
                        </div>

                        <span className="border border-slate-700 px-2 py-1 text-xs uppercase tracking-wide text-slate-300">
                            {workspace.visibility}
                        </span>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-slate-400">
                        {workspace.description ||
                            'No description has been added.'}
                    </p>

                    <div className="mt-5 border-t border-slate-800 pt-4 text-sm text-slate-500">
                        Owner:{' '}
                        <span className="text-slate-300">
                            {workspace.owner?.name ?? 'Unknown'}
                        </span>
                    </div>
                </Link>
            ))}
        </div>
    );
}

export default WorkspaceList;