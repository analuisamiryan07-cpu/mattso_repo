@extends('layouts.app')
@section('title', 'Detalle — ' . $empleado->nombres_completos . ' — MATsso')

@push('styles')
<style>
.detalle-header {
    display: flex; align-items: flex-start; gap: 1.25rem;
    flex-wrap: wrap; margin-bottom: 1.5rem;
}
.avatar-circle {
    width: 56px; height: 56px; border-radius: 50%;
    background: var(--blue); color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.4rem; font-weight: 700; flex-shrink: 0;
}
.periodo-bar { display:flex; align-items:center; gap:.6rem; flex-wrap:wrap; margin-bottom:1.25rem; }
.periodo-bar form { display:flex; gap:.5rem; align-items:center; flex-wrap:wrap; }
.periodo-bar select, .periodo-bar input[type="date"] {
    padding:.45rem .75rem; border:1px solid var(--border);
    border-radius:7px; font:inherit; font-size:.88rem;
    background:var(--surface); color:var(--text);
}
.period-navigation {
    display:flex; flex-direction:column; align-items:flex-start; gap:.35rem;
}
.period-navigation-label {
    color:var(--navy); font-size:.78rem; font-weight:700;
    letter-spacing:.04em; text-transform:uppercase;
}
.period-nav {
    display:flex; align-items:center; gap:.55rem; flex-wrap:wrap;
    padding:0; background:transparent; box-shadow:none;
}
.period-nav-btn {
    min-width:72px; height:38px; padding:0 1rem;
    display:inline-flex; align-items:center; justify-content:center;
    border:2px solid #2458b3; border-radius:999px;
    background:#fff; color:#2458b3; text-decoration:none;
    font-size:1rem; font-weight:700; line-height:1;
    box-shadow:0 2px 5px rgba(36,88,179,.10);
    transition:background .15s, color .15s, box-shadow .15s, transform .15s;
}
.period-nav-btn:hover {
    background:#eff6ff; color:#173f82;
    box-shadow:0 4px 10px rgba(36,88,179,.16); transform:translateY(-1px);
}
.period-nav-btn:focus-visible {
    outline:3px solid rgba(36,88,179,.25); outline-offset:2px;
}
.period-nav-current {
    padding:.45rem .35rem; border:none; background:transparent;
    color:#2458b3; font:inherit; font-size:.78rem; cursor:pointer;
    text-decoration:underline;
}
.period-title {
    min-width:190px; text-align:center; color:var(--navy);
    font-size:.92rem; font-weight:700;
}
.calendar-headers {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: .85rem;
    margin-bottom: .5rem;
}
.calendar-headers span {
    text-align: center; font-size: .72rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: .04em; color: var(--muted);
}
.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: .85rem;
    margin-bottom: 1.5rem;
}
.day-relleno { visibility: hidden; }
@media (max-width: 720px) {
    .calendar-headers { display: none; }
    .calendar-grid { grid-template-columns: 1fr; }
    .day-relleno { display: none; }
}
.day-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 10px; padding: 1rem;
    box-shadow: var(--shadow-sm);
    min-width: 0; box-sizing: border-box; overflow-wrap: break-word;
}
.day-card.has-delay{ border-left: 4px solid var(--danger); }
.day-card.complete { border-left: 4px solid var(--success); }
.day-card.empty    { border-left: 4px solid var(--border); opacity: .6; }
.day-card.weekend  { border-left: 4px dashed var(--muted); background: rgba(100,116,139,.06); }
.weekend-tag {
    display: block; margin-top: .5rem; padding: .2rem .5rem;
    background: rgba(100,116,139,.12); color: var(--muted);
    border-radius: 6px; font-size: .68rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: .03em;
    white-space: normal; overflow-wrap: break-word; text-align: center;
}
.marcacion-row { min-width: 0; }
.marcacion-row .tipo, .marcacion-row .hora { overflow-wrap: break-word; }
.day-head {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: .65rem;
}
.day-fecha  { font-size: .82rem; color: var(--muted); }
.day-semana { font-size: .78rem; font-weight: 700; text-transform: uppercase;
    color: var(--navy); letter-spacing: .04em; }
