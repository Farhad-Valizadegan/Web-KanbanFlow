<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WorkspaceApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_create_a_workspace(): void
    {
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/workspaces', [
            'name' => 'Engineering Workspace',
            'description' => 'Workspace for the engineering team',
            'visibility' => 'private',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath(
                'message',
                'Workspace created successfully.'
            )
            ->assertJsonPath(
                'data.name',
                'Engineering Workspace'
            )
            ->assertJsonPath(
                'data.owner_id',
                $user->id
            );

        $workspace = Workspace::query()
            ->firstOrFail();

        $this->assertDatabaseHas('workspaces', [
            'id' => $workspace->id,
            'owner_id' => $user->id,
            'name' => 'Engineering Workspace',
            'visibility' => 'private',
        ]);

        $this->assertDatabaseHas('workspace_user', [
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'role' => 'owner',
        ]);
    }

    public function test_authenticated_user_can_list_only_their_workspaces(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $ownWorkspace =
            $this->createWorkspaceFor($user);

        $this->createWorkspaceFor($otherUser);

        Sanctum::actingAs($user);

        $response =
            $this->getJson('/api/workspaces');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath(
                'data.0.id',
                $ownWorkspace->id
            );
    }

    public function test_member_can_view_a_workspace(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        $workspace =
            $this->createWorkspaceFor($owner);

        $workspace->members()->attach(
            $member->id,
            [
                'role' => 'member',
            ]
        );

        Sanctum::actingAs($member);

        $this->getJson(
            "/api/workspaces/{$workspace->id}"
        )
            ->assertOk()
            ->assertJsonPath(
                'data.id',
                $workspace->id
            );
    }

    public function test_non_member_cannot_view_a_workspace(): void
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();

        $workspace =
            $this->createWorkspaceFor($owner);

        Sanctum::actingAs($outsider);

        $this->getJson(
            "/api/workspaces/{$workspace->id}"
        )->assertForbidden();
    }

    public function test_only_owner_can_update_a_workspace(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        $workspace =
            $this->createWorkspaceFor($owner);

        $workspace->members()->attach(
            $member->id,
            [
                'role' => 'member',
            ]
        );

        Sanctum::actingAs($member);

        $this->patchJson(
            "/api/workspaces/{$workspace->id}",
            [
                'name' => 'Unauthorized Update',
            ]
        )->assertForbidden();

        Sanctum::actingAs($owner);

        $this->patchJson(
            "/api/workspaces/{$workspace->id}",
            [
                'name' => 'Updated Workspace',
            ]
        )
            ->assertOk()
            ->assertJsonPath(
                'data.name',
                'Updated Workspace'
            );

        $this->assertDatabaseHas('workspaces', [
            'id' => $workspace->id,
            'name' => 'Updated Workspace',
        ]);
    }

    public function test_only_owner_can_delete_a_workspace(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        $workspace =
            $this->createWorkspaceFor($owner);

        $workspace->members()->attach(
            $member->id,
            [
                'role' => 'member',
            ]
        );

        Sanctum::actingAs($member);

        $this->deleteJson(
            "/api/workspaces/{$workspace->id}"
        )->assertForbidden();

        Sanctum::actingAs($owner);

        $this->deleteJson(
            "/api/workspaces/{$workspace->id}"
        )
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Workspace deleted successfully.'
            );

        $this->assertSoftDeleted('workspaces', [
            'id' => $workspace->id,
        ]);
    }

    public function test_workspace_slug_remains_unique_after_soft_delete(): void
    {
        $user = User::factory()->create();

        $deletedWorkspace =
            Workspace::query()->create([
                'owner_id' => $user->id,
                'name' => 'Engineering Workspace',
                'slug' => 'engineering-workspace',
                'description' => null,
                'visibility' => 'private',
            ]);

        $deletedWorkspace->delete();

        Sanctum::actingAs($user);

        $this->postJson('/api/workspaces', [
            'name' => 'Engineering Workspace',
            'visibility' => 'private',
        ])
            ->assertCreated()
            ->assertJsonPath(
                'data.slug',
                'engineering-workspace-2'
            );
    }

    private function createWorkspaceFor(
        User $user
    ): Workspace {
        $workspace =
            Workspace::query()->create([
                'owner_id' => $user->id,
                'name' => 'Test Workspace',
                'slug' => 'test-workspace-'.
                    $user->id,
                'description' => null,
                'visibility' => 'private',
            ]);

        $workspace->members()->attach(
            $user->id,
            [
                'role' => 'owner',
            ]
        );

        return $workspace;
    }
}
