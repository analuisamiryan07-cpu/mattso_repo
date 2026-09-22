<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    public const COMPANY_SAPPER = 'SAPPER';

    public const COMPANY_MATSSO = 'MATSSO';

    public const COMPANY_FUMALU = 'FUMALU';

    public static function companies(): array
    {
        return [
            self::COMPANY_SAPPER => 'Sapper',
            self::COMPANY_MATSSO => 'Matsso',
            self::COMPANY_FUMALU => 'Fumalu',
        ];
    }

    protected $table = 'clientes';

    protected $fillable = [
        'nombre', 'cedula', 'telefono', 'correo', 'direccion', 'fecha',
        'ciudad', 'lugar', 'esquema', 'tipo_examen', 'puntaje_teorico',
        'puntaje_practico', 'datos_c02', 'empresa',
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
