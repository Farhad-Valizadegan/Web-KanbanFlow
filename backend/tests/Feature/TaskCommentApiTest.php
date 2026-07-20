<?php

namespace Tests\Feature;

use App\Models\Board;
use App\Models\Column;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskComment;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TaskCommentApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_workspace_member_can_list_task_comments(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        [
            $workspace,
            $project,
            $board,
            $column,
            $task,
        ] = $this->createTaskStructure($owner);

        $this->addMember(
            $workspace,
            $member,
            'member'
        );

        TaskComment::factory()
            ->count(2)
            ->create([
                'task_id' => $task->id,
                'user_id' => $owner->id,
            ]);

        Sanctum::actingAs($member);

        $this->getJson(
            $this->commentsUrl(
                $workspace,
                $project,
                $board,
                $column,
                $task
            )
        )
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath(
                'data.0.user.id',
                $owner->id
            );
    }

    public function test_comments_are_returned_in_chronological_order(): void
    {
        $owner = User::factory()->create();

        [
            $workspace,
            $project,
            $board,
            $column,
            $task,
        ] = $this->createTaskStructure($owner);

        TaskComment::factory()->create([
            'task_id' => $task->id,
            'user_id' => $owner->id,
            'body' => 'Second comment',
            'created_at' => now()->addMinute(),
        ]);

        TaskComment::factory()->create([
            'task_id' => $task->id,
            'user_id' => $owner->id,
            'body' => 'First comment',
            'created_at' => now(),
        ]);

        Sanctum::actingAs($owner);

        $this->getJson(
            $this->commentsUrl(
                $workspace,
                $project,
                $board,
                $column,
                $task
            )
        )
            ->assertOk()
            ->assertJsonPath(
                'data.0.body',
                'First comment'
            )
            ->assertJsonPath(
                'data.1.body',
                'Second comment'
            );
    }

    public function test_outsider_cannot_list_task_comments(): void
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();

        [
            $workspace,
            $project,
            $board,
            $column,
            $task,
        ] = $this->createTaskStructure($owner);

        Sanctum::actingAs($outsider);

        $this->getJson(
            $this->commentsUrl(
                $workspace,
                $project,
                $board,
                $column,
                $task
            )
        )->assertForbidden();
    }

    public function test_workspace_member_can_create_comment(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        [
            $workspace,
            $project,
            $board,
            $column,
            $task,
        ] = $this->createTaskStructure($owner);

        $this->addMember(
            $workspace,
            $member,
            'member'
        );

        Sanctum::actingAs($member);

        $this->postJson(
            $this->commentsUrl(
                $workspace,
                $project,
                $board,
                $column,
                $task
            ),
            [
                'body' => 'This task needs additional review.',
            ]
        )
            ->assertCreated()
            ->assertJsonPath(
                'data.task_id',
                $task->id
            )
            ->assertJsonPath(
                'data.user_id',
                $member->id
            )
            ->assertJsonPath(
                'data.body',
                'This task needs additional review.'
            )
            ->assertJsonPath(
                'data.user.id',
                $member->id
            );

        $this->assertDatabaseHas(
            'task_comments',
            [
                'task_id' => $task->id,
                'user_id' => $member->id,
                'body' =>
                    'This task needs additional review.',
            ]
        );
    }

    public function test_outsider_cannot_create_comment(): void
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();

        [
            $workspace,
            $project,
            $board,
            $column,
            $task,
        ] = $this->createTaskStructure($owner);

        Sanctum::actingAs($outsider);

        $this->postJson(
            $this->commentsUrl(
                $workspace,
                $project,
                $board,
                $column,
                $task
            ),
            [
                'body' => 'Unauthorized comment.',
            ]
        )->assertForbidden();

        $this->assertDatabaseMissing(
            'task_comments',
            [
                'task_id' => $task->id,
                'user_id' => $outsider->id,
            ]
        );
    }

    public function test_comment_body_is_required(): void
    {
        $owner = User::factory()->create();

        [
            $workspace,
            $project,
            $board,
            $column,
            $task,
        ] = $this->createTaskStructure($owner);

        Sanctum::actingAs($owner);

        $this->postJson(
            $this->commentsUrl(
                $workspace,
                $project,
                $board,
                $column,
                $task
            ),
            []
        )
            ->assertUnprocessable()
            ->assertJsonValidationErrors('body');
    }

    public function test_comment_body_cannot_exceed_maximum_length(): void
    {
        $owner = User::factory()->create();

        [
            $workspace,
            $project,
            $board,
            $column,
            $task,
        ] = $this->createTaskStructure($owner);

        Sanctum::actingAs($owner);

        $this->postJson(
            $this->commentsUrl(
                $workspace,
                $project,
                $board,
                $column,
                $task
            ),
            [
                'body' => str_repeat('a', 5001),
            ]
        )
            ->assertUnprocessable()
            ->assertJsonValidationErrors('body');
    }

    public function test_workspace_member_can_view_comment(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        [
            $workspace,
            $project,
            $board,
            $column,
            $task,
        ] = $this->createTaskStructure($owner);

        $this->addMember(
            $workspace,
            $member,
            'viewer'
        );

        $comment = TaskComment::factory()->create([
            'task_id' => $task->id,
            'user_id' => $owner->id,
            'body' => 'Visible comment',
        ]);

        Sanctum::actingAs($member);

        $this->getJson(
            $this->commentUrl(
                $workspace,
                $project,
                $board,
                $column,
                $task,
                $comment
            )
        )
            ->assertOk()
            ->assertJsonPath(
                'data.id',
                $comment->id
            )
            ->assertJsonPath(
                'data.body',
                'Visible comment'
            );
    }

    public function test_comment_author_can_update_comment(): void
    {
        $owner = User::factory()->create();
        $author = User::factory()->create();

        [
            $workspace,
            $project,
            $board,
            $column,
            $task,
        ] = $this->createTaskStructure($owner);

        $this->addMember(
            $workspace,
            $author,
            'member'
        );

        $comment = TaskComment::factory()->create([
            'task_id' => $task->id,
            'user_id' => $author->id,
            'body' => 'Original body',
        ]);

        Sanctum::actingAs($author);

        $this->patchJson(
            $this->commentUrl(
                $workspace,
                $project,
                $board,
                $column,
                $task,
                $comment
            ),
            [
                'body' => 'Updated body',
            ]
        )
            ->assertOk()
            ->assertJsonPath(
                'data.body',
                'Updated body'
            );

        $this->assertDatabaseHas(
            'task_comments',
            [
                'id' => $comment->id,
                'body' => 'Updated body',
            ]
        );
    }

    public function test_another_member_cannot_update_comment(): void
    {
        $owner = User::factory()->create();
        $author = User::factory()->create();
        $otherMember = User::factory()->create();

        [
            $workspace,
            $project,
            $board,
            $column,
            $task,
        ] = $this->createTaskStructure($owner);

        $this->addMember(
            $workspace,
            $author,
            'member'
        );

        $this->addMember(
            $workspace,
            $otherMember,
            'member'
        );

        $comment = TaskComment::factory()->create([
            'task_id' => $task->id,
            'user_id' => $author->id,
            'body' => 'Original body',
        ]);

        Sanctum::actingAs($otherMember);

        $this->patchJson(
            $this->commentUrl(
                $workspace,
                $project,
                $board,
                $column,
                $task,
                $comment
            ),
            [
                'body' => 'Unauthorized update',
            ]
        )->assertForbidden();

        $this->assertDatabaseHas(
            'task_comments',
            [
                'id' => $comment->id,
                'body' => 'Original body',
            ]
        );
    }

    public function test_comment_author_can_delete_comment(): void
    {
        $owner = User::factory()->create();
        $author = User::factory()->create();

        [
            $workspace,
            $project,
            $board,
            $column,
            $task,
        ] = $this->createTaskStructure($owner);

        $this->addMember(
            $workspace,
            $author,
            'member'
        );

        $comment = TaskComment::factory()->create([
            'task_id' => $task->id,
            'user_id' => $author->id,
        ]);

        Sanctum::actingAs($author);

        $this->deleteJson(
            $this->commentUrl(
                $workspace,
                $project,
                $board,
                $column,
                $task,
                $comment
            )
        )->assertOk();

        $this->assertSoftDeleted(
            'task_comments',
            [
                'id' => $comment->id,
            ]
        );
    }

    public function test_manager_can_delete_another_users_comment(): void
    {
        $owner = User::factory()->create();
        $manager = User::factory()->create();
        $author = User::factory()->create();

        [
            $workspace,
            $project,
            $board,
            $column,
            $task,
        ] = $this->createTaskStructure($owner);

        $this->addMember(
            $workspace,
            $manager,
            'manager'
        );

        $this->addMember(
            $workspace,
            $author,
            'member'
        );

        $comment = TaskComment::factory()->create([
            'task_id' => $task->id,
            'user_id' => $author->id,
        ]);

        Sanctum::actingAs($manager);

        $this->deleteJson(
            $this->commentUrl(
                $workspace,
                $project,
                $board,
                $column,
                $task,
                $comment
            )
        )->assertOk();

        $this->assertSoftDeleted(
            'task_comments',
            [
                'id' => $comment->id,
            ]
        );
    }

    public function test_regular_member_cannot_delete_another_users_comment(): void
    {
        $owner = User::factory()->create();
        $author = User::factory()->create();
        $otherMember = User::factory()->create();

        [
            $workspace,
            $project,
            $board,
            $column,
            $task,
        ] = $this->createTaskStructure($owner);

        $this->addMember(
            $workspace,
            $author,
            'member'
        );

        $this->addMember(
            $workspace,
            $otherMember,
            'member'
        );

        $comment = TaskComment::factory()->create([
            'task_id' => $task->id,
            'user_id' => $author->id,
        ]);

        Sanctum::actingAs($otherMember);

        $this->deleteJson(
            $this->commentUrl(
                $workspace,
                $project,
                $board,
                $column,
                $task,
                $comment
            )
        )->assertForbidden();

        $this->assertDatabaseHas(
            'task_comments',
            [
                'id' => $comment->id,
                'deleted_at' => null,
            ]
        );
    }

    public function test_comment_from_another_task_returns_not_found(): void
    {
        $owner = User::factory()->create();

        [
            $workspace,
            $project,
            $board,
            $column,
            $firstTask,
        ] = $this->createTaskStructure($owner);

        $secondTask = Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $owner->id,
        ]);

        $comment = TaskComment::factory()->create([
            'task_id' => $secondTask->id,
            'user_id' => $owner->id,
        ]);

        Sanctum::actingAs($owner);

        $this->getJson(
            $this->commentUrl(
                $workspace,
                $project,
                $board,
                $column,
                $firstTask,
                $comment
            )
        )->assertNotFound();
    }

    private function createTaskStructure(
        User $owner
    ): array {
        $workspace =
            Workspace::factory()->create([
                'owner_id' => $owner->id,
            ]);

        $workspace->members()->attach(
            $owner->id,
            [
                'role' => 'owner',
            ]
        );

        $project =
            Project::factory()->create([
                'workspace_id' =>
                    $workspace->id,
                'created_by' => $owner->id,
            ]);

        $board = Board::factory()->create([
            'project_id' => $project->id,
            'created_by' => $owner->id,
        ]);

        $column = Column::factory()->create([
            'board_id' => $board->id,
        ]);

        $task = Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $owner->id,
        ]);

        return [
            $workspace,
            $project,
            $board,
            $column,
            $task,
        ];
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

    private function commentsUrl(
        Workspace $workspace,
        Project $project,
        Board $board,
        Column $column,
        Task $task
    ): string {
        return "/api/workspaces/{$workspace->id}"
            . "/projects/{$project->id}"
            . "/boards/{$board->id}"
            . "/columns/{$column->id}"
            . "/tasks/{$task->id}"
            . '/comments';
    }

    private function commentUrl(
        Workspace $workspace,
        Project $project,
        Board $board,
        Column $column,
        Task $task,
        TaskComment $comment
    ): string {
        return $this->commentsUrl(
            $workspace,
            $project,
            $board,
            $column,
            $task
        ) . "/{$comment->id}";
    }
}