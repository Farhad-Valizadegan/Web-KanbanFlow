<?php

namespace App\Models;

use Database\Factories\BoardFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Board extends Model
{
    /** @use HasFactory<BoardFactory> */
    use HasFactory;

    use SoftDeletes;

    protected $fillable = [
        'project_id',
        'created_by',
        'name',
        'slug',
        'description',
        'visibility',
        'position',
    ];

    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'deleted_at' => 'datetime',
        ];
    }

    public function scopeVisibleTo(Builder $query, User $user): void
    {
        $query->whereHas('project.workspace.members', fn ($members) => $members->where('users.id', $user->id))
            ->where(function ($boards) use ($user): void {
                $boards->where('visibility', 'workspace')
                    ->orWhere('created_by', $user->id)
                    ->orWhereHas('project.workspace', fn ($workspaces) => $workspaces->where('owner_id', $user->id))
                    ->orWhereHas('project.workspace.members', fn ($members) => $members
                        ->where('users.id', $user->id)->where('workspace_user.role', 'manager'));
            });
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function columns(): HasMany
    {
        return $this->hasMany(Column::class);
    }
}
