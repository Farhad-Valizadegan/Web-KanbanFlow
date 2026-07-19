<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('boards', function (Blueprint $table) {
            $table->id();

            $table
                ->foreignId('project_id')
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
                ->string('visibility')
                ->default('workspace');

            $table
                ->unsignedInteger('position')
                ->default(0);

            $table->softDeletes();
            $table->timestamps();

            $table->unique([
                'project_id',
                'slug',
            ]);

            $table->index([
                'project_id',
                'position',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('boards');
    }
};