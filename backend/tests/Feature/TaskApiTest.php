<?php

namespace Tests\Feature;

use App\Models\Board;
use App\Models\Column;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TaskApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_workspace_member_can_list_tasks(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);
        $board = $this->createBoardFor($project, $owner);
        $column = $this->createColumnFor($board);

        $this->addMember($workspace, $member, 'member');

        Task::factory()->count(2)->create([
            'column_id' => $column->id,
            'created_by' => $owner->id,
        ]);

        Sanctum::actingAs($member);

        $this->getJson(
            $this->tasksUrl(
                $workspace,
                $project,
                $board,
                $column
            )
        )
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_tasks_are_returned_in_position_order(): void
    {
        $owner = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);
        $board = $this->createBoardFor($project, $owner);
        $column = $this->createColumnFor($board);

        Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $owner->id,
            'title' => 'Second Task',
            'position' => 2,
        ]);

        Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $owner->id,
            'title' => 'First Task',
            'position' => 1,
        ]);

        Sanctum::actingAs($owner);

        $this->getJson(
            $this->tasksUrl(
                $workspace,
                $project,
                $board,
                $column
            )
        )
            ->assertOk()
            ->assertJsonPath(
                'data.0.title',
                'First Task'
            )
            ->assertJsonPath(
                'data.1.title',
                'Second Task'
            );
    }

    public function test_outsider_cannot_list_tasks(): void
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);
        $board = $this->createBoardFor($project, $owner);
        $column = $this->createColumnFor($board);

        Sanctum::actingAs($outsider);

        $this->getJson(
            $this->tasksUrl(
                $workspace,
                $project,
                $board,
                $column
            )
        )->assertForbidden();
    }

    public function test_owner_can_create_task(): void
    {
        $owner = User::factory()->create();
        $assignee = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);
        $board = $this->createBoardFor($project, $owner);
        $column = $this->createColumnFor($board);

        $this->addMember($workspace, $assignee, 'member');

        Sanctum::actingAs($owner);

        $response = $this->postJson(
            $this->tasksUrl(
                $workspace,
                $project,
                $board,
                $column
            ),
            [
                'title' => 'Build authentication',
                'description' => 'Implement login and registration.',
                'priority' => 'high',
                'assigned_to' => $assignee->id,
                'due_date' => '2026-08-10',
            ]
        );

        $response
            ->assertCreated()
            ->assertJsonPath(
                'data.title',
                'Build authentication'
            )
            ->assertJsonPath(
                'data.priority',
                'high'
            )
            ->assertJsonPath(
                'data.position',
                1
            )
            ->assertJsonPath(
                'data.column_id',
                $column->id
            )
            ->assertJsonPath(
                'data.created_by',
                $owner->id
            )
            ->assertJsonPath(
                'data.assigned_to',
                $assignee->id
            );

        $this->assertDatabaseHas('tasks', [
            'column_id' => $column->id,
            'created_by' => $owner->id,
            'assigned_to' => $assignee->id,
            'title' => 'Build authentication',
            'priority' => 'high',
            'position' => 1,
        ]);
    }

    public function test_manager_can_create_task(): void
    {
        $owner = User::factory()->create();
        $manager = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);
        $board = $this->createBoardFor($project, $owner);
        $column = $this->createColumnFor($board);

        $this->addMember($workspace, $manager, 'manager');

        Sanctum::actingAs($manager);

        $this->postJson(
            $this->tasksUrl(
                $workspace,
                $project,
                $board,
                $column
            ),
            [
                'title' => 'Manager Task',
                'priority' => 'medium',
            ]
        )->assertCreated();
    }

    public function test_regular_member_cannot_create_task(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);
        $board = $this->createBoardFor($project, $owner);
        $column = $this->createColumnFor($board);

        $this->addMember($workspace, $member, 'member');

        Sanctum::actingAs($member);

        $this->postJson(
            $this->tasksUrl(
                $workspace,
                $project,
                $board,
                $column
            ),
            [
                'title' => 'Unauthorized Task',
                'priority' => 'medium',
            ]
        )->assertForbidden();
    }

    public function test_new_task_position_follows_existing_tasks(): void
    {
        $owner = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);
        $board = $this->createBoardFor($project, $owner);
        $column = $this->createColumnFor($board);

        Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $owner->id,
            'position' => 4,
        ]);

        Sanctum::actingAs($owner);

        $this->postJson(
            $this->tasksUrl(
                $workspace,
                $project,
                $board,
                $column
            ),
            [
                'title' => 'Next Task',
                'priority' => 'medium',
            ]
        )
            ->assertCreated()
            ->assertJsonPath('data.position', 5);
    }

    public function test_workspace_member_can_view_task(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);
        $board = $this->createBoardFor($project, $owner);
        $column = $this->createColumnFor($board);
        $task = $this->createTaskFor($column, $owner);

        $this->addMember($workspace, $member, 'member');

        Sanctum::actingAs($member);

        $this->getJson(
            $this->taskUrl(
                $workspace,
                $project,
                $board,
                $column,
                $task
            )
        )
            ->assertOk()
            ->assertJsonPath('data.id', $task->id)
            ->assertJsonPath('data.title', $task->title);
    }

    public function test_task_from_another_column_returns_not_found(): void
    {
        $owner = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);
        $board = $this->createBoardFor($project, $owner);

        $firstColumn = $this->createColumnFor($board);
        $secondColumn = $this->createColumnFor($board);

        $task = $this->createTaskFor(
            $secondColumn,
            $owner
        );

        Sanctum::actingAs($owner);

        $this->getJson(
            $this->taskUrl(
                $workspace,
                $project,
                $board,
                $firstColumn,
                $task
            )
        )->assertNotFound();
    }

    public function test_column_from_another_board_returns_not_found(): void
    {
        $owner = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);

        $firstBoard = $this->createBoardFor($project, $owner);
        $secondBoard = $this->createBoardFor($project, $owner);

        $column = $this->createColumnFor($secondBoard);

        Sanctum::actingAs($owner);

        $this->getJson(
            $this->tasksUrl(
                $workspace,
                $project,
                $firstBoard,
                $column
            )
        )->assertNotFound();
    }

    public function test_manager_can_update_task(): void
    {
        $owner = User::factory()->create();
        $manager = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);
        $board = $this->createBoardFor($project, $owner);
        $column = $this->createColumnFor($board);
        $task = $this->createTaskFor(
            $column,
            $owner
        );

        $this->addMember(
            $workspace,
            $manager,
            'manager'
        );

        Sanctum::actingAs($manager);

        $response = $this->patchJson(
            $this->taskUrl(
                $workspace,
                $project,
                $board,
                $column,
                $task
            ),
            [
                'title' => 'Updated Task',
                'priority' => 'urgent',
                'completed_at' => '2026-07-19 18:00:00',
            ]
        );

        $response
            ->assertOk()
            ->assertJsonPath(
                'data.title',
                'Updated Task'
            )
            ->assertJsonPath(
                'data.priority',
                'urgent'
            )
            ->assertJsonPath(
                'data.position',
                $task->position
            );

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'title' => 'Updated Task',
            'priority' => 'urgent',
            'position' => $task->position,
        ]);
    }

    public function test_regular_member_cannot_update_task(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);
        $board = $this->createBoardFor($project, $owner);
        $column = $this->createColumnFor($board);
        $task = $this->createTaskFor($column, $owner);

        $this->addMember($workspace, $member, 'member');

        Sanctum::actingAs($member);

        $this->patchJson(
            $this->taskUrl(
                $workspace,
                $project,
                $board,
                $column,
                $task
            ),
            [
                'title' => 'Unauthorized Update',
            ]
        )->assertForbidden();
    }

    public function test_manager_can_delete_task(): void
    {
        $owner = User::factory()->create();
        $manager = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);
        $board = $this->createBoardFor($project, $owner);
        $column = $this->createColumnFor($board);
        $task = $this->createTaskFor($column, $owner);

        $this->addMember($workspace, $manager, 'manager');

        Sanctum::actingAs($manager);

        $this->deleteJson(
            $this->taskUrl(
                $workspace,
                $project,
                $board,
                $column,
                $task
            )
        )->assertOk();

        $this->assertSoftDeleted('tasks', [
            'id' => $task->id,
        ]);
    }

    public function test_task_priority_must_be_valid(): void
    {
        $owner = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);
        $board = $this->createBoardFor($project, $owner);
        $column = $this->createColumnFor($board);

        Sanctum::actingAs($owner);

        $this->postJson(
            $this->tasksUrl(
                $workspace,
                $project,
                $board,
                $column
            ),
            [
                'title' => 'Invalid Priority Task',
                'priority' => 'critical',
            ]
        )
            ->assertUnprocessable()
            ->assertJsonValidationErrors('priority');
    }

    public function test_assignee_must_belong_to_workspace(): void
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);
        $board = $this->createBoardFor($project, $owner);
        $column = $this->createColumnFor($board);

        Sanctum::actingAs($owner);

        $this->postJson(
            $this->tasksUrl(
                $workspace,
                $project,
                $board,
                $column
            ),
            [
                'title' => 'Invalid Assignment',
                'priority' => 'medium',
                'assigned_to' => $outsider->id,
            ]
        )->assertUnprocessable();
    }

    public function test_owner_can_move_task_to_another_column(): void
    {
        $owner = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);
        $board = $this->createBoardFor($project, $owner);

        $sourceColumn = $this->createColumnFor($board);
        $destinationColumn = $this->createColumnFor($board);

        $task = Task::factory()->create([
            'column_id' => $sourceColumn->id,
            'created_by' => $owner->id,
            'position' => 1,
        ]);

        Sanctum::actingAs($owner);

        $this->patchJson(
            $this->moveTaskUrl(
                $workspace,
                $project,
                $board,
                $sourceColumn,
                $task
            ),
            [
                'column_id' => $destinationColumn->id,
                'position' => 1,
            ]
        )
            ->assertOk()
            ->assertJsonPath(
                'data.column_id',
                $destinationColumn->id
            )
            ->assertJsonPath(
                'data.position',
                1
            );

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'column_id' => $destinationColumn->id,
            'position' => 1,
        ]);
    }

    public function test_manager_can_move_task(): void
    {
        $owner = User::factory()->create();
        $manager = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);
        $board = $this->createBoardFor($project, $owner);

        $sourceColumn = $this->createColumnFor($board);
        $destinationColumn = $this->createColumnFor($board);

        $task = $this->createTaskFor(
            $sourceColumn,
            $owner
        );

        $this->addMember(
            $workspace,
            $manager,
            'manager'
        );

        Sanctum::actingAs($manager);

        $this->patchJson(
            $this->moveTaskUrl(
                $workspace,
                $project,
                $board,
                $sourceColumn,
                $task
            ),
            [
                'column_id' => $destinationColumn->id,
                'position' => 1,
            ]
        )->assertOk();
    }

    public function test_regular_member_cannot_move_task(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);
        $board = $this->createBoardFor($project, $owner);

        $sourceColumn = $this->createColumnFor($board);
        $destinationColumn = $this->createColumnFor($board);

        $task = $this->createTaskFor(
            $sourceColumn,
            $owner
        );

        $this->addMember(
            $workspace,
            $member,
            'member'
        );

        Sanctum::actingAs($member);

        $this->patchJson(
            $this->moveTaskUrl(
                $workspace,
                $project,
                $board,
                $sourceColumn,
                $task
            ),
            [
                'column_id' => $destinationColumn->id,
                'position' => 1,
            ]
        )->assertForbidden();
    }

    public function test_task_cannot_move_to_column_on_another_board(): void
    {
        $owner = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);

        $sourceBoard = $this->createBoardFor(
            $project,
            $owner
        );

        $otherBoard = $this->createBoardFor(
            $project,
            $owner
        );

        $sourceColumn = $this->createColumnFor(
            $sourceBoard
        );

        $otherColumn = $this->createColumnFor(
            $otherBoard
        );

        $task = $this->createTaskFor(
            $sourceColumn,
            $owner
        );

        Sanctum::actingAs($owner);

        $this->patchJson(
            $this->moveTaskUrl(
                $workspace,
                $project,
                $sourceBoard,
                $sourceColumn,
                $task
            ),
            [
                'column_id' => $otherColumn->id,
                'position' => 1,
            ]
        )->assertUnprocessable();
    }

    public function test_task_move_respects_destination_wip_limit(): void
    {
        $owner = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);
        $board = $this->createBoardFor($project, $owner);

        $sourceColumn = $this->createColumnFor($board);

        $destinationColumn = Column::factory()->create([
            'board_id' => $board->id,
            'wip_limit' => 1,
        ]);

        Task::factory()->create([
            'column_id' => $destinationColumn->id,
            'created_by' => $owner->id,
            'completed_at' => null,
        ]);

        $task = Task::factory()->create([
            'column_id' => $sourceColumn->id,
            'created_by' => $owner->id,
            'completed_at' => null,
        ]);

        Sanctum::actingAs($owner);

        $this->patchJson(
            $this->moveTaskUrl(
                $workspace,
                $project,
                $board,
                $sourceColumn,
                $task
            ),
            [
                'column_id' => $destinationColumn->id,
                'position' => 1,
            ]
        )
            ->assertUnprocessable()
            ->assertJsonValidationErrors('column_id');

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'column_id' => $sourceColumn->id,
        ]);
    }

    public function test_completed_task_does_not_exceed_wip_limit(): void
    {
        $owner = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);
        $board = $this->createBoardFor($project, $owner);

        $sourceColumn = $this->createColumnFor($board);

        $destinationColumn = Column::factory()->create([
            'board_id' => $board->id,
            'wip_limit' => 1,
        ]);

        Task::factory()->create([
            'column_id' => $destinationColumn->id,
            'created_by' => $owner->id,
            'completed_at' => null,
        ]);

        $task = Task::factory()->create([
            'column_id' => $sourceColumn->id,
            'created_by' => $owner->id,
            'completed_at' => now(),
        ]);

        Sanctum::actingAs($owner);

        $this->patchJson(
            $this->moveTaskUrl(
                $workspace,
                $project,
                $board,
                $sourceColumn,
                $task
            ),
            [
                'column_id' => $destinationColumn->id,
                'position' => 2,
            ]
        )->assertOk();
    }

    public function test_task_can_be_reordered_inside_same_column(): void
    {
        $owner = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);
        $board = $this->createBoardFor($project, $owner);
        $column = $this->createColumnFor($board);

        $firstTask = Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $owner->id,
            'position' => 1,
        ]);

        $secondTask = Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $owner->id,
            'position' => 2,
        ]);

        Sanctum::actingAs($owner);

        $this->patchJson(
            $this->moveTaskUrl(
                $workspace,
                $project,
                $board,
                $column,
                $secondTask
            ),
            [
                'column_id' => $column->id,
                'position' => 1,
            ]
        )->assertOk();

        $this->assertDatabaseHas('tasks', [
            'id' => $secondTask->id,
            'position' => 1,
        ]);

        $this->assertDatabaseHas('tasks', [
            'id' => $firstTask->id,
            'position' => 2,
        ]);
    }

    public function test_active_task_cannot_be_created_when_column_wip_limit_is_reached(): void
    {
        $owner = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);
        $board = $this->createBoardFor($project, $owner);

        $column = Column::factory()->create([
            'board_id' => $board->id,
            'wip_limit' => 1,
        ]);

        Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $owner->id,
            'completed_at' => null,
        ]);

        Sanctum::actingAs($owner);

        $this->postJson(
            $this->tasksUrl(
                $workspace,
                $project,
                $board,
                $column
            ),
            [
                'title' => 'Blocked active task',
                'priority' => 'medium',
            ]
        )
            ->assertUnprocessable()
            ->assertJsonValidationErrors('column_id');

        $this->assertDatabaseMissing('tasks', [
            'column_id' => $column->id,
            'title' => 'Blocked active task',
        ]);
    }

    public function test_completed_task_can_be_created_when_column_wip_limit_is_reached(): void
    {
        $owner = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);
        $board = $this->createBoardFor($project, $owner);

        $column = Column::factory()->create([
            'board_id' => $board->id,
            'wip_limit' => 1,
        ]);

        Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $owner->id,
            'completed_at' => null,
        ]);

        Sanctum::actingAs($owner);

        $this->postJson(
            $this->tasksUrl(
                $workspace,
                $project,
                $board,
                $column
            ),
            [
                'title' => 'Completed task',
                'priority' => 'medium',
                'completed_at' => now()->toDateTimeString(),
            ]
        )->assertCreated();
    }

    public function test_completed_task_cannot_be_reopened_when_column_wip_limit_is_reached(): void
    {
        $owner = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);
        $board = $this->createBoardFor($project, $owner);

        $column = Column::factory()->create([
            'board_id' => $board->id,
            'wip_limit' => 1,
        ]);

        Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $owner->id,
            'completed_at' => null,
        ]);

        $completedTask = Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $owner->id,
            'completed_at' => now(),
        ]);

        Sanctum::actingAs($owner);

        $this->patchJson(
            $this->taskUrl(
                $workspace,
                $project,
                $board,
                $column,
                $completedTask
            ),
            [
                'completed_at' => null,
            ]
        )
            ->assertUnprocessable()
            ->assertJsonValidationErrors('column_id');

        $this->assertDatabaseMissing('tasks', [
            'id' => $completedTask->id,
            'completed_at' => null,
        ]);
    }

    public function test_task_position_cannot_be_changed_through_standard_update(): void
    {
        $owner = User::factory()->create();

        $workspace = $this->createWorkspaceFor($owner);
        $project = $this->createProjectFor($workspace, $owner);
        $board = $this->createBoardFor($project, $owner);
        $column = $this->createColumnFor($board);

        $task = Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $owner->id,
            'position' => 1,
        ]);

        Sanctum::actingAs($owner);

        $this->patchJson(
            $this->taskUrl(
                $workspace,
                $project,
                $board,
                $column,
                $task
            ),
            [
                'position' => 4,
            ]
        )
            ->assertUnprocessable()
            ->assertJsonValidationErrors('position');

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'position' => 1,
        ]);
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

    private function createColumnFor(
        Board $board
    ): Column {
        return Column::factory()->create([
            'board_id' => $board->id,
        ]);
    }

    private function createTaskFor(
        Column $column,
        User $creator
    ): Task {
        return Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $creator->id,
        ]);
    }

    private function tasksUrl(
        Workspace $workspace,
        Project $project,
        Board $board,
        Column $column
    ): string {
        return "/api/workspaces/{$workspace->id}"
            ."/projects/{$project->id}"
            ."/boards/{$board->id}"
            ."/columns/{$column->id}/tasks";
    }

    private function taskUrl(
        Workspace $workspace,
        Project $project,
        Board $board,
        Column $column,
        Task $task
    ): string {
        return $this->tasksUrl(
            $workspace,
            $project,
            $board,
            $column
        )."/{$task->id}";
    }

    private function moveTaskUrl(
        Workspace $workspace,
        Project $project,
        Board $board,
        Column $column,
        Task $task
    ): string {
        return $this->taskUrl(
            $workspace,
            $project,
            $board,
            $column,
            $task
        ).'/move';
    }
}
