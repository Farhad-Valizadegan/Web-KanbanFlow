<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Board;
use App\Models\Column;
use App\Models\Project;
use App\Models\Task;
use App\Models\Workspace;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TaskController extends Controller
{
    public function __construct(
        private readonly ActivityLogger $activityLogger
    ) {
    }

    public function index(
        Workspace $workspace,
        Project $project,
        Board $board,
        Column $column
    ): JsonResponse {
        $this->ensureNestedResources(
            $workspace,
            $project,
            $board,
            $column
        );

        $this->authorize('view', $board);

        $tasks = $column
            ->tasks()
            ->with([
                'creator',
                'assignee',
            ])
            ->orderBy('position')
            ->orderBy('id')
            ->get();

        return response()->json([
            'data' => $tasks,
        ]);
    }

    public function store(
        Request $request,
        Workspace $workspace,
        Project $project,
        Board $board,
        Column $column
    ): JsonResponse {
        $this->ensureNestedResources(
            $workspace,
            $project,
            $board,
            $column
        );

        $this->authorize('update', $board);

        $validated = $request->validate([
            'title' => [
                'required',
                'string',
                'max:255',
            ],
            'description' => [
                'nullable',
                'string',
            ],
            'priority' => [
                'required',
                'in:low,medium,high,urgent',
            ],
            'assigned_to' => [
                'nullable',
                'integer',
                'exists:users,id',
            ],
            'due_date' => [
                'nullable',
                'date',
            ],
            'completed_at' => [
                'nullable',
                'date',
            ],
        ]);

        $this->ensureAssigneeBelongsToWorkspace(
            $workspace,
            $validated['assigned_to'] ?? null
        );

        $task = DB::transaction(function () use (
            $request,
            $workspace,
            $column,
            $validated
        ): Task {
            $column->refresh();

            $this->ensureColumnCanAcceptActiveTask(
                $column,
                $validated['completed_at'] ?? null
            );

            $task = $column->tasks()->create([
                'created_by' => $request->user()->id,
                'assigned_to' =>
                    $validated['assigned_to'] ?? null,
                'title' => $validated['title'],
                'description' =>
                    $validated['description'] ?? null,
                'priority' => $validated['priority'],
                'position' =>
                    (int) $column
                        ->tasks()
                        ->max('position') + 1,
                'due_date' =>
                    $validated['due_date'] ?? null,
                'completed_at' =>
                    $validated['completed_at'] ?? null,
            ]);

            $this->activityLogger->log(
                $workspace,
                $request->user(),
                'created',
                'task',
                $task,
                $task->title,
                [
                    'task' =>
                        $this->taskActivityState(
                            $task
                        ),
                ]
            );

            return $task;
        });

        $task->load([
            'creator',
            'assignee',
        ]);

        return response()->json([
            'message' => 'Task created successfully.',
            'data' => $task,
        ], 201);
    }

    public function show(
        Workspace $workspace,
        Project $project,
        Board $board,
        Column $column,
        Task $task
    ): JsonResponse {
        $this->ensureNestedResources(
            $workspace,
            $project,
            $board,
            $column,
            $task
        );

        $this->authorize('view', $board);

        $task->load([
            'creator',
            'assignee',
        ]);

        return response()->json([
            'data' => $task,
        ]);
    }

    public function update(
        Request $request,
        Workspace $workspace,
        Project $project,
        Board $board,
        Column $column,
        Task $task
    ): JsonResponse {
        $this->ensureNestedResources(
            $workspace,
            $project,
            $board,
            $column,
            $task
        );

        $this->authorize('update', $board);

        $validated = $request->validate([
            'title' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],
            'description' => [
                'sometimes',
                'nullable',
                'string',
            ],
            'priority' => [
                'sometimes',
                'required',
                'in:low,medium,high,urgent',
            ],
            'assigned_to' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:users,id',
            ],
            'position' => [
                'prohibited',
            ],
            'due_date' => [
                'sometimes',
                'nullable',
                'date',
            ],
            'completed_at' => [
                'sometimes',
                'nullable',
                'date',
            ],
        ]);

        if (
            array_key_exists(
                'assigned_to',
                $validated
            )
        ) {
            $this->ensureAssigneeBelongsToWorkspace(
                $workspace,
                $validated['assigned_to']
            );
        }

        DB::transaction(function () use (
            $request,
            $workspace,
            $task,
            $column,
            $validated
        ): void {
            $task->refresh();
            $column->refresh();

            $before =
                $this->taskActivityState(
                    $task
                );

            $isReopeningTask =
                array_key_exists(
                    'completed_at',
                    $validated
                ) &&
                $validated['completed_at'] === null &&
                $task->completed_at !== null;

            if ($isReopeningTask) {
                $this->ensureColumnCanAcceptActiveTask(
                    $column,
                    null
                );
            }

            $task->update($validated);
            $task->refresh();

            $this->activityLogger->log(
                $workspace,
                $request->user(),
                'updated',
                'task',
                $task,
                $task->title,
                [
                    'before' => $before,
                    'after' =>
                        $this->taskActivityState(
                            $task
                        ),
                ]
            );
        });

        $task->refresh();
        $task->load([
            'creator',
            'assignee',
        ]);

        return response()->json([
            'message' => 'Task updated successfully.',
            'data' => $task,
        ]);
    }

    public function move(
        Request $request,
        Workspace $workspace,
        Project $project,
        Board $board,
        Column $column,
        Task $task
    ): JsonResponse {
        $this->ensureNestedResources(
            $workspace,
            $project,
            $board,
            $column,
            $task
        );

        $this->authorize('update', $board);

        $validated = $request->validate([
            'column_id' => [
                'required',
                'integer',
                'exists:columns,id',
            ],
            'position' => [
                'required',
                'integer',
                'min:1',
            ],
        ]);

        $destinationColumn = Column::query()
            ->findOrFail($validated['column_id']);

        if (
            $destinationColumn->board_id !==
            $board->id
        ) {
            throw ValidationException::withMessages([
                'column_id' => [
                    'The destination column must belong to the same board.',
                ],
            ]);
        }

        DB::transaction(function () use (
            $request,
            $workspace,
            $task,
            $column,
            $destinationColumn,
            $validated
        ): void {
            $task->refresh();

            $before = [
                'column_id' =>
                    $task->column_id,
                'position' =>
                    $task->position,
            ];

            if (
                $task->column_id ===
                $destinationColumn->id
            ) {
                $this->reorderTaskWithinColumn(
                    $task,
                    $destinationColumn,
                    $validated['position']
                );
            } else {
                $this->ensureDestinationWipLimit(
                    $task,
                    $destinationColumn
                );

                $this->moveTaskBetweenColumns(
                    $task,
                    $column,
                    $destinationColumn,
                    $validated['position']
                );
            }

            $task->refresh();

            $this->activityLogger->log(
                $workspace,
                $request->user(),
                'moved',
                'task',
                $task,
                $task->title,
                [
                    'before' => $before,
                    'after' => [
                        'column_id' =>
                            $task->column_id,
                        'position' =>
                            $task->position,
                    ],
                ]
            );
        });

        $task->refresh();
        $task->load([
            'creator',
            'assignee',
        ]);

        return response()->json([
            'message' => 'Task moved successfully.',
            'data' => $task,
        ]);
    }

    public function destroy(
        Request $request,
        Workspace $workspace,
        Project $project,
        Board $board,
        Column $column,
        Task $task
    ): JsonResponse {
        $this->ensureNestedResources(
            $workspace,
            $project,
            $board,
            $column,
            $task
        );

        $this->authorize('delete', $board);

        DB::transaction(function () use (
            $request,
            $workspace,
            $task
        ): void {
            $taskState =
                $this->taskActivityState(
                    $task
                );

            $taskName = $task->title;

            $task->delete();

            $this->activityLogger->log(
                $workspace,
                $request->user(),
                'deleted',
                'task',
                $task,
                $taskName,
                [
                    'task' => $taskState,
                ]
            );
        });

        return response()->json([
            'message' => 'Task deleted successfully.',
        ]);
    }

    private function reorderTaskWithinColumn(
        Task $task,
        Column $column,
        int $requestedPosition
    ): void {
        $otherTaskIds = $column
            ->tasks()
            ->whereKeyNot($task->id)
            ->orderBy('position')
            ->orderBy('id')
            ->lockForUpdate()
            ->pluck('id')
            ->all();

        $position = min(
            max($requestedPosition, 1),
            count($otherTaskIds) + 1
        );

        array_splice(
            $otherTaskIds,
            $position - 1,
            0,
            [$task->id]
        );

        $this->applyTaskPositions(
            $otherTaskIds,
            $column->id
        );
    }

    private function moveTaskBetweenColumns(
        Task $task,
        Column $sourceColumn,
        Column $destinationColumn,
        int $requestedPosition
    ): void {
        $sourceTaskIds = $sourceColumn
            ->tasks()
            ->whereKeyNot($task->id)
            ->orderBy('position')
            ->orderBy('id')
            ->lockForUpdate()
            ->pluck('id')
            ->all();

        $destinationTaskIds = $destinationColumn
            ->tasks()
            ->orderBy('position')
            ->orderBy('id')
            ->lockForUpdate()
            ->pluck('id')
            ->all();

        $position = min(
            max($requestedPosition, 1),
            count($destinationTaskIds) + 1
        );

        array_splice(
            $destinationTaskIds,
            $position - 1,
            0,
            [$task->id]
        );

        $this->applyTaskPositions(
            $sourceTaskIds,
            $sourceColumn->id
        );

        $this->applyTaskPositions(
            $destinationTaskIds,
            $destinationColumn->id
        );
    }

    private function applyTaskPositions(
        array $taskIds,
        int $columnId
    ): void {
        foreach (
            array_values($taskIds)
            as $index => $taskId
        ) {
            Task::query()
                ->whereKey($taskId)
                ->update([
                    'column_id' => $columnId,
                    'position' => $index + 1,
                ]);
        }
    }

    private function ensureDestinationWipLimit(
        Task $task,
        Column $destinationColumn
    ): void {
        $this->ensureColumnCanAcceptActiveTask(
            $destinationColumn,
            $task->completed_at
        );
    }

    private function ensureColumnCanAcceptActiveTask(
        Column $column,
        mixed $completedAt
    ): void {
        if ($column->wip_limit === null) {
            return;
        }

        if ($completedAt !== null) {
            return;
        }

        $activeTaskCount = $column
            ->tasks()
            ->whereNull('completed_at')
            ->lockForUpdate()
            ->count();

        if (
            $activeTaskCount >=
            $column->wip_limit
        ) {
            throw ValidationException::withMessages([
                'column_id' => [
                    'The column has reached its WIP limit.',
                ],
            ]);
        }
    }

    private function ensureNestedResources(
        Workspace $workspace,
        Project $project,
        Board $board,
        Column $column,
        ?Task $task = null
    ): void {
        abort_unless(
            $project->workspace_id ===
                $workspace->id,
            404
        );

        abort_unless(
            $board->project_id ===
                $project->id,
            404
        );

        abort_unless(
            $column->board_id ===
                $board->id,
            404
        );

        if ($task !== null) {
            abort_unless(
                $task->column_id ===
                    $column->id,
                404
            );
        }
    }

    private function ensureAssigneeBelongsToWorkspace(
        Workspace $workspace,
        ?int $userId
    ): void {
        if ($userId === null) {
            return;
        }

        $belongsToWorkspace = $workspace
            ->members()
            ->where(
                'users.id',
                $userId
            )
            ->exists();

        abort_unless(
            $belongsToWorkspace,
            422
        );
    }

    private function taskActivityState(
        Task $task
    ): array {
        return [
            'column_id' =>
                $task->column_id,
            'created_by' =>
                $task->created_by,
            'assigned_to' =>
                $task->assigned_to,
            'title' =>
                $task->title,
            'description' =>
                $task->description,
            'priority' =>
                $task->priority,
            'position' =>
                $task->position,
            'due_date' =>
                $task->due_date,
            'completed_at' =>
                $task->completed_at,
        ];
    }
}