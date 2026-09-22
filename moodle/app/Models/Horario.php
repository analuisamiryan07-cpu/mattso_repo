<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Horario extends Model
{
    protected $table = 'asistencia.horarios';

    public $timestamps = false;

    protected $fillable = [
        'empleado_id',
        'hora_entrada',
        'hora_salida_almuerzo',
        'hora_regreso_almuerzo',
        'hora_salida',
    ];

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class, 'empleado_id');
    }
}
