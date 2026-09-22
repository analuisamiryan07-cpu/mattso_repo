<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TokenMovil extends Model
{
    protected $table = 'asistencia.tokens_movil';

    public $timestamps = false;

    protected $fillable = [
        'empleado_id',
        'token',
        'token_hash',
        'dispositivo',
        'ultimo_uso',
        'expira_en',
        'revocado_en',
        'rotado_en',
    ];

    protected function casts(): array
    {
        return [
            'creado_en'  => 'datetime',
            'ultimo_uso' => 'datetime',
            'expira_en' => 'datetime',
            'revocado_en' => 'datetime',
            'rotado_en' => 'datetime',
        ];
    }

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class, 'empleado_id');
    }
}
