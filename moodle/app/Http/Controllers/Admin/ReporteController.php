<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empleado;
use App\Models\NotaAsistencia;
use App\Models\RegistroAsistencia;
use App\Services\AsistenciaService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\NamedRange;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Symfony\Component\HttpFoundation\Response;

class ReporteController extends Controller
{
    // Nombres definidos que la macro de la plantilla usa para encontrar la
    // tabla sin depender de un numero de fila fijo (ver ModFiltro.vba).
    private const NOMBRE_ENCABEZADO = 'TablaEncabezado';
    private const NOMBRE_DATOS_INICIO = 'TablaDatosInicio';

    public function __construct(private readonly AsistenciaService $asistencia) {}

    // ── GET /admin/horas/reporte/global ───────────────────────────────────────
    public function global(Request $request): Response
    {
        $empleados = Empleado::with(['horario'])->orderBy('primer_apellido')->orderBy('segundo_apellido')->orderBy('primer_nombre')->get();

        $allNotas = NotaAsistencia::all()->keyBy(
            fn($n) => $n->empleado_id . '_' . ($n->fecha instanceof Carbon
                ? $n->fecha->toDateString() : (string) $n->fecha)
        );

        $desde = $request->query('desde');
        $hasta = $request->query('hasta');
        $rows = [];
        foreach ($empleados as $emp) {
            $registros = RegistroAsistencia::where('empleado_id', $emp->id)
                ->when($desde, fn($q) => $q->whereDate('fecha', '>=', $desde))
                ->when($hasta, fn($q) => $q->whereDate('fecha', '<=', $hasta))
                ->orderBy('fecha')->orderBy('hora_marcacion')->get()
                ->groupBy(fn($r) => $r->fecha instanceof Carbon
                    ? $r->fecha->toDateString() : (string) $r->fecha);

            $empNotaFechas = $allNotas
                ->filter(fn($n) => $n->empleado_id === $emp->id)
                ->keys()
                ->map(fn($k) => substr($k, strpos($k, '_') + 1))
                ->filter(fn($f) => (!$desde || $f >= $desde) && (!$hasta || $f <= $hasta));

            $todasFechas = $registros->keys()
                ->merge($empNotaFechas)
                ->unique()->sort()->values();

            foreach ($todasFechas as $fecha) {
                $dayRegs    = $registros->get($fecha, collect());
                $tipos      = $dayRegs->keyBy('tipo');
                $llegada    = $tipos->get('LLEGADA');
                $salidaAlm  = $tipos->get('SALIDA_ALMUERZO');
                $regresoAlm = $tipos->get('REGRESO_ALMUERZO');
                $salida     = $tipos->get('SALIDA');

                $atrasoMin = $this->atrasoAritmetico($llegada, $emp);
                $minutos   = $this->asistencia->calcularHorasNetas($tipos);
                $metaMin   = $emp->es_pasante ? 360 : 480;
                $deficit   = $minutos !== null ? max(0, $metaMin - $minutos) : null;
                $nota      = $allNotas->get($emp->id . '_' . $fecha);
                $fc        = Carbon::parse($fecha);

                $rows[] = [
                    'cols' => [
                        $emp->primer_apellido . ' ' . $emp->segundo_apellido . ' ' . $emp->primer_nombre . ' ' . $emp->segundo_nombre,
                        $emp->cedula,
                        $emp->grupo !== null ? ($emp->grupo ? 'Grupo 1' : 'Grupo 2') : '-',
                        $emp->es_pasante ? 'Pasante' : 'No pasante',
                        $fc->format('d/m/Y'),
                        ucfirst($fc->locale('es')->isoFormat('dddd')),
                        $llegada    ? Carbon::parse($llegada->hora_confirmada    ?? $llegada->hora_marcacion)->format('H:i:s')    : '-',
                        $atrasoMin  > 0 ? '+' . $this->fmtMin($atrasoMin) : '-',
                        $salidaAlm  ? Carbon::parse($salidaAlm->hora_confirmada  ?? $salidaAlm->hora_marcacion)->format('H:i:s')  : '-',
                        $regresoAlm ? Carbon::parse($regresoAlm->hora_confirmada ?? $regresoAlm->hora_marcacion)->format('H:i:s') : '-',
                        $salida     ? Carbon::parse($salida->hora_confirmada     ?? $salida->hora_marcacion)->format('H:i:s')     : '-',
                        $minutos !== null ? $this->fmtMin($minutos) : '-',
                        $fc->isWeekend() ? '' : $this->fmtMin($metaMin),
                        $fc->isWeekend() ? '' : ($deficit !== null ? ($deficit === 0 ? 'Cumplido' : '-' . $this->fmtMin($deficit)) : '-'),
                        $nota?->nota ?? '',
                    ],
                    'es_pasante'    => $emp->es_pasante,
                    'atraso'        => $atrasoMin,
                    'deficit'       => $deficit,
                    'global_col'    => true,
                    'es_fin_semana' => $fc->isWeekend(),
                ];
            }
        }

        $headers = ['Empleado', 'Cedula', 'Grupo', 'Tipo', 'Fecha', 'Dia',
            'LLEGADA', 'Atraso', 'S. Almuerzo', 'R. Almuerzo', 'SALIDA',
            'Horas trab.', 'Meta dia', 'Deficit', 'Nota'];

        $stats = [
            ['n' => $empleados->count(),                            'l' => 'Empleados activos'],
            ['n' => collect($rows)->count(),                        'l' => 'Dias registrados'],
            ['n' => $empleados->where('es_pasante', false)->count(),'l' => 'No pasantes'],
            ['n' => $empleados->where('es_pasante', true)->count(), 'l' => 'Pasantes'],
        ];

        $titulo    = 'Reporte Global de Asistencia';
        $subtitulo = 'Todos los empleados' . ($desde || $hasta ? ' · ' . $this->periodoLabel($desde, $hasta) : ' - Periodo completo');

        return $this->responderGlobalXlsm($titulo, $subtitulo, $stats, $headers, $rows, 'reporte_global');
    }

