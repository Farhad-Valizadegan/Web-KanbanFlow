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

class WorkspaceAnalyticsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_workspace_member_can_view_analytics(): void
    {
        [
            $user,
            $workspace,
            $project,
            $board,
            $column,
        ] = $this->createTaskHierarchy();

        Project::factory()->create([
            'workspace_id' => $workspace->id,
            'created_by' => $user->id,
            'status' => 'completed',
        ]);

        Project::factory()->create([
            'workspace_id' => $workspace->id,
            'created_by' => $user->id,
            'status' => 'archived',
        ]);

        Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $user->id,
            'assigned_to' => $user->id,
            'title' => 'Open low priority task',
            'priority' => 'low',
            'position' => 1,
            'due_date' => now()->addDays(5),
            'completed_at' => null,
        ]);

        Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $user->id,
            'title' => 'Completed medium task',
            'priority' => 'medium',
            'position' => 2,
            'due_date' => now()->subDay(),
            'completed_at' => now(),
        ]);

        Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $user->id,
            'title' => 'Overdue high priority task',
            'priority' => 'high',
            'position' => 3,
            'due_date' => now()->subDays(2),
            'completed_at' => null,
        ]);

        Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $user->id,
            'title' => 'Urgent task due today',
            'priority' => 'urgent',
            'position' => 4,
            'due_date' => now(),
            'completed_at' => null,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson(
            "/api/workspaces/{$workspace->id}/analytics"
        );

        $response
            ->assertOk()
            ->assertJsonPath(
                'data.summary.members',
                1
            )
            ->assertJsonPath(
                'data.summary.projects',
                3
            )
            ->assertJsonPath(
                'data.summary.boards',
                1
            )
            ->assertJsonPath(
                'data.summary.tasks',
                4
            )
            ->assertJsonPath(
                'data.summary.open_tasks',
                3
            )
            ->assertJsonPath(
                'data.summary.completed_tasks',
                1
            )
            ->assertJsonPath(
                'data.summary.overdue_tasks',
                1
            )
            ->assertJsonPath(
                'data.summary.due_today_tasks',
                1
            )
            ->assertJsonPath(
                'data.projects_by_status.active',
                1
            )
            ->assertJsonPath(
                'data.projects_by_status.completed',
                1
            )
            ->assertJsonPath(
                'data.projects_by_status.archived',
                1
            )
            ->assertJsonPath(
                'data.tasks_by_priority.low',
                1
            )
            ->assertJsonPath(
                'data.tasks_by_priority.medium',
                1
            )
            ->assertJsonPath(
                'data.tasks_by_priority.high',
                1
            )
            ->assertJsonPath(
                'data.tasks_by_priority.urgent',
                1
            );
    }

    public function test_analytics_only_include_workspace_data(): void
    {
        [
            $user,
            $workspace,
            $project,
            $board,
            $column,
        ] = $this->createTaskHierarchy();

        Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $user->id,
            'priority' => 'high',
            'position' => 1,
        ]);

        $otherUser = User::factory()->create();

        [
            ,
            $otherWorkspace,
            ,
            ,
            $otherColumn,
        ] = $this->createTaskHierarchy(
            $otherUser
        );

        Task::factory()->count(3)->create([
            'column_id' => $otherColumn->id,
            'created_by' => $otherUser->id,
            'priority' => 'urgent',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson(
            "/api/workspaces/{$workspace->id}/analytics"
        );

        $response
            ->assertOk()
            ->assertJsonPath(
                'data.summary.projects',
                1
            )
            ->assertJsonPath(
                'data.summary.boards',
                1
            )
            ->assertJsonPath(
                'data.summary.tasks',
                1
            )
            ->assertJsonPath(
                'data.tasks_by_priority.high',
                1
            )
            ->assertJsonPath(
                'data.tasks_by_priority.urgent',
                0
            );

        $this->assertNotSame(
            $workspace->id,
            $otherWorkspace->id
        );
    }

    public function test_outsider_cannot_view_workspace_analytics(): void
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();

        $workspace =
            $this->createWorkspaceFor($owner);

        Sanctum::actingAs($outsider);

        $response = $this->getJson(
            "/api/workspaces/{$workspace->id}/analytics"
        );

        $response->assertForbidden();
    }

    public function test_analytics_route_requires_authentication(): void
    {
        $user = User::factory()->create();

        $workspace =
            $this->createWorkspaceFor($user);

        $response = $this->getJson(
            "/api/workspaces/{$workspace->id}/analytics"
        );

        $response->assertUnauthorized();
    }

    public function test_upcoming_tasks_are_ordered_by_due_date(): void
    {
        [
            $user,
            $workspace,
            ,
            ,
            $column,
        ] = $this->createTaskHierarchy();

        Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $user->id,
            'title' => 'Later task',
            'priority' => 'low',
            'position' => 1,
            'due_date' => now()->addDays(5),
        ]);

        Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $user->id,
            'title' => 'Sooner task',
            'priority' => 'urgent',
            'position' => 2,
            'due_date' => now()->addDay(),
        ]);

        Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $user->id,
            'title' => 'Overdue task',
            'priority' => 'high',
            'position' => 3,
            'due_date' => now()->subDay(),
        ]);

        Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $user->id,
            'title' => 'Completed upcoming task',
            'priority' => 'medium',
            'position' => 4,
            'due_date' => now()->addDays(2),
            'completed_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson(
            "/api/workspaces/{$workspace->id}/analytics"
        );

        $response
            ->assertOk()
            ->assertJsonCount(
                2,
                'data.upcoming_tasks'
            )
            ->assertJsonPath(
                'data.upcoming_tasks.0.title',
                'Sooner task'
            )
            ->assertJsonPath(
                'data.upcoming_tasks.1.title',
                'Later task'
            );
    }

    public function test_assigned_to_me_only_returns_open_tasks_for_current_user(): void
    {
        [
            $user,
            $workspace,
            ,
            ,
            $column,
        ] = $this->createTaskHierarchy();

        $otherUser = User::factory()->create();

        $workspace
            ->members()
            ->syncWithoutDetaching([
                $otherUser->id => [
                    'role' => 'member',
                ],
            ]);

        Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $user->id,
            'assigned_to' => $user->id,
            'title' => 'My open task',
            'position' => 1,
            'due_date' => now()->addDay(),
            'completed_at' => null,
        ]);

        Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $user->id,
            'assigned_to' => $user->id,
            'title' => 'My completed task',
            'position' => 2,
            'completed_at' => now(),
        ]);

        Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $user->id,
            'assigned_to' => $otherUser->id,
            'title' => 'Another users task',
            'position' => 3,
            'completed_at' => null,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson(
            "/api/workspaces/{$workspace->id}/analytics"
        );

        $response
            ->assertOk()
            ->assertJsonCount(
                1,
                'data.assigned_to_me'
            )
            ->assertJsonPath(
                'data.assigned_to_me.0.title',
                'My open task'
            );
    }

    public function test_analytics_limits_are_validated(): void
    {
        $user = User::factory()->create();

        $workspace =
            $this->createWorkspaceFor($user);

        Sanctum::actingAs($user);

        $response = $this->getJson(
            "/api/workspaces/{$workspace->id}/analytics"
                . '?upcoming_limit=0'
                . '&assigned_limit=51'
        );

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'upcoming_limit',
                'assigned_limit',
            ]);
    }

    private function createWorkspaceFor(
        User $user
    ): Workspace {
        $workspace =
            Workspace::factory()->create([
                'owner_id' => $user->id,
            ]);

        $workspace
            ->members()
            ->syncWithoutDetaching([
                $user->id => [
                    'role' => 'owner',
                ],
            ]);

        return $workspace;
    }

    private function createTaskHierarchy(
        ?User $user = null
    ): array {
        $user ??= User::factory()->create();

        $workspace =
            $this->createWorkspaceFor($user);

        $project =
            Project::factory()->create([
                'workspace_id' =>
                    $workspace->id,
                'created_by' => $user->id,
                'status' => 'active',
            ]);

        $board =
            Board::factory()->create([
                'project_id' => $project->id,
                'created_by' => $user->id,
                'position' => 1,
            ]);

        $column =
            Column::factory()->create([
                'board_id' => $board->id,
                'position' => 1,
            ]);

        return [
            $user,
            $workspace,
            $project,
            $board,
            $column,
        ];
    }
}