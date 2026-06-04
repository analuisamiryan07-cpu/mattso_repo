<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clientes', function (Blueprint $table) {
            $table->string('nombre_examinador')->nullable()->after('lugar');
            $table->string('cedula_examinador', 20)->nullable()->after('nombre_examinador');
            $table->string('telefono_examinador', 20)->nullable()->after('cedula_examinador');
            $table->integer('edad')->nullable()->after('telefono_examinador');
            $table->string('celular1', 20)->nullable()->after('edad');
            $table->json('cv_metadata')->nullable()->after('celular1');
        });
    }

    public function down(): void
    {
        Schema::table('clientes', function (Blueprint $table) {
            $table->dropColumn([
                'nombre_examinador',
                'cedula_examinador',
                'telefono_examinador',
                'edad',
                'celular1',
                'cv_metadata'
            ]);
        });
    }
};
