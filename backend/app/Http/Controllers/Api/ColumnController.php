<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Board;
use App\Models\Column;
use App\Models\Project;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ColumnController extends Controller
{
    public function index(
        Workspace $workspace,
        Project $project,
        Board $board
    ): JsonResponse {
        $this->ensureNestedResources(
            $workspace,
            $project,
            $board
        );

        $this->authorize('view', $board);

        $columns = $board
            ->columns()
            ->orderBy('position')
            ->orderBy('id')
            ->get();

        return response()->json([
            'data' => $columns,
        ]);
    }

    public function store(
        Request $request,
        Workspace $workspace,
        Project $project,
        Board $board
    ): JsonResponse {
        $this->ensureNestedResources(
            $workspace,
            $project,
            $board
        );

        $this->authorize('update', $board);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],
            'wip_limit' => [
                'nullable',
                'integer',
                'min:1',
            ],
        ]);

        $column = DB::transaction(function () use ($board, $validated): Column {
            Board::query()->whereKey($board->id)->lockForUpdate()->firstOrFail();

            return $board->columns()->create([
                'name' => $validated['name'],
                'position' => (int) $board
                    ->columns()
                    ->max('position') + 1,
                'wip_limit' => $validated['wip_limit'] ?? null,
            ]);
        });

        return response()->json([
            'message' => 'Column created successfully.',
            'data' => $column,
        ], 201);
    }

    public function show(
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

        return response()->json([
            'data' => $column,
        ]);
    }

    public function update(
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
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],
            'position' => [
                'prohibited',
            ],
            'wip_limit' => [
                'sometimes',
                'nullable',
                'integer',
                'min:1',
            ],
        ]);

        DB::transaction(function () use ($board, $column, $validated): void {
            Board::query()->whereKey($board->id)->lockForUpdate()->firstOrFail();
            Column::query()->whereKey($column->id)->lockForUpdate()->firstOrFail();
            $column->update($validated);
        });

        return response()->json([
            'message' => 'Column updated successfully.',
            'data' => $column,
        ]);
    }

    public function move(
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
            'position' => [
                'required',
                'integer',
                'min:1',
            ],
        ]);

        DB::transaction(function () use (
            $board,
            $column,
            $validated
        ): void {
            Board::query()->whereKey($board->id)->lockForUpdate()->firstOrFail();
            $column->refresh();

            $columnIds = $board
                ->columns()
                ->whereKeyNot($column->id)
                ->orderBy('position')
                ->orderBy('id')
                ->lockForUpdate()
                ->pluck('id')
                ->all();

            $position = min(
                max(
                    $validated['position'],
                    1
                ),
                count($columnIds) + 1
            );

            array_splice(
                $columnIds,
                $position - 1,
                0,
                [$column->id]
            );

            $this->applyColumnPositions(
                $columnIds,
                $board->id
            );
        });

        $column->refresh();

        return response()->json([
            'message' => 'Column moved successfully.',
            'data' => $column,
        ]);
    }

    public function destroy(
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

        $this->authorize('delete', $board);

        DB::transaction(function () use ($board, $column): void {
            Board::query()->whereKey($board->id)->lockForUpdate()->firstOrFail();
            Column::query()->whereKey($column->id)->lockForUpdate()->firstOrFail();
            $column->delete();
            $this->applyColumnPositions($board->columns()->orderBy('position')->orderBy('id')->pluck('id')->all(), $board->id);
        });

        return response()->json([
            'message' => 'Column deleted successfully.',
        ]);
    }

    private function applyColumnPositions(
        array $columnIds,
        int $boardId
    ): void {
        foreach (
            array_values($columnIds) as $index => $columnId
        ) {
            Column::query()
                ->whereKey($columnId)
                ->update([
                    'board_id' => $boardId,
                    'position' => $index + 1,
                ]);
        }
    }

    private function ensureNestedResources(
        Workspace $workspace,
        Project $project,
        Board $board,
        ?Column $column = null
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

        if ($column !== null) {
            abort_unless(
                $column->board_id ===
                    $board->id,
                404
            );
        }
    }
}
