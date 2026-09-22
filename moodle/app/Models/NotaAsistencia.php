<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotaAsistencia extends Model
{
    protected $table      = 'asistencia.notas_asistencia';
    protected $fillable   = ['empleado_id', 'fecha', 'nota'];
    protected $casts      = ['fecha' => 'date'];
}
