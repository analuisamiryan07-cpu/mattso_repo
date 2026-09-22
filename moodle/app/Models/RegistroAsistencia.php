<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RegistroAsistencia extends Model
{
    protected $table = 'asistencia.registros_asistencia';

    public $timestamps = false;

    protected $fillable = [
        'empleado_id',
        'tipo',
        'hora_marcacion',
        'hora_confirmada',
        'minutos_descontados',
        'fecha',
        'atraso_minutos',
    ];

    protected function casts(): array
    {
        return [
            'hora_marcacion'      => 'datetime',
            'hora_confirmada'     => 'datetime',
            'fecha'               => 'date',
            'minutos_descontados' => 'integer',
            'atraso_minutos'      => 'integer',
        ];
    }

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class, 'empleado_id');
    }
}
