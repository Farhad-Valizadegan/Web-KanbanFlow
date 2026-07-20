<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Model;

class ActivityLogger
{
    public function log(
        Workspace $workspace,
        ?User $user,
        string $action,
        string $subjectType,
        ?Model $subject,
        string $subjectName,
        ?array $properties = null
    ): ActivityLog {
        return ActivityLog::query()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $user?->id,
            'action' => $action,
            'subject_type' => $subjectType,
            'subject_id' => $subject?->getKey(),
            'subject_name' => $subjectName,
            'properties' => $properties,
        ]);
    }
}