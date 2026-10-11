import { useWorkspacePermissions } from '../features/workspaces/useWorkspacePermissions';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getBoard } from '../features/boards/api';
import ColumnList from '../features/columns/components/ColumnList';
import Icon from '../components/ui/Icon';
import CreateColumnForm from '../features/columns/components/CreateColumnForm';

export type BoardViewMode =
    | 'detailed'
    | 'overview';

function BoardPage() {
    const {
        workspaceId,
        projectId,
        boardId,
    } = useParams();

    const numericWorkspaceId =
        Number(workspaceId);
    const { canManage } = useWorkspacePermissions(numericWorkspaceId);

    const numericProjectId =
        Number(projectId);

    const numericBoardId =
        Number(boardId);

    const hasValidIdentifiers =
        Number.isInteger(numericWorkspaceId) &&
        numericWorkspaceId > 0 &&
        Number.isInteger(numericProjectId) &&
        numericProjectId > 0 &&
        Number.isInteger(numericBoardId) &&
        numericBoardId > 0;

    const [isColumnFormOpen, setIsColumnFormOpen] = useState(false);

    const storageKey = `board-view-mode-${numericBoardId}`;

    const [viewMode, setViewMode] =
        useState<BoardViewMode>(() => {
            const storedValue =
                window.localStorage.getItem(
                    storageKey,
                );

            if (
                storedValue === 'overview' ||
                storedValue === 'detailed'
            ) {
                return storedValue;
            }

            return 'detailed';
        });

    useEffect(() => {
        window.localStorage.setItem(
            storageKey,
            viewMode,
        );
    }, [storageKey, viewMode]);

    const boardQuery = useQuery({
        queryKey: [
            'board',
            numericWorkspaceId,
            numericProjectId,
            numericBoardId,
        ],
        queryFn: () =>
            getBoard(
                numericWorkspaceId,
                numericProjectId,
                numericBoardId,
            ),
        enabled: hasValidIdentifiers,
        retry: false,
    });

    if (!hasValidIdentifiers) {
        return (
            <main className="min-h-screen bg-slate-950 p-8 text-red-400">
                Invalid board identifier.
            </main>
        );
    }

    if (boardQuery.isPending) {
        return (
            <main role="status" className="min-h-screen bg-slate-950 p-8 text-slate-300">
                Loading board...
            </main>
        );
    }

    if (boardQuery.isError) {
        return (
            <main className="min-h-screen bg-slate-950 p-8 text-red-400">
                Unable to load the board.
            </main>
        );
    }

    const board = boardQuery.data;

    return (
        <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
            <section
                className={
                    viewMode === 'overview'
                        ? 'mx-auto max-w-[1800px]'
                        : 'mx-auto max-w-7xl'
                }
            >
                <Link
                    to={`/workspaces/${numericWorkspaceId}/projects/${numericProjectId}`}
                    className="text-sm font-medium text-blue-400 hover:text-blue-300"
                >
                    &larr; Back to project
                </Link>

                <header className="page-heading board-heading mt-6 border border-slate-800 bg-slate-900 p-8">
                    <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
                        <div>
                            <h1 className="mt-3 text-3xl font-bold">
                                {board.name}
                            </h1>

                            <p className="mt-2 text-slate-500">
                                {board.slug}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <span className="border border-slate-700 px-3 py-2 text-xs uppercase tracking-wide text-slate-300">
                                {board.visibility}
                            </span>


                        </div>
                    </div>

                    <p className="mt-6 max-w-3xl leading-7 text-slate-400">
                        {board.description ||
                            'No description has been added.'}
                    </p>

                    <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4 text-sm">
                        <div>
                            <dt className="text-slate-500">
                                Created by
                            </dt>

                            <dd className="mt-1 text-slate-300">
                                {board.creator?.name ??
                                    'Unknown user'}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-slate-500">
                                Created
                            </dt>

                            <dd className="mt-1 text-slate-300">
                                {board.created_at
                                    ? new Date(
                                          board.created_at,
                                      ).toLocaleDateString()
                                    : 'Unknown'}
                            </dd>
                        </div>
                    </dl>
                </header>

                <section className="mt-10">
                    <div className="floating-toolbar flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                        <div>
                            <h2 className="mt-2 text-2xl font-bold">
                                Board workflow
                            </h2>

                            <p className="mt-2 max-w-3xl text-slate-400">
                                Drag tasks to move work forward. Switch to overview for a wider view.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                        <div className="segmented-control" role="group" aria-label="Board view">
                            <button
                                type="button"
                                onClick={() =>
                                    setViewMode(
                                        'detailed',
                                    )
                                }
                                aria-pressed={
                                    viewMode ===
                                    'detailed'
                                }
                                className={
                                    viewMode ===
                                    'detailed'
                                        ? 'bg-blue-600 px-4 py-2 text-sm font-semibold text-white'
                                        : 'px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-100'
                                }
                            >
                                Detailed
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setViewMode(
                                        'overview',
                                    )
                                }
                                aria-pressed={
                                    viewMode ===
                                    'overview'
                                }
                                className={
                                    viewMode ===
                                    'overview'
                                        ? 'bg-blue-600 px-4 py-2 text-sm font-semibold text-white'
                                        : 'px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-100'
                                }
                            >
                                Overview
                            </button>
                        </div>
                        {canManage && <button type="button" className="primary-button" aria-expanded={isColumnFormOpen} aria-controls="column-create" onClick={() => setIsColumnFormOpen(open => !open)}><Icon name="plus" size={16} />{isColumnFormOpen ? "Close form" : "Add column"}</button>}
                        </div>
                    </div>

                    {canManage && isColumnFormOpen && (<div id="column-create"><CreateColumnForm
                        workspaceId={
                            numericWorkspaceId
                        }
                        projectId={
                            numericProjectId
                        }
                        boardId={numericBoardId}
                    /></div>)}

                    <ColumnList
                        workspaceId={
                            numericWorkspaceId
                        }
                        projectId={
                            numericProjectId
                        }
                        boardId={numericBoardId}
                        viewMode={viewMode}
                    />
                </section>
            </section>
        </main>
    );
}

export default BoardPage;
