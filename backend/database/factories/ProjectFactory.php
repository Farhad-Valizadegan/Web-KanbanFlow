<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Project>
 */
class ProjectFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);

        return [
            'workspace_id' => Workspace::factory(),
            'created_by' => User::factory(),
            'name' => Str::title($name),
            'slug' => Str::slug($name),
            'description' => fake()->optional()->paragraph(),
            'status' => fake()->randomElement([
                'active',
                'completed',
                'archived',
            ]),
            'start_date' => fake()->optional()->date(),
            'due_date' => fake()->optional()->date(),
        ];
    }
}