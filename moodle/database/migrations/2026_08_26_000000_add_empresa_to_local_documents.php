<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('clientes') && ! Schema::hasColumn('clientes', 'empresa')) {
            Schema::table('clientes', function (Blueprint $table): void {
                $table->string('empresa', 20)->default('SAPPER')->index();
            });
        }

        if (Schema::hasTable('documentos_generados') && ! Schema::hasColumn('documentos_generados', 'empresa')) {
            Schema::table('documentos_generados', function (Blueprint $table): void {
                $table->string('empresa', 20)->default('SAPPER')->index();
            });
        }

        if (DB::getDriverName() === 'pgsql' && Schema::hasTable('clientes')) {
            DB::statement('alter table clientes drop constraint if exists clientes_empresa_check');
            DB::statement("alter table clientes add constraint clientes_empresa_check check (empresa in ('SAPPER', 'MATSSO', 'FUMALU'))");
        }

        if (DB::getDriverName() === 'pgsql' && Schema::hasTable('documentos_generados')) {
            DB::statement('alter table documentos_generados drop constraint if exists documentos_generados_empresa_check');
            DB::statement("alter table documentos_generados add constraint documentos_generados_empresa_check check (empresa in ('SAPPER', 'MATSSO', 'FUMALU'))");
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('documentos_generados')) {
            if (DB::getDriverName() === 'pgsql') {
                DB::statement('alter table documentos_generados drop constraint if exists documentos_generados_empresa_check');
            }
            Schema::table('documentos_generados', fn (Blueprint $table) => $table->dropColumn('empresa'));
        }

        if (Schema::hasTable('clientes')) {
            if (DB::getDriverName() === 'pgsql') {
                DB::statement('alter table clientes drop constraint if exists clientes_empresa_check');
            }
            Schema::table('clientes', fn (Blueprint $table) => $table->dropColumn('empresa'));
        }
    }
};