<?php

namespace Tests\Feature;

use App\Models\Board;
use App\Models\Column;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Models\Workspace;
use App\Notifications\TaskAssignedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_assigned_task_notifies_assignee(): void
    {
        Notification::fake();

        [
            $owner,
            $assignee,
            $workspace,
            $project,
            $board,
            $column,
        ] = $this->createTaskHierarchy();

        Sanctum::actingAs($owner);

        $response = $this->postJson(
            $this->tasksUrl(
                $workspace,
                $project,
                $board,
                $column
            ),
            [
                'title' => 'Implement notifications',
                'description' =>
                    'Create assignment notifications.',
                'priority' => 'high',
                'assigned_to' => $assignee->id,
            ]
        );

        $response
            ->assertCreated()
            ->assertJsonPath(
                'data.assigned_to',
                $assignee->id
            );

        Notification::assertSentTo(
            $assignee,
            TaskAssignedNotification::class,
            function (
                TaskAssignedNotification $notification,
                array $channels
            ) use (
                $assignee,
                $owner,
                $workspace
            ): bool {
                $data =
                    $notification->toArray(
                        $assignee
                    );

                return $channels === [
                    'database',
                ] &&
                    $data['type'] ===
                        'task_assigned' &&
                    $data['workspace_id'] ===
                        $workspace->id &&
                    $data['assigned_by_id'] ===
                        $owner->id &&
                    $data['task_title'] ===
                        'Implement notifications';
            }
        );
    }

    public function test_creating_unassigned_task_does_not_send_notification(): void
    {
        Notification::fake();

        [
            $owner,
            $assignee,
            $workspace,
            $project,
            $board,
            $column,
        ] = $this->createTaskHierarchy();

        Sanctum::actingAs($owner);

        $response = $this->postJson(
            $this->tasksUrl(
                $workspace,
                $project,
                $board,
                $column
            ),
            [
                'title' => 'Unassigned task',
                'priority' => 'medium',
                'assigned_to' => null,
            ]
        );

        $response->assertCreated();

        Notification::assertNothingSent();
    }

    public function test_user_is_not_notified_when_assigning_task_to_themselves(): void
    {
        Notification::fake();

        [
            $owner,
            $assignee,
            $workspace,
            $project,
            $board,
            $column,
        ] = $this->createTaskHierarchy();

        Sanctum::actingAs($owner);

        $response = $this->postJson(
            $this->tasksUrl(
                $workspace,
                $project,
                $board,
                $column
            ),
            [
                'title' => 'Self-assigned task',
                'priority' => 'medium',
                'assigned_to' => $owner->id,
            ]
        );

        $response->assertCreated();

        Notification::assertNothingSent();
    }

    public function test_assigning_existing_task_notifies_new_assignee(): void
    {
        Notification::fake();

        [
            $owner,
            $assignee,
            $workspace,
            $project,
            $board,
            $column,
        ] = $this->createTaskHierarchy();

        $task = Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $owner->id,
            'assigned_to' => null,
            'title' => 'Existing task',
            'priority' => 'low',
            'position' => 1,
        ]);

        Sanctum::actingAs($owner);

        $response = $this->patchJson(
            $this->taskUrl(
                $workspace,
                $project,
                $board,
                $column,
                $task
            ),
            [
                'assigned_to' => $assignee->id,
            ]
        );

        $response
            ->assertOk()
            ->assertJsonPath(
                'data.assigned_to',
                $assignee->id
            );

        Notification::assertSentTo(
            $assignee,
            TaskAssignedNotification::class
        );
    }

    public function test_reassigning_task_notifies_only_new_assignee(): void
    {
        Notification::fake();

        [
            $owner,
            $firstAssignee,
            $workspace,
            $project,
            $board,
            $column,
        ] = $this->createTaskHierarchy();

        $secondAssignee =
            User::factory()->create();

        $workspace
            ->members()
            ->attach(
                $secondAssignee->id,
                [
                    'role' => 'member',
                ]
            );

        $task = Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $owner->id,
            'assigned_to' =>
                $firstAssignee->id,
            'title' => 'Reassigned task',
            'priority' => 'medium',
            'position' => 1,
        ]);

        Sanctum::actingAs($owner);

        $response = $this->patchJson(
            $this->taskUrl(
                $workspace,
                $project,
                $board,
                $column,
                $task
            ),
            [
                'assigned_to' =>
                    $secondAssignee->id,
            ]
        );

        $response->assertOk();

        Notification::assertSentTo(
            $secondAssignee,
            TaskAssignedNotification::class
        );

        Notification::assertNotSentTo(
            $firstAssignee,
            TaskAssignedNotification::class
        );
    }

    public function test_updating_task_without_changing_assignee_does_not_notify_again(): void
    {
        Notification::fake();

        [
            $owner,
            $assignee,
            $workspace,
            $project,
            $board,
            $column,
        ] = $this->createTaskHierarchy();

        $task = Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $owner->id,
            'assigned_to' => $assignee->id,
            'title' => 'Existing assignment',
            'priority' => 'medium',
            'position' => 1,
        ]);

        Sanctum::actingAs($owner);

        $response = $this->patchJson(
            $this->taskUrl(
                $workspace,
                $project,
                $board,
                $column,
                $task
            ),
            [
                'title' => 'Updated title',
                'priority' => 'high',
            ]
        );

        $response->assertOk();

        Notification::assertNothingSent();
    }

    public function test_sending_same_assignee_value_does_not_notify_again(): void
    {
        Notification::fake();

        [
            $owner,
            $assignee,
            $workspace,
            $project,
            $board,
            $column,
        ] = $this->createTaskHierarchy();

        $task = Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $owner->id,
            'assigned_to' => $assignee->id,
            'title' => 'Same assignment',
            'priority' => 'medium',
            'position' => 1,
        ]);

        Sanctum::actingAs($owner);

        $response = $this->patchJson(
            $this->taskUrl(
                $workspace,
                $project,
                $board,
                $column,
                $task
            ),
            [
                'assigned_to' => $assignee->id,
            ]
        );

        $response->assertOk();

        Notification::assertNothingSent();
    }

    public function test_unassigning_task_does_not_send_notification(): void
    {
        Notification::fake();

        [
            $owner,
            $assignee,
            $workspace,
            $project,
            $board,
            $column,
        ] = $this->createTaskHierarchy();

        $task = Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $owner->id,
            'assigned_to' => $assignee->id,
            'title' => 'Task to unassign',
            'priority' => 'medium',
            'position' => 1,
        ]);

        Sanctum::actingAs($owner);

        $response = $this->patchJson(
            $this->taskUrl(
                $workspace,
                $project,
                $board,
                $column,
                $task
            ),
            [
                'assigned_to' => null,
            ]
        );

        $response
            ->assertOk()
            ->assertJsonPath(
                'data.assigned_to',
                null
            );

        Notification::assertNothingSent();
    }

    public function test_authenticated_user_can_list_own_notifications(): void
    {
        $user = User::factory()->create();

        $notification =
            $this->createDatabaseNotification(
                $user,
                [
                    'message' =>
                        'You were assigned a task.',
                ]
            );

        Sanctum::actingAs($user);

        $response = $this->getJson(
            '/api/notifications'
        );

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath(
                'data.0.id',
                $notification->id
            )
            ->assertJsonPath(
                'data.0.data.message',
                'You were assigned a task.'
            )
            ->assertJsonPath(
                'meta.unread_count',
                1
            );
    }

    public function test_user_cannot_see_another_users_notifications(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $this->createDatabaseNotification(
            $otherUser
        );

        Sanctum::actingAs($user);

        $response = $this->getJson(
            '/api/notifications'
        );

        $response
            ->assertOk()
            ->assertJsonCount(0, 'data')
            ->assertJsonPath(
                'meta.unread_count',
                0
            );
    }

    public function test_notifications_can_be_limited(): void
    {
        $user = User::factory()->create();

        $this->createDatabaseNotification(
            $user,
            [
                'message' =>
                    'Older notification.',
            ],
            now()->subMinute()
        );

        $latest =
            $this->createDatabaseNotification(
                $user,
                [
                    'message' =>
                        'Latest notification.',
                ],
                now()
            );

        Sanctum::actingAs($user);

        $response = $this->getJson(
            '/api/notifications?limit=1'
        );

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath(
                'data.0.id',
                $latest->id
            );
    }

    public function test_notifications_can_be_filtered_to_unread_only(): void
    {
        $user = User::factory()->create();

        $this->createDatabaseNotification(
            $user,
            [
                'message' =>
                    'Unread notification.',
            ]
        );

        $this->createDatabaseNotification(
            $user,
            [
                'message' =>
                    'Read notification.',
            ],
            now()->subMinute(),
            now()
        );

        Sanctum::actingAs($user);

        $response = $this->getJson(
            '/api/notifications?unread_only=1'
        );

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath(
                'data.0.data.message',
                'Unread notification.'
            )
            ->assertJsonPath(
                'meta.unread_count',
                1
            );
    }

    public function test_authenticated_user_can_get_unread_count(): void
    {
        $user = User::factory()->create();

        $this->createDatabaseNotification(
            $user
        );

        $this->createDatabaseNotification(
            $user,
            [],
            now()->subMinute(),
            now()
        );

        Sanctum::actingAs($user);

        $response = $this->getJson(
            '/api/notifications/unread-count'
        );

        $response
            ->assertOk()
            ->assertJsonPath(
                'data.unread_count',
                1
            );
    }

    public function test_user_can_mark_own_notification_as_read(): void
    {
        $user = User::factory()->create();

        $notification =
            $this->createDatabaseNotification(
                $user
            );

        Sanctum::actingAs($user);

        $response = $this->patchJson(
            "/api/notifications/{$notification->id}/read"
        );

        $response
            ->assertOk()
            ->assertJsonPath(
                'data.id',
                $notification->id
            )
            ->assertJsonPath(
                'message',
                'Notification marked as read.'
            );

        $this->assertNotNull(
            $notification
                ->fresh()
                ?->read_at
        );
    }

    public function test_user_cannot_mark_another_users_notification_as_read(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $notification =
            $this->createDatabaseNotification(
                $otherUser
            );

        Sanctum::actingAs($user);

        $response = $this->patchJson(
            "/api/notifications/{$notification->id}/read"
        );

        $response->assertNotFound();

        $this->assertNull(
            $notification
                ->fresh()
                ?->read_at
        );
    }

    public function test_user_can_mark_all_notifications_as_read(): void
    {
        $user = User::factory()->create();

        $this->createDatabaseNotification(
            $user
        );

        $this->createDatabaseNotification(
            $user
        );

        Sanctum::actingAs($user);

        $response = $this->patchJson(
            '/api/notifications/read-all'
        );

        $response
            ->assertOk()
            ->assertJsonPath(
                'message',
                'All notifications marked as read.'
            );

        $this->assertSame(
            0,
            $user
                ->fresh()
                ->unreadNotifications()
                ->count()
        );
    }

    public function test_marking_all_as_read_does_not_change_another_users_notifications(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $this->createDatabaseNotification(
            $user
        );

        $this->createDatabaseNotification(
            $otherUser
        );

        Sanctum::actingAs($user);

        $response = $this->patchJson(
            '/api/notifications/read-all'
        );

        $response->assertOk();

        $this->assertSame(
            0,
            $user
                ->fresh()
                ->unreadNotifications()
                ->count()
        );

        $this->assertSame(
            1,
            $otherUser
                ->fresh()
                ->unreadNotifications()
                ->count()
        );
    }

    public function test_user_can_delete_own_notification(): void
    {
        $user = User::factory()->create();

        $notification =
            $this->createDatabaseNotification(
                $user
            );

        Sanctum::actingAs($user);

        $response = $this->deleteJson(
            "/api/notifications/{$notification->id}"
        );

        $response
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Notification deleted successfully.'
            );

        $this->assertDatabaseMissing(
            'notifications',
            [
                'id' => $notification->id,
            ]
        );
    }

    public function test_user_cannot_delete_another_users_notification(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $notification =
            $this->createDatabaseNotification(
                $otherUser
            );

        Sanctum::actingAs($user);

        $response = $this->deleteJson(
            "/api/notifications/{$notification->id}"
        );

        $response->assertNotFound();

        $this->assertDatabaseHas(
            'notifications',
            [
                'id' => $notification->id,
            ]
        );
    }

    public function test_notification_routes_require_authentication(): void
    {
        $this->getJson(
            '/api/notifications'
        )->assertUnauthorized();

        $this->getJson(
            '/api/notifications/unread-count'
        )->assertUnauthorized();

        $this->patchJson(
            '/api/notifications/read-all'
        )->assertUnauthorized();

        $this->patchJson(
            '/api/notifications/test-id/read'
        )->assertUnauthorized();

        $this->deleteJson(
            '/api/notifications/test-id'
        )->assertUnauthorized();
    }

    private function createTaskHierarchy(): array
    {
        $owner = User::factory()->create();
        $assignee = User::factory()->create();

        $workspace =
            Workspace::factory()->create([
                'owner_id' => $owner->id,
            ]);

        $workspace
            ->members()
            ->attach(
                $owner->id,
                [
                    'role' => 'owner',
                ]
            );

        $workspace
            ->members()
            ->attach(
                $assignee->id,
                [
                    'role' => 'member',
                ]
            );

        $project =
            Project::factory()->create([
                'workspace_id' =>
                    $workspace->id,
            ]);

        $board =
            Board::factory()->create([
                'project_id' =>
                    $project->id,
                'position' => 1,
            ]);

        $column =
            Column::factory()->create([
                'board_id' => $board->id,
                'position' => 1,
            ]);

        return [
            $owner,
            $assignee,
            $workspace,
            $project,
            $board,
            $column,
        ];
    }

    private function createDatabaseNotification(
        User $user,
        array $data = [],
        mixed $createdAt = null,
        mixed $readAt = null
    ): DatabaseNotification {
        return DatabaseNotification::query()->create([
            'id' => (string) Str::uuid(),
            'type' =>
                TaskAssignedNotification::class,
            'notifiable_type' =>
                User::class,
            'notifiable_id' =>
                $user->id,
            'data' => array_merge(
                [
                    'type' =>
                        'task_assigned',
                    'message' =>
                        'Test notification.',
                ],
                $data
            ),
            'read_at' => $readAt,
            'created_at' =>
                $createdAt ?? now(),
            'updated_at' =>
                $createdAt ?? now(),
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