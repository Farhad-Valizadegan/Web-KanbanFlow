<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    /**
     * Determine whether the user can view the project.
     */
    public function view(User $user, Project $project): bool
    {
        return $project->workspace
            ->members()
            ->where('users.id', $user->id)
            ->exists();
    }

    /**
     * Determine whether the user can update the project.
     */
    public function update(User $user, Project $project): bool
    {
        if ($project->workspace->owner_id === $user->id) {
            return true;
        }

        $role = $project->workspace
            ->members()
            ->where('users.id', $user->id)
            ->value('workspace_user.role');

        return $role === 'manager';
    }

    /**
     * Determine whether the user can delete the project.
     */
    public function delete(User $user, Project $project): bool
    {
        return $this->update($user, $project);
    }

    /**
     * Determine whether the user can restore the project.
     */
    public function restore(User $user, Project $project): bool
    {
        return $project->workspace->owner_id === $user->id;
    }

    /**
     * Determine whether the user can permanently delete the project.
     */
    public function forceDelete(
        User $user,
        Project $project
    ): bool {
        return $project->workspace->owner_id === $user->id;
    }
}
