<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();

            $table
                ->foreignId('column_id')
                ->constrained()
                ->cascadeOnDelete();

            $table
                ->foreignId('created_by')
                ->constrained('users')
                ->cascadeOnDelete();

            $table
                ->foreignId('assigned_to')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('title');
            $table->text('description')->nullable();

            $table
                ->string('priority')
                ->default('medium');

            $table
                ->unsignedInteger('position')
                ->default(0);

            $table->date('due_date')->nullable();

            $table
                ->timestamp('completed_at')
                ->nullable();

            $table->softDeletes();
            $table->timestamps();

            $table->index([
                'column_id',
                'position',
            ]);

            $table->index([
                'assigned_to',
                'due_date',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
