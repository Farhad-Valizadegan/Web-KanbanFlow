<?php

namespace App\Policies;

use App\Models\TaskComment;
use App\Models\User;

class TaskCommentPolicy
{
    public function view(
        User $user,
        TaskComment $taskComment
    ): bool {
        return $this->belongsToWorkspace(
            $user,
            $taskComment
        );
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(
        User $user,
        TaskComment $taskComment
    ): bool {
        return $taskComment->user_id ===
            $user->id;
    }

    public function delete(
        User $user,
        TaskComment $taskComment
    ): bool {
        if (
            $taskComment->user_id ===
            $user->id
        ) {
            return true;
        }

        $workspace = $taskComment
            ->task
            ->column
            ->board
            ->project
            ->workspace;

        return $workspace->owner_id ===
            $user->id;
    }

    public function restore(
        User $user,
        TaskComment $taskComment
    ): bool {
        return false;
    }

    public function forceDelete(
        User $user,
        TaskComment $taskComment
    ): bool {
        return false;
    }

    private function belongsToWorkspace(
        User $user,
        TaskComment $taskComment
    ): bool {
        $workspace = $taskComment
            ->task
            ->column
            ->board
            ->project
            ->workspace;

        if (
            $workspace->owner_id ===
            $user->id
        ) {
            return true;
        }

        return $workspace
            ->members()
            ->where(
                'users.id',
                $user->id
            )
            ->exists();
    }
}