<?php

namespace App\Models;

use Database\Factories\ColumnFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Column extends Model
{
    /** @use HasFactory<ColumnFactory> */
    use HasFactory;

    use SoftDeletes;

    protected $fillable = [
        'board_id',
        'name',
        'position',
        'wip_limit',
    ];

    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'wip_limit' => 'integer',
            'deleted_at' => 'datetime',
        ];
    }

    public function board(): BelongsTo
    {
        return $this->belongsTo(Board::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }
}
