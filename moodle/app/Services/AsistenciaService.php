<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class AsistenciaService
{
    private const TZ = 'America/Guayaquil';

    // ── Cifrado de IPs ─────────────────────────────────────────────────────────

    public function encryptIp(string $ip): string
    {
        $key = $this->derivedKey();
        $iv  = random_bytes(16);
        $enc = openssl_encrypt($ip, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv);
        return base64_encode($iv . $enc);
    }

    public function decryptIp(string $data): ?string
    {
        $raw = base64_decode($data, true);
        if (!$raw || strlen($raw) < 17) {
            return null;
        }
        $key    = $this->derivedKey();
        $iv     = substr($raw, 0, 16);
        $enc    = substr($raw, 16);
        $result = openssl_decrypt($enc, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv);
        return $result !== false ? $result : null;
    }

    private function derivedKey(): string
    {
        return substr(hash('sha256', config('asistencia.ip_key', ''), true), 0, 32);
    }

    // ── Ping ───────────────────────────────────────────────────────────────────

    public function pingIp(string $ip): bool
    {
        $ip = filter_var(trim($ip), FILTER_VALIDATE_IP);
        if (!$ip) {
            return false;
        }
        // 3 paquetes en vez de 1: `ping -c N` en Linux devuelve código 0 si al
        // menos UNA respuesta llegó. Con un solo paquete, una pérdida normal de
        // wifi (muy común aunque el equipo esté encendido y en uso) rechazaba
        // marcaciones válidas. Con 3 intentos basta que responda una vez.
        exec('ping -c 3 -W 2 ' . escapeshellarg($ip) . ' 2>/dev/null', $output, $code);
        return $code === 0;
    }

    // ── Verificación de red de empresa ─────────────────────────────────────────

    public function isOnCompanyNetwork(Request $request): bool
    {
        $prefix = config('asistencia.red_empresa', '192.168.100');
        return str_starts_with($request->ip() ?? '', $prefix . '.');
    }

    // ── Hora actual (como string local, sin conversión de timezone) ────────────
    // Las columnas en PostgreSQL son de tipo TIMESTAMPTZ (timestamp with time zone).
    // La sesión de PostgreSQL opera en UTC (Etc/UTC) y Laravel envía los dígitos
    // de la hora local de Guayaquil ('Y-m-d H:i:s'), por lo que PostgreSQL almacena
    // dichos dígitos con etiqueta +00. Se retorna Carbon formateado para mantener
    // la compatibilidad con este esquema al persistir y leer de la BD.

    public function ahoraGuayaquil(): Carbon
    {
        $now = Carbon::now(self::TZ);
        // Devolver como Carbon con los dígitos de hora local de Ecuador para
        // inserción en la sesión UTC de PostgreSQL (almacenando dígitos locales con +00).
        return Carbon::createFromFormat('Y-m-d H:i:s', $now->format('Y-m-d H:i:s'));
    }

    // ── Cálculo de atraso en minutos ───────────────────────────────────────────
    // $hora es un Carbon con los dígitos de hora local de marcación.

    public function calcularAtrasoMinutos(string $tipo, object $horario, Carbon $hora): int
    {
        $fecha = $hora->format('Y-m-d');

        switch ($tipo) {
            case 'LLEGADA':
                $esperada = Carbon::parse($fecha . ' ' . $horario->hora_entrada);
                return max(0, (int) round($hora->diffInMinutes($esperada, false) * -1));

            case 'REGRESO_ALMUERZO':
                $esperada = Carbon::parse($fecha . ' ' . $horario->hora_regreso_almuerzo);
                return max(0, (int) round($hora->diffInMinutes($esperada, false) * -1));

            default:
                // SALIDA y SALIDA_ALMUERZO no generan tardanza.
                // La salida temprana se refleja en las horas trabajadas, no en retraso.
                return 0;
        }
    }

    // ── Cálculo de horas netas trabajadas en un día ────────────────────────────
    // Recibe la colección keyBy('tipo') de registros de un día.
    // Devuelve minutos netos o null si no hay llegada + salida.
    //
    // Caso A: solo LLEGADA + SALIDA → netos = SALIDA - LLEGADA
    // Caso B: las 4 marcas           → netos = (S_ALM - LLEGADA) + (SALIDA - R_ALM)

    public function calcularHorasNetas(Collection $tipos): ?int
    {
        $llegada = $tipos->get('LLEGADA');
        $salida  = $tipos->get('SALIDA');

        if (!$llegada || !$salida) return null;

        $tLlegada = Carbon::parse($llegada->hora_confirmada ?? $llegada->hora_marcacion);
        $tSalida  = Carbon::parse($salida->hora_confirmada  ?? $salida->hora_marcacion);

        $salidaAlm  = $tipos->get('SALIDA_ALMUERZO');
        $regresoAlm = $tipos->get('REGRESO_ALMUERZO');

        if ($salidaAlm && $regresoAlm) {
            $tSalidaAlm  = Carbon::parse($salidaAlm->hora_confirmada  ?? $salidaAlm->hora_marcacion);
            $tRegresoAlm = Carbon::parse($regresoAlm->hora_confirmada ?? $regresoAlm->hora_marcacion);
            $minutos     = $tLlegada->diffInMinutes($tSalidaAlm) + $tRegresoAlm->diffInMinutes($tSalida);
        } else {
            $minutos = $tLlegada->diffInMinutes($tSalida);
        }

        return max(0, (int) $minutos);
    }
}