.marcacion-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: .2rem 0; font-size: .82rem; border-bottom: 1px solid var(--border);
}
.marcacion-row:last-child { border-bottom: none; }
.marcacion-row .tipo { color: var(--muted); }
.marcacion-row .hora { font-weight: 600; font-family: monospace; letter-spacing: .04em; }
.pending-tag { font-size: .68rem; color: #92400e; font-style: italic; }
.day-footer {
    margin-top: .65rem; padding-top: .55rem; border-top: 1px dashed var(--border);
    display: flex; justify-content: space-between; font-size: .8rem;
}
.day-horas { font-weight: 700; color: var(--navy); }
.day-sin   { font-size: .8rem; color: var(--muted); text-align: center; padding: .5rem 0; }
.tipo-label {
    font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .04em;
}
.tipo-label.llegada         { color: #15803d; }
.tipo-label.salida_almuerzo { color: #b45309; }
.tipo-label.regreso_almuerzo{ color: #1d4ed8; }
.tipo-label.salida          { color: var(--navy); }
/* KPI cards */
.kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 1rem;
}
.kpi-card {
    background: var(--surface); border-radius: 12px; padding: 1.25rem 1.5rem;
    box-shadow: var(--shadow-sm, 0 1px 4px rgba(0,0,0,.06));
    border-top: 4px solid var(--border);
    display: flex; flex-direction: column; gap: .25rem;
}
.kpi-card.blue   { border-top-color: #2458b3; }
.kpi-card.green  { border-top-color: #15803d; }
.kpi-card.red    { border-top-color: #b91c1c; }
.kpi-card.purple { border-top-color: #7c3aed; }
.kpi-num { font-size: 2rem; font-weight: 800; line-height: 1; color: var(--navy, #0f2a5c); }
.kpi-card.blue   .kpi-num { color: #2458b3; }
.kpi-card.green  .kpi-num { color: #15803d; }
.kpi-card.red    .kpi-num { color: #b91c1c; }
.kpi-card.purple .kpi-num { color: #7c3aed; }
.kpi-lbl { font-size: .82rem; color: var(--muted, #64748b); font-weight: 500; }
/* Barra de progreso mensual */
.progress-bar-wrap {
    height: 6px; background: var(--border); border-radius: 3px; margin-top: 6px;
}
.progress-bar-fill {
    height: 100%; border-radius: 3px; transition: width .4s;
}
.nota-tag {
    margin-top: .5rem; padding: .35rem .55rem;
    background: #fefce8; border-left: 3px solid #d97706;
    border-radius: 0 6px 6px 0; font-size: .75rem;
    color: #78350f; line-height: 1.4; word-break: break-word;
}
.nota-tag .nota-label {
    font-weight: 700; font-size: .68rem; text-transform: uppercase;
    letter-spacing: .04em; color: #92400e; display: block; margin-bottom: 2px;
}
.btn-nota {
    margin-top: .45rem; width: 100%; text-align: left;
    font-size: .74rem; padding: .28rem .5rem; border-radius: 6px;
    border: 1px dashed var(--border); background: transparent;
    cursor: pointer; color: var(--muted); font-family: inherit;
    transition: border-color .15s, color .15s;
}
.btn-nota:hover { border-color: #d97706; color: #92400e; }
/* Modal reporte */
.modal-overlay {
    display: none; position: fixed; inset: 0; z-index: 500;
    background: rgba(15,42,92,.45); backdrop-filter: blur(2px);
    align-items: center; justify-content: center;
}
.modal-overlay.open { display: flex; }
.modal-box {
    background: var(--surface); border-radius: 14px; width: min(460px, 92vw);
    padding: 2rem; box-shadow: var(--shadow-md);
    animation: slideUp .2s ease;
}
@keyframes slideUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }
.modal-box h2 { margin-bottom: 1.25rem; }
.modal-field label { display: block; font-size: .85rem; font-weight: 600; margin-bottom: .3rem; color: var(--muted); }
.modal-actions { display: flex; gap: .75rem; justify-content: flex-end; margin-top: 1.25rem; }
.radio-group { display: flex; gap: .75rem; margin-bottom: 1rem; }
.radio-opt {
    flex: 1; border: 2px solid var(--border); border-radius: 9px;
    padding: .65rem 1rem; cursor: pointer; text-align: center;
    font-size: .88rem; font-weight: 600; color: var(--muted);
    transition: border-color .15s, background .15s, color .15s;
}
.radio-opt input { display: none; }
.radio-opt.selected { border-color: var(--navy); background: var(--navy); color: #fff; }
/* Modal notas */
#nota-modal {
    display: none; position: fixed; inset: 0;
    background: rgba(0,0,0,.45); z-index: 9999;
    align-items: center; justify-content: center;
}
#nota-modal.open { display: flex; }
.nota-modal-box {
    background: var(--surface); border-radius: 14px;
    padding: 1.5rem; width: 90%; max-width: 460px;
    box-shadow: 0 12px 40px rgba(0,0,0,.22);
}
.nota-modal-box h3 { margin: 0 0 .9rem; font-size: 1rem; color: var(--navy); }
.nota-modal-box textarea {
    width: 100%; padding: .6rem .75rem;
    border: 1px solid var(--border); border-radius: 8px;
    font: inherit; font-size: .88rem; resize: vertical;
    background: var(--surface); color: var(--text);
    box-sizing: border-box; min-height: 100px;
}
.nota-modal-actions {
    display: flex; gap: .5rem; justify-content: flex-end; margin-top: .8rem;
}
</style>
@endpush

@section('content')

<div style="display:flex;gap:.5rem;margin-bottom:1.25rem;">
  <a href="{{ route('horas.index') }}" class="btn btn-secondary btn-sm">← Volver al panel</a>
  <button onclick="openReporteModal('{{ route('horas.reporte.empleado', $empleado->id) }}', '{{ $desde }}', '{{ $periodo }}')"
          class="btn btn-sm" style="background:#15803d;color:#fff;border-color:#15803d;">
    ⬇ Generar Reporte
  </button>
</div>

{{-- ── Header del empleado ── --}}
<div class="detalle-header">
  <div class="avatar-circle">
    {{ mb_substr($empleado->primer_apellido, 0, 1) }}
  </div>
  <div style="flex:1;">
    <h1 style="margin-bottom:.1rem;">{{ $empleado->primer_apellido }} {{ $empleado->segundo_apellido }} {{ $empleado->primer_nombre }} {{ $empleado->segundo_nombre }}</h1>
    <p class="muted" style="margin:0;display:flex;gap:.5rem;flex-wrap:wrap;align-items:center;">
      <span>Cédula: <strong>{{ $empleado->cedula }}</strong></span>
      @if($empleado->grupo !== null)
        <span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:.75rem;font-weight:700;
          background:{{ $empleado->grupo ? '#dbeafe' : '#fef9c3' }};
          color:{{ $empleado->grupo ? '#1d4ed8' : '#854d0e' }};">
          {{ $empleado->grupo ? 'Grupo 1' : 'Grupo 2' }}
        </span>
      @endif
      @if($empleado->es_pasante)
        <span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:.75rem;font-weight:700;background:#f3e8ff;color:#7c3aed;">Pasante</span>
      @endif
      @if($empleado->horario)
        · Horario:
        <strong>{{ substr($empleado->horario->hora_entrada, 0, 5) }}
          – {{ substr($empleado->horario->hora_salida, 0, 5) }}</strong>
        (alm. {{ substr($empleado->horario->hora_salida_almuerzo, 0, 5) }}
        – {{ substr($empleado->horario->hora_regreso_almuerzo, 0, 5) }})
      @endif
      · IP: {{ $empleado->ip_computadora_enc ? '✓ configurada' : '⚠ sin IP' }}
    </p>
  </div>
</div>

{{-- ── KPIs ── --}}
@php
  $thTotal = intdiv($totalMinutos, 60);
  $tmTotal = $totalMinutos % 60;
  $metaMinutos  = $metaHoras * 60;
  $pctMeta = $metaMinutos > 0 ? min(100, round($totalMinutos / $metaMinutos * 100)) : 0;
  $colorMeta = $pctMeta >= 100 ? '#15803d' : ($pctMeta >= 70 ? '#d97706' : '#b91c1c');
@endphp
<div class="kpi-grid" style="margin-bottom:1.5rem;">
  <div class="kpi-card blue">
    <div class="kpi-num">{{ $diasConLlegada }}</div>
    <div class="kpi-lbl">Días con asistencia</div>
  </div>

  @if(!$empleado->es_pasante)
  <div class="kpi-card {{ $totalAtraso > 0 ? 'red' : 'green' }}">
    <div class="kpi-num">
      @php $h = intdiv($totalAtraso, 60); $m = $totalAtraso % 60; @endphp
      {{ $h > 0 ? "{$h}h {$m}m" : "{$m}m" }}
    </div>
    <div class="kpi-lbl">Retraso acumulado</div>
  </div>
  @endif

  <div class="kpi-card {{ $empleado->es_pasante ? 'purple' : 'green' }}" style="grid-column: span 2;">
    <div class="kpi-num" style="font-size:1.6rem;">
      {{ $thTotal }}h {{ $tmTotal }}m
      <span style="font-size:1rem;font-weight:500;color:var(--muted);">/ {{ $metaHoras }}h</span>
    </div>
    <div class="kpi-lbl">
      Horas netas ·
      @if($periodo === 'semana')
        Meta semanal (5 días × {{ $metaDiariaH }}h)
      @else
        Meta mensual (20 días × {{ $metaDiariaH }}h)
      @endif
    </div>
    <div class="progress-bar-wrap">
      <div class="progress-bar-fill"
           style="width:{{ $pctMeta }}%;background:{{ $colorMeta }};"></div>
    </div>
    <div style="font-size:.75rem;color:var(--muted);margin-top:2px;">{{ $pctMeta }}% completado</div>
  </div>

  @if($empleado->es_pasante && $deficitMinutos !== null)
  @php $dh = intdiv($deficitMinutos, 60); $dm = $deficitMinutos % 60; @endphp
  <div class="kpi-card {{ $deficitMinutos > 0 ? 'red' : 'green' }}" style="grid-column: span 2;">
    <div class="kpi-num">{{ $dh > 0 ? "{$dh}h {$dm}m" : "{$dm}m" }}</div>
    <div class="kpi-lbl">
      Déficit de horas (días trabajados · meta {{ $metaDiariaMinutos / 60 }}h/día)
    </div>
    @if($deficitMinutos === 0)
      <div style="font-size:.75rem;color:#15803d;margin-top:2px;">✓ Sin déficit en el período</div>
    @else
      <div style="font-size:.75rem;color:#b91c1c;margin-top:2px;">
        Horas por recuperar en días que sí asistió
      </div>
    @endif
  </div>
  @endif
</div>

{{-- ── Filtro período ── --}}
<div class="periodo-bar">
  <form method="GET" action="{{ route('horas.detalle', $empleado->id) }}"
        style="display:flex;align-items:center;gap:.45rem;margin:0;">
    <label style="font-weight:700;font-size:.88rem;white-space:nowrap;line-height:1;color:var(--navy);">Período:</label>
    <input type="hidden" name="fecha" value="{{ $fechaReferencia->toDateString() }}">
    <select name="periodo" onchange="this.form.submit()"
            style="padding:.42rem .75rem;border:1px solid var(--border);border-radius:7px;
                   font:inherit;font-size:.88rem;background:var(--surface);color:var(--text);
                   line-height:1;cursor:pointer;">
      <option value="semana" {{ $periodo==='semana'?'selected':'' }}>Semana</option>
      <option value="mes"    {{ $periodo==='mes'   ?'selected':'' }}>Mes</option>
    </select>
  </form>
  <div class="period-navigation">
    <span class="period-navigation-label">Navegación</span>
    <div class="period-nav" role="navigation" aria-label="Navegación del período">
      <a class="period-nav-btn"
         href="{{ route('horas.detalle', ['id' => $empleado->id, 'periodo' => $periodo, 'fecha' => $fechaAnterior]) }}"
         aria-label="{{ $periodo === 'mes' ? 'Mes anterior' : 'Semana anterior' }}"
         title="{{ $periodo === 'mes' ? 'Mes anterior' : 'Semana anterior' }}">←</a>
      <span class="period-title">{{ $periodoTitulo }}</span>
      <a class="period-nav-btn"
         href="{{ route('horas.detalle', ['id' => $empleado->id, 'periodo' => $periodo, 'fecha' => $fechaSiguiente]) }}"
         aria-label="{{ $periodo === 'mes' ? 'Mes siguiente' : 'Semana siguiente' }}"
         title="{{ $periodo === 'mes' ? 'Mes siguiente' : 'Semana siguiente' }}">→</a>
      @unless($esPeriodoActual)
        <a class="period-nav-current"
           href="{{ route('horas.detalle', ['id' => $empleado->id, 'periodo' => $periodo]) }}">
          Ir al período actual
        </a>
      @endunless
    </div>
  </div>
</div>

{{-- ── Grilla de días (calendario real: lunes a domingo, en orden) ── --}}
<div class="calendar-headers">
  <span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span>
  <span>Vie</span><span>Sáb</span><span>Dom</span>
</div>
<div class="calendar-grid">
@php
  // Celdas vacias antes del primer dia del periodo, para que caiga en su
  // columna real de dia-de-semana (solo aplica al inicio de "Mes"; en
  // "Semana" el primer dia siempre es lunes, asi que da 0).
  $celdasRelleno = !empty($dias) ? \Carbon\Carbon::parse($dias[0]['fecha'])->dayOfWeekIso - 1 : 0;
@endphp
@for($r = 0; $r < $celdasRelleno; $r++)
  <div class="day-card day-relleno"></div>
@endfor
@foreach($dias as $dia)
  @php
    $tipos       = $dia['tipos'];
    $regs        = $dia['registros'];
    $esFinSemana = $dia['es_fin_semana'] ?? false;
    $hasDelay    = !$empleado->es_pasante && $dia['atraso_total'] > 0;
    $complete    = $tipos->has('LLEGADA') && $tipos->has('SALIDA');
    $empty       = $regs->isEmpty();
    $dayClass    = $empty ? 'empty' : ($hasDelay ? 'has-delay' : ($complete ? 'complete' : ''));
    // Fin de semana siempre gana el estilo: es informativo, no cuenta para la meta.
    $dayClass    = trim($dayClass . ($esFinSemana ? ' weekend' : ''));
    $nota        = $notas->get($dia['fecha']);
    $tipoNombres = [
        'LLEGADA'          => 'Lleg.',
        'SALIDA_ALMUERZO'  => 'S. Alm.',
        'REGRESO_ALMUERZO' => 'R. Alm.',
        'SALIDA'           => 'Sal.',
    ];
    $tipoCss = [
        'LLEGADA'          => 'llegada',
        'SALIDA_ALMUERZO'  => 'salida_almuerzo',
        'REGRESO_ALMUERZO' => 'regreso_almuerzo',
        'SALIDA'           => 'salida',
    ];
  @endphp
  <div class="day-card {{ $dayClass }}">
    <div class="day-head">
      <span class="day-fecha">{{ \Carbon\Carbon::parse($dia['fecha'])->format('d/m') }}</span>
      <span class="day-semana">{{ $dia['dia_semana'] }}</span>
    </div>

    @if($esFinSemana)
      <span class="weekend-tag">No cuenta para la meta</span>
    @endif

    @if($empty)
      <div class="day-sin">Sin registros</div>
    @else
    {{-- Registros de asistencia --}}
      @foreach(['LLEGADA','SALIDA_ALMUERZO','REGRESO_ALMUERZO','SALIDA'] as $tipoKey)
        @if($m = $tipos->get($tipoKey))
          @php
            // Parsear sin setTimezone: los valores en DB son hora local Ecuador
            $horaDisplay = \Carbon\Carbon::parse($m->hora_confirmada ?? $m->hora_marcacion);
            // La hora ya quedó asentada al marcar (un solo ping); "verificando…"
            // es solo un efecto visual durante los primeros 10 minutos.
            // hora_marcacion llega etiquetada +00 (UTC) aunque el valor real es
            // hora local Guayaquil — re-etiquetar antes de comparar contra
            // "ahora", si no diffInMinutes() calcula ~5h de más.
            $marcTz      = \Carbon\Carbon::createFromFormat('Y-m-d H:i:s', \Carbon\Carbon::parse($m->hora_marcacion)->format('Y-m-d H:i:s'), 'America/Guayaquil');
            $confirmado  = $marcTz->diffInMinutes(\Carbon\Carbon::now('America/Guayaquil')) >= 10;
          @endphp
          <div class="marcacion-row">
            <span class="tipo tipo-label {{ $tipoCss[$tipoKey] }}">{{ $tipoNombres[$tipoKey] }}</span>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:1px;">
              <div style="display:flex;align-items:center;gap:.3rem;">
                <span class="hora">{{ $horaDisplay->format('H:i:s') }}</span>
              </div>
              @if(!$confirmado && in_array($tipoKey, ['LLEGADA','REGRESO_ALMUERZO']))
                <span class="pending-tag">verificando…</span>
              @endif
            </div>
          </div>
        @endif
      @endforeach

      <div class="day-footer">
        <span>
          @if(!$empleado->es_pasante)
            @if($dia['atraso_total'] > 0)
              <span style="color:var(--danger);font-weight:600;">⏱ Con atraso</span>
            @else
              <span style="color:var(--success);font-weight:600;">✓ A tiempo</span>
            @endif
          @else
            @php
              $defDia = $dia['minutos_trabajados'] !== null
                ? max(0, 360 - $dia['minutos_trabajados'])
                : null;
            @endphp
            @if($defDia === null)
              <span style="color:var(--muted);font-size:.75rem;">pasante</span>
            @elseif($defDia === 0)
              <span style="color:var(--success);font-weight:600;">✓ 6h cumplidas</span>
            @else
              @php $dah = intdiv($defDia, 60); $dam = $defDia % 60; @endphp
              <span style="color:var(--danger);font-weight:600;">
                −{{ $dah > 0 ? "{$dah}h {$dam}m" : "{$dam}m" }}
              </span>
            @endif
          @endif
        </span>
        <span class="day-horas">
          @if($dia['minutos_trabajados'] !== null)
            @php $dh = intdiv($dia['minutos_trabajados'], 60); $dm = $dia['minutos_trabajados'] % 60; @endphp
            {{ $dh }}h {{ $dm }}m
          @else
            —
          @endif
        </span>
      </div>
    @endif

    {{-- Nota del día --}}
    @if($nota)
      <div class="nota-tag">
        <span class="nota-label">Nota</span>
        {{ Str::limit($nota->nota, 90) }}
      </div>
    @endif
    <button class="btn-nota"
      data-fecha="{{ $dia['fecha'] }}"
      data-nota="{{ $nota?->nota ?? '' }}"
      onclick="abrirNota(this)">
      {{ $nota ? '✏ Editar nota' : '+ Agregar nota' }}
    </button>
  </div>
@endforeach
</div>

{{-- ── Modal: Generar Reporte con filtro de fechas ── --}}
<div class="modal-overlay" id="reporteModal">
  <div class="modal-box" style="width:min(500px,94vw);">
    <h2 style="margin-bottom:1.25rem;">Generar Reporte</h2>

    <div style="font-size:.82rem;font-weight:600;color:var(--muted);margin-bottom:.5rem;">Tipo de período</div>
    <div class="radio-group" style="margin-bottom:1.25rem;">
      <label class="radio-opt selected" id="rModoSemana" onclick="setModoReporte('semana')">
        <input type="radio" name="modoR" checked> Semana
      </label>
      <label class="radio-opt" id="rModoMes" onclick="setModoReporte('mes')">
        <input type="radio" name="modoR"> Mes
      </label>
      <label class="radio-opt" id="rModoRango" onclick="setModoReporte('rango')">
        <input type="radio" name="modoR"> Rango libre
      </label>
      <label class="radio-opt" id="rModoTodo" onclick="setModoReporte('todo')">
        <input type="radio" name="modoR"> Todo
      </label>
    </div>

    <div id="rPanelSemana">
      <div class="modal-field">
        <label>Escribe cualquier día de esa semana</label>
        <input type="date" id="rSemanaRef" oninput="autoFillWeekR(this.value)"
               style="width:100%;margin-bottom:.75rem;">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:.5rem;">
        <div class="modal-field">
          <label>Desde (lunes)</label>
          <input type="date" id="rSemanaDesde" readonly style="width:100%;opacity:.7;">
        </div>
        <div class="modal-field">
          <label>Hasta (domingo)</label>
          <input type="date" id="rSemanaHasta" readonly style="width:100%;opacity:.7;">
        </div>
      </div>
    </div>

    <div id="rPanelMes" style="display:none;">
      <div class="modal-field">
        <label>Selecciona el mes</label>
        <input type="month" id="rMesRef" oninput="autoFillMesR(this.value)"
               style="width:100%;margin-bottom:.75rem;">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:.5rem;">
        <div class="modal-field">
          <label>Desde (día 1)</label>
          <input type="date" id="rMesDesde" readonly style="width:100%;opacity:.7;">
        </div>
        <div class="modal-field">
          <label>Hasta (último día)</label>
          <input type="date" id="rMesHasta" readonly style="width:100%;opacity:.7;">
        </div>
      </div>
    </div>

    <div id="rPanelRango" style="display:none;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:.5rem;">
        <div class="modal-field">
          <label>Desde</label>
          <input type="date" id="rRangoDesde" style="width:100%;">
        </div>
        <div class="modal-field">
          <label>Hasta</label>
          <input type="date" id="rRangoHasta" style="width:100%;">
        </div>
      </div>
    </div>

    <div id="rPanelTodo" style="display:none;">
      <div style="padding:.9rem 1rem;background:#fefce8;border-radius:9px;font-size:.85rem;color:#78350f;border:1px solid #fde68a;margin-bottom:.5rem;">
        Descarga el historial completo sin filtro de fechas.
      </div>
    </div>

    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="closeReporteModal()">Cancelar</button>
      <button class="btn" style="background:#15803d;border-color:#15803d;color:#fff;"
              onclick="descargarReporte()">⬇ Descargar Excel</button>
    </div>
  </div>
</div>

{{-- ── Modal de notas ── --}}
<div id="nota-modal">
  <div class="nota-modal-box">
    <h3 id="nota-modal-titulo">Nota</h3>
    <form id="nota-form" method="POST">
      @csrf
      <input type="hidden" name="fecha" id="nota-fecha-input">
      <textarea name="nota" id="nota-texto" placeholder="Ej: Permiso médico, llegó tarde por tráfico, día libre autorizado…"></textarea>
      <div class="nota-modal-actions">
        <button type="button" onclick="cerrarNota()"
          style="padding:.42rem 1rem;border:1px solid var(--border);border-radius:7px;background:transparent;cursor:pointer;font-family:inherit;">
          Cancelar
        </button>
        <button type="button" id="btn-borrar-nota" onclick="submitBorrar()"
          style="padding:.42rem 1rem;border:none;border-radius:7px;background:#fee2e2;color:#b91c1c;cursor:pointer;font-family:inherit;display:none;">
          Eliminar
        </button>
        <button type="submit"
          style="padding:.42rem 1.2rem;border:none;border-radius:7px;background:var(--blue);color:#fff;font-weight:600;cursor:pointer;font-family:inherit;">
          Guardar
        </button>
      </div>
    </form>
    <form id="nota-delete-form" method="POST" style="display:none;">
      @csrf
      @method('DELETE')
      <input type="hidden" name="fecha" id="nota-delete-fecha-input">
    </form>
  </div>
</div>

@push('scripts')
<script>
const notaGuardarUrl = "{{ route('horas.nota.guardar', $empleado->id) }}";
const notaBorrarUrl  = "{{ route('horas.nota.borrar',  $empleado->id) }}";

function abrirNota(btn) {
  const fecha = btn.dataset.fecha;
  const texto = btn.dataset.nota;
  document.getElementById('nota-modal-titulo').textContent = 'Nota — ' + fecha;
  document.getElementById('nota-fecha-input').value = fecha;
  document.getElementById('nota-delete-fecha-input').value = fecha;
  document.getElementById('nota-texto').value = texto;
  document.getElementById('nota-form').action = notaGuardarUrl;
  document.getElementById('nota-delete-form').action = notaBorrarUrl;
  document.getElementById('btn-borrar-nota').style.display = texto ? 'inline-block' : 'none';
  document.getElementById('nota-modal').classList.add('open');
}

function cerrarNota() {
  document.getElementById('nota-modal').classList.remove('open');
}

function submitBorrar() {
  document.getElementById('nota-delete-form').submit();
}

document.getElementById('nota-modal').addEventListener('click', function(e) {
  if (e.target === this) cerrarNota();
});

// ── Reporte modal ─────────────────────────────────────────────────────────────
let _rBaseUrl = '';
let _rModo    = 'semana';

function _rFmt(d) { return d.toISOString().split('T')[0]; }

function autoFillWeekR(val) {
  if (!val) return;
  const d   = new Date(val + 'T12:00:00');
  const day = d.getDay();
  const mon = new Date(d); mon.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  document.getElementById('rSemanaDesde').value = _rFmt(mon);
  document.getElementById('rSemanaHasta').value = _rFmt(sun);
}

function autoFillMesR(val) {
  if (!val) return;
  const [y, m] = val.split('-').map(Number);
  document.getElementById('rMesDesde').value = _rFmt(new Date(y, m - 1, 1));
  document.getElementById('rMesHasta').value = _rFmt(new Date(y, m, 0));
}

function setModoReporte(modo) {
  _rModo = modo;
  ['Semana','Mes','Rango','Todo'].forEach(n => {
    const k = n.toLowerCase();
    const el = document.getElementById('rModo' + n);
    if (el) el.classList.toggle('selected', k === modo);
    const panel = document.getElementById('rPanel' + n);
    if (panel) panel.style.display = k === modo ? '' : 'none';
  });
}

function openReporteModal(url, fechaVisible, periodoVisible) {
  _rBaseUrl = url;
  const h    = new Date();
  const hoy  = [h.getFullYear(), String(h.getMonth()+1).padStart(2,'0'), String(h.getDate()).padStart(2,'0')].join('-');
  const ref  = fechaVisible || hoy;
  const mStr = ref.slice(0, 7);
  document.getElementById('rSemanaRef').value = ref; autoFillWeekR(ref);
  document.getElementById('rMesRef').value    = mStr; autoFillMesR(mStr);
  document.getElementById('rRangoDesde').value = '';
  document.getElementById('rRangoHasta').value = '';
  setModoReporte(periodoVisible === 'mes' ? 'mes' : 'semana');
  document.getElementById('reporteModal').classList.add('open');
}

function closeReporteModal() {
  document.getElementById('reporteModal').classList.remove('open');
}

function descargarReporte() {
  let desde = '', hasta = '';
  if (_rModo === 'semana') {
    desde = document.getElementById('rSemanaDesde').value;
    hasta = document.getElementById('rSemanaHasta').value;
  } else if (_rModo === 'mes') {
    desde = document.getElementById('rMesDesde').value;
    hasta = document.getElementById('rMesHasta').value;
  } else if (_rModo === 'rango') {
    desde = document.getElementById('rRangoDesde').value;
    hasta = document.getElementById('rRangoHasta').value;
  }
  // _rModo === 'todo': sin parámetros de fecha
  const p = new URLSearchParams();
  if (desde) p.set('desde', desde);
  if (hasta) p.set('hasta', hasta);
  window.location.href = _rBaseUrl + (p.toString() ? '?' + p.toString() : '');
  closeReporteModal();
}

document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); });
});
</script>
@endpush

@endsection
