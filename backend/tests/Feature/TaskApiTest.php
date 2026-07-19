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
        $task = $this->createTaskFor($column, $owner);

        $this->addMember($workspace, $manager, 'manager');

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
                'position' => 3,
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
                3
            );
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
            . "/projects/{$project->id}"
            . "/boards/{$board->id}"
            . "/columns/{$column->id}/tasks";
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
        ) . "/{$task->id}";
    }
}