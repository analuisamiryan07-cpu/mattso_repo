<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GeneratedDocument extends Model
{
    protected $table = 'documentos_generados';

    public $timestamps = false;

    protected $fillable = [
        'cliente_id', 'carpeta', 'zip_ruta', 'n_archivos',
        'nombres_archivos', 'generado_por',
    ];

    protected function casts(): array
    {
        return [
            'nombres_archivos' => 'array',
            'fecha_generacion' => 'datetime',
            'n_archivos' => 'integer',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'cliente_id');
    }
}
