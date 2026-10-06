<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
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

class ReviewRegressionTest extends TestCase
{
    use RefreshDatabase;

    private function setupBoard(): array
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $workspace = Workspace::factory()->create(['owner_id' => $owner->id]);
        $workspace->members()->attach([$owner->id => ['role' => 'owner'], $member->id => ['role' => 'member']]);
        $project = Project::factory()->create(['workspace_id' => $workspace->id, 'created_by' => $owner->id]);
        $board = Board::factory()->create(['project_id' => $project->id, 'created_by' => $owner->id, 'visibility' => 'private']);
        $column = Column::factory()->create(['board_id' => $board->id]);
        $task = Task::factory()->create(['column_id' => $column->id, 'created_by' => $owner->id]);
        $url = "/api/workspaces/{$workspace->id}/projects/{$project->id}/boards/{$board->id}";

        return compact('owner', 'member', 'workspace', 'project', 'board', 'column', 'task', 'url');
    }

    public function test_private_board_is_hidden_from_regular_members_including_tasks_and_analytics(): void
    {
        $s = $this->setupBoard();
        Sanctum::actingAs($s['member']);
        $this->getJson(dirname($s['url']))->assertOk()->assertJsonCount(0, 'data');
        $this->getJson($s['url'])->assertForbidden();
        $this->getJson($s['url']."/columns/{$s['column']->id}/tasks")->assertForbidden();
        $this->getJson("/api/workspaces/{$s['workspace']->id}/analytics")
            ->assertOk()->assertJsonPath('data.summary.boards', 0)->assertJsonPath('data.summary.tasks', 0);
    }

    public function test_private_board_remains_accessible_to_owner_and_manager(): void
    {
        $s = $this->setupBoard();
        foreach ([$s['owner'], $s['member']] as $user) {
            if ($user->id === $s['member']->id) {
                $s['workspace']->members()->updateExistingPivot($user->id, ['role' => 'manager']);
            }
            Sanctum::actingAs($user);
            $this->getJson($s['url'])->assertOk();
        }
    }

    public function test_private_board_creator_can_read_it_while_viewer_cannot(): void
    {
        $s = $this->setupBoard();
        $s['board']->update(['created_by' => $s['member']->id]);
        Sanctum::actingAs($s['member']);
        $this->getJson($s['url'])->assertOk();
        $viewer = User::factory()->create();
        $s['workspace']->members()->attach($viewer->id, ['role' => 'viewer']);
        Sanctum::actingAs($viewer);
        $this->getJson($s['url'])->assertForbidden();
    }

    public function test_private_task_activity_is_hidden_including_after_task_deletion(): void
    {
        $s = $this->setupBoard();
        ActivityLog::factory()->create([
            'workspace_id' => $s['workspace']->id, 'user_id' => $s['owner']->id,
            'subject_type' => 'task', 'subject_id' => $s['task']->id, 'subject_name' => 'Private task',
        ]);
        $url = "/api/workspaces/{$s['workspace']->id}/activities";
        Sanctum::actingAs($s['member']);
        $this->getJson($url)->assertOk()->assertJsonCount(0, 'data');
        $s['task']->delete();
        $this->getJson($url)->assertOk()->assertJsonCount(0, 'data');
        Sanctum::actingAs($s['owner']);
        $this->getJson($url)->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_removed_comment_author_cannot_edit_or_delete_comment(): void
    {
        $s = $this->setupBoard();
        $comment = TaskComment::factory()->create(['task_id' => $s['task']->id, 'user_id' => $s['member']->id]);
        $s['workspace']->members()->detach($s['member']->id);
        Sanctum::actingAs($s['member']);
        $url = $s['url']."/columns/{$s['column']->id}/tasks/{$s['task']->id}/comments/{$comment->id}";
        $this->patchJson($url, ['body' => 'Changed'])->assertForbidden();
        $this->deleteJson($url)->assertForbidden();
        $this->assertDatabaseHas('task_comments', ['id' => $comment->id, 'deleted_at' => null]);
    }

    public function test_board_and_column_deletion_normalize_positions(): void
    {
        $s = $this->setupBoard();
        $s['board']->update(['position' => 1]);
        $next = Board::factory()->create(['project_id' => $s['project']->id, 'created_by' => $s['owner']->id, 'position' => 2]);
        $s['column']->update(['position' => 1]);
        $nextColumn = Column::factory()->create(['board_id' => $s['board']->id, 'position' => 2]);
        Sanctum::actingAs($s['owner']);
        $this->deleteJson($s['url']."/columns/{$s['column']->id}")->assertOk();
        $this->assertSame(1, $nextColumn->fresh()->position);
        $this->deleteJson($s['url'])->assertOk();
        $this->assertSame(1, $next->fresh()->position);
    }

    public function test_login_is_rate_limited(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $response = $this->postJson('/login', ['email' => 'missing@example.com', 'password' => 'wrong']);
            $this->assertSame(422, $response->status());
        }
        $this->postJson('/login', ['email' => 'missing@example.com', 'password' => 'wrong'])->assertStatus(429);
    }
}
