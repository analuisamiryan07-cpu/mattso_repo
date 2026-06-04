<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Familia extends Model
{
    protected $table = 'familias';
    protected $primaryKey = 'id_familia';
    public $timestamps = false; // No necesitamos created_at y updated_at aquí

    protected $fillable = [
        'fam_descripcion',
    ];
}
