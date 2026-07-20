import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getWorkspaceActivities } from '../api';
import type {
    ActivityAction,
    ActivityLog,
    ActivitySubjectType,
} from '../types';

interface WorkspaceActivityFeedProps {
    workspaceId: number;
}

function formatActivityDate(
    value: string,
): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString();
}

function activitySentence(
    activity: ActivityLog,
): string {
    const actor =
        activity.user?.name ??
        'Unknown user';

    const subject =
        activity.subject_name;

    switch (activity.action) {
        case 'created':
            return `${actor} created ${activity.subject_type} "${subject}".`;

        case 'updated':
            return `${actor} updated ${activity.subject_type} "${subject}".`;

        case 'moved':
            return `${actor} moved ${activity.subject_type} "${subject}".`;

        case 'deleted':
            return `${actor} deleted ${activity.subject_type} "${subject}".`;

        case 'commented':
            return `${actor} commented on "${subject}".`;

        default:
            return `${actor} performed an action on "${subject}".`;
    }
}

function WorkspaceActivityFeed({
    workspaceId,
}: WorkspaceActivityFeedProps) {
    const [action, setAction] =
        useState<ActivityAction | ''>('');

    const [
        subjectType,
        setSubjectType,
    ] = useState<
        ActivitySubjectType | ''
    >('');

    const activitiesQuery = useQuery({
        queryKey: [
            'workspace-activities',
            workspaceId,
            action,
            subjectType,
        ],
        queryFn: () =>
            getWorkspaceActivities(
                workspaceId,
                {
                    limit: 50,
                    action:
                        action || undefined,
                    subject_type:
                        subjectType ||
                        undefined,
                },
            ),
        retry: false,
    });

    const activities =
        activitiesQuery.data ?? [];

    return (
        <section className="mt-10 border border-slate-800 bg-slate-900 p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
                        Activity
                    </p>

                    <h2 className="mt-2 text-2xl font-bold">
                        Workspace activity
                    </h2>

                    <p className="mt-2 text-slate-400">
                        Review recent task actions in this workspace.
                    </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <label>
                        <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                            Action
                        </span>

                        <select
                            value={action}
                            onChange={event =>
                                setAction(
                                    event.target
                                        .value as
                                        | ActivityAction
                                        | '',
                                )
                            }
                            className="mt-1 border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500"
                        >
                            <option value="">
                                All actions
                            </option>

                            <option value="created">
                                Created
                            </option>

                            <option value="updated">
                                Updated
                            </option>

                            <option value="moved">
                                Moved
                            </option>

                            <option value="deleted">
                                Deleted
                            </option>

                            <option value="commented">
                                Commented
                            </option>
                        </select>
                    </label>

                    <label>
                        <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                            Type
                        </span>

                        <select
                            value={
                                subjectType
                            }
                            onChange={event =>
                                setSubjectType(
                                    event.target
                                        .value as
                                        | ActivitySubjectType
                                        | '',
                                )
                            }
                            className="mt-1 border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500"
                        >
                            <option value="">
                                All types
                            </option>

                            <option value="workspace">
                                Workspace
                            </option>

                            <option value="project">
                                Project
                            </option>

                            <option value="board">
                                Board
                            </option>

                            <option value="column">
                                Column
                            </option>

                            <option value="task">
                                Task
                            </option>

                            <option value="comment">
                                Comment
                            </option>
                        </select>
                    </label>
                </div>
            </div>

            {activitiesQuery.isPending && (
                <p className="mt-6 text-sm text-slate-500">
                    Loading activity...
                </p>
            )}

            {activitiesQuery.isError && (
                <p className="mt-6 border border-red-900 bg-red-950/40 p-3 text-sm text-red-400">
                    Unable to load workspace activity.
                </p>
            )}

            {!activitiesQuery.isPending &&
                !activitiesQuery.isError &&
                activities.length === 0 && (
                    <p className="mt-6 border border-dashed border-slate-700 bg-slate-950 p-4 text-sm text-slate-500">
                        No activity found.
                    </p>
                )}

            {!activitiesQuery.isPending &&
                !activitiesQuery.isError &&
                activities.length > 0 && (
                    <div className="mt-6 space-y-3">
                        {activities.map(
                            activity => (
                                <article
                                    key={
                                        activity.id
                                    }
                                    className="border border-slate-800 bg-slate-950 p-4"
                                >
                                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                                        <div>
                                            <p className="text-sm font-medium text-slate-200">
                                                {activitySentence(
                                                    activity,
                                                )}
                                            </p>

                                            <p className="mt-2 text-xs text-slate-500">
                                                {activity.subject_type}
                                                {' · '}
                                                {activity.action}
                                            </p>
                                        </div>

                                        <time className="shrink-0 text-xs text-slate-500">
                                            {formatActivityDate(
                                                activity.created_at,
                                            )}
                                        </time>
                                    </div>
                                </article>
                            ),
                        )}
                    </div>
                )}
        </section>
    );
}

export default WorkspaceActivityFeed;