<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql' || ! Schema::hasTable('asistencia.tokens_movil')) {
            return;
        }

        $requiredColumns = ['token_hash', 'expira_en', 'revocado_en', 'rotado_en'];
        $missingColumns = array_values(array_filter(
            $requiredColumns,
            fn (string $column): bool => ! Schema::hasColumn('asistencia.tokens_movil', $column),
        ));
        $indexExists = (bool) DB::scalar(<<<'SQL'
            SELECT EXISTS (
                SELECT 1 FROM pg_indexes
                WHERE schemaname = 'asistencia'
                  AND indexname = 'tokens_movil_token_hash_unique'
            )
            SQL);
        $constraintExists = (bool) DB::scalar(<<<'SQL'
            SELECT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'tokens_movil_token_hash_format_check'
                  AND conrelid = 'asistencia.tokens_movil'::regclass
            )
            SQL);

        if ($missingColumns !== [] || ! $indexExists || ! $constraintExists) {
            $ownership = DB::selectOne(<<<'SQL'
                SELECT current_user AS current_role,
                       pg_get_userbyid(c.relowner) AS owner_role
                FROM pg_class c
                WHERE c.oid = 'asistencia.tokens_movil'::regclass
                SQL);

            if ($ownership?->current_role !== $ownership?->owner_role) {
                throw new RuntimeException(
                    'La estructura de tokens requiere privilegios del propietario. '.
                    'Ejecute primero Gestión_horas_MATSSO/database/02_expand_mobile_token_security.sql '.
                    'como postgres y vuelva a lanzar la migración.'
                );
            }

            DB::unprepared(file_get_contents(
                database_path('sql/02_expand_mobile_token_security.sql')
            ));
        }

        DB::table('asistencia.tokens_movil')
            ->select(['id', 'token', 'creado_en'])
            ->whereNull('token_hash')
            ->orderBy('id')
            ->chunkById(100, function ($tokens): void {
                foreach ($tokens as $token) {
                    DB::table('asistencia.tokens_movil')
                        ->where('id', $token->id)
                        ->whereNull('token_hash')
                        ->update([
                            'token_hash' => hash('sha256', (string) $token->token),
                            'rotado_en' => $token->creado_en,
                        ]);
                }
            });

        $missingHashes = DB::table('asistencia.tokens_movil')
            ->whereNull('token_hash')
            ->count();

        if ($missingHashes > 0) {
            throw new RuntimeException(
                "La expansión de tokens quedó incompleta: {$missingHashes} filas no tienen hash."
            );
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql' || ! Schema::hasTable('asistencia.tokens_movil')) {
            return;
        }

        DB::unprepared(<<<'SQL'
            DROP INDEX IF EXISTS asistencia.tokens_movil_token_hash_unique;
            ALTER TABLE asistencia.tokens_movil
                DROP CONSTRAINT IF EXISTS tokens_movil_token_hash_format_check,
                DROP COLUMN IF EXISTS token_hash,
                DROP COLUMN IF EXISTS expira_en,
                DROP COLUMN IF EXISTS revocado_en,
                DROP COLUMN IF EXISTS rotado_en;
            SQL);
    }
};