    // ── GET /admin/horas/reporte/empleado/{id} ────────────────────────────────
    public function empleado(Request $request, int $id): Response
    {
        $emp   = Empleado::with(['horario'])->findOrFail($id);
        $notas = NotaAsistencia::where('empleado_id', $id)->get()
            ->keyBy(fn($n) => $n->fecha instanceof Carbon
                ? $n->fecha->toDateString() : (string) $n->fecha);

        $desde = $request->query('desde');
        $hasta = $request->query('hasta');

        $registros = RegistroAsistencia::where('empleado_id', $id)
            ->when($desde, fn($q) => $q->whereDate('fecha', '>=', $desde))
            ->when($hasta, fn($q) => $q->whereDate('fecha', '<=', $hasta))
            ->orderBy('fecha')->orderBy('hora_marcacion')->get()
            ->groupBy(fn($r) => $r->fecha instanceof Carbon
                ? $r->fecha->toDateString() : (string) $r->fecha);

        $rows        = [];
        $totalMin    = 0;
        $totalAtraso = 0;
        $diasConLleg = 0;

        $todasFechas = $registros->keys()
            ->merge($notas->keys()->filter(fn($f) => (!$desde || $f >= $desde) && (!$hasta || $f <= $hasta)))
            ->unique()->sort()->values();

        foreach ($todasFechas as $fecha) {
            $dayRegs    = $registros->get($fecha, collect());
            $tipos      = $dayRegs->keyBy('tipo');
            $llegada    = $tipos->get('LLEGADA');
            $salidaAlm  = $tipos->get('SALIDA_ALMUERZO');
            $regresoAlm = $tipos->get('REGRESO_ALMUERZO');
            $salida     = $tipos->get('SALIDA');

            $atrasoMin = $this->atrasoAritmetico($llegada, $emp);
            $minutos   = $this->asistencia->calcularHorasNetas($tipos);
            $metaMin   = $emp->es_pasante ? 360 : 480;
            $deficit   = $minutos !== null ? max(0, $metaMin - $minutos) : null;
            $nota      = $notas->get($fecha);
            $fc        = Carbon::parse($fecha);

            if ($llegada) { $diasConLleg++; $totalAtraso += $atrasoMin; }
            if ($minutos !== null) $totalMin += $minutos;

            $rows[] = [
                'cols' => [
                    $fc->format('d/m/Y'),
                    ucfirst($fc->locale('es')->isoFormat('dddd')),
                    $llegada    ? Carbon::parse($llegada->hora_confirmada    ?? $llegada->hora_marcacion)->format('H:i:s')    : '-',
                    $atrasoMin  > 0 ? '+' . $this->fmtMin($atrasoMin) : '-',
                    $salidaAlm  ? Carbon::parse($salidaAlm->hora_confirmada  ?? $salidaAlm->hora_marcacion)->format('H:i:s')  : '-',
                    $regresoAlm ? Carbon::parse($regresoAlm->hora_confirmada ?? $regresoAlm->hora_marcacion)->format('H:i:s') : '-',
                    $salida     ? Carbon::parse($salida->hora_confirmada     ?? $salida->hora_marcacion)->format('H:i:s')     : '-',
                    $minutos !== null ? $this->fmtMin($minutos) : '-',
                    $fc->isWeekend() ? '' : $this->fmtMin($metaMin),
                    $fc->isWeekend() ? '' : ($deficit !== null ? ($deficit === 0 ? 'Cumplido' : '-' . $this->fmtMin($deficit)) : '-'),
                    $nota?->nota ?? '',
                ],
                'es_pasante'    => $emp->es_pasante,
                'atraso'        => $atrasoMin,
                'deficit'       => $deficit,
                'global_col'    => false,
                'es_fin_semana' => $fc->isWeekend(),
            ];
        }

        $headers = ['Fecha', 'Dia', 'LLEGADA', 'Atraso', 'S. Almuerzo', 'R. Almuerzo',
            'SALIDA', 'Horas trab.', 'Meta dia', 'Deficit', 'Nota'];

        $grupoLabel  = $emp->grupo !== null ? ($emp->grupo ? 'Grupo 1' : 'Grupo 2') : 'Sin grupo';
        $horarioStr  = $emp->horario
            ? substr($emp->horario->hora_entrada, 0, 5) . ' - ' . substr($emp->horario->hora_salida, 0, 5)
            : 'no asignado';
        $atrasoLabel = $emp->es_pasante ? 'Sin penalizacion (pasante)' : $this->fmtMin($totalAtraso);

        $stats = [
            ['n' => $diasConLleg,              'l' => 'Dias asistidos'],
            ['n' => $this->fmtMin($totalMin),  'l' => 'Horas totales'],
            ['n' => $atrasoLabel,               'l' => 'Atraso acumulado'],
            ['n' => $emp->es_pasante ? 'Pasante' : 'Regular', 'l' => $grupoLabel],
        ];

        $periodoStr = $this->periodoLabel($desde, $hasta);
        $sub    = "Cedula: {$emp->cedula}   Horario: {$horarioStr}   Meta: " . ($emp->es_pasante ? '6h/dia' : '8h/dia') . ($periodoStr ? "   Periodo: {$periodoStr}" : '');
        $titulo = $emp->primer_apellido . ' ' . $emp->segundo_apellido . ' ' . $emp->primer_nombre . ' ' . $emp->segundo_nombre;
        $nFile  = preg_replace('/[^a-zA-Z0-9]/', '_', $emp->primer_apellido . '_' . $emp->primer_nombre);

        return $this->responderEmpleadoXlsx($titulo, $sub, $stats, $headers, $rows, "reporte_{$nFile}_{$emp->cedula}");
    }

