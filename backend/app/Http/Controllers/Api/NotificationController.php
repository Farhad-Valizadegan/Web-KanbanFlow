<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{
    public function index(
        Request $request
    ): JsonResponse {
        $validated = $request->validate([
            'limit' => [
                'sometimes',
                'integer',
                'min:1',
                'max:100',
            ],
            'unread_only' => [
                'sometimes',
                'boolean',
            ],
        ]);

        $limit =
            $validated['limit'] ?? 50;

        $unreadOnly =
            $validated['unread_only'] ?? false;

        $query = $request
            ->user()
            ->notifications()
            ->latest('created_at');

        if ($unreadOnly) {
            $query->whereNull('read_at');
        }

        $notifications = $query
            ->limit($limit)
            ->get();

        return response()->json([
            'data' => $notifications,
            'meta' => [
                'unread_count' =>
                    $request
                        ->user()
                        ->unreadNotifications()
                        ->count(),
            ],
        ]);
    }

    public function unreadCount(
        Request $request
    ): JsonResponse {
        return response()->json([
            'data' => [
                'unread_count' =>
                    $request
                        ->user()
                        ->unreadNotifications()
                        ->count(),
            ],
        ]);
    }

    public function markAsRead(
        Request $request,
        string $notification
    ): JsonResponse {
        $databaseNotification =
            $this->findUserNotification(
                $request,
                $notification
            );

        if (
            $databaseNotification->read_at ===
            null
        ) {
            $databaseNotification
                ->markAsRead();
        }

        $databaseNotification->refresh();

        return response()->json([
            'message' =>
                'Notification marked as read.',
            'data' =>
                $databaseNotification,
        ]);
    }

    public function markAllAsRead(
        Request $request
    ): JsonResponse {
        $request
            ->user()
            ->unreadNotifications()
            ->update([
                'read_at' => now(),
            ]);

        return response()->json([
            'message' =>
                'All notifications marked as read.',
        ]);
    }

    public function destroy(
        Request $request,
        string $notification
    ): JsonResponse {
        $databaseNotification =
            $this->findUserNotification(
                $request,
                $notification
            );

        $databaseNotification->delete();

        return response()->json([
            'message' =>
                'Notification deleted successfully.',
        ]);
    }

    private function findUserNotification(
        Request $request,
        string $notificationId
    ): DatabaseNotification {
        return $request
            ->user()
            ->notifications()
            ->whereKey($notificationId)
            ->firstOrFail();
    }
}