<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProjectApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_workspace_member_can_list_projects(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);

        $this->addMember($workspace, $member, 'member');

        Project::factory()->count(2)->create([
            'workspace_id' => $workspace->id,
            'created_by' => $owner->id,
        ]);

        Sanctum::actingAs($member);

        $response = $this->getJson(
            "/api/workspaces/{$workspace->id}/projects"
        );

        $response
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_outsider_cannot_list_projects(): void
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);

        Sanctum::actingAs($outsider);

        $this->getJson(
            "/api/workspaces/{$workspace->id}/projects"
        )->assertForbidden();
    }

    public function test_owner_can_create_project(): void
    {
        $owner = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);

        Sanctum::actingAs($owner);

        $response = $this->postJson(
            "/api/workspaces/{$workspace->id}/projects",
            [
                'name' => 'Website Redesign',
                'description' => 'Redesign the company website.',
                'status' => 'active',
                'start_date' => '2026-07-20',
                'due_date' => '2026-08-20',
            ]
        );

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'Website Redesign')
            ->assertJsonPath('data.slug', 'website-redesign')
            ->assertJsonPath('data.status', 'active')
            ->assertJsonPath('data.workspace_id', $workspace->id)
            ->assertJsonPath('data.created_by', $owner->id);

        $this->assertDatabaseHas('projects', [
            'workspace_id' => $workspace->id,
            'created_by' => $owner->id,
            'name' => 'Website Redesign',
            'slug' => 'website-redesign',
        ]);
    }

    public function test_manager_can_create_project(): void
    {
        $owner = User::factory()->create();
        $manager = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);

        $this->addMember($workspace, $manager, 'manager');

        Sanctum::actingAs($manager);

        $this->postJson(
            "/api/workspaces/{$workspace->id}/projects",
            [
                'name' => 'Mobile Application',
                'status' => 'active',
            ]
        )->assertCreated();
    }

    public function test_regular_member_cannot_create_project(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);

        $this->addMember($workspace, $member, 'member');

        Sanctum::actingAs($member);

        $this->postJson(
            "/api/workspaces/{$workspace->id}/projects",
            [
                'name' => 'Unauthorized Project',
            ]
        )->assertForbidden();
    }

    public function test_project_slug_is_unique_within_workspace(): void
    {
        $owner = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);

        Sanctum::actingAs($owner);

        $firstResponse = $this->postJson(
            "/api/workspaces/{$workspace->id}/projects",
            [
                'name' => 'Client Portal',
            ]
        );

        $secondResponse = $this->postJson(
            "/api/workspaces/{$workspace->id}/projects",
            [
                'name' => 'Client Portal',
            ]
        );

        $firstResponse
            ->assertCreated()
            ->assertJsonPath('data.slug', 'client-portal');

        $secondResponse
            ->assertCreated()
            ->assertJsonPath('data.slug', 'client-portal-2');
    }

    public function test_workspace_member_can_view_project(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);

        $this->addMember($workspace, $member, 'member');

        Sanctum::actingAs($member);

        $this->getJson(
            "/api/workspaces/{$workspace->id}/projects/{$project->id}"
        )
            ->assertOk()
            ->assertJsonPath('data.id', $project->id)
            ->assertJsonPath('data.name', $project->name);
    }

    public function test_project_from_another_workspace_returns_not_found(): void
    {
        $owner = User::factory()->create();
        $firstWorkspace = $this->createWorkspaceFor($owner);
        $secondWorkspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor(
            $secondWorkspace,
            $owner
        );

        Sanctum::actingAs($owner);

        $this->getJson(
            "/api/workspaces/{$firstWorkspace->id}/projects/{$project->id}"
        )->assertNotFound();
    }

    public function test_manager_can_update_project(): void
    {
        $owner = User::factory()->create();
        $manager = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);

        $this->addMember($workspace, $manager, 'manager');

        Sanctum::actingAs($manager);

        $response = $this->patchJson(
            "/api/workspaces/{$workspace->id}/projects/{$project->id}",
            [
                'name' => 'Updated Project',
                'status' => 'completed',
            ]
        );

        $response
            ->assertOk()
            ->assertJsonPath('data.name', 'Updated Project')
            ->assertJsonPath('data.slug', 'updated-project')
            ->assertJsonPath('data.status', 'completed');
    }

    public function test_regular_member_cannot_update_project(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);

        $this->addMember($workspace, $member, 'member');

        Sanctum::actingAs($member);

        $this->patchJson(
            "/api/workspaces/{$workspace->id}/projects/{$project->id}",
            [
                'name' => 'Unauthorized Update',
            ]
        )->assertForbidden();
    }

    public function test_manager_can_delete_project(): void
    {
        $owner = User::factory()->create();
        $manager = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);

        $this->addMember($workspace, $manager, 'manager');

        Sanctum::actingAs($manager);

        $this->deleteJson(
            "/api/workspaces/{$workspace->id}/projects/{$project->id}"
        )->assertOk();

        $this->assertSoftDeleted('projects', [
            'id' => $project->id,
        ]);
    }

    public function test_due_date_cannot_be_before_start_date(): void
    {
        $owner = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);

        Sanctum::actingAs($owner);

        $this->postJson(
            "/api/workspaces/{$workspace->id}/projects",
            [
                'name' => 'Invalid Timeline',
                'start_date' => '2026-08-20',
                'due_date' => '2026-07-20',
            ]
        )
            ->assertUnprocessable()
            ->assertJsonValidationErrors('due_date');
    }

    private function createWorkspaceFor(User $owner): Workspace
    {
        $workspace = Workspace::factory()->create([
            'owner_id' => $owner->id,
        ]);

        $workspace->members()->attach($owner->id, [
            'role' => 'owner',
        ]);

        return $workspace;
    }

    private function addMember(
        Workspace $workspace,
        User $user,
        string $role
    ): void {
        $workspace->members()->attach($user->id, [
            'role' => $role,
        ]);
    }

    private function createProjectFor(
        Workspace $workspace,
        User $creator
    ): Project {
        return Project::factory()->create([
            'workspace_id' => $workspace->id,
            'created_by' => $creator->id,
        ]);
    }
}