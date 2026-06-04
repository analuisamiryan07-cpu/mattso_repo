<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cliente extends Model
{
    protected $table = 'clientes';

    protected $fillable = [
        'nombre',
        'cedula',
        'telefono',
        'correo',
        'direccion',
        'fecha',
        'ciudad',
        'lugar',
        'esquema',
        'tipo_examen',
        'puntaje_teorico',
        'puntaje_practico',
        'id_familia',
        'id_sector',
        'nombre_examinador',
        'cedula_examinador',
        'telefono_examinador',
        'edad',
        'celular1',
        'cv_metadata'
    ];

    protected $casts = [
        'fecha' => 'date',
        'cv_metadata' => 'array',
    ];

    public function familia()
    {
        return $this->belongsTo(Familia::class, 'id_familia', 'id_familia');
    }

    public function sector()
    {
        return $this->belongsTo(Sector::class, 'id_sector', 'id_sector');
    }
}
