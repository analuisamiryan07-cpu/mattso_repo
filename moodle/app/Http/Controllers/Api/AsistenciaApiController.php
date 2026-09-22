<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Empleado;
use App\Models\Horario;
use App\Models\RegistroAsistencia;
use App\Models\TokenMovil;
use App\Models\User;
use App\Services\AsistenciaService;
use App\Services\MobileTokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AsistenciaApiController extends Controller
{
    // Nombres legibles para mostrarle al empleado — nunca mostrar el valor
    // interno (LLEGADA, SALIDA_ALMUERZO, etc.) directo en un mensaje de error.
    private const TIPO_LABELS = [
        'LLEGADA'          => 'Llegada',
        'SALIDA_ALMUERZO'  => 'Salida de almuerzo',
        'REGRESO_ALMUERZO' => 'Regreso de almuerzo',
        'SALIDA'           => 'Salida',
    ];

    public function __construct(
        private readonly AsistenciaService $asistencia,
        private readonly MobileTokenService $tokens,
    ) {}

    // ── POST /api/asistencia/registrar ─────────────────────────────────────────
    // Primera vez: crea usuario VENDEDOR + empleado + horario default + token.
    // ip_celular lo detecta la app y lo envía en el body.
    public function registrar(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nombres_completos' => 'required|string|max:150',
            'cedula'            => 'required|string|max:20',
            'genero'            => 'required|in:M,F',
            'correo'            => 'nullable|email|max:150',
            'celular'           => 'nullable|string|max:20',
            'fecha_nacimiento'  => 'nullable|date',
            'ip_celular'        => 'required|string',
            'password'          => 'required|string|min:6',
            'dispositivo'       => 'nullable|string|max:200',
        ], [
            'nombres_completos.required' => 'Escribe tu nombre completo.',
            'cedula.required'            => 'Escribe tu número de cédula.',
            'genero.required'            => 'Selecciona tu género.',
            'genero.in'                  => 'Selecciona un género válido.',
            'correo.email'               => 'El correo electrónico no es válido.',
            'ip_celular.required'        => 'No se pudo detectar tu celular. Revisa que estés conectado al wifi de la empresa e intenta de nuevo.',
            'password.required'          => 'Escribe una contraseña.',
            'password.min'               => 'La contraseña debe tener al menos 6 caracteres.',
        ]);

        if (User::where('usuario', $data['cedula'])->where('rol', 'VENDEDOR')->exists()) {
            return response()->json([
                'error' => 'Ya existe una cuenta registrada con esa cédula. Si es tuya, inicia sesión en vez de registrarte de nuevo.',
            ], 409);
        }

        [$user, $token] = DB::transaction(function () use ($data) {
            $user = User::create([
                'usuario'         => $data['cedula'],
                'password_hash'   => Hash::make($data['password']),
                'rol'             => 'VENDEDOR',
                'activo'          => true,
                'nombre_completo' => $data['nombres_completos'],
            ]);

            $empleado = Empleado::create([
                'usuario_id'        => $user->id,
                'nombres_completos' => $data['nombres_completos'],
                'cedula'            => $data['cedula'],
                'genero'            => $data['genero'],
                'correo'            => $data['correo'] ?? null,
                'celular'           => $data['celular'] ?? null,
                'fecha_nacimiento'  => $data['fecha_nacimiento'] ?? null,
                'estado'            => 'activo',
                'ip_celular_enc'    => $this->asistencia->encryptIp($data['ip_celular']),
            ]);

            Horario::create([
                'empleado_id'           => $empleado->id,
                'hora_entrada'          => '08:00',
                'hora_salida_almuerzo'  => '13:00',
                'hora_regreso_almuerzo' => '14:00',
                'hora_salida'           => '17:00',
            ]);

            $token = Str::random(64);
            TokenMovil::create([
                'empleado_id' => $empleado->id,
                'token'       => $this->tokens->protect($token),
                'token_hash'  => $this->tokens->hash($token),
                'dispositivo' => $data['dispositivo'] ?? null,
                'ultimo_uso'  => now(),
                'rotado_en'   => now(),
            ]);

            return [$user, $token];
        });

        return response()->json([
            'token'  => $token,
            'nombre' => $user->nombre_completo,
        ], 201);
    }

    // ── POST /api/asistencia/login ──────────────────────────────────────────────
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'cedula'      => 'required|string',
            'password'    => 'required|string',
            'dispositivo' => 'nullable|string|max:200',
        ], [
            'cedula.required'   => 'Escribe tu número de cédula.',
            'password.required' => 'Escribe tu contraseña.',
        ]);

        $user = User::where('usuario', $data['cedula'])
                    ->where('rol', 'VENDEDOR')
                    ->where('activo', true)
                    ->first();

        if (!$user || !Hash::check($data['password'], $user->password_hash)) {
            return response()->json(['error' => 'La cédula o la contraseña no son correctas. Revísalas e intenta de nuevo.'], 401);
        }

        $empleado    = Empleado::where('usuario_id', $user->id)->firstOrFail();
        $tokenRecord = $empleado->tokens()->first();

        if (!$tokenRecord) {
            $token       = Str::random(64);
            $tokenRecord = TokenMovil::create([
                'empleado_id' => $empleado->id,
                'token'       => $this->tokens->protect($token),
                'token_hash'  => $this->tokens->hash($token),
                'dispositivo' => $data['dispositivo'] ?? null,
                'ultimo_uso'  => now(),
                'rotado_en'   => now(),
            ]);
        } else {
            $token = $this->tokens->reveal($tokenRecord->token);
            $updates = ['ultimo_uso' => now()];
            if (! $tokenRecord->token_hash) {
                $updates['token_hash'] = $this->tokens->hash($token);
            }
            $tokenRecord->updateQuietly($updates);
        }

        return response()->json([
            'token'  => $token,
            'nombre' => $user->nombre_completo,
        ]);
    }

    // ── POST /api/asistencia/marcar ────────────────────────────────────────────
    // Registra una marcación. Para LLEGADA y REGRESO_ALMUERZO:
    //   1) verifica red de empresa
    //   2) verifica ip_celular (debe ser la misma IP fija del registro)
    //   3) hace un único ping (3 intentos) a ip_computadora del empleado
    //   4) si responde, guarda con hora_confirmada=hora_marcacion (confirmación
    //      inmediata); no hay una segunda verificación posterior.
    // Para SALIDA_ALMUERZO y SALIDA:
    //   1) verifica red de empresa
    //   2) guarda con hora_confirmada=hora_marcacion (confirmación inmediata)
    public function marcar(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tipo' => 'required|in:LLEGADA,SALIDA_ALMUERZO,REGRESO_ALMUERZO,SALIDA',
        ], [
            'tipo.required' => 'Falta indicar qué vas a marcar. Cierra y vuelve a abrir la app e intenta de nuevo.',
            'tipo.in'       => 'Ese tipo de marcación no es válido. Cierra y vuelve a abrir la app e intenta de nuevo.',
        ]);

        /** @var Empleado $empleado */
        $empleado = $request->attributes->get('empleado');

        // 1. Verificar red de empresa
        if (!$this->asistencia->isOnCompanyNetwork($request)) {
            return response()->json([
                'error' => 'No estás conectado al wifi de la empresa. Conéctate a esa red e intenta de nuevo.',
            ], 403);
        }

        // 2. Para marcaciones de entrada: verificar IPs
        if (in_array($data['tipo'], ['LLEGADA', 'REGRESO_ALMUERZO'])) {

            // 2a. Verificar que la request viene del celular registrado.
            // La IP del celular queda fija (estática) desde el registro; si no
            // coincide, se rechaza. La IP debe mantenerse fija en el dispositivo
            // (ver configuración de IP estática) en vez de dejar que el sistema
            // la actualice sola.
            if ($empleado->ip_celular_enc) {
                $ipCelular = $this->asistencia->decryptIp($empleado->ip_celular_enc);
                if ($ipCelular && $request->ip() !== $ipCelular) {
                    return response()->json([
                        'error' => 'Este no es el celular con el que te registraste. Marca siempre desde el mismo celular, o contacta al administrador si cambiaste de equipo.',
                    ], 403);
                }
            }

            // 2b. Ping al equipo del empleado
            if (!$empleado->ip_computadora_enc) {
                return response()->json([
                    'error' => 'Tu computadora todavía no está registrada en el sistema. Avisa al administrador para que la configure.',
                ], 403);
            }

            $ipPC = $this->asistencia->decryptIp($empleado->ip_computadora_enc);
            if (!$ipPC || !$this->asistencia->pingIp($ipPC)) {
                return response()->json([
                    'error' => 'No se pudo confirmar que tu computadora esté encendida y conectada. Verifícalo e intenta de nuevo.',
                ], 422);
            }
        }

        $ahora = $this->asistencia->ahoraGuayaquil();
        $fecha = $ahora->toDateString();

        // 3. Evitar duplicados
        if (RegistroAsistencia::where('empleado_id', $empleado->id)
                              ->where('fecha', $fecha)
                              ->where('tipo', $data['tipo'])
                              ->exists()) {
            $label = self::TIPO_LABELS[$data['tipo']] ?? $data['tipo'];
            return response()->json(['error' => "Ya registraste tu {$label} de hoy. No puedes marcarla dos veces."], 409);
        }

        // 4. Crear registro
        // El ping (si aplica) ya se validó arriba de forma síncrona, así que la
        // hora queda asentada de inmediato. Para LLEGADA/REGRESO_ALMUERZO la app
        // y el panel muestran "verificando…" solo como efecto visual durante los
        // primeros 10 minutos (ver formatMarcacion() y las vistas admin/horas).
        $horario = $empleado->horario;

        $atrasoInmediato = 0;
        if ($horario && !$empleado->es_pasante) {
            $atrasoInmediato = $this->asistencia->calcularAtrasoMinutos($data['tipo'], $horario, $ahora);
        }

        $registro = RegistroAsistencia::create([
            'empleado_id'         => $empleado->id,
            'tipo'                => $data['tipo'],
            'hora_marcacion'      => $ahora,
            'hora_confirmada'     => $ahora,
            'minutos_descontados' => 0,
            'fecha'               => $fecha,
            'atraso_minutos'      => $atrasoInmediato,
        ]);

        return response()->json([
            'success' => true,
            'tipo'    => $registro->tipo,
            'hora'    => $ahora->format('H:i'),
        ]);
    }

    // ── GET /api/asistencia/estado-hoy ────────────────────────────────────────
    public function estadoHoy(Request $request): JsonResponse
    {
        /** @var Empleado $empleado */
        $empleado = $request->attributes->get('empleado');
        $ahora    = $this->asistencia->ahoraGuayaquil();
        $fecha    = $ahora->toDateString();
        $horario  = $empleado->horario;

        $registros = RegistroAsistencia::where('empleado_id', $empleado->id)
                        ->where('fecha', $fecha)
                        ->get()
                        ->keyBy('tipo');

        return response()->json([
            'nombre'         => $empleado->usuario->nombre_completo,
            'fecha'          => $fecha,
            'hora_actual'    => $ahora->format('H:i:s'),
            'ip_configurada' => !empty($empleado->ip_computadora_enc),
            'marcaciones'    => [
                'LLEGADA'          => $this->formatMarcacion($registros->get('LLEGADA'),          $horario, 'LLEGADA',          $empleado->es_pasante),
                'SALIDA_ALMUERZO'  => $this->formatMarcacion($registros->get('SALIDA_ALMUERZO'),  $horario, 'SALIDA_ALMUERZO',  $empleado->es_pasante),
                'REGRESO_ALMUERZO' => $this->formatMarcacion($registros->get('REGRESO_ALMUERZO'), $horario, 'REGRESO_ALMUERZO', $empleado->es_pasante),
                'SALIDA'           => $this->formatMarcacion($registros->get('SALIDA'),           $horario, 'SALIDA',           $empleado->es_pasante),
            ],
            'horarios_esperados' => [
                'llegada'          => $horario ? substr($horario->hora_entrada, 0, 5)          : '08:00',
                'salida_almuerzo'  => $horario ? substr($horario->hora_salida_almuerzo, 0, 5)  : '13:00',
                'regreso_almuerzo' => $horario ? substr($horario->hora_regreso_almuerzo, 0, 5) : '14:00',
                'salida'           => $horario ? substr($horario->hora_salida, 0, 5)           : '17:00',
            ],
        ]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function formatMarcacion(
        ?RegistroAsistencia $r,
        ?Horario $horario  = null,
        string   $tipo     = '',
        bool     $pasante  = false
    ): ?array {
        if (!$r) return null;

        $horaBase = $r->hora_confirmada ?? $r->hora_marcacion;
        $hora     = \Carbon\Carbon::parse($horaBase);

        // Calcular atraso con aritmética (igual que el panel) — evita bug de Carbon que guarda 0 en DB
        $atrasoMin = 0;
        if ($horario && !$pasante && in_array($tipo, ['LLEGADA', 'REGRESO_ALMUERZO'])) {
            $esperadaStr = $tipo === 'LLEGADA'
                ? $horario->hora_entrada
                : $horario->hora_regreso_almuerzo;
            [$eH, $eM] = array_map('intval', explode(':', substr($esperadaStr, 0, 5)));
            $atrasoMin  = max(0, ($hora->hour * 60 + $hora->minute) - ($eH * 60 + $eM));
        }

        // "Verificando…": la hora ya quedó asentada al marcar (un solo ping),
        // pero para LLEGADA/REGRESO_ALMUERZO se muestra como pendiente los
        // primeros 10 minutos (solo efecto visual, no reintenta nada).
        // hora_marcacion llega de Eloquent etiquetada +00 (UTC) aunque el valor
        // real son dígitos de hora local Guayaquil — hay que reconstruir el
        // string y re-etiquetarlo antes de comparar, si no diffInMinutes()
        // calcula ~5h de diferencia en vez de los minutos reales.
        $confirmado = true;
        if (in_array($tipo, ['LLEGADA', 'REGRESO_ALMUERZO'])) {
            $marcacionStr = $r->hora_marcacion instanceof \Carbon\Carbon
                ? $r->hora_marcacion->format('Y-m-d H:i:s')
                : substr((string) $r->hora_marcacion, 0, 19);
            $marcacion  = \Carbon\Carbon::createFromFormat('Y-m-d H:i:s', $marcacionStr, 'America/Guayaquil');
            $confirmado = $marcacion->diffInMinutes(\Carbon\Carbon::now('America/Guayaquil')) >= 10;
        }

        return [
            'hora'           => $hora->format('H:i:s'),
            'atraso_minutos' => $atrasoMin,
            'confirmado'     => $confirmado,
        ];
    }
}
