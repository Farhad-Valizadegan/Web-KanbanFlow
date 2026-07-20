<?php

namespace Database\Factories;

use App\Models\ActivityLog;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ActivityLog>
 */
class ActivityLogFactory extends Factory
{
    protected $model = ActivityLog::class;

    public function definition(): array
    {
        return [
            'workspace_id' =>
                Workspace::factory(),

            'user_id' =>
                User::factory(),

            'action' =>
                fake()->randomElement([
                    'created',
                    'updated',
                    'moved',
                    'deleted',
                    'commented',
                ]),

            'subject_type' =>
                fake()->randomElement([
                    'task',
                    'comment',
                    'column',
                    'board',
                    'project',
                    'workspace',
                ]),

            'subject_id' =>
                fake()->numberBetween(
                    1,
                    1000
                ),

            'subject_name' =>
                fake()->sentence(3),

            'properties' => [
                'description' =>
                    fake()->sentence(),
            ],
        ];
    }
}