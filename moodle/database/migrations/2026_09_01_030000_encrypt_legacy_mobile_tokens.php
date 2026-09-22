<?php

use App\Services\MobileTokenService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql'
            || ! Schema::hasColumns('asistencia.tokens_movil', ['token', 'token_hash'])) {
            return;
        }

        $tokens = app(MobileTokenService::class);

        DB::table('asistencia.tokens_movil')
            ->select(['id', 'token', 'token_hash'])
            ->orderBy('id')
            ->chunkById(100, function ($records) use ($tokens): void {
                foreach ($records as $record) {
                    $stored = (string) $record->token;
                    $raw = $tokens->reveal($stored);
                    $expectedHash = trim((string) $record->token_hash);

                    if ($expectedHash === '' || ! hash_equals($expectedHash, $tokens->hash($raw))) {
                        throw new RuntimeException(
                            "El token ID {$record->id} no coincide con su hash; no se cifró el lote."
                        );
                    }

                    if (hash_equals($stored, $raw)) {
                        DB::table('asistencia.tokens_movil')
                            ->where('id', $record->id)
                            ->where('token', $stored)
                            ->update(['token' => $tokens->protect($raw)]);
                    }
                }
            });

        $invalid = DB::table('asistencia.tokens_movil')
            ->get(['id', 'token', 'token_hash'])
            ->filter(function ($record) use ($tokens): bool {
                $stored = (string) $record->token;
                $raw = $tokens->reveal($stored);

                return hash_equals($stored, $raw)
                    || ! hash_equals(trim((string) $record->token_hash), $tokens->hash($raw));
            })
            ->count();

        if ($invalid > 0) {
            throw new RuntimeException(
                "La protección de tokens quedó incompleta en {$invalid} filas."
            );
        }
    }

    public function down(): void
    {
        // No se restaura texto legible automáticamente. Existe un respaldo
        // cifrado previo y los celulares conservan los tokens originales.
    }
};
