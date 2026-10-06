<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Board;
use App\Models\Column;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskComment;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskCommentController extends Controller
{
    public function index(
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

        $comments = $task
            ->comments()
            ->with('user')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get();

        return response()->json([
            'data' => $comments,
        ]);
    }

    public function store(
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

        $this->authorize('view', $board);

        $validated = $request->validate([
            'body' => [
                'required',
                'string',
                'max:5000',
            ],
        ]);

        $comment = $task
            ->comments()
            ->create([
                'user_id' => $request->user()->id,
                'body' => $validated['body'],
            ]);

        $comment->load('user');

        return response()->json([
            'message' => 'Comment created successfully.',
            'data' => $comment,
        ], 201);
    }

    public function show(
        Workspace $workspace,
        Project $project,
        Board $board,
        Column $column,
        Task $task,
        TaskComment $comment
    ): JsonResponse {
        $this->ensureNestedResources(
            $workspace,
            $project,
            $board,
            $column,
            $task,
            $comment
        );

        $this->authorize('view', $board);

        $comment->load('user');

        return response()->json([
            'data' => $comment,
        ]);
    }

    public function update(
        Request $request,
        Workspace $workspace,
        Project $project,
        Board $board,
        Column $column,
        Task $task,
        TaskComment $comment
    ): JsonResponse {
        $this->ensureNestedResources(
            $workspace,
            $project,
            $board,
            $column,
            $task,
            $comment
        );

        $this->authorize('view', $board);
        $this->authorize('update', $comment);

        $validated = $request->validate([
            'body' => [
                'required',
                'string',
                'max:5000',
            ],
        ]);

        $comment->update([
            'body' => $validated['body'],
        ]);

        $comment->refresh();
        $comment->load('user');

        return response()->json([
            'message' => 'Comment updated successfully.',
            'data' => $comment,
        ]);
    }

    public function destroy(
        Request $request,
        Workspace $workspace,
        Project $project,
        Board $board,
        Column $column,
        Task $task,
        TaskComment $comment
    ): JsonResponse {
        $this->ensureNestedResources(
            $workspace,
            $project,
            $board,
            $column,
            $task,
            $comment
        );

        $this->authorize('view', $board);

        $isAuthor =
            $comment->user_id ===
            $request->user()->id;

        $workspaceRole = $workspace
            ->members()
            ->where(
                'users.id',
                $request->user()->id
            )
            ->value('workspace_user.role');

        $canModerate =
            $workspace->owner_id ===
                $request->user()->id ||
            $workspaceRole === 'manager';

        abort_unless(
            $isAuthor || $canModerate,
            403
        );

        $comment->delete();

        return response()->json([
            'message' => 'Comment deleted successfully.',
        ]);
    }

    private function ensureNestedResources(
        Workspace $workspace,
        Project $project,
        Board $board,
        Column $column,
        Task $task,
        ?TaskComment $comment = null
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

        abort_unless(
            $task->column_id ===
                $column->id,
            404
        );

        if ($comment !== null) {
            abort_unless(
                $comment->task_id ===
                    $task->id,
                404
            );
        }
    }
}
