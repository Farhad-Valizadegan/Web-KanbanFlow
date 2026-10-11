import { useQuery } from '@tanstack/react-query';
import type { Task } from '../../tasks/types';
import { getWorkspaceAnalytics } from '../api';

interface WorkspaceAnalyticsDashboardProps {
    workspaceId: number;
}

interface SummaryCardProps {
    label: string;
    value: number;
    description: string;
}

function SummaryCard({
    label,
    value,
    description,
}: SummaryCardProps) {
    return (
        <article className="summary-card border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm font-medium text-slate-400">
                {label}
            </p>

            <p className="mt-3 text-3xl font-bold text-slate-100">
                {value}
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-400">
                {description}
            </p>
        </article>
    );
}

function formatDate(
    value: string | null,
): string {
    if (!value) {
        return 'No due date';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat(
        undefined,
        {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        },
    ).format(date);
}

function getTaskLocation(
    task: Task,
): string {
    const projectName =
        task.column?.board?.project?.name;

    const boardName =
        task.column?.board?.name;

    const columnName =
        task.column?.name;

    return [
        projectName,
        boardName,
        columnName,
    ]
        .filter(Boolean)
        .join(' / ');
}

function TaskAnalyticsItem({
    task,
}: {
    task: Task;
}) {
    const location =
        getTaskLocation(task);

    return (
        <li className="analytics-task-row border-b border-slate-800 py-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                    <p className="font-semibold text-slate-100">
                        {task.title}
                    </p>

                    {location && (
                        <p className="mt-1 text-sm text-slate-500">
                            {location}
                        </p>
                    )}
                </div>

                <span className="w-fit border border-slate-700 px-2 py-1 text-xs uppercase tracking-wide text-slate-300">
                    {task.priority}
                </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-400">
                <span>
                    Due: {formatDate(task.due_date)}
                </span>

                {task.assignee && (
                    <span>
                        Assigned to: {task.assignee.name}
                    </span>
                )}
            </div>
        </li>
    );
}

function WorkspaceAnalyticsDashboard({
    workspaceId,
}: WorkspaceAnalyticsDashboardProps) {
    const analyticsQuery = useQuery({
        queryKey: [
            'workspace-analytics',
            workspaceId,
        ],
        queryFn: () =>
            getWorkspaceAnalytics(
                workspaceId,
                {
                    upcoming_limit: 10,
                    assigned_limit: 10,
                },
            ),
        enabled: Number.isInteger(
            workspaceId,
        ),
        retry: false,
    });

    if (analyticsQuery.isPending) {
        return (
            <section className="mt-10 border border-slate-800 bg-slate-900 p-6 text-slate-400">
                Loading workspace analytics...
            </section>
        );
    }

    if (analyticsQuery.isError) {
        return (
            <section className="mt-10 border border-red-900 bg-red-950/40 p-6 text-red-300">
                Unable to load workspace analytics.
            </section>
        );
    }

    const analytics =
        analyticsQuery.data;

    const summaryCards = [
        {
            label: 'Members',
            value:
                analytics.summary.members,
            description:
                'Users with access to this workspace.',
        },
        {
            label: 'Projects',
            value:
                analytics.summary.projects,
            description:
                'Projects currently stored in this workspace.',
        },
        {
            label: 'Boards',
            value:
                analytics.summary.boards,
            description:
                'Kanban boards across workspace projects.',
        },
        {
            label: 'Tasks',
            value:
                analytics.summary.tasks,
            description:
                'Total active task records in the workspace.',
        },
        {
            label: 'Open tasks',
            value:
                analytics.summary.open_tasks,
            description:
                'Tasks that have not been completed.',
        },
        {
            label: 'Completed',
            value:
                analytics.summary.completed_tasks,
            description:
                'Tasks marked as completed.',
        },
        {
            label: 'Overdue',
            value:
                analytics.summary.overdue_tasks,
            description:
                'Open tasks with due dates in the past.',
        },
        {
            label: 'Due today',
            value:
                analytics.summary.due_today_tasks,
            description:
                'Open tasks scheduled for today.',
        },
    ];

    return (
        <section className="mt-10">
            <div>
                <h2 className="mt-2 text-2xl font-bold">
                    Workspace overview
                </h2>

                <p className="mt-2 text-slate-400">
                    Review project distribution, task progress, priorities, and deadlines.
                </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {summaryCards.map(
                    (card) => (
                        <SummaryCard
                            key={card.label}
                            label={card.label}
                            value={card.value}
                            description={
                                card.description
                            }
                        />
                    ),
                )}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-3">
                <article className="border border-slate-800 bg-slate-900 p-6">
                    <h3 className="text-lg font-bold">
                        Projects by status
                    </h3>

                    <dl className="mt-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <dt className="text-slate-400">
                                Active
                            </dt>

                            <dd className="font-semibold">
                                {
                                    analytics
                                        .projects_by_status
                                        .active
                                }
                            </dd>
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <dt className="text-slate-400">
                                Completed
                            </dt>

                            <dd className="font-semibold">
                                {
                                    analytics
                                        .projects_by_status
                                        .completed
                                }
                            </dd>
                        </div>

                        <div className="flex items-center justify-between">
                            <dt className="text-slate-400">
                                Archived
                            </dt>

                            <dd className="font-semibold">
                                {
                                    analytics
                                        .projects_by_status
                                        .archived
                                }
                            </dd>
                        </div>
                    </dl>
                </article>

                <article className="border border-slate-800 bg-slate-900 p-6">
                    <h3 className="text-lg font-bold">
                        Tasks by status
                    </h3>

                    <dl className="mt-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <dt className="text-slate-400">
                                Open
                            </dt>

                            <dd className="font-semibold">
                                {
                                    analytics
                                        .tasks_by_status
                                        .open
                                }
                            </dd>
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <dt className="text-slate-400">
                                Completed
                            </dt>

                            <dd className="font-semibold">
                                {
                                    analytics
                                        .tasks_by_status
                                        .completed
                                }
                            </dd>
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <dt className="text-slate-400">
                                Overdue
                            </dt>

                            <dd className="font-semibold text-red-400">
                                {
                                    analytics
                                        .tasks_by_status
                                        .overdue
                                }
                            </dd>
                        </div>

                        <div className="flex items-center justify-between">
                            <dt className="text-slate-400">
                                Due today
                            </dt>

                            <dd className="font-semibold text-amber-300">
                                {
                                    analytics
                                        .tasks_by_status
                                        .due_today
                                }
                            </dd>
                        </div>
                    </dl>
                </article>

                <article className="border border-slate-800 bg-slate-900 p-6">
                    <h3 className="text-lg font-bold">
                        Tasks by priority
                    </h3>

                    <dl className="mt-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <dt className="text-slate-400">
                                Low
                            </dt>

                            <dd className="font-semibold">
                                {
                                    analytics
                                        .tasks_by_priority
                                        .low
                                }
                            </dd>
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <dt className="text-slate-400">
                                Medium
                            </dt>

                            <dd className="font-semibold">
                                {
                                    analytics
                                        .tasks_by_priority
                                        .medium
                                }
                            </dd>
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <dt className="text-slate-400">
                                High
                            </dt>

                            <dd className="font-semibold">
                                {
                                    analytics
                                        .tasks_by_priority
                                        .high
                                }
                            </dd>
                        </div>

                        <div className="flex items-center justify-between">
                            <dt className="text-slate-400">
                                Urgent
                            </dt>

                            <dd className="font-semibold text-red-400">
                                {
                                    analytics
                                        .tasks_by_priority
                                        .urgent
                                }
                            </dd>
                        </div>
                    </dl>
                </article>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <article className="border border-slate-800 bg-slate-900 p-6">
                    <h3 className="text-lg font-bold">
                        Upcoming tasks
                    </h3>

                    <p className="mt-2 text-sm text-slate-400">
                        Open tasks ordered by their nearest due date.
                    </p>

                    {analytics.upcoming_tasks.length ===
                    0 ? (
                        <p className="mt-5 py-2 text-sm text-slate-500">
                            No upcoming tasks were found.
                        </p>
                    ) : (
                        <ul className="mt-5 space-y-3">
                            {analytics.upcoming_tasks.map(
                                (task) => (
                                    <TaskAnalyticsItem
                                        key={task.id}
                                        task={task}
                                    />
                                ),
                            )}
                        </ul>
                    )}
                </article>

                <article className="border border-slate-800 bg-slate-900 p-6">
                    <h3 className="text-lg font-bold">
                        Assigned to me
                    </h3>

                    <p className="mt-2 text-sm text-slate-400">
                        Your open tasks in this workspace.
                    </p>

                    {analytics.assigned_to_me.length ===
                    0 ? (
                        <p className="mt-5 py-2 text-sm text-slate-500">
                            No open tasks are assigned to you.
                        </p>
                    ) : (
                        <ul className="mt-5 space-y-3">
                            {analytics.assigned_to_me.map(
                                (task) => (
                                    <TaskAnalyticsItem
                                        key={task.id}
                                        task={task}
                                    />
                                ),
                            )}
                        </ul>
                    )}
                </article>
            </div>
        </section>
    );
}

export default WorkspaceAnalyticsDashboard;
