<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WorkspaceMemberApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_workspace_member_can_list_members(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);

        $workspace->members()->attach($member->id, [
            'role' => 'member',
        ]);

        Sanctum::actingAs($member);

        $this->getJson("/api/workspaces/{$workspace->id}/members")
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_outsider_cannot_list_workspace_members(): void
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);

        Sanctum::actingAs($outsider);

        $this->getJson("/api/workspaces/{$workspace->id}/members")
            ->assertForbidden();
    }

    public function test_owner_can_add_a_member(): void
    {
        $owner = User::factory()->create();
        $newMember = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);

        Sanctum::actingAs($owner);

        $this->postJson(
            "/api/workspaces/{$workspace->id}/members",
            [
                'email' => $newMember->email,
                'role' => 'member',
            ]
        )
            ->assertCreated()
            ->assertJsonPath(
                'message',
                'Workspace member added successfully.'
            )
            ->assertJsonPath('data.id', $newMember->id)
            ->assertJsonPath('data.role', 'member');

        $this->assertDatabaseHas('workspace_user', [
            'workspace_id' => $workspace->id,
            'user_id' => $newMember->id,
            'role' => 'member',
        ]);
    }

    public function test_manager_cannot_add_a_member(): void
    {
        $owner = User::factory()->create();
        $manager = User::factory()->create();
        $newMember = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);

        $workspace->members()->attach($manager->id, [
            'role' => 'manager',
        ]);

        Sanctum::actingAs($manager);

        $this->postJson(
            "/api/workspaces/{$workspace->id}/members",
            [
                'email' => $newMember->email,
                'role' => 'viewer',
            ]
        )->assertForbidden();

        $this->assertDatabaseMissing('workspace_user', [
            'workspace_id' => $workspace->id,
            'user_id' => $newMember->id,
            'role' => 'viewer',
        ]);
    }

    public function test_regular_member_cannot_add_a_member(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $newMember = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);

        $workspace->members()->attach($member->id, [
            'role' => 'member',
        ]);

        Sanctum::actingAs($member);

        $this->postJson(
            "/api/workspaces/{$workspace->id}/members",
            [
                'email' => $newMember->email,
                'role' => 'member',
            ]
        )->assertForbidden();
    }

    public function test_duplicate_member_cannot_be_added(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);

        $workspace->members()->attach($member->id, [
            'role' => 'member',
        ]);

        Sanctum::actingAs($owner);

        $this->postJson(
            "/api/workspaces/{$workspace->id}/members",
            [
                'email' => $member->email,
                'role' => 'viewer',
            ]
        )
            ->assertUnprocessable()
            ->assertJsonPath(
                'message',
                'User is already a workspace member.'
            );
    }

    public function test_owner_can_change_a_member_role(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);

        $workspace->members()->attach($member->id, [
            'role' => 'member',
        ]);

        Sanctum::actingAs($owner);

        $this->patchJson(
            "/api/workspaces/{$workspace->id}/members/{$member->id}",
            [
                'role' => 'manager',
            ]
        )
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Workspace member role updated successfully.'
            );

        $this->assertDatabaseHas('workspace_user', [
            'workspace_id' => $workspace->id,
            'user_id' => $member->id,
            'role' => 'manager',
        ]);
    }

    public function test_manager_cannot_change_a_member_role(): void
    {
        $owner = User::factory()->create();
        $manager = User::factory()->create();
        $member = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);

        $workspace->members()->attach($manager->id, [
            'role' => 'manager',
        ]);

        $workspace->members()->attach($member->id, [
            'role' => 'member',
        ]);

        Sanctum::actingAs($manager);

        $this->patchJson(
            "/api/workspaces/{$workspace->id}/members/{$member->id}",
            [
                'role' => 'viewer',
            ]
        )->assertForbidden();
    }

    public function test_owner_role_cannot_be_changed(): void
    {
        $owner = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);

        Sanctum::actingAs($owner);

        $this->patchJson(
            "/api/workspaces/{$workspace->id}/members/{$owner->id}",
            [
                'role' => 'manager',
            ]
        )
            ->assertUnprocessable()
            ->assertJsonPath(
                'message',
                'The workspace owner role cannot be changed.'
            );
    }

    public function test_owner_can_remove_a_member(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);

        $workspace->members()->attach($member->id, [
            'role' => 'member',
        ]);

        Sanctum::actingAs($owner);

        $this->deleteJson(
            "/api/workspaces/{$workspace->id}/members/{$member->id}"
        )
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Workspace member removed successfully.'
            );

        $this->assertDatabaseMissing('workspace_user', [
            'workspace_id' => $workspace->id,
            'user_id' => $member->id,
        ]);
    }

    public function test_manager_cannot_remove_a_member(): void
    {
        $owner = User::factory()->create();
        $manager = User::factory()->create();
        $member = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);

        $workspace->members()->attach($manager->id, [
            'role' => 'manager',
        ]);

        $workspace->members()->attach($member->id, [
            'role' => 'member',
        ]);

        Sanctum::actingAs($manager);

        $this->deleteJson(
            "/api/workspaces/{$workspace->id}/members/{$member->id}"
        )->assertForbidden();

        $this->assertDatabaseHas('workspace_user', [
            'workspace_id' => $workspace->id,
            'user_id' => $member->id,
        ]);
    }

    public function test_non_member_removal_returns_not_found(): void
    {
        $owner = User::factory()->create();
        $nonMember = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);

        Sanctum::actingAs($owner);

        $this->deleteJson(
            "/api/workspaces/{$workspace->id}/members/{$nonMember->id}"
        )
            ->assertNotFound()
            ->assertJsonPath(
                'message',
                'User is not a member of this workspace.'
            );
    }

    public function test_workspace_owner_cannot_be_removed(): void
    {
        $owner = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);

        Sanctum::actingAs($owner);

        $this->deleteJson(
            "/api/workspaces/{$workspace->id}/members/{$owner->id}"
        )
            ->assertUnprocessable()
            ->assertJsonPath(
                'message',
                'The workspace owner cannot be removed.'
            );
    }

    public function test_manager_cannot_remove_and_readd_member_with_another_role(): void
    {
        $owner = User::factory()->create();
        $manager = User::factory()->create();
        $member = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $workspace->members()->attach($manager->id, ['role' => 'manager']);
        $workspace->members()->attach($member->id, ['role' => 'viewer']);
        Sanctum::actingAs($manager);
        $this->deleteJson("/api/workspaces/{$workspace->id}/members/{$member->id}")->assertForbidden();
        $this->postJson("/api/workspaces/{$workspace->id}/members", [
            'email' => $member->email,
            'role' => 'manager',
        ])->assertForbidden();
        $this->assertDatabaseHas('workspace_user', [
            'workspace_id' => $workspace->id,
            'user_id' => $member->id,
            'role' => 'viewer',
        ]);
    }

    private function createWorkspaceFor(User $user): Workspace
    {
        $workspace = Workspace::query()->create([
            'owner_id' => $user->id,
            'name' => 'Test Workspace',
            'slug' => 'test-workspace-'.$user->id,
            'description' => null,
            'visibility' => 'private',
        ]);

        $workspace->members()->attach($user->id, [
            'role' => 'owner',
        ]);

        return $workspace;
    }
}
