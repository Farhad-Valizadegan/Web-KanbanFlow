<?php

namespace Tests\Feature;

use App\Models\Board;
use App\Models\Column;
use App\Models\Project;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ColumnApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_workspace_member_can_list_columns(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor(
            $workspace,
            $owner
        );
        $board = $this->createBoardFor(
            $project,
            $owner
        );

        $this->addMember(
            $workspace,
            $member,
            'member'
        );

        Column::factory()->count(2)->create([
            'board_id' => $board->id,
        ]);

        Sanctum::actingAs($member);

        $this->getJson(
            $this->columnsUrl(
                $workspace,
                $project,
                $board
            )
        )
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_columns_are_returned_in_position_order(): void
    {
        $owner = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor(
            $workspace,
            $owner
        );
        $board = $this->createBoardFor(
            $project,
            $owner
        );

        Column::factory()->create([
            'board_id' => $board->id,
            'name' => 'Done',
            'position' => 2,
        ]);

        Column::factory()->create([
            'board_id' => $board->id,
            'name' => 'To Do',
            'position' => 1,
        ]);

        Sanctum::actingAs($owner);

        $this->getJson(
            $this->columnsUrl(
                $workspace,
                $project,
                $board
            )
        )
            ->assertOk()
            ->assertJsonPath(
                'data.0.name',
                'To Do'
            )
            ->assertJsonPath(
                'data.1.name',
                'Done'
            );
    }

    public function test_outsider_cannot_list_columns(): void
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor(
            $workspace,
            $owner
        );
        $board = $this->createBoardFor(
            $project,
            $owner
        );

        Sanctum::actingAs($outsider);

        $this->getJson(
            $this->columnsUrl(
                $workspace,
                $project,
                $board
            )
        )->assertForbidden();
    }

    public function test_owner_can_create_column(): void
    {
        $owner = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor(
            $workspace,
            $owner
        );
        $board = $this->createBoardFor(
            $project,
            $owner
        );

        Sanctum::actingAs($owner);

        $response = $this->postJson(
            $this->columnsUrl(
                $workspace,
                $project,
                $board
            ),
            [
                'name' => 'In Progress',
                'wip_limit' => 5,
            ]
        );

        $response
            ->assertCreated()
            ->assertJsonPath(
                'data.name',
                'In Progress'
            )
            ->assertJsonPath(
                'data.position',
                1
            )
            ->assertJsonPath(
                'data.wip_limit',
                5
            )
            ->assertJsonPath(
                'data.board_id',
                $board->id
            );

        $this->assertDatabaseHas('columns', [
            'board_id' => $board->id,
            'name' => 'In Progress',
            'position' => 1,
            'wip_limit' => 5,
        ]);
    }

    public function test_manager_can_create_column(): void
    {
        $owner = User::factory()->create();
        $manager = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor(
            $workspace,
            $owner
        );
        $board = $this->createBoardFor(
            $project,
            $owner
        );

        $this->addMember(
            $workspace,
            $manager,
            'manager'
        );

        Sanctum::actingAs($manager);

        $this->postJson(
            $this->columnsUrl(
                $workspace,
                $project,
                $board
            ),
            [
                'name' => 'Review',
                'wip_limit' => 3,
            ]
        )->assertCreated();
    }

    public function test_regular_member_cannot_create_column(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor(
            $workspace,
            $owner
        );
        $board = $this->createBoardFor(
            $project,
            $owner
        );

        $this->addMember(
            $workspace,
            $member,
            'member'
        );

        Sanctum::actingAs($member);

        $this->postJson(
            $this->columnsUrl(
                $workspace,
                $project,
                $board
            ),
            [
                'name' => 'Unauthorized Column',
            ]
        )->assertForbidden();
    }

    public function test_new_column_position_follows_existing_columns(): void
    {
        $owner = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor(
            $workspace,
            $owner
        );
        $board = $this->createBoardFor(
            $project,
            $owner
        );

        Column::factory()->create([
            'board_id' => $board->id,
            'position' => 4,
        ]);

        Sanctum::actingAs($owner);

        $this->postJson(
            $this->columnsUrl(
                $workspace,
                $project,
                $board
            ),
            [
                'name' => 'Next Column',
            ]
        )
            ->assertCreated()
            ->assertJsonPath(
                'data.position',
                5
            );
    }

    public function test_workspace_member_can_view_column(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor(
            $workspace,
            $owner
        );
        $board = $this->createBoardFor(
            $project,
            $owner
        );
        $column = $this->createColumnFor(
            $board
        );

        $this->addMember(
            $workspace,
            $member,
            'member'
        );

        Sanctum::actingAs($member);

        $this->getJson(
            $this->columnUrl(
                $workspace,
                $project,
                $board,
                $column
            )
        )
            ->assertOk()
            ->assertJsonPath(
                'data.id',
                $column->id
            )
            ->assertJsonPath(
                'data.name',
                $column->name
            );
    }

    public function test_column_from_another_board_returns_not_found(): void
    {
        $owner = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor(
            $workspace,
            $owner
        );

        $firstBoard = $this->createBoardFor(
            $project,
            $owner
        );

        $secondBoard = $this->createBoardFor(
            $project,
            $owner
        );

        $column = $this->createColumnFor(
            $secondBoard
        );

        Sanctum::actingAs($owner);

        $this->getJson(
            $this->columnUrl(
                $workspace,
                $project,
                $firstBoard,
                $column
            )
        )->assertNotFound();
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
            $this->columnsUrl(
                $workspace,
                $firstProject,
                $board
            )
        )->assertNotFound();
    }

    public function test_project_from_another_workspace_returns_not_found(): void
    {
        $owner = User::factory()->create();

        $firstWorkspace =
            $this->createWorkspaceFor($owner);

        $secondWorkspace =
            $this->createWorkspaceFor($owner);

        $project = $this->createProjectFor(
            $secondWorkspace,
            $owner
        );

        $board = $this->createBoardFor(
            $project,
            $owner
        );

        Sanctum::actingAs($owner);

        $this->getJson(
            $this->columnsUrl(
                $firstWorkspace,
                $project,
                $board
            )
        )->assertNotFound();
    }

    public function test_manager_can_update_column(): void
    {
        $owner = User::factory()->create();
        $manager = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor(
            $workspace,
            $owner
        );
        $board = $this->createBoardFor(
            $project,
            $owner
        );
        $column = $this->createColumnFor(
            $board
        );

        $originalPosition = $column->position;

        $this->addMember(
            $workspace,
            $manager,
            'manager'
        );

        Sanctum::actingAs($manager);

        $response = $this->patchJson(
            $this->columnUrl(
                $workspace,
                $project,
                $board,
                $column
            ),
            [
                'name' => 'Updated Column',
                'wip_limit' => 8,
            ]
        );

        $response
            ->assertOk()
            ->assertJsonPath(
                'data.name',
                'Updated Column'
            )
            ->assertJsonPath(
                'data.position',
                $originalPosition
            )
            ->assertJsonPath(
                'data.wip_limit',
                8
            );

        $this->assertDatabaseHas('columns', [
            'id' => $column->id,
            'name' => 'Updated Column',
            'position' => $originalPosition,
            'wip_limit' => 8,
        ]);
    }

    public function test_column_position_cannot_be_changed_through_standard_update(): void
    {
        $owner = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor(
            $workspace,
            $owner
        );
        $board = $this->createBoardFor(
            $project,
            $owner
        );
        $column = $this->createColumnFor(
            $board
        );

        $originalPosition = $column->position;

        Sanctum::actingAs($owner);

        $this->patchJson(
            $this->columnUrl(
                $workspace,
                $project,
                $board,
                $column
            ),
            [
                'position' => 5,
            ]
        )
            ->assertUnprocessable()
            ->assertJsonValidationErrors(
                'position'
            );

        $this->assertDatabaseHas('columns', [
            'id' => $column->id,
            'position' => $originalPosition,
        ]);
    }

    public function test_owner_can_move_column(): void
    {
        $owner = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor(
            $workspace,
            $owner
        );
        $board = $this->createBoardFor(
            $project,
            $owner
        );

        $firstColumn = $this->createColumnFor(
            $board,
            [
                'name' => 'To Do',
                'position' => 1,
            ]
        );

        $secondColumn = $this->createColumnFor(
            $board,
            [
                'name' => 'In Progress',
                'position' => 2,
            ]
        );

        $thirdColumn = $this->createColumnFor(
            $board,
            [
                'name' => 'Done',
                'position' => 3,
            ]
        );

        Sanctum::actingAs($owner);

        $this->patchJson(
            $this->columnMoveUrl(
                $workspace,
                $project,
                $board,
                $thirdColumn
            ),
            [
                'position' => 1,
            ]
        )
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Column moved successfully.'
            )
            ->assertJsonPath(
                'data.id',
                $thirdColumn->id
            )
            ->assertJsonPath(
                'data.position',
                1
            );

        $this->assertDatabaseHas('columns', [
            'id' => $thirdColumn->id,
            'position' => 1,
        ]);

        $this->assertDatabaseHas('columns', [
            'id' => $firstColumn->id,
            'position' => 2,
        ]);

        $this->assertDatabaseHas('columns', [
            'id' => $secondColumn->id,
            'position' => 3,
        ]);
    }

    public function test_manager_can_move_column(): void
    {
        $owner = User::factory()->create();
        $manager = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor(
            $workspace,
            $owner
        );
        $board = $this->createBoardFor(
            $project,
            $owner
        );

        $firstColumn = $this->createColumnFor(
            $board,
            [
                'position' => 1,
            ]
        );

        $secondColumn = $this->createColumnFor(
            $board,
            [
                'position' => 2,
            ]
        );

        $this->addMember(
            $workspace,
            $manager,
            'manager'
        );

        Sanctum::actingAs($manager);

        $this->patchJson(
            $this->columnMoveUrl(
                $workspace,
                $project,
                $board,
                $secondColumn
            ),
            [
                'position' => 1,
            ]
        )
            ->assertOk()
            ->assertJsonPath(
                'data.position',
                1
            );

        $this->assertDatabaseHas('columns', [
            'id' => $secondColumn->id,
            'position' => 1,
        ]);

        $this->assertDatabaseHas('columns', [
            'id' => $firstColumn->id,
            'position' => 2,
        ]);
    }

    public function test_regular_member_cannot_move_column(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor(
            $workspace,
            $owner
        );
        $board = $this->createBoardFor(
            $project,
            $owner
        );
        $column = $this->createColumnFor(
            $board
        );

        $this->addMember(
            $workspace,
            $member,
            'member'
        );

        Sanctum::actingAs($member);

        $this->patchJson(
            $this->columnMoveUrl(
                $workspace,
                $project,
                $board,
                $column
            ),
            [
                'position' => 1,
            ]
        )->assertForbidden();
    }

    public function test_column_move_position_is_clamped_to_valid_range(): void
    {
        $owner = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor(
            $workspace,
            $owner
        );
        $board = $this->createBoardFor(
            $project,
            $owner
        );

        $firstColumn = $this->createColumnFor(
            $board,
            [
                'position' => 1,
            ]
        );

        $secondColumn = $this->createColumnFor(
            $board,
            [
                'position' => 2,
            ]
        );

        Sanctum::actingAs($owner);

        $this->patchJson(
            $this->columnMoveUrl(
                $workspace,
                $project,
                $board,
                $firstColumn
            ),
            [
                'position' => 999,
            ]
        )
            ->assertOk()
            ->assertJsonPath(
                'data.position',
                2
            );

        $this->assertDatabaseHas('columns', [
            'id' => $secondColumn->id,
            'position' => 1,
        ]);

        $this->assertDatabaseHas('columns', [
            'id' => $firstColumn->id,
            'position' => 2,
        ]);
    }

    public function test_column_move_position_must_be_at_least_one(): void
    {
        $owner = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor(
            $workspace,
            $owner
        );
        $board = $this->createBoardFor(
            $project,
            $owner
        );
        $column = $this->createColumnFor(
            $board
        );

        Sanctum::actingAs($owner);

        $this->patchJson(
            $this->columnMoveUrl(
                $workspace,
                $project,
                $board,
                $column
            ),
            [
                'position' => 0,
            ]
        )
            ->assertUnprocessable()
            ->assertJsonValidationErrors(
                'position'
            );
    }

    public function test_column_from_another_board_cannot_be_moved(): void
    {
        $owner = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor(
            $workspace,
            $owner
        );

        $firstBoard = $this->createBoardFor(
            $project,
            $owner
        );

        $secondBoard = $this->createBoardFor(
            $project,
            $owner
        );

        $column = $this->createColumnFor(
            $secondBoard
        );

        Sanctum::actingAs($owner);

        $this->patchJson(
            $this->columnMoveUrl(
                $workspace,
                $project,
                $firstBoard,
                $column
            ),
            [
                'position' => 1,
            ]
        )->assertNotFound();
    }

    public function test_regular_member_cannot_update_column(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor(
            $workspace,
            $owner
        );
        $board = $this->createBoardFor(
            $project,
            $owner
        );
        $column = $this->createColumnFor(
            $board
        );

        $this->addMember(
            $workspace,
            $member,
            'member'
        );

        Sanctum::actingAs($member);

        $this->patchJson(
            $this->columnUrl(
                $workspace,
                $project,
                $board,
                $column
            ),
            [
                'name' => 'Unauthorized Update',
            ]
        )->assertForbidden();
    }

    public function test_manager_can_delete_column(): void
    {
        $owner = User::factory()->create();
        $manager = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor(
            $workspace,
            $owner
        );
        $board = $this->createBoardFor(
            $project,
            $owner
        );
        $column = $this->createColumnFor(
            $board
        );

        $this->addMember(
            $workspace,
            $manager,
            'manager'
        );

        Sanctum::actingAs($manager);

        $this->deleteJson(
            $this->columnUrl(
                $workspace,
                $project,
                $board,
                $column
            )
        )->assertOk();

        $this->assertSoftDeleted('columns', [
            'id' => $column->id,
        ]);
    }

    public function test_wip_limit_must_be_at_least_one(): void
    {
        $owner = User::factory()->create();
        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor(
            $workspace,
            $owner
        );
        $board = $this->createBoardFor(
            $project,
            $owner
        );

        Sanctum::actingAs($owner);

        $this->postJson(
            $this->columnsUrl(
                $workspace,
                $project,
                $board
            ),
            [
                'name' => 'Invalid WIP Column',
                'wip_limit' => 0,
            ]
        )
            ->assertUnprocessable()
            ->assertJsonValidationErrors(
                'wip_limit'
            );
    }

    private function createWorkspaceFor(
        User $owner
    ): Workspace {
        $workspace = Workspace::factory()->create([
            'owner_id' => $owner->id,
        ]);

        $workspace->members()->attach(
            $owner->id,
            [
                'role' => 'owner',
            ]
        );

        return $workspace;
    }

    private function addMember(
        Workspace $workspace,
        User $user,
        string $role
    ): void {
        $workspace->members()->attach(
            $user->id,
            [
                'role' => $role,
            ]
        );
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

    private function createColumnFor(
        Board $board,
        array $attributes = []
    ): Column {
        return Column::factory()->create(
            array_merge(
                [
                    'board_id' => $board->id,
                ],
                $attributes
            )
        );
    }

    private function columnsUrl(
        Workspace $workspace,
        Project $project,
        Board $board
    ): string {
        return "/api/workspaces/{$workspace->id}"
            . "/projects/{$project->id}"
            . "/boards/{$board->id}/columns";
    }

    private function columnUrl(
        Workspace $workspace,
        Project $project,
        Board $board,
        Column $column
    ): string {
        return $this->columnsUrl(
            $workspace,
            $project,
            $board
        ) . "/{$column->id}";
    }

    private function columnMoveUrl(
        Workspace $workspace,
        Project $project,
        Board $board,
        Column $column
    ): string {
        return $this->columnUrl(
            $workspace,
            $project,
            $board,
            $column
        ) . '/move';
    }
}