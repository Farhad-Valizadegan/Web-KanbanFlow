<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ProjectController extends Controller
{
    public function index(
        Request $request,
        Workspace $workspace
    ): JsonResponse {
        $this->authorize('view', $workspace);

        $projects = $workspace
            ->projects()
            ->with('creator:id,name,email')
            ->latest()
            ->get();

        return response()->json([
            'data' => $projects,
        ]);
    }

    public function store(
        Request $request,
        Workspace $workspace
    ): JsonResponse {
        $this->authorize('manageProjects', $workspace);

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
            'status' => [
                'nullable',
                Rule::in([
                    'active',
                    'completed',
                    'archived',
                ]),
            ],
            'start_date' => [
                'nullable',
                'date',
            ],
            'due_date' => [
                'nullable',
                'date',
                'after_or_equal:start_date',
            ],
        ]);

        $project = $workspace->projects()->create([
            'created_by' => $request->user()->id,
            'name' => $validated['name'],
            'slug' => $this->generateUniqueSlug(
                $workspace,
                $validated['name']
            ),
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'] ?? 'active',
            'start_date' => $validated['start_date'] ?? null,
            'due_date' => $validated['due_date'] ?? null,
        ]);

        $project->load('creator:id,name,email');

        return response()->json([
            'message' => 'Project created successfully.',
            'data' => $project,
        ], 201);
    }

    public function show(
        Request $request,
        Workspace $workspace,
        Project $project
    ): JsonResponse {
        $this->ensureProjectBelongsToWorkspace(
            $workspace,
            $project
        );

        $this->authorize('view', $project);

        $project->load('creator:id,name,email');

        return response()->json([
            'data' => $project,
        ]);
    }

    public function update(
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
            'status' => [
                'sometimes',
                Rule::in([
                    'active',
                    'completed',
                    'archived',
                ]),
            ],
            'start_date' => [
                'sometimes',
                'nullable',
                'date',
            ],
            'due_date' => [
                'sometimes',
                'nullable',
                'date',
                'after_or_equal:start_date',
            ],
        ]);

        if (
            array_key_exists('name', $validated)
            && $validated['name'] !== $project->name
        ) {
            $validated['slug'] =
                $this->generateUniqueSlug(
                    $workspace,
                    $validated['name'],
                    $project->id
                );
        }

        $project->update($validated);
        $project->load('creator:id,name,email');

        return response()->json([
            'message' => 'Project updated successfully.',
            'data' => $project,
        ]);
    }

    public function destroy(
        Request $request,
        Workspace $workspace,
        Project $project
    ): JsonResponse {
        $this->ensureProjectBelongsToWorkspace(
            $workspace,
            $project
        );

        $this->authorize('delete', $project);

        $project->delete();

        return response()->json([
            'message' => 'Project deleted successfully.',
        ]);
    }

    private function ensureProjectBelongsToWorkspace(
        Workspace $workspace,
        Project $project
    ): void {
        abort_unless(
            $project->workspace_id === $workspace->id,
            404,
            'Project not found in this workspace.'
        );
    }

    private function generateUniqueSlug(
        Workspace $workspace,
        string $name,
        ?int $ignoreProjectId = null
    ): string {
        $baseSlug = Str::slug($name);

        if ($baseSlug === '') {
            $baseSlug = 'project';
        }

        $slug = $baseSlug;
        $counter = 2;

        while (
            $workspace
                ->projects()
                ->withTrashed()
                ->when(
                    $ignoreProjectId !== null,
                    fn ($query) => $query->whereKeyNot(
                        $ignoreProjectId
                    )
                )
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
