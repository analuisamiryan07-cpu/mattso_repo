<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    protected $table = 'clientes';

    protected $fillable = [
        'nombre', 'cedula', 'telefono', 'correo', 'direccion', 'fecha',
        'ciudad', 'lugar', 'esquema', 'tipo_examen', 'puntaje_teorico',
        'puntaje_practico', 'datos_c02',
    ];

    protected function casts(): array
    {
        return ['fecha' => 'date', 'datos_c02' => 'array'];
    }

    public function generatedDocuments(): HasMany
    {
        return $this->hasMany(GeneratedDocument::class, 'cliente_id');
    }
}
