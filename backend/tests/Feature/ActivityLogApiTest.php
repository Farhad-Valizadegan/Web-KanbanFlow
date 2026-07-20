<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Board;
use App\Models\Column;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ActivityLogApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_workspace_member_can_list_activity_logs(): void
    {
        $user = User::factory()->create();

        $workspace =
            $this->createWorkspaceFor($user);

        ActivityLog::factory()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'action' => 'created',
            'subject_type' => 'task',
            'subject_id' => 10,
            'subject_name' => 'Implement authentication',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson(
            "/api/workspaces/{$workspace->id}/activities"
        );

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath(
                'data.0.action',
                'created'
            )
            ->assertJsonPath(
                'data.0.subject_type',
                'task'
            )
            ->assertJsonPath(
                'data.0.subject_name',
                'Implement authentication'
            )
            ->assertJsonPath(
                'data.0.user.id',
                $user->id
            );
    }

    public function test_outsider_cannot_list_workspace_activity_logs(): void
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();

        $workspace =
            $this->createWorkspaceFor($owner);

        ActivityLog::factory()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $owner->id,
        ]);

        Sanctum::actingAs($outsider);

        $response = $this->getJson(
            "/api/workspaces/{$workspace->id}/activities"
        );

        $response->assertForbidden();
    }

    public function test_activity_logs_can_be_filtered_and_limited(): void
    {
        $user = User::factory()->create();

        $workspace =
            $this->createWorkspaceFor($user);

        ActivityLog::factory()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'action' => 'created',
            'subject_type' => 'task',
            'subject_name' => 'First task',
            'created_at' => now()->subMinutes(3),
        ]);

        ActivityLog::factory()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'action' => 'updated',
            'subject_type' => 'task',
            'subject_name' => 'Second task',
            'created_at' => now()->subMinutes(2),
        ]);

        ActivityLog::factory()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'action' => 'created',
            'subject_type' => 'comment',
            'subject_name' => 'A comment',
            'created_at' => now()->subMinute(),
        ]);

        ActivityLog::factory()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'action' => 'created',
            'subject_type' => 'task',
            'subject_name' => 'Latest task',
            'created_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson(
            "/api/workspaces/{$workspace->id}/activities"
                . '?action=created'
                . '&subject_type=task'
                . '&limit=1'
        );

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath(
                'data.0.subject_name',
                'Latest task'
            );
    }

    public function test_creating_task_records_activity(): void
    {
        [
            $user,
            $workspace,
            $project,
            $board,
            $column,
        ] = $this->createTaskHierarchy();

        Sanctum::actingAs($user);

        $response = $this->postJson(
            $this->tasksUrl(
                $workspace,
                $project,
                $board,
                $column
            ),
            [
                'title' => 'Create activity feed',
                'description' =>
                    'Record task actions.',
                'priority' => 'high',
            ]
        );

        $response
            ->assertCreated()
            ->assertJsonPath(
                'data.title',
                'Create activity feed'
            );

        $taskId = $response->json('data.id');

        $this->assertDatabaseHas(
            'activity_logs',
            [
                'workspace_id' =>
                    $workspace->id,
                'user_id' => $user->id,
                'action' => 'created',
                'subject_type' => 'task',
                'subject_id' => $taskId,
                'subject_name' =>
                    'Create activity feed',
            ]
        );

        $activity = ActivityLog::query()
            ->where('subject_id', $taskId)
            ->where('action', 'created')
            ->firstOrFail();

        $this->assertSame(
            'high',
            $activity->properties[
                'task'
            ]['priority']
        );

        $this->assertSame(
            $column->id,
            $activity->properties[
                'task'
            ]['column_id']
        );
    }

    public function test_updating_task_records_before_and_after_states(): void
    {
        [
            $user,
            $workspace,
            $project,
            $board,
            $column,
        ] = $this->createTaskHierarchy();

        $task = Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $user->id,
            'title' => 'Old task title',
            'priority' => 'low',
            'position' => 1,
        ]);

        Sanctum::actingAs($user);

        $response = $this->patchJson(
            $this->taskUrl(
                $workspace,
                $project,
                $board,
                $column,
                $task
            ),
            [
                'title' => 'New task title',
                'priority' => 'urgent',
            ]
        );

        $response
            ->assertOk()
            ->assertJsonPath(
                'data.title',
                'New task title'
            )
            ->assertJsonPath(
                'data.priority',
                'urgent'
            );

        $activity = ActivityLog::query()
            ->where(
                'workspace_id',
                $workspace->id
            )
            ->where('action', 'updated')
            ->where('subject_type', 'task')
            ->where('subject_id', $task->id)
            ->firstOrFail();

        $this->assertSame(
            'Old task title',
            $activity->properties[
                'before'
            ]['title']
        );

        $this->assertSame(
            'low',
            $activity->properties[
                'before'
            ]['priority']
        );

        $this->assertSame(
            'New task title',
            $activity->properties[
                'after'
            ]['title']
        );

        $this->assertSame(
            'urgent',
            $activity->properties[
                'after'
            ]['priority']
        );
    }

    public function test_moving_task_records_source_and_destination(): void
    {
        [
            $user,
            $workspace,
            $project,
            $board,
            $sourceColumn,
        ] = $this->createTaskHierarchy();

        $destinationColumn =
            Column::factory()->create([
                'board_id' => $board->id,
                'position' => 2,
            ]);

        $task = Task::factory()->create([
            'column_id' => $sourceColumn->id,
            'created_by' => $user->id,
            'title' => 'Move activity task',
            'position' => 1,
        ]);

        Sanctum::actingAs($user);

        $response = $this->patchJson(
            $this->taskUrl(
                $workspace,
                $project,
                $board,
                $sourceColumn,
                $task
            ) . '/move',
            [
                'column_id' =>
                    $destinationColumn->id,
                'position' => 1,
            ]
        );

        $response
            ->assertOk()
            ->assertJsonPath(
                'data.column_id',
                $destinationColumn->id
            );

        $activity = ActivityLog::query()
            ->where('action', 'moved')
            ->where('subject_type', 'task')
            ->where('subject_id', $task->id)
            ->firstOrFail();

        $this->assertSame(
            $sourceColumn->id,
            $activity->properties[
                'before'
            ]['column_id']
        );

        $this->assertSame(
            $destinationColumn->id,
            $activity->properties[
                'after'
            ]['column_id']
        );

        $this->assertSame(
            1,
            $activity->properties[
                'after'
            ]['position']
        );
    }

    public function test_deleting_task_records_activity(): void
    {
        [
            $user,
            $workspace,
            $project,
            $board,
            $column,
        ] = $this->createTaskHierarchy();

        $task = Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $user->id,
            'title' => 'Task to delete',
            'priority' => 'medium',
            'position' => 1,
        ]);

        Sanctum::actingAs($user);

        $response = $this->deleteJson(
            $this->taskUrl(
                $workspace,
                $project,
                $board,
                $column,
                $task
            )
        );

        $response->assertOk();

        $this->assertSoftDeleted(
            'tasks',
            [
                'id' => $task->id,
            ]
        );

        $this->assertDatabaseHas(
            'activity_logs',
            [
                'workspace_id' =>
                    $workspace->id,
                'user_id' => $user->id,
                'action' => 'deleted',
                'subject_type' => 'task',
                'subject_id' => $task->id,
                'subject_name' =>
                    'Task to delete',
            ]
        );
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

    private function createTaskHierarchy(): array
    {
        $user = User::factory()->create();

        $workspace =
            $this->createWorkspaceFor($user);

        $project =
            Project::factory()->create([
                'workspace_id' =>
                    $workspace->id,
            ]);

        $board =
            Board::factory()->create([
                'project_id' => $project->id,
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

    private function tasksUrl(
        Workspace $workspace,
        Project $project,
        Board $board,
        Column $column
    ): string {
        return "/api/workspaces/{$workspace->id}"
            . "/projects/{$project->id}"
            . "/boards/{$board->id}"
            . "/columns/{$column->id}"
            . '/tasks';
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