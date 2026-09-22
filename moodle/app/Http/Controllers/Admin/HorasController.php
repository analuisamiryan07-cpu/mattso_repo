<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empleado;
use App\Models\Horario;
use App\Models\NotaAsistencia;
use App\Models\RegistroAsistencia;
use App\Services\AsistenciaService;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class HorasController extends Controller
{
    public function __construct(private readonly AsistenciaService $asistencia) {}

    // ── GET /admin/horas ──────────────────────────────────────────────────────
    public function index(Request $request): View
    {
        $periodo = $request->input('periodo', 'hoy');
        [$desde, $hasta] = $this->rangoFechas($periodo, $request->input('fecha'));

        $empleados = Empleado::with(['usuario', 'horario', 'registros' => function ($q) use ($desde, $hasta) {
            $q->whereBetween('fecha', [$desde, $hasta])
              ->orderBy('fecha')
              ->orderBy('hora_marcacion');
        }])
        ->where('estado', 'activo')
        ->whereHas('usuario', fn ($q) => $q->where('activo', true))
        ->orderBy('primer_apellido')
        ->orderBy('segundo_apellido')
        ->orderBy('primer_nombre')
        ->get();

        $hoy      = Carbon::today('America/Guayaquil')->toDateString();
        $llegaron = RegistroAsistencia::where('fecha', $hoy)->where('tipo', 'LLEGADA')->count();
        $totalEmp = $empleados->count();

        // Tardanzas calculadas con aritmética (no lee atraso_minutos del DB)
        $tardanzas = $empleados->filter(function ($emp) use ($hoy) {
            if ($emp->es_pasante || !$emp->horario) return false;
            $llegada = $emp->registros
                ->filter(fn($r) => (
                    $r->fecha instanceof Carbon
                        ? $r->fecha->toDateString()
                        : (string) $r->fecha
                ) === $hoy)
                ->firstWhere('tipo', 'LLEGADA');
            if (!$llegada) return false;
            $hora    = Carbon::parse($llegada->hora_confirmada ?? $llegada->hora_marcacion);
            $marcMin = $hora->hour * 60 + $hora->minute;
            [$eH, $eM] = array_map('intval', explode(':', substr($emp->horario->hora_entrada, 0, 5)));
            return $marcMin > ($eH * 60 + $eM);
        })->count();

        return view('admin.horas.index', compact(
            'empleados', 'periodo', 'desde', 'hasta',
            'llegaron', 'totalEmp', 'tardanzas'
        ));
    }

    // ── GET /admin/horas/empleado/{id} ────────────────────────────────────────
    public function detalle(int $id, Request $request): View
    {
        $empleado = Empleado::with(['usuario', 'horario'])->findOrFail($id);

        $filtros = $request->validate([
            'periodo' => ['nullable', 'in:semana,mes'],
            'fecha'   => ['nullable', 'date_format:Y-m-d'],
        ]);

        $periodo        = $filtros['periodo'] ?? 'mes';
        $fechaIngresada = $filtros['fecha'] ?? null;
        [$desde, $hasta] = $this->rangoFechas($periodo, $fechaIngresada);

        $fechaReferencia = $fechaIngresada
            ? Carbon::createFromFormat('Y-m-d', $fechaIngresada, 'America/Guayaquil')
            : Carbon::today('America/Guayaquil');

        if ($periodo === 'semana') {
            $fechaAnterior = $fechaReferencia->copy()->subWeek()->toDateString();
            $fechaSiguiente = $fechaReferencia->copy()->addWeek()->toDateString();
            $periodoTitulo = 'Semana del '
                . Carbon::parse($desde)->locale('es')->isoFormat('D [de] MMMM')
                . ' al '
                . Carbon::parse($hasta)->locale('es')->isoFormat('D [de] MMMM [de] YYYY');
        } else {
            $fechaAnterior = $fechaReferencia->copy()->subMonthNoOverflow()->startOfMonth()->toDateString();
            $fechaSiguiente = $fechaReferencia->copy()->addMonthNoOverflow()->startOfMonth()->toDateString();
            $periodoTitulo = ucfirst(Carbon::parse($desde)->locale('es')->isoFormat('MMMM [de] YYYY'));
        }

        $hoyPeriodo = Carbon::today('America/Guayaquil')->toDateString();
        $esPeriodoActual = $hoyPeriodo >= $desde && $hoyPeriodo <= $hasta;

        // La grilla se muestra completa (incluye sáb/dom), pero los cálculos de
        // meta/atraso/déficit siguen siendo solo de lunes a viernes: por eso el
        // rango de consulta y de despliegue ($hastaMostrar) puede ser más amplio
        // que el rango "oficial" ($desde/$hasta) usado para esos totales.
        $hastaMostrar = $periodo === 'semana'
            ? Carbon::parse($desde)->addDays(6)->toDateString()
            : $hasta;

        $registros = RegistroAsistencia::where('empleado_id', $id)
            ->whereBetween('fecha', [$desde, $hastaMostrar])
            ->orderBy('fecha')
            ->orderBy('hora_marcacion')
            ->get()
            ->groupBy(fn($r) => $r->fecha instanceof Carbon
                ? $r->fecha->toDateString()
                : (string) $r->fecha);

        $dias = [];
        foreach (CarbonPeriod::create($desde, $hastaMostrar) as $day) {
            $dateStr = $day->toDateString();
            $dayRegs = $registros->get($dateStr, collect());
            $tipos   = $dayRegs->keyBy('tipo');

            $minutosNetos = $this->asistencia->calcularHorasNetas($tipos);

            // Pasantes no acumulan atraso (horario de entrada variable)
            $atrasoTotal = $empleado->es_pasante ? 0 : $dayRegs->sum('atraso_minutos');

            $dias[] = [
                'fecha'              => $dateStr,
                'dia_semana'         => $day->locale('es')->isoFormat('ddd'),
                'registros'          => $dayRegs,
                'tipos'              => $tipos,
                'minutos_trabajados' => $minutosNetos,
                'atraso_total'       => $atrasoTotal,
                // Sábado/domingo: solo se muestran, nunca entran en los totales.
                'es_fin_semana'      => $day->isWeekend(),
            ];
        }

        $diasLaborables = collect($dias)->reject(fn($d) => $d['es_fin_semana']);

        $totalAtraso    = $diasLaborables->sum('atraso_total');
        $diasConLlegada = $diasLaborables->filter(fn($d) => $d['tipos']->has('LLEGADA'))->count();
        $totalMinutos   = $diasLaborables->whereNotNull('minutos_trabajados')->sum('minutos_trabajados');
        // Meta estándar: semana=5 días, mes=20 días (igual que el Código Laboral de Ecuador)
        $metaDiariaH = $empleado->es_pasante ? 6 : 8;
        $metaHoras   = $periodo === 'semana'
            ? ($empleado->es_pasante ? 30  : 40)
            : ($empleado->es_pasante ? 120 : 160);

        // Para pasantes: déficit = suma de (360 min - trabajados) por día con marcaciones
        $metaDiariaMinutos = $empleado->es_pasante ? 360 : null;
        $deficitMinutos    = null;
        if ($empleado->es_pasante) {
            $deficitMinutos = $diasLaborables->reduce(function ($carry, $dia) {
                if ($dia['minutos_trabajados'] !== null) {
                    return $carry + max(0, 360 - $dia['minutos_trabajados']);
                }
                return $carry;
            }, 0);
        }

        $notas = NotaAsistencia::where('empleado_id', $id)
            ->whereBetween('fecha', [$desde, $hastaMostrar])
            ->get()
            ->keyBy(fn($n) => $n->fecha instanceof Carbon
                ? $n->fecha->toDateString()
                : (string) $n->fecha);

        return view('admin.horas.detalle', compact(
            'empleado', 'periodo', 'desde', 'hasta',
            'dias', 'totalAtraso', 'diasConLlegada',
            'totalMinutos', 'metaHoras', 'metaDiariaH',
            'metaDiariaMinutos', 'deficitMinutos',
            'notas', 'fechaReferencia', 'fechaAnterior',
            'fechaSiguiente', 'periodoTitulo', 'esPeriodoActual'
        ));
    }

    // ── PATCH /admin/horas/empleados/{id}/grupo ───────────────────────────────
    public function asignarGrupo(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'grupo'      => 'required|boolean',
            'es_pasante' => 'required|boolean',
        ]);

        $empleado = Empleado::findOrFail($id);
        $empleado->update([
            'grupo'      => $data['grupo'],
            'es_pasante' => $data['es_pasante'],
        ]);

        // Auto-llenar horario según el grupo asignado
        $almuerzoSalida  = $data['grupo'] ? '13:00' : '13:30';
        $almuerzoRegreso = $data['grupo'] ? '14:00' : '14:30';

        Horario::updateOrCreate(
            ['empleado_id' => $empleado->id],
            [
                'hora_entrada'          => '08:00',
                'hora_salida_almuerzo'  => $almuerzoSalida,
                'hora_regreso_almuerzo' => $almuerzoRegreso,
                'hora_salida'           => '17:00',
            ]
        );

        $label = $data['grupo'] ? 'Grupo 1' : 'Grupo 2';
        $tipo  = $data['es_pasante'] ? ' · Pasante' : '';
        return response()->json(['success' => true, 'message' => "{$label}{$tipo} asignado correctamente."]);
    }

    // ── PATCH /admin/horas/empleados/{id}/horario ─────────────────────────────
    public function actualizarHorario(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'hora_entrada'          => 'required|date_format:H:i',
            'hora_salida_almuerzo'  => 'required|date_format:H:i',
            'hora_regreso_almuerzo' => 'required|date_format:H:i',
            'hora_salida'           => 'required|date_format:H:i',
        ]);

        $empleado = Empleado::findOrFail($id);

        Horario::updateOrCreate(
            ['empleado_id' => $empleado->id],
            $data
        );

        return response()->json(['success' => true, 'message' => 'Horario actualizado correctamente.']);
    }

    // ── PATCH /admin/horas/empleados/{id}/configurar-ip ──────────────────────
    public function configurarIp(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'ip_computadora' => ['required', 'string', 'regex:/^\d{1,3}(\.\d{1,3}){3}$/'],
        ]);

        $empleado = Empleado::findOrFail($id);
        $enc      = $this->asistencia->encryptIp($data['ip_computadora']);
        $empleado->update(['ip_computadora_enc' => $enc]);

        return response()->json(['success' => true, 'message' => 'IP configurada correctamente.']);
    }

    // ── POST /admin/horas/empleado/{id}/nota ──────────────────────────────────
    public function guardarNota(Request $request, int $id): \Illuminate\Http\RedirectResponse
    {
        $data = $request->validate([
            'fecha' => 'required|date',
            'nota'  => 'required|string|max:1000',
        ]);

        Empleado::findOrFail($id);

        NotaAsistencia::updateOrCreate(
            ['empleado_id' => $id, 'fecha' => $data['fecha']],
            ['nota'        => $data['nota']]
        );

        return redirect()->back();
    }

    // ── DELETE /admin/horas/empleado/{id}/nota ────────────────────────────────
    public function borrarNota(Request $request, int $id): \Illuminate\Http\RedirectResponse
    {
        $data = $request->validate(['fecha' => 'required|date']);

        NotaAsistencia::where('empleado_id', $id)
                      ->where('fecha', $data['fecha'])
                      ->delete();

        return redirect()->back();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function rangoFechas(string $periodo, ?string $fecha): array
    {
        $ref = $fecha
            ? Carbon::parse($fecha, 'America/Guayaquil')
            : Carbon::today('America/Guayaquil');

        return match ($periodo) {
            'semana' => [
                $ref->copy()->startOfWeek(Carbon::MONDAY)->toDateString(),
                $ref->copy()->startOfWeek(Carbon::MONDAY)->addDays(4)->toDateString(),
            ],
            'mes' => [
                $ref->copy()->startOfMonth()->toDateString(),
                $ref->copy()->endOfMonth()->toDateString(),
            ],
            default => [
                Carbon::today('America/Guayaquil')->toDateString(),
                Carbon::today('America/Guayaquil')->toDateString(),
            ],
        };
    }
}