    // ── Formatea rango de fechas para subtitulo del Excel ──────────────────
    private function periodoLabel(?string $desde, ?string $hasta): string
    {
        if (!$desde && !$hasta) return '';
        $fmt = fn($d): string => Carbon::parse($d)->format('d/m/Y');
        if ($desde && $hasta) return $fmt($desde) . ' - ' . $fmt($hasta);
        if ($desde)           return 'desde ' . $fmt($desde);
        return 'hasta ' . $fmt($hasta);
    }

    // ── Convierte minutos enteros a "Xh YYm" ─────────────────────────────────
    private function fmtMin(int $min): string
    {
        $h = intdiv($min, 60);
        $m = $min % 60;
        return "{$h}h " . str_pad($m, 2, '0', STR_PAD_LEFT) . 'm';
    }

    // ── Calcula atraso con aritmética (misma lógica que el panel) ────────────
    private function atrasoAritmetico(?object $llegada, Empleado $emp): int
    {
        if (!$llegada || $emp->es_pasante || !$emp->horario) return 0;
        $hora    = Carbon::parse($llegada->hora_confirmada ?? $llegada->hora_marcacion);
        $marcMin = $hora->hour * 60 + $hora->minute;
        [$eH, $eM] = array_map('intval', explode(':', substr($emp->horario->hora_entrada, 0, 5)));
        return max(0, $marcMin - ($eH * 60 + $eM));
    }

