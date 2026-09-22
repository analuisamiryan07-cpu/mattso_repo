<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('usuarios_admin')) {
            Schema::create('usuarios_admin', function (Blueprint $table): void {
                $table->id();
                $table->string('usuario', 100)->unique();
                $table->string('password_hash');
                $table->string('rol', 30);
                $table->boolean('activo')->default(true);
                $table->string('nombre_completo', 180)->nullable();
                $table->timestamp('created_at')->useCurrent();
            });

            DB::statement("alter table usuarios_admin add constraint usuarios_admin_rol_check check (rol in ('ADMINISTRADOR', 'SECRETARIA'))");
        }

        if (! Schema::hasTable('documentos_generados')) {
            Schema::create('documentos_generados', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('cliente_id')->constrained('clientes')->cascadeOnUpdate()->restrictOnDelete();
                $table->string('carpeta');
                $table->string('zip_ruta');
                $table->timestamp('fecha_generacion')->useCurrent()->index();
                $table->unsignedInteger('n_archivos')->default(0);
                $table->json('nombres_archivos')->default('[]');
                $table->string('generado_por', 100)->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('documentos_generados');
        Schema::dropIfExists('usuarios_admin');
    }
};
