<?php

namespace App\Notifications;

use App\Models\Task;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TaskAssignedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Task $task,
        private readonly Workspace $workspace,
        private readonly User $assignedBy
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return [
            'database',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(
        object $notifiable
    ): array {
        return [
            'type' => 'task_assigned',
            'workspace_id' => $this->workspace->id,
            'workspace_name' => $this->workspace->name,
            'task_id' => $this->task->id,
            'task_title' => $this->task->title,
            'column_id' => $this->task->column_id,
            'assigned_by_id' => $this->assignedBy->id,
            'assigned_by_name' => $this->assignedBy->name,
            'message' => "{$this->assignedBy->name} assigned you to task \"{$this->task->title}\".",
        ];
    }
}
