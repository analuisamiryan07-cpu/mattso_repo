<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sector extends Model
{
    protected $table = 'sectores';
    protected $primaryKey = 'id_sector';
    public $timestamps = false;

    protected $fillable = [
        'sec_descripcion',
    ];
}
