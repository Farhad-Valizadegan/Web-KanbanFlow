<?php

namespace Database\Factories;

use App\Models\Column;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    public function definition(): array
    {
        return [
            'column_id' => Column::factory(),
            'created_by' => User::factory(),
            'assigned_to' => null,
            'title' => fake()->sentence(4),
            'description' => fake()->optional()->paragraph(),
            'priority' => fake()->randomElement([
                'low',
                'medium',
                'high',
                'urgent',
            ]),
            'position' => fake()->numberBetween(0, 20),
            'due_date' => fake()->optional()->dateTimeBetween(
                'now',
                '+2 months'
            ),
            'completed_at' => null,
        ];
    }
}
