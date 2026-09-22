<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const CONSTRAINT = 'clientes_cedula_formato_check';

    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql' || ! Schema::hasTable('clientes')) {
            return;
        }

        $invalidRows = DB::table('clientes')
            ->whereRaw("cedula !~ '^[0-9]{10}(001)?$'")
            ->count();

        if ($invalidRows > 0) {
            throw new \RuntimeException(
                "No se puede aplicar la restricción de cédula/RUC: existen {$invalidRows} filas con formato inválido."
            );
        }

        DB::statement('ALTER TABLE public.clientes DROP CONSTRAINT IF EXISTS '.self::CONSTRAINT);
        DB::statement(
            "ALTER TABLE public.clientes ADD CONSTRAINT ".self::CONSTRAINT
            ." CHECK (cedula ~ '^[0-9]{10}(001)?$')"
        );
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql' && Schema::hasTable('clientes')) {
            DB::statement('ALTER TABLE public.clientes DROP CONSTRAINT IF EXISTS '.self::CONSTRAINT);
        }
    }
};
