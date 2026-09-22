<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Validates that the FK notas_asistencia_empleado_id_fkey exists on
 * asistencia.notas_asistencia, referencing asistencia.empleados(id)
 * with ON DELETE CASCADE.
 *
 * The FK must be created beforehand by the table owner (postgres) using
 * the SQL in: /home/matt/03_add_fk_notas_asistencia_empleado.sql
 *
 * This migration does NOT create the FK because the table is owned by
 * 'postgres' and the Laravel role 'aquiles' cannot ALTER it.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql'
            || ! Schema::hasTable('asistencia.notas_asistencia')) {
            return;
        }

        $constraintName = 'notas_asistencia_empleado_id_fkey';

        $constraint = DB::selectOne("
            SELECT pg_get_constraintdef(c.oid) AS definition,
                   c.confdeltype AS delete_action
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE n.nspname = 'asistencia'
              AND c.conrelid = 'asistencia.notas_asistencia'::regclass
              AND c.confrelid = 'asistencia.empleados'::regclass
              AND c.conname  = ?
              AND c.contype  = 'f'
        ", [$constraintName]);

        if (! $constraint) {
            throw new \RuntimeException(
                "FK '{$constraintName}' does not exist on asistencia.notas_asistencia. "
                . "Ask the DBA to run 03_add_fk_notas_asistencia_empleado.sql first."
            );
        }

        $definition = (string) $constraint->definition;
        if (! str_contains($definition, 'FOREIGN KEY (empleado_id)')
            || ! str_contains($definition, 'REFERENCES asistencia.empleados(id)')) {
            throw new \RuntimeException(
                "FK '{$constraintName}' does not use the expected columns. "
                . "Definition: {$definition}"
            );
        }

        if ($constraint->delete_action !== 'c'
            || ! str_contains(strtoupper($definition), 'ON DELETE CASCADE')) {
            throw new \RuntimeException(
                "FK '{$constraintName}' exists but does not include ON DELETE CASCADE. "
                . "Definition: {$definition}"
            );
        }

        // Verify zero orphans remain
        $orphanCount = (int) DB::scalar("
            SELECT COUNT(*) AS cnt
            FROM asistencia.notas_asistencia n
            LEFT JOIN asistencia.empleados e ON e.id = n.empleado_id
            WHERE e.id IS NULL
        ");

        if ($orphanCount > 0) {
            throw new \RuntimeException(
                "Cannot validate FK: {$orphanCount} orphan note(s) still exist."
            );
        }
    }

    public function down(): void
    {
        // This migration only validates; it does not create or drop anything.
        // The FK must be managed by the DBA (postgres).
    }
};
