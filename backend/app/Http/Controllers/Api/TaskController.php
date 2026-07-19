<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Board;
use App\Models\Column;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
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

        $task = $column->tasks()->create([
            'created_by' => $request->user()->id,
            'assigned_to' => $validated['assigned_to'] ?? null,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'priority' => $validated['priority'],
            'position' =>
                (int) $column->tasks()->max('position') + 1,
            'due_date' => $validated['due_date'] ?? null,
            'completed_at' => $validated['completed_at'] ?? null,
        ]);

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
                'sometimes',
                'required',
                'integer',
                'min:0',
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

        if (array_key_exists('assigned_to', $validated)) {
            $this->ensureAssigneeBelongsToWorkspace(
                $workspace,
                $validated['assigned_to']
            );
        }

        $task->update($validated);

        $task->load([
            'creator',
            'assignee',
        ]);

        return response()->json([
            'message' => 'Task updated successfully.',
            'data' => $task,
        ]);
    }

    public function destroy(
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

        $task->delete();

        return response()->json([
            'message' => 'Task deleted successfully.',
        ]);
    }

    private function ensureNestedResources(
        Workspace $workspace,
        Project $project,
        Board $board,
        Column $column,
        ?Task $task = null
    ): void {
        abort_unless(
            $project->workspace_id === $workspace->id,
            404
        );

        abort_unless(
            $board->project_id === $project->id,
            404
        );

        abort_unless(
            $column->board_id === $board->id,
            404
        );

        if ($task !== null) {
            abort_unless(
                $task->column_id === $column->id,
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
            ->where('users.id', $userId)
            ->exists();

        abort_unless($belongsToWorkspace, 422);
    }
}