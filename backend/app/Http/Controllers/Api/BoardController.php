<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Board;
use App\Models\Project;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BoardController extends Controller
{
    public function index(
        Request $request,
        Workspace $workspace,
        Project $project
    ): JsonResponse {
        $this->ensureProjectBelongsToWorkspace(
            $workspace,
            $project
        );

        $this->authorize('view', $project);

        $boards = $project
            ->boards()
            ->with('creator')
            ->orderBy('position')
            ->orderBy('id')
            ->get();

        return response()->json([
            'data' => $boards,
        ]);
    }

    public function store(
        Request $request,
        Workspace $workspace,
        Project $project
    ): JsonResponse {
        $this->ensureProjectBelongsToWorkspace(
            $workspace,
            $project
        );

        $this->authorize('update', $project);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],
            'description' => [
                'nullable',
                'string',
            ],
            'visibility' => [
                'required',
                'in:workspace,private',
            ],
        ]);

        $board = $project->boards()->create([
            'created_by' => $request->user()->id,
            'name' => $validated['name'],
            'slug' => $this->generateUniqueSlug(
                $project,
                $validated['name']
            ),
            'description' =>
                $validated['description'] ?? null,
            'visibility' =>
                $validated['visibility'],
            'position' =>
                (int) $project
                    ->boards()
                    ->max('position') + 1,
        ]);

        $board->load('creator');

        return response()->json([
            'message' =>
                'Board created successfully.',
            'data' => $board,
        ], 201);
    }

    public function show(
        Workspace $workspace,
        Project $project,
        Board $board
    ): JsonResponse {
        $this->ensureNestedResources(
            $workspace,
            $project,
            $board
        );

        $this->authorize('view', $project);

        $board->load('creator');

        return response()->json([
            'data' => $board,
        ]);
    }

    public function update(
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

        $this->authorize('update', $project);

        $validated = $request->validate([
            'name' => [
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
            'visibility' => [
                'sometimes',
                'required',
                'in:workspace,private',
            ],
            'position' => [
                'prohibited',
            ],
        ]);

        if (
            array_key_exists(
                'name',
                $validated
            )
        ) {
            $validated['slug'] =
                $this->generateUniqueSlug(
                    $project,
                    $validated['name'],
                    $board
                );
        }

        $board->update($validated);
        $board->load('creator');

        return response()->json([
            'message' =>
                'Board updated successfully.',
            'data' => $board,
        ]);
    }

    public function destroy(
        Workspace $workspace,
        Project $project,
        Board $board
    ): JsonResponse {
        $this->ensureNestedResources(
            $workspace,
            $project,
            $board
        );

        $this->authorize('update', $project);

        $board->delete();

        return response()->json([
            'message' =>
                'Board deleted successfully.',
        ]);
    }

    private function ensureProjectBelongsToWorkspace(
        Workspace $workspace,
        Project $project
    ): void {
        abort_unless(
            $project->workspace_id ===
                $workspace->id,
            404
        );
    }

    private function ensureNestedResources(
        Workspace $workspace,
        Project $project,
        Board $board
    ): void {
        $this->ensureProjectBelongsToWorkspace(
            $workspace,
            $project
        );

        abort_unless(
            $board->project_id === $project->id,
            404
        );
    }

    /**
     * Generate a unique board slug within
     * the project, including soft-deleted boards.
     */
    private function generateUniqueSlug(
        Project $project,
        string $name,
        ?Board $ignoredBoard = null
    ): string {
        $baseSlug =
            Str::slug($name) ?: 'board';

        $slug = $baseSlug;
        $counter = 2;

        while (
            $project
                ->boards()
                ->withTrashed()
                ->when(
                    $ignoredBoard !== null,
                    fn ($query) =>
                        $query->whereKeyNot(
                            $ignoredBoard->id
                        )
                )
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug =
                "{$baseSlug}-{$counter}";

            $counter++;
        }

        return $slug;
    }
}