    // ── Evita que un texto libre (p. ej. una Nota) se interprete como
    //    formula al abrir el Excel. Aunque las celdas se escriben con tipo
    //    de dato TEXTO explicito (no formula), esto es una capa extra de
    //    seguridad: si el texto empieza con = + - @, se antepone un
    //    apostrofe para forzar que Excel lo trate como texto literal.
    private function sanitizeText(?string $value): string
    {
        $value = (string) $value;
        if ($value !== '' && in_array($value[0], ['=', '+', '-', '@'], true)) {
            return "'" . $value;
        }
        return $value;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Construcción del archivo Excel real (sin fórmulas, todo como texto)
    // ═══════════════════════════════════════════════════════════════════════

    private const NAVY  = '0F2A5C';
    private const WHITE = 'FFFFFF';
    private const SLATE = '94A3B8';
    private const INK   = '1E293B';
    private const MUTED = '64748B';

    // Escribe el bloque de título + subtítulos + KPIs + tabla en la hoja dada.
    // Devuelve [filaEncabezado, primeraFilaDatos, ultimaFilaDatos, ultimaColumna].
    private function escribirHojaReporte(
        Worksheet $sheet, string $titulo, string $subtitulo,
        array $stats, array $headers, array $rows, bool $isGlobal
    ): array {
        $colspan = count($headers);
        $lastCol = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colspan);

        // Limpia cualquier contenido/estilo previo (de una plantilla reusada)
        // antes de escribir, para no arrastrar datos de una generación o
        // prueba anterior.
        $highestRow = $sheet->getHighestRow();
        if ($highestRow > 0) {
            $sheet->removeRow(1, $highestRow);
        }

        // ── Barra de título (navy) ──────────────────────────────────────────
        $sheet->mergeCells("A1:{$lastCol}1");
        $sheet->setCellValueExplicit('A1', 'MATSSO - Control de Asistencia', DataType::TYPE_STRING);
        $sheet->getStyle("A1:{$lastCol}1")->applyFromArray([
            'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => self::WHITE], 'name' => 'Calibri'],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => self::NAVY]],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(28);

        $sheet->mergeCells("A2:{$lastCol}2");
        $sheet->setCellValueExplicit('A2', $titulo, DataType::TYPE_STRING);
        $sheet->mergeCells("A3:{$lastCol}3");
        $sheet->setCellValueExplicit('A3', $subtitulo, DataType::TYPE_STRING);
        $sheet->mergeCells("A4:{$lastCol}4");
        $sheet->setCellValueExplicit('A4', 'Generado: ' . date('d/m/Y H:i'), DataType::TYPE_STRING);
        $sheet->getStyle("A2:{$lastCol}4")->applyFromArray([
            'font' => ['size' => 9, 'color' => ['rgb' => self::SLATE], 'name' => 'Calibri'],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => self::NAVY]],
        ]);

        // ── Fila de KPIs ─────────────────────────────────────────────────────
        $kpiRow = 6;
        $col = 1;
        foreach ($stats as $s) {
            $numCol = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col);
            $lblCol = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col + 1);
            $sheet->setCellValueExplicit("{$numCol}{$kpiRow}", (string) $s['n'], DataType::TYPE_STRING);
            $sheet->setCellValueExplicit("{$lblCol}{$kpiRow}", $s['l'], DataType::TYPE_STRING);
            $sheet->getStyle("{$numCol}{$kpiRow}")->applyFromArray([
                'font' => ['bold' => true, 'size' => 11, 'color' => ['rgb' => self::NAVY], 'name' => 'Calibri'],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                'borders' => ['bottom' => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['rgb' => '1D4ED8']]],
            ]);
            $sheet->getStyle("{$lblCol}{$kpiRow}")->applyFromArray([
                'font' => ['size' => 8, 'color' => ['rgb' => self::MUTED], 'name' => 'Calibri'],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);
            $col += 2;
        }
        $sheet->getStyle("A{$kpiRow}:{$lastCol}{$kpiRow}")->applyFromArray([
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'DBEAFE']],
        ]);
        $sheet->getRowDimension($kpiRow)->setRowHeight(26);

        // ── Encabezado de la tabla ───────────────────────────────────────────
        $filaEncabezado = 8;
        foreach ($headers as $i => $col) {
            $letra = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($i + 1);
            $sheet->setCellValueExplicit("{$letra}{$filaEncabezado}", $col, DataType::TYPE_STRING);
        }
        $sheet->getStyle("A{$filaEncabezado}:{$lastCol}{$filaEncabezado}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 8.5, 'color' => ['rgb' => self::WHITE], 'name' => 'Calibri'],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => self::NAVY]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '1E3A6E']]],
        ]);

        // ── Índices de columnas especiales (igual que el diseño anterior) ────
        $iAtraso = $isGlobal ? 7  : 3;
        $iDef    = $isGlobal ? 13 : 9;
        $iLleg   = $isGlobal ? 6  : 2;
        $iSA     = $isGlobal ? 8  : 4;
        $iRA     = $isGlobal ? 9  : 5;
        $iSal    = $isGlobal ? 10 : 6;
        $iFecha  = $isGlobal ? 4  : 0;

        $filaInicio = $filaEncabezado + 1;
        $fila = $filaInicio;
        foreach ($rows as $row) {
            $data        = $row['cols'];
            $atraso      = $row['atraso'];
            $deficit     = $row['deficit'];
            $esFinSemana = $row['es_fin_semana'] ?? false;
            $even        = (($fila - $filaInicio) % 2 === 1);

            $bg  = $esFinSemana ? 'FEF3C7' : ($even ? 'EFF6FF' : self::WHITE);
            $bdr = $esFinSemana ? 'FCD34D' : ($even ? 'BFDBFE' : 'E2E8F0');

            foreach ($data as $i => $val) {
                $letra = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($i + 1);
                $coord = "{$letra}{$fila}";
                $texto = $this->sanitizeText((string) $val);
                $sheet->setCellValueExplicit($coord, $texto, DataType::TYPE_STRING);

                $estilo = [
                    'font'      => ['size' => 9, 'color' => ['rgb' => self::INK], 'name' => 'Calibri'],
                    'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $bg]],
                    'borders'   => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => $bdr]]],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'vertical' => Alignment::VERTICAL_CENTER],
                ];

                if ($i === $iAtraso && $atraso > 0) {
                    $estilo['fill']['startColor']['rgb'] = 'FEF9C3';
                    $estilo['font']['color']['rgb'] = '854D0E';
                    $estilo['font']['bold'] = true;
                    $estilo['alignment']['horizontal'] = Alignment::HORIZONTAL_CENTER;
                } elseif ($i === $iDef && $deficit !== null && !$esFinSemana) {
                    $estilo['fill']['startColor']['rgb'] = $deficit === 0 ? 'DCFCE7' : 'FEE2E2';
                    $estilo['font']['color']['rgb']      = $deficit === 0 ? '166534' : '991B1B';
                    $estilo['font']['bold'] = true;
                    $estilo['alignment']['horizontal'] = Alignment::HORIZONTAL_CENTER;
                } elseif (in_array($i, [$iLleg, $iSA, $iRA, $iSal], true)) {
                    $estilo['font']['name'] = 'Courier New';
                    $estilo['alignment']['horizontal'] = Alignment::HORIZONTAL_CENTER;
                } elseif ($i === $iFecha) {
                    $estilo['alignment']['horizontal'] = Alignment::HORIZONTAL_CENTER;
                } elseif ($i < $iLleg) {
                    $estilo['alignment']['horizontal'] = Alignment::HORIZONTAL_CENTER;
                }

                $sheet->getStyle($coord)->applyFromArray($estilo);
            }
            $fila++;
        }
        $ultimaFilaDatos = $fila - 1;

        // ── Anchos de columna (aprox. igual proporcion que la version HTML) ──
        $colWidthsPx = $isGlobal
            ? [200, 100, 68, 95, 90, 78, 90, 82, 90, 90, 90, 75, 60, 78, 180]
            : [90,  78, 90, 82, 90, 90, 90, 75, 60, 78, 180];
        foreach ($colWidthsPx as $i => $px) {
            $letra = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($i + 1);
            $sheet->getColumnDimension($letra)->setWidth(round($px / 7, 1));
        }

        $sheet->freezePane('A' . $filaInicio);

        return [$filaEncabezado, $filaInicio, max($ultimaFilaDatos, $filaInicio), $lastCol];
    }

    // ── Reporte GLOBAL: contenido nuevo (PhpSpreadsheet) + macro injertada ───
    //
    // OJO: PhpSpreadsheet tiene un problema conocido y documentado -- al
    // cargar un .xlsm con macros, modificarlo y volver a guardarlo con su
    // escritor normal, en muchos casos BORRA la macro sin avisar (ver
    // github.com/PHPOffice/PhpSpreadsheet issues #172, #1201, #1657).
    // Por eso NO se carga la plantilla con IOFactory::load(): el contenido
    // se arma desde cero (100% confiable, mismo camino que ya usa
    // DocumentGenerationService.php) y la macro se injerta despues como un
    // paso aparte, manipulando el ZIP directamente -- evitando por completo
    // la parte de la libreria que sabemos que falla.
    private function responderGlobalXlsm(
        string $titulo, string $subtitulo, array $stats,
        array $headers, array $rows, string $baseFilename
    ): Response {
        $plantilla = resource_path('excel-macro/plantilla_reporte.xlsm');
        // Ruta fija dentro del proyecto -- nunca depende de un parametro de
        // la peticion, para que no se pueda pedir que cargue otro archivo.
        if (!is_file($plantilla)) {
            abort(500, 'No se encontró la plantilla de reporte (plantilla_reporte.xlsm).');
        }

        $spreadsheet = new Spreadsheet();
        $spreadsheet->removeSheetByIndex(0);

        $wsReporte = new Worksheet($spreadsheet, 'Reporte');
        $spreadsheet->addSheet($wsReporte);
        $wsDatos = new Worksheet($spreadsheet, 'Datos');
        $spreadsheet->addSheet($wsDatos);

        [$filaEncabezado, $filaInicio, , $lastCol] =
            $this->escribirHojaReporte($wsReporte, $titulo, $subtitulo, $stats, $headers, $rows, true);

        // Hoja "Datos": tabla plana sin estilo, es la fuente que lee la macro
        // (columna A = nombre del empleado).
        foreach ($headers as $i => $col) {
            $letra = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($i + 1);
            $wsDatos->setCellValueExplicit("{$letra}1", $col, DataType::TYPE_STRING);
        }
        $fila = 2;
        foreach ($rows as $row) {
            foreach ($row['cols'] as $i => $val) {
                $letra = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($i + 1);
                $wsDatos->setCellValueExplicit("{$letra}{$fila}", $this->sanitizeText((string) $val), DataType::TYPE_STRING);
            }
            $fila++;
        }

        // Nombres definidos que la macro usa para encontrar la tabla en
        // "Reporte" sin importar cuantas filas de KPIs haya arriba.
        $this->definirONombreDeRango($spreadsheet, self::NOMBRE_ENCABEZADO, $wsReporte, "\$A\${$filaEncabezado}:\${$lastCol}\${$filaEncabezado}");
        $this->definirONombreDeRango($spreadsheet, self::NOMBRE_DATOS_INICIO, $wsReporte, "\$A\${$filaInicio}");

        $spreadsheet->setActiveSheetIndex($spreadsheet->getIndex($wsReporte));

        $tmpXlsx = tempnam(sys_get_temp_dir(), 'reporte_') . '.xlsx';
        IOFactory::createWriter($spreadsheet, 'Xlsx')->save($tmpXlsx);

        $tmpXlsm = $this->injertarMacro($tmpXlsx, $plantilla);
        @unlink($tmpXlsx);

        return response()->download($tmpXlsm, "{$baseFilename}_" . date('Y-m-d') . '.xlsm', [
            'Content-Type' => 'application/vnd.ms-excel.sheet.macroEnabled.12',
        ])->deleteFileAfterSend(true);
    }

    // ── Reporte INDIVIDUAL: xlsx simple, sin macro (no hace falta) ───────────
    private function responderEmpleadoXlsx(
        string $titulo, string $subtitulo, array $stats,
        array $headers, array $rows, string $baseFilename
    ): Response {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Reporte');

        $this->escribirHojaReporte($sheet, $titulo, $subtitulo, $stats, $headers, $rows, false);

        $tmp = tempnam(sys_get_temp_dir(), 'reporte_') . '.xlsx';
        IOFactory::createWriter($spreadsheet, 'Xlsx')->save($tmp);

        return response()->download($tmp, "{$baseFilename}_" . date('Y-m-d') . '.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    // addDefinedName() ya reemplaza el valor si el nombre existe, no hace
    // falta borrarlo a mano antes.
    private function definirONombreDeRango(Spreadsheet $spreadsheet, string $nombre, Worksheet $sheet, string $rango): void
    {
        $spreadsheet->addDefinedName(new NamedRange($nombre, $sheet, $rango));
    }

    // ── Injerta la macro (xl/vbaProject.bin) de la plantilla real dentro de
    //    un .xlsx recien generado, convirtiendolo en un .xlsm funcional.
    //    Es cirugia de ZIP de bajo nivel a proposito: evita pasar por el
    //    lector/escritor de PhpSpreadsheet para la parte de macros, que es
    //    justo la que tiene el bug conocido de perder el VBA al re-guardar.
    //
    //    No hace falta preservar el boton/desplegable como objetos del
    //    archivo -- el propio codigo "Workbook_Open" de la plantilla los
    //    vuelve a crear cada vez que se abre el archivo en Excel.
    private function injertarMacro(string $xlsxPath, string $plantillaXlsmPath): string
    {
        $zipPlantilla = new \ZipArchive();
        if ($zipPlantilla->open($plantillaXlsmPath) !== true) {
            throw new \RuntimeException('No se pudo abrir la plantilla para leer la macro.');
        }
        $vbaBin = $zipPlantilla->getFromName('xl/vbaProject.bin');
        $zipPlantilla->close();

        if ($vbaBin === false) {
            throw new \RuntimeException('La plantilla no tiene xl/vbaProject.bin -- revisa que se guardó como .xlsm con macros.');
        }

        $tmpXlsm = tempnam(sys_get_temp_dir(), 'reporte_') . '.xlsm';
        copy($xlsxPath, $tmpXlsm);

        $zip = new \ZipArchive();
        if ($zip->open($tmpXlsm) !== true) {
            throw new \RuntimeException('No se pudo abrir el archivo generado para injertar la macro.');
        }

        // a) el binario de la macro
        $zip->addFromString('xl/vbaProject.bin', $vbaBin);

        // b) declarar el tipo de contenido como "macro-habilitado"
        $contentTypes = $zip->getFromName('[Content_Types].xml');
        $contentTypes = str_replace(
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml',
            'application/vnd.ms-excel.sheet.macroEnabled.main+xml',
            $contentTypes
        );
        if (!str_contains($contentTypes, 'vbaProject')) {
            $contentTypes = str_replace(
                '</Types>',
                '<Default Extension="bin" ContentType="application/vnd.ms-office.vbaProject"/></Types>',
                $contentTypes
            );
        }
        $zip->addFromString('[Content_Types].xml', $contentTypes);

        // c) relacionar vbaProject.bin con el workbook
        $rels = $zip->getFromName('xl/_rels/workbook.xml.rels');
        $rels = str_replace(
            '</Relationships>',
            '<Relationship Id="rIdVbaProject" Type="http://schemas.microsoft.com/office/2006/relationships/vbaProject" Target="vbaProject.bin"/></Relationships>',
            $rels
        );
        $zip->addFromString('xl/_rels/workbook.xml.rels', $rels);

        $zip->close();

        return $tmpXlsm;
    }
}
