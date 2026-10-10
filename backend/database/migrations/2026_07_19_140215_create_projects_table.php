<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();

            $table
                ->foreignId('workspace_id')
                ->constrained()
                ->cascadeOnDelete();

            $table
                ->foreignId('created_by')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();

            $table
                ->string('status')
                ->default('active');

            $table->date('start_date')->nullable();
            $table->date('due_date')->nullable();

            $table->softDeletes();
            $table->timestamps();

            $table->unique([
                'workspace_id',
                'slug',
            ]);

            $table->index([
                'workspace_id',
                'status',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
