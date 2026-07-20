<?php

use App\Http\Controllers\Api\BoardController;
use App\Http\Controllers\Api\ColumnController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\WorkspaceController;
use App\Http\Controllers\Api\WorkspaceMemberController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', function (): JsonResponse {
    return response()->json([
        'status' => 'ok',
        'application' => config('app.name'),
    ]);
});

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/user', function (Request $request): JsonResponse {
        return response()->json($request->user());
    });

    Route::apiResource(
        'workspaces',
        WorkspaceController::class
    );

    Route::get(
        'workspaces/{workspace}/members',
        [WorkspaceMemberController::class, 'index']
    );

    Route::post(
        'workspaces/{workspace}/members',
        [WorkspaceMemberController::class, 'store']
    );

    Route::patch(
        'workspaces/{workspace}/members/{user}',
        [WorkspaceMemberController::class, 'update']
    );

    Route::delete(
        'workspaces/{workspace}/members/{user}',
        [WorkspaceMemberController::class, 'destroy']
    );

    Route::apiResource(
        'workspaces.projects',
        ProjectController::class
    );

    Route::apiResource(
        'workspaces.projects.boards',
        BoardController::class
    );

    Route::apiResource(
        'workspaces.projects.boards.columns',
        ColumnController::class
    );

    Route::patch(
        'workspaces/{workspace}/projects/{project}/boards/{board}/columns/{column}/tasks/{task}/move',
        [TaskController::class, 'move']
    );

    Route::apiResource(
        'workspaces.projects.boards.columns.tasks',
        TaskController::class
    );
});