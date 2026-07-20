<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkspaceAnalyticsController extends Controller
{
    public function index(
        Request $request,
        Workspace $workspace
    ): JsonResponse {
        $this->authorize(
            'view',
            $workspace
        );

        $validated = $request->validate([
            'upcoming_limit' => [
                'sometimes',
                'integer',
                'min:1',
                'max:50',
            ],
            'assigned_limit' => [
                'sometimes',
                'integer',
                'min:1',
                'max:50',
            ],
        ]);

        $upcomingLimit =
            $validated['upcoming_limit'] ?? 10;

        $assignedLimit =
            $validated['assigned_limit'] ?? 10;

        $today = now()->startOfDay();

        $workspaceTaskQuery = Task::query()
            ->whereHas(
                'column.board.project',
                function (
                    Builder $query
                ) use (
                    $workspace
                ): void {
                    $query->where(
                        'workspace_id',
                        $workspace->id
                    );
                }
            );

        $projectStatusCounts = Project::query()
            ->where(
                'workspace_id',
                $workspace->id
            )
            ->selectRaw(
                'status, COUNT(*) as total'
            )
            ->groupBy('status')
            ->pluck(
                'total',
                'status'
            );

        $taskPriorityCounts = (
            clone $workspaceTaskQuery
        )
            ->selectRaw(
                'priority, COUNT(*) as total'
            )
            ->groupBy('priority')
            ->pluck(
                'total',
                'priority'
            );

        $totalTasks = (
            clone $workspaceTaskQuery
        )->count();

        $completedTasks = (
            clone $workspaceTaskQuery
        )
            ->whereNotNull(
                'completed_at'
            )
            ->count();

        $openTasks =
            $totalTasks - $completedTasks;

        $overdueTasks = (
            clone $workspaceTaskQuery
        )
            ->whereNull(
                'completed_at'
            )
            ->whereNotNull(
                'due_date'
            )
            ->whereDate(
                'due_date',
                '<',
                $today
            )
            ->count();

        $dueTodayTasks = (
            clone $workspaceTaskQuery
        )
            ->whereNull(
                'completed_at'
            )
            ->whereDate(
                'due_date',
                $today
            )
            ->count();

        $upcomingTasks = (
            clone $workspaceTaskQuery
        )
            ->whereNull(
                'completed_at'
            )
            ->whereNotNull(
                'due_date'
            )
            ->whereDate(
                'due_date',
                '>=',
                $today
            )
            ->with([
                'assignee:id,name,email',
                'column:id,board_id,name',
                'column.board:id,project_id,name,slug',
                'column.board.project:id,workspace_id,name,slug',
            ])
            ->orderBy(
                'due_date'
            )
            ->orderBy(
                'priority'
            )
            ->orderBy(
                'id'
            )
            ->limit(
                $upcomingLimit
            )
            ->get();

        $assignedTasks = (
            clone $workspaceTaskQuery
        )
            ->where(
                'assigned_to',
                $request->user()->id
            )
            ->whereNull(
                'completed_at'
            )
            ->with([
                'column:id,board_id,name',
                'column.board:id,project_id,name,slug',
                'column.board.project:id,workspace_id,name,slug',
            ])
            ->orderByRaw(
                'CASE
                    WHEN due_date IS NULL THEN 1
                    ELSE 0
                END'
            )
            ->orderBy(
                'due_date'
            )
            ->orderBy(
                'priority'
            )
            ->orderBy(
                'id'
            )
            ->limit(
                $assignedLimit
            )
            ->get();

        return response()->json([
            'data' => [
                'summary' => [
                    'members' =>
                        $workspace
                            ->members()
                            ->count(),
                    'projects' =>
                        $workspace
                            ->projects()
                            ->count(),
                    'boards' =>
                        $workspace
                            ->projects()
                            ->withCount('boards')
                            ->get()
                            ->sum('boards_count'),
                    'tasks' => $totalTasks,
                    'open_tasks' => $openTasks,
                    'completed_tasks' =>
                        $completedTasks,
                    'overdue_tasks' =>
                        $overdueTasks,
                    'due_today_tasks' =>
                        $dueTodayTasks,
                ],
                'projects_by_status' => [
                    'active' => (int) (
                        $projectStatusCounts[
                            'active'
                        ] ?? 0
                    ),
                    'completed' => (int) (
                        $projectStatusCounts[
                            'completed'
                        ] ?? 0
                    ),
                    'archived' => (int) (
                        $projectStatusCounts[
                            'archived'
                        ] ?? 0
                    ),
                ],
                'tasks_by_status' => [
                    'open' => $openTasks,
                    'completed' =>
                        $completedTasks,
                    'overdue' =>
                        $overdueTasks,
                    'due_today' =>
                        $dueTodayTasks,
                ],
                'tasks_by_priority' => [
                    'low' => (int) (
                        $taskPriorityCounts[
                            'low'
                        ] ?? 0
                    ),
                    'medium' => (int) (
                        $taskPriorityCounts[
                            'medium'
                        ] ?? 0
                    ),
                    'high' => (int) (
                        $taskPriorityCounts[
                            'high'
                        ] ?? 0
                    ),
                    'urgent' => (int) (
                        $taskPriorityCounts[
                            'urgent'
                        ] ?? 0
                    ),
                ],
                'upcoming_tasks' =>
                    $upcomingTasks,
                'assigned_to_me' =>
                    $assignedTasks,
            ],
        ]);
    }
}