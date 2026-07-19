<?php

namespace Tests\Feature;

use App\Models\Board;
use App\Models\Project;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BoardApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_workspace_member_can_list_project_boards(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);

        $this->addMember($workspace, $member, 'member');

        Board::factory()->count(2)->create([
            'project_id' => $project->id,
            'created_by' => $owner->id,
        ]);

        Sanctum::actingAs($member);

        $response = $this->getJson(
            $this->boardsUrl($workspace, $project)
        );

        $response
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_boards_are_returned_in_position_order(): void
    {
        $owner = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);

        Board::factory()->create([
            'project_id' => $project->id,
            'created_by' => $owner->id,
            'name' => 'Second Board',
            'position' => 2,
        ]);

        Board::factory()->create([
            'project_id' => $project->id,
            'created_by' => $owner->id,
            'name' => 'First Board',
            'position' => 1,
        ]);

        Sanctum::actingAs($owner);

        $this->getJson(
            $this->boardsUrl($workspace, $project)
        )
            ->assertOk()
            ->assertJsonPath('data.0.name', 'First Board')
            ->assertJsonPath('data.1.name', 'Second Board');
    }

    public function test_outsider_cannot_list_project_boards(): void
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);

        Sanctum::actingAs($outsider);

        $this->getJson(
            $this->boardsUrl($workspace, $project)
        )->assertForbidden();
    }

    public function test_owner_can_create_board(): void
    {
        $owner = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);

        Sanctum::actingAs($owner);

        $response = $this->postJson(
            $this->boardsUrl($workspace, $project),
            [
                'name' => 'Development Board',
                'description' => 'Main software delivery board.',
                'visibility' => 'workspace',
            ]
        );

        $response
            ->assertCreated()
            ->assertJsonPath(
                'data.name',
                'Development Board'
            )
            ->assertJsonPath(
                'data.slug',
                'development-board'
            )
            ->assertJsonPath(
                'data.visibility',
                'workspace'
            )
            ->assertJsonPath(
                'data.position',
                1
            )
            ->assertJsonPath(
                'data.project_id',
                $project->id
            )
            ->assertJsonPath(
                'data.created_by',
                $owner->id
            );

        $this->assertDatabaseHas('boards', [
            'project_id' => $project->id,
            'created_by' => $owner->id,
            'name' => 'Development Board',
            'slug' => 'development-board',
            'visibility' => 'workspace',
            'position' => 1,
        ]);
    }

    public function test_manager_can_create_board(): void
    {
        $owner = User::factory()->create();
        $manager = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);

        $this->addMember($workspace, $manager, 'manager');

        Sanctum::actingAs($manager);

        $this->postJson(
            $this->boardsUrl($workspace, $project),
            [
                'name' => 'Manager Board',
                'visibility' => 'workspace',
            ]
        )->assertCreated();
    }

    public function test_regular_member_cannot_create_board(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);

        $this->addMember($workspace, $member, 'member');

        Sanctum::actingAs($member);

        $this->postJson(
            $this->boardsUrl($workspace, $project),
            [
                'name' => 'Unauthorized Board',
                'visibility' => 'workspace',
            ]
        )->assertForbidden();
    }

    public function test_board_slug_is_unique_within_project(): void
    {
        $owner = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);

        Sanctum::actingAs($owner);

        $firstResponse = $this->postJson(
            $this->boardsUrl($workspace, $project),
            [
                'name' => 'Product Board',
                'visibility' => 'workspace',
            ]
        );

        $secondResponse = $this->postJson(
            $this->boardsUrl($workspace, $project),
            [
                'name' => 'Product Board',
                'visibility' => 'workspace',
            ]
        );

        $firstResponse
            ->assertCreated()
            ->assertJsonPath(
                'data.slug',
                'product-board'
            );

        $secondResponse
            ->assertCreated()
            ->assertJsonPath(
                'data.slug',
                'product-board-2'
            );
    }

    public function test_new_board_position_follows_existing_boards(): void
    {
        $owner = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);

        Board::factory()->create([
            'project_id' => $project->id,
            'created_by' => $owner->id,
            'position' => 4,
        ]);

        Sanctum::actingAs($owner);

        $this->postJson(
            $this->boardsUrl($workspace, $project),
            [
                'name' => 'Next Board',
                'visibility' => 'workspace',
            ]
        )
            ->assertCreated()
            ->assertJsonPath('data.position', 5);
    }

    public function test_workspace_member_can_view_board(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);
        $board = $this->createBoardFor($project, $owner);

        $this->addMember($workspace, $member, 'member');

        Sanctum::actingAs($member);

        $this->getJson(
            $this->boardUrl($workspace, $project, $board)
        )
            ->assertOk()
            ->assertJsonPath('data.id', $board->id)
            ->assertJsonPath('data.name', $board->name);
    }

    public function test_board_from_another_project_returns_not_found(): void
    {
        $owner = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);

        $firstProject = $this->createProjectFor(
            $workspace,
            $owner
        );

        $secondProject = $this->createProjectFor(
            $workspace,
            $owner
        );

        $board = $this->createBoardFor(
            $secondProject,
            $owner
        );

        Sanctum::actingAs($owner);

        $this->getJson(
            $this->boardUrl(
                $workspace,
                $firstProject,
                $board
            )
        )->assertNotFound();
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
            $this->boardsUrl($firstWorkspace, $project)
        )->assertNotFound();
    }

    public function test_manager_can_update_board(): void
    {
        $owner = User::factory()->create();
        $manager = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);
        $board = $this->createBoardFor($project, $owner);

        $this->addMember($workspace, $manager, 'manager');

        Sanctum::actingAs($manager);

        $response = $this->patchJson(
            $this->boardUrl($workspace, $project, $board),
            [
                'name' => 'Updated Board',
                'visibility' => 'private',
                'position' => 3,
            ]
        );

        $response
            ->assertOk()
            ->assertJsonPath(
                'data.name',
                'Updated Board'
            )
            ->assertJsonPath(
                'data.slug',
                'updated-board'
            )
            ->assertJsonPath(
                'data.visibility',
                'private'
            )
            ->assertJsonPath(
                'data.position',
                3
            );
    }

    public function test_regular_member_cannot_update_board(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);
        $board = $this->createBoardFor($project, $owner);

        $this->addMember($workspace, $member, 'member');

        Sanctum::actingAs($member);

        $this->patchJson(
            $this->boardUrl($workspace, $project, $board),
            [
                'name' => 'Unauthorized Update',
            ]
        )->assertForbidden();
    }

    public function test_manager_can_delete_board(): void
    {
        $owner = User::factory()->create();
        $manager = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);
        $board = $this->createBoardFor($project, $owner);

        $this->addMember($workspace, $manager, 'manager');

        Sanctum::actingAs($manager);

        $this->deleteJson(
            $this->boardUrl($workspace, $project, $board)
        )->assertOk();

        $this->assertSoftDeleted('boards', [
            'id' => $board->id,
        ]);
    }

    public function test_board_visibility_must_be_valid(): void
    {
        $owner = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);

        Sanctum::actingAs($owner);

        $this->postJson(
            $this->boardsUrl($workspace, $project),
            [
                'name' => 'Invalid Board',
                'visibility' => 'public',
            ]
        )
            ->assertUnprocessable()
            ->assertJsonValidationErrors('visibility');
    }

    private function createWorkspaceFor(
        User $owner
    ): Workspace {
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

    private function createBoardFor(
        Project $project,
        User $creator
    ): Board {
        return Board::factory()->create([
            'project_id' => $project->id,
            'created_by' => $creator->id,
        ]);
    }

    private function boardsUrl(
        Workspace $workspace,
        Project $project
    ): string {
        return "/api/workspaces/{$workspace->id}"
            . "/projects/{$project->id}/boards";
    }

    private function boardUrl(
        Workspace $workspace,
        Project $project,
        Board $board
    ): string {
        return $this->boardsUrl($workspace, $project)
            . "/{$board->id}";
    }
}