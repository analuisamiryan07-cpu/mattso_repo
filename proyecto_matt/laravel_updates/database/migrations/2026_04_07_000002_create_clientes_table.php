<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clientes', function (Blueprint $table) {
            $table->id();
            // Basado en los $datos (generar.php)
            $table->string('nombre');
            $table->string('cedula', 15)->unique();
            $table->string('telefono')->nullable();
            $table->string('correo')->nullable();
            $table->text('direccion')->nullable();
            $table->date('fecha');
            $table->string('ciudad')->nullable();
            $table->string('lugar')->nullable();
            
            // Evaluaciones y Esquemas
            $table->string('esquema')->nullable();
            $table->string('tipo_examen')->nullable();
            $table->string('puntaje_teorico')->nullable();
            $table->string('puntaje_practico')->nullable();
            
            // Relaciones opcionales (foráneas lógicas para Eloquent)
            $table->unsignedBigInteger('id_familia')->nullable();
            $table->unsignedBigInteger('id_sector')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clientes');
    }
};
