<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Task;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(
        Request $request,
        Workspace $workspace
    ): JsonResponse {
        $this->authorize(
            'view',
            $workspace
        );

        $validated = $request->validate([
            'limit' => [
                'sometimes',
                'integer',
                'min:1',
                'max:100',
            ],
            'action' => [
                'sometimes',
                'string',
                'max:100',
            ],
            'subject_type' => [
                'sometimes',
                'string',
                'max:100',
            ],
        ]);

        $limit =
            $validated['limit'] ?? 50;

        $visibleTaskIds = Task::withTrashed()->whereHas('column', fn ($columns) => $columns->withTrashed()
            ->whereHas('board', fn ($boards) => $boards->withTrashed()->visibleTo($request->user())))->select('id');

        $activities = ActivityLog::query()
            ->when(! $request->user()->can('manageMembers', $workspace), fn ($query) => $query->where(fn ($activities) => $activities->where('subject_type', '!=', 'task')
                ->orWhereIn('subject_id', $visibleTaskIds)))
            ->where(
                'workspace_id',
                $workspace->id
            )
            ->with('user')
            ->when(
                isset(
                    $validated['action']
                ),
                fn ($query) => $query->where(
                    'action',
                    $validated['action']
                )
            )
            ->when(
                isset(
                    $validated[
                        'subject_type'
                    ]
                ),
                fn ($query) => $query->where(
                    'subject_type',
                    $validated[
                        'subject_type'
                    ]
                )
            )
            ->latest('created_at')
            ->latest('id')
            ->limit($limit)
            ->get();

        return response()->json([
            'data' => $activities,
        ]);
    }
}
