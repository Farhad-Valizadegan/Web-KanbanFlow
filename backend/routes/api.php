<?php

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', function (): JsonResponse {
    return response()->json([
        'status' => 'ok',
        'application' => config('app.name'),
    ]);
});

Route::middleware('auth:sanctum')->get(
    '/user',
    function (Request $request): JsonResponse {
        return response()->json($request->user());
    },
);