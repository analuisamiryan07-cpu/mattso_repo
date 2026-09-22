<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Empleado extends Model
{
    protected $table = 'asistencia.empleados';

    const CREATED_AT = 'creado_en';
    const UPDATED_AT = 'actualizado_en';

    protected $fillable = [
        'usuario_id',
        'nombres_completos',
        'cedula',
        'genero',
        'correo',
        'celular',
        'fecha_nacimiento',
        'estado',
        'ip_celular_enc',
        'ip_computadora_enc',
        'grupo',
        'es_pasante',
    ];

    protected function casts(): array
    {
        return [
            'fecha_nacimiento' => 'date',
            'creado_en'        => 'datetime',
            'actualizado_en'   => 'datetime',
            'grupo'            => 'boolean',
            'es_pasante'       => 'boolean',
        ];
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function horario(): HasOne
    {
        return $this->hasOne(Horario::class, 'empleado_id');
    }

    public function registros(): HasMany
    {
        return $this->hasMany(RegistroAsistencia::class, 'empleado_id');
    }

    public function tokens(): HasMany
    {
        return $this->hasMany(TokenMovil::class, 'empleado_id');
    }
}
