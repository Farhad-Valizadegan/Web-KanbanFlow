<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class WorkspaceMemberController extends Controller
{
    use AuthorizesRequests;

    /**
     * List all members of a workspace.
     */
    public function index(
        Request $request,
        Workspace $workspace
    ): JsonResponse {
        $this->authorize('view', $workspace);

        $members = $workspace->members()
            ->select('users.id', 'users.name', 'users.email')
            ->orderBy('users.name')
            ->get();

        return response()->json([
            'data' => $members,
        ]);
    }

    /**
     * Add a member to a workspace.
     */
    public function store(
        Request $request,
        Workspace $workspace
    ): JsonResponse {
        $this->authorize('manageMembers', $workspace);

        $validated = $request->validate([
            'email' => [
                'required',
                'email',
                'exists:users,email',
            ],
            'role' => [
                'required',
                Rule::in(['manager', 'member', 'viewer']),
            ],
        ]);

        $user = User::query()
            ->where('email', $validated['email'])
            ->firstOrFail();

        if (
            $workspace->members()
                ->where('users.id', $user->id)
                ->exists()
        ) {
            return response()->json([
                'message' => 'User is already a workspace member.',
            ], 422);
        }

        $workspace->members()->attach($user->id, [
            'role' => $validated['role'],
        ]);

        return response()->json([
            'message' => 'Workspace member added successfully.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $validated['role'],
            ],
        ], 201);
    }

    /**
     * Update a workspace member's role.
     */
    public function update(
        Request $request,
        Workspace $workspace,
        User $user
    ): JsonResponse {
        $this->authorize('changeMemberRoles', $workspace);

        $validated = $request->validate([
            'role' => [
                'required',
                Rule::in(['manager', 'member', 'viewer']),
            ],
        ]);

        abort_if(
            $user->id === $workspace->owner_id,
            422,
            'The workspace owner role cannot be changed.'
        );

        $isMember = $workspace->members()
            ->where('users.id', $user->id)
            ->exists();

        abort_unless(
            $isMember,
            404,
            'User is not a member of this workspace.'
        );

        $workspace->members()->updateExistingPivot(
            $user->id,
            [
                'role' => $validated['role'],
            ]
        );

        return response()->json([
            'message' => 'Workspace member role updated successfully.',
        ]);
    }

    /**
     * Remove a member from a workspace.
     */
    public function destroy(
        Request $request,
        Workspace $workspace,
        User $user
    ): JsonResponse {
        $this->authorize('manageMembers', $workspace);

        abort_if(
            $user->id === $workspace->owner_id,
            422,
            'The workspace owner cannot be removed.'
        );

        $isMember = $workspace->members()
            ->where('users.id', $user->id)
            ->exists();

        abort_unless(
            $isMember,
            404,
            'User is not a member of this workspace.'
        );

        $workspace->members()->detach($user->id);

        return response()->json([
            'message' => 'Workspace member removed successfully.',
        ]);
    }
}