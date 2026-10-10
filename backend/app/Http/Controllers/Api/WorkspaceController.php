<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class WorkspaceController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display the authenticated user's workspaces.
     */
    public function index(Request $request): JsonResponse
    {
        $workspaces = $request->user()
            ->workspaces()
            ->with('owner:id,name,email')
            ->latest('workspaces.created_at')
            ->get();

        return response()->json([
            'data' => $workspaces,
        ]);
    }

    /**
     * Store a new workspace.
     */
    public function store(Request $request): JsonResponse
    {
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
                'nullable',
                Rule::in([
                    'private',
                    'public',
                ]),
            ],
        ]);

        $workspace = DB::transaction(
            function () use (
                $request,
                $validated
            ): Workspace {
                $workspace =
                    Workspace::query()->create([
                        'owner_id' => $request->user()->id,
                        'name' => $validated['name'],
                        'slug' => $this->generateUniqueSlug(
                            $validated['name']
                        ),
                        'description' => $validated['description']
                                ?? null,
                        'visibility' => $validated['visibility']
                                ?? 'private',
                    ]);

                $workspace->members()->attach(
                    $request->user()->id,
                    [
                        'role' => 'owner',
                    ]
                );

                return $workspace;
            }
        );

        $workspace->load(
            'owner:id,name,email'
        );

        return response()->json([
            'message' => 'Workspace created successfully.',
            'data' => $workspace,
        ], 201);
    }

    /**
     * Display one workspace.
     */
    public function show(
        Request $request,
        Workspace $workspace
    ): JsonResponse {
        $this->authorize(
            'view',
            $workspace
        );

        $workspace->load([
            'owner:id,name,email',
            'members:id,name,email',
        ]);

        return response()->json([
            'data' => $workspace,
        ]);
    }

    /**
     * Update a workspace.
     */
    public function update(
        Request $request,
        Workspace $workspace
    ): JsonResponse {
        $this->authorize(
            'update',
            $workspace
        );

        $validated = $request->validate([
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],
            'description' => [
                'nullable',
                'string',
            ],
            'visibility' => [
                'sometimes',
                Rule::in([
                    'private',
                    'public',
                ]),
            ],
        ]);

        if (
            array_key_exists(
                'name',
                $validated
            ) &&
            $validated['name'] !==
                $workspace->name
        ) {
            $validated['slug'] =
                $this->generateUniqueSlug(
                    $validated['name'],
                    $workspace->id
                );
        }

        $workspace->update($validated);

        $workspace->load(
            'owner:id,name,email'
        );

        return response()->json([
            'message' => 'Workspace updated successfully.',
            'data' => $workspace,
        ]);
    }

    /**
     * Delete a workspace.
     */
    public function destroy(
        Request $request,
        Workspace $workspace
    ): JsonResponse {
        $this->authorize(
            'delete',
            $workspace
        );

        $workspace->delete();

        return response()->json([
            'message' => 'Workspace deleted successfully.',
        ]);
    }

    /**
     * Generate a unique workspace slug,
     * including soft-deleted workspaces.
     */
    private function generateUniqueSlug(
        string $name,
        ?int $ignoreWorkspaceId = null
    ): string {
        $baseSlug = Str::slug($name);

        if ($baseSlug === '') {
            $baseSlug = 'workspace';
        }

        $slug = $baseSlug;
        $counter = 2;

        while (
            Workspace::withTrashed()
                ->when(
                    $ignoreWorkspaceId !== null,
                    fn ($query) => $query->whereKeyNot(
                        $ignoreWorkspaceId
                    )
                )
                ->where(
                    'slug',
                    $slug
                )
                ->exists()
        ) {
            $slug =
                "{$baseSlug}-{$counter}";

            $counter++;
        }

        return $slug;
    }
}
