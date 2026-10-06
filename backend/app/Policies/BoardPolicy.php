<?php

namespace App\Policies;

use App\Models\Board;
use App\Models\User;

class BoardPolicy
{
    public function view(User $user, Board $board): bool
    {
        return Board::query()->visibleTo($user)->whereKey($board->id)->exists();
    }

    public function update(User $user, Board $board): bool
    {
        if (! $this->view($user, $board)) {
            return false;
        }

        $workspace = $board->project->workspace;

        if ($workspace->owner_id === $user->id) {
            return true;
        }

        $role = $workspace
            ->members()
            ->where('users.id', $user->id)
            ->value('workspace_user.role');

        return $role === 'manager';
    }

    public function delete(User $user, Board $board): bool
    {
        return $this->update($user, $board);
    }

    public function restore(User $user, Board $board): bool
    {
        return $board
            ->project
            ->workspace
            ->owner_id === $user->id;
    }

    public function forceDelete(
        User $user,
        Board $board
    ): bool {
        return $board
            ->project
            ->workspace
            ->owner_id === $user->id;
    }
}
