<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'activity_logs',
            function (Blueprint $table): void {
                $table->id();

                $table
                    ->foreignId('workspace_id')
                    ->constrained()
                    ->cascadeOnDelete();

                $table
                    ->foreignId('user_id')
                    ->nullable()
                    ->constrained()
                    ->nullOnDelete();

                $table->string('action', 100);

                $table->string(
                    'subject_type',
                    100
                );

                $table
                    ->unsignedBigInteger(
                        'subject_id'
                    )
                    ->nullable();

                $table->string(
                    'subject_name'
                );

                $table
                    ->json('properties')
                    ->nullable();

                $table->timestamps();

                $table->index([
                    'workspace_id',
                    'created_at',
                ]);

                $table->index([
                    'subject_type',
                    'subject_id',
                ]);
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'activity_logs'
        );
    }
};