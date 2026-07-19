<?php

namespace Database\Factories;

use App\Models\Board;
use App\Models\Column;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Column>
 */
class ColumnFactory extends Factory
{
    public function definition(): array
    {
        return [
            'board_id' => Board::factory(),
            'name' => fake()->randomElement([
                'Backlog',
                'To Do',
                'In Progress',
                'Review',
                'Done',
            ]),
            'position' => fake()->numberBetween(0, 10),
            'wip_limit' => fake()->optional()->numberBetween(1, 20),
        ];
    }
}