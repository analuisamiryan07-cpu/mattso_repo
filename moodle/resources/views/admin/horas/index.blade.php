@extends('layouts.app')
@section('title', 'Control de Horas — MATsso')

@push('styles')
<style>
.periodo-bar {
    display: flex; align-items: center; gap: .6rem; flex-wrap: wrap;
    margin-bottom: 1.5rem;
}
.periodo-bar form { display: flex; gap: .5rem; align-items: center; flex-wrap: wrap; }
.periodo-bar select, .periodo-bar input[type="date"] {
    padding: .45rem .75rem; border: 1px solid var(--border);
    border-radius: 7px; font: inherit; font-size: .88rem;
    background: var(--surface); color: var(--text);
}
.empleados-table-wrap { overflow-x: auto; }
.hora-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 9px; border-radius: 20px; font-size: .78rem; font-weight: 600;
}
.hora-badge.ok      { background: var(--success-bg); color: var(--success); }
.hora-badge.late    { background: var(--danger-bg);  color: var(--danger); }
.hora-badge.absent  { background: #f1f5f9; color: #94a3b8; }
.hora-badge.pending { background: var(--accent-dim); color: #92400e; }
.delay-pill {
    font-size: .75rem; font-weight: 600; padding: 2px 8px; border-radius: 12px;
    background: var(--danger-bg); color: var(--danger);
}
.delay-pill.ok { background: var(--success-bg); color: var(--success); }
.horario-text {
    font-size: .75rem; color: var(--muted); font-family: monospace; white-space: nowrap;
}
/* badges grupo / pasante */
.badge-grupo {
    display: inline-block; font-size: .68rem; font-weight: 700;
    padding: 2px 7px; border-radius: 10px; line-height: 1.4;
}
.badge-g1 { background: #dbeafe; color: #1d4ed8; }
.badge-g2 { background: #fef9c3; color: #854d0e; }
.badge-pasante { background: #f3e8ff; color: #7c3aed; }
/* ── Modal ── */
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
.modal-field input { width: 100%; margin-bottom: 1rem; }
.modal-actions { display: flex; gap: .75rem; justify-content: flex-end; margin-top: 1.25rem; }
.time-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; margin-bottom: .5rem; }
.radio-group { display: flex; gap: .75rem; margin-bottom: 1rem; }
.radio-opt {
    flex: 1; border: 2px solid var(--border); border-radius: 9px;
    padding: .65rem 1rem; cursor: pointer; text-align: center;
    font-size: .88rem; font-weight: 600; color: var(--muted);
    transition: border-color .15s, background .15s, color .15s;
}
.radio-opt input { display: none; }
.radio-opt.selected { border-color: var(--navy); background: var(--navy); color: #fff; }
.toggle-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: .75rem 0; border-top: 1px solid var(--border); margin-top: .25rem;
}
.toggle-row label { font-size: .88rem; font-weight: 600; }
.toggle-row small { display: block; font-size: .75rem; color: var(--muted); font-weight: 400; }
.switch { position: relative; display: inline-block; width: 42px; height: 24px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider {
    position: absolute; cursor: pointer; inset: 0;
    background: var(--border); border-radius: 24px; transition: .2s;
}
.slider:before {
    content: ''; position: absolute; height: 18px; width: 18px;
    left: 3px; bottom: 3px; background: #fff;
    border-radius: 50%; transition: .2s;
}
.switch input:checked + .slider { background: #7c3aed; }
.switch input:checked + .slider:before { transform: translateX(18px); }
.toast {
    position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 600;
    background: var(--navy); color: #fff; padding: .85rem 1.3rem;
    border-radius: 10px; font-size: .9rem; font-weight: 500;
    box-shadow: var(--shadow-md); transform: translateY(80px); opacity: 0;
    transition: transform .3s ease, opacity .3s ease;
}
.toast.show { transform: translateY(0); opacity: 1; }
/* ── KPI cards locales ── */
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
.kpi-card.yellow { border-top-color: #d97706; }
.kpi-num { font-size: 2rem; font-weight: 800; line-height: 1; color: var(--navy, #0f2a5c); }
.kpi-card.blue   .kpi-num { color: #2458b3; }
.kpi-card.green  .kpi-num { color: #15803d; }
.kpi-card.red    .kpi-num { color: #b91c1c; }
.kpi-card.yellow .kpi-num { color: #d97706; }
.kpi-lbl { font-size: .82rem; color: var(--muted, #64748b); font-weight: 500; }
</style>
@endpush

@section('content')

<div class="page-header">
  <div>
    <h1>Control de Horas</h1>
    <p class="muted">Registro de asistencia y puntualidad del personal.</p>
  </div>
  <div style="display:flex;gap:.5rem;align-items:center;">
    <a href="{{ route('horas.index') }}" class="btn btn-sm">↻ Actualizar</a>
    <button onclick="openReporteModal('{{ route('horas.reporte.global') }}')"
            class="btn btn-sm" style="background:#15803d;color:#fff;border-color:#15803d;">
      ⬇ Generar Reporte
    </button>
  </div>
</div>

@if(session('success'))
<div class="alert">✓ {{ session('success') }}</div>
@endif

{{-- ── KPIs ── --}}
<div class="kpi-grid" style="margin-bottom:1.5rem;">
  <div class="kpi-card blue">
    <div class="kpi-num">{{ $totalEmp }}</div>
    <div class="kpi-lbl">Empleados activos</div>
  </div>
  <div class="kpi-card green">
    <div class="kpi-num">{{ $llegaron }}</div>
    <div class="kpi-lbl">Presentes hoy</div>
  </div>
  <div class="kpi-card {{ $tardanzas > 0 ? 'red' : 'green' }}">
    <div class="kpi-num">{{ $tardanzas }}</div>
    <div class="kpi-lbl">Tardanzas hoy</div>
  </div>
</div>

{{-- ── Fecha dinámica (hoy siempre) ── --}}
@php
  $carbonHoy  = \Carbon\Carbon::today('America/Guayaquil');
  $diaLabel   = ucfirst($carbonHoy->locale('es')->isoFormat('dddd, D [de] MMMM [de] YYYY'));
@endphp
<div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1.25rem;">
  <span style="font-size:1.05rem;font-weight:700;color:var(--navy);">📅 {{ $diaLabel }}</span>
  <span class="muted" style="font-size:.82rem;">Asistencia del día</span>
</div>

{{-- ── Tabla empleados ── --}}
<div class="card table-card">
  <h2 style="padding:1.25rem 1.5rem 0;">Empleados</h2>
  <div class="empleados-table-wrap">
    <table>
      <thead>
        <tr>
          <th>Empleado</th>
          <th>Horario</th>
          <th>Llegada</th>
          <th>S. Almuerzo</th>
          <th>R. Almuerzo</th>
          <th>Salida</th>
          <th>Retraso período</th>
          <th>IP equipo</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        @foreach($empleados as $emp)
        @php
          $hoy    = now()->setTimezone('America/Guayaquil')->toDateString();
          $regHoy = $emp->registros->filter(fn($r) => (
              $r->fecha instanceof \Carbon\Carbon
                  ? $r->fecha->toDateString()
                  : (string) $r->fecha
          ) === $hoy);
          $tipos     = $regHoy->keyBy('tipo');
          $atrasoPer = $emp->registros->sum('atraso_minutos');
          $horario   = $emp->horario;
          $grupoLabel = $emp->grupo === null ? null : ($emp->grupo ? 'G1' : 'G2');
        @endphp
        <tr>
          {{-- Nombre, cédula, badges --}}
          <td>
            <a href="{{ route('horas.detalle', $emp->id) }}"
               style="font-weight:600;color:var(--navy);text-decoration:none;">
              {{ $emp->primer_apellido }} {{ $emp->segundo_apellido }} {{ $emp->primer_nombre }} {{ $emp->segundo_nombre }}
            </a>
            <div style="font-size:.78rem;color:var(--muted);">{{ $emp->cedula }}</div>
            <div style="display:flex;gap:.3rem;flex-wrap:wrap;margin-top:4px;">
              @if($grupoLabel)
                <span class="badge-grupo {{ $emp->grupo ? 'badge-g1' : 'badge-g2' }}">{{ $grupoLabel }}</span>
              @else
                <span style="font-size:.68rem;color:var(--muted);">sin grupo</span>
              @endif
              @if($emp->es_pasante)
                <span class="badge-grupo badge-pasante">Pasante</span>
              @endif
            </div>
          </td>
          {{-- Horario --}}
          <td>
            @if($horario)
              @if(!$emp->es_pasante)
                <div class="horario-text">
                  {{ substr($horario->hora_entrada, 0, 5) }}–{{ substr($horario->hora_salida, 0, 5) }}
                </div>
              @endif
              <div class="horario-text" style="color:#854d0e;">
                🍽 {{ substr($horario->hora_salida_almuerzo, 0, 5) }}–{{ substr($horario->hora_regreso_almuerzo, 0, 5) }}
              </div>
            @else
              <span style="font-size:.78rem;color:var(--muted);">sin horario</span>
            @endif
            @if(!$emp->es_pasante)
              <button class="btn btn-secondary btn-sm" style="margin-top:4px;font-size:.72rem;padding:2px 6px;"
                onclick="openHorarioModal({{ $emp->id }}, '{{ $emp->primer_apellido }} {{ $emp->segundo_apellido }} {{ $emp->primer_nombre }} {{ $emp->segundo_nombre }}',
                  '{{ $horario ? substr($horario->hora_entrada,0,5) : '08:00' }}',
                  '{{ $horario ? substr($horario->hora_salida_almuerzo,0,5) : '13:00' }}',
                  '{{ $horario ? substr($horario->hora_regreso_almuerzo,0,5) : '14:00' }}',
                  '{{ $horario ? substr($horario->hora_salida,0,5) : '17:00' }}')">
                Editar
              </button>
            @endif
          </td>
          {{-- Llegada --}}
          <td>
            @if($m = $tipos->get('LLEGADA'))
              @php
                $hora = \Carbon\Carbon::parse($m->hora_confirmada ?? $m->hora_marcacion);
                // Calcular atraso: convertir ambas horas a minutos desde medianoche y restar
                $atrasoLlegada = 0;
                if (!$emp->es_pasante && $horario) {
                    $marcStr = \Carbon\Carbon::parse($m->hora_marcacion)->format('H:i');
                    $espStr  = substr($horario->hora_entrada, 0, 5);
                    [$mH, $mM] = array_map('intval', explode(':', $marcStr));
                    [$eH, $eM] = array_map('intval', explode(':', $espStr));
                    $atrasoLlegada = max(0, ($mH * 60 + $mM) - ($eH * 60 + $eM));
                }
              @endphp
              <span class="hora-badge {{ !$emp->es_pasante && $atrasoLlegada > 0 ? 'late' : 'ok' }}">
                {{ $hora->format('H:i:s') }}
                @if(!$emp->es_pasante && $atrasoLlegada > 0)<small>+{{ $atrasoLlegada }}m</small>@endif
              </span>
              @php
                // hora_marcacion llega etiquetada +00 (UTC) aunque el valor real
                // es hora local Guayaquil — re-etiquetar antes de comparar contra
                // "ahora", si no diffInMinutes() calcula ~5h de más.
                $marcTz = \Carbon\Carbon::createFromFormat('Y-m-d H:i:s', \Carbon\Carbon::parse($m->hora_marcacion)->format('Y-m-d H:i:s'), 'America/Guayaquil');
              @endphp
              @if($marcTz->diffInMinutes(\Carbon\Carbon::now('America/Guayaquil')) < 10)
                <div style="font-size:.7rem;color:#92400e;">verificando…</div>
              @endif
            @else
              <span class="hora-badge absent">—</span>
            @endif
          </td>
          {{-- Salida almuerzo --}}
          <td>
            @if($m = $tipos->get('SALIDA_ALMUERZO'))
              @php $hora = \Carbon\Carbon::parse($m->hora_confirmada ?? $m->hora_marcacion); @endphp
              <span class="hora-badge ok">{{ $hora->format('H:i:s') }}</span>
            @else
              <span class="hora-badge absent">—</span>
            @endif
          </td>
          {{-- Regreso almuerzo --}}
          <td>
            @if($m = $tipos->get('REGRESO_ALMUERZO'))
              @php $hora = \Carbon\Carbon::parse($m->hora_confirmada ?? $m->hora_marcacion); @endphp
              <span class="hora-badge {{ !$emp->es_pasante && $m->atraso_minutos > 0 ? 'late' : 'ok' }}">
                {{ $hora->format('H:i:s') }}
                @if(!$emp->es_pasante && $m->atraso_minutos > 0)<small>+{{ $m->atraso_minutos }}m</small>@endif
              </span>
              @php
                $marcTz = \Carbon\Carbon::createFromFormat('Y-m-d H:i:s', \Carbon\Carbon::parse($m->hora_marcacion)->format('Y-m-d H:i:s'), 'America/Guayaquil');
              @endphp
              @if($marcTz->diffInMinutes(\Carbon\Carbon::now('America/Guayaquil')) < 10)
                <div style="font-size:.7rem;color:#92400e;">verificando…</div>
              @endif
            @else
              <span class="hora-badge absent">—</span>
            @endif
          </td>
          {{-- Salida --}}
          <td>
            @if($m = $tipos->get('SALIDA'))
              @php $hora = \Carbon\Carbon::parse($m->hora_confirmada ?? $m->hora_marcacion); @endphp
              <span class="hora-badge {{ $m->atraso_minutos > 0 ? 'late' : 'ok' }}">
                {{ $hora->format('H:i:s') }}
              </span>
            @else
              <span class="hora-badge absent">—</span>
            @endif
          </td>
          {{-- Retraso período --}}
          <td>
            @if($emp->es_pasante)
              @php
                // Pasante: déficit = 6h - horas hechas hoy (solo si tiene SALIDA marcada)
                $pLleg = $tipos->get('LLEGADA');
                $pSal  = $tipos->get('SALIDA');
                $defHoy = null;
                if ($pLleg && $pSal) {
                    $tL  = \Carbon\Carbon::parse($pLleg->hora_confirmada ?? $pLleg->hora_marcacion);
                    $tS  = \Carbon\Carbon::parse($pSal->hora_confirmada  ?? $pSal->hora_marcacion);
                    $pSA = $tipos->get('SALIDA_ALMUERZO');
                    $pRA = $tipos->get('REGRESO_ALMUERZO');
                    if ($pSA && $pRA) {
                        $tSA = \Carbon\Carbon::parse($pSA->hora_confirmada ?? $pSA->hora_marcacion);
                        $tRA = \Carbon\Carbon::parse($pRA->hora_confirmada ?? $pRA->hora_marcacion);
                        $minHechos = max(0, $tL->diffInMinutes($tSA) + $tRA->diffInMinutes($tS));
                    } else {
                        $minHechos = max(0, (int) $tL->diffInMinutes($tS));
                    }
                    $defHoy = max(0, 360 - $minHechos);
                    $dh2 = intdiv($defHoy, 60); $dm2 = $defHoy % 60;
                }
              @endphp
              @if($defHoy !== null)
                <span class="delay-pill {{ $defHoy === 0 ? 'ok' : '' }}">
                  {{ $defHoy === 0 ? '✓ 6h' : ($dh2 > 0 ? "{$dh2}h {$dm2}m" : "{$dm2}m") }}
                </span>
              @else
                <span style="font-size:.78rem;color:var(--muted);">—</span>
              @endif
            @else
              @php
                // Si ya marcó SALIDA: calcular horas trabajadas vs meta 8h (480 min)
                $nLleg = $tipos->get('LLEGADA');
                $nSal  = $tipos->get('SALIDA');
                $minTrabajadosHoy = null;
                if ($nLleg && $nSal) {
                    $tL  = \Carbon\Carbon::parse($nLleg->hora_confirmada ?? $nLleg->hora_marcacion);
                    $tS  = \Carbon\Carbon::parse($nSal->hora_confirmada  ?? $nSal->hora_marcacion);
                    $nSA = $tipos->get('SALIDA_ALMUERZO');
                    $nRA = $tipos->get('REGRESO_ALMUERZO');
                    if ($nSA && $nRA) {
                        $tSA = \Carbon\Carbon::parse($nSA->hora_confirmada ?? $nSA->hora_marcacion);
                        $tRA = \Carbon\Carbon::parse($nRA->hora_confirmada ?? $nRA->hora_marcacion);
                        $minTrabajadosHoy = max(0, $tL->diffInMinutes($tSA) + $tRA->diffInMinutes($tS));
                    } else {
                        $minTrabajadosHoy = max(0, (int) $tL->diffInMinutes($tS));
                    }
                    $defHoy = max(0, 480 - $minTrabajadosHoy);
                    $dhT = intdiv($minTrabajadosHoy, 60); $dmT = $minTrabajadosHoy % 60;
                    $dhD = intdiv($defHoy, 60);           $dmD = $defHoy % 60;
                }
              @endphp
              @if($minTrabajadosHoy !== null)
                @if($defHoy === 0)
                  <span class="delay-pill ok">✓ {{ $dhT }}h {{ $dmT }}m</span>
                @else
                  <span class="delay-pill" title="{{ $dhT }}h {{ $dmT }}m trabajadas">
                    −{{ $dhD > 0 ? "{$dhD}h {$dmD}m" : "{$dmD}m" }}
                  </span>
                @endif
              @else
                {{-- Aún no marcó SALIDA: mostrar tardanza de llegada --}}
                @php $h = intdiv($atrasoPer, 60); $m2 = $atrasoPer % 60; @endphp
                <span class="delay-pill {{ $atrasoPer === 0 ? 'ok' : '' }}">
                  {{ $atrasoPer > 0 ? ($h > 0 ? "{$h}h {$m2}m" : "{$m2}m") : '—' }}
                </span>
              @endif
            @endif
          </td>
          {{-- IP --}}
          <td>
            @if($emp->ip_computadora_enc)
              <span style="font-size:.78rem;color:var(--success);">✓ configurada</span>
            @else
              <span style="font-size:.78rem;color:var(--danger);">sin IP</span>
            @endif
          </td>
          {{-- Acciones --}}
          <td style="text-align:right;">
            <div style="display:flex;flex-direction:column;gap:.3rem;align-items:flex-end;">
              <a href="{{ route('horas.detalle', $emp->id) }}" class="btn btn-secondary btn-sm">Ver</a>
              <button class="btn btn-sm" style="background:#475569;"
                onclick="openGrupoModal({{ $emp->id }}, '{{ addslashes($emp->primer_apellido . " " . $emp->segundo_apellido . " " . $emp->primer_nombre . " " . $emp->segundo_nombre) }}', {{ $emp->grupo === null ? 'true' : ($emp->grupo ? 'true' : 'false') }}, {{ $emp->es_pasante ? 'true' : 'false' }})">
                Grupo
              </button>
              <button class="btn btn-sm" style="background:#0369a1;"
                onclick="openIpModal({{ $emp->id }}, '{{ addslashes($emp->primer_apellido . " " . $emp->segundo_apellido . " " . $emp->primer_nombre . " " . $emp->segundo_nombre) }}')">
                IP
              </button>
            </div>
          </td>
        </tr>
        @endforeach
        @if($empleados->isEmpty())
        <tr><td colspan="9" style="text-align:center;color:var(--muted);padding:2rem;">
          No hay empleados registrados.
        </td></tr>
        @endif
      </tbody>
    </table>
  </div>
</div>

{{-- ── Modal: editar horario ── --}}
<div class="modal-overlay" id="horarioModal">
  <div class="modal-box">
    <h2>Editar horario</h2>
    <p id="horarioModalNombre" style="margin-bottom:1rem;font-weight:600;color:var(--navy);"></p>
    <div class="time-grid">
      <div class="modal-field">
        <label>Entrada</label>
        <input type="time" id="hEntrada" value="08:00">
      </div>
      <div class="modal-field">
        <label>Salida</label>
        <input type="time" id="hSalida" value="17:00">
      </div>
      <div class="modal-field">
        <label>Salida almuerzo</label>
        <input type="time" id="hSalidaAlm" value="13:00">
      </div>
      <div class="modal-field">
        <label>Regreso almuerzo</label>
        <input type="time" id="hRegresoAlm" value="14:00">
      </div>
    </div>
    <div style="font-size:.82rem;color:var(--muted);margin-top:.25rem;">
      La jornada neta es siempre <strong>8 horas</strong> (9h – 1h almuerzo).
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="closeHorarioModal()">Cancelar</button>
      <button class="btn" onclick="guardarHorario()">Guardar horario</button>
    </div>
  </div>
</div>

{{-- ── Modal: asignar grupo / pasante ── --}}
<div class="modal-overlay" id="grupoModal">
  <div class="modal-box">
    <h2>Asignar grupo</h2>
    <p id="grupoModalNombre" style="margin-bottom:1.25rem;font-weight:600;color:var(--navy);"></p>

    <div style="font-size:.82rem;font-weight:600;color:var(--muted);margin-bottom:.5rem;">Grupo de horario</div>
    <div class="radio-group">
      <label class="radio-opt" id="optG1" onclick="selectGrupo(true)">
        <input type="radio" name="grupoRadio" id="grupoRadio1" value="1">
        <div>Grupo 1</div>
        <div style="font-size:.72rem;font-weight:400;margin-top:2px;">Almuerzo 13:00–14:00</div>
      </label>
      <label class="radio-opt" id="optG2" onclick="selectGrupo(false)">
        <input type="radio" name="grupoRadio" id="grupoRadio2" value="0">
        <div>Grupo 2</div>
        <div style="font-size:.72rem;font-weight:400;margin-top:2px;">Almuerzo 13:30–14:30</div>
      </label>
    </div>

    <div class="toggle-row">
      <div>
        <label>Pasante</label>
        <small>Meta mensual 120h · sin control de tardanza</small>
      </div>
      <label class="switch">
        <input type="checkbox" id="pasanteCheck">
        <span class="slider"></span>
      </label>
    </div>

    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="closeGrupoModal()">Cancelar</button>
      <button class="btn" onclick="guardarGrupo()">Guardar</button>
    </div>
  </div>
</div>

{{-- ── Modal: configurar IP ── --}}
<div class="modal-overlay" id="ipModal">
  <div class="modal-box">
    <h2>Configurar IP del equipo</h2>
    <p id="ipModalNombre" style="margin-bottom:1rem;font-weight:600;color:var(--navy);"></p>
    <div class="modal-field">
      <label>Dirección IP del computador (red interna)</label>
      <input type="text" id="ipInput" placeholder="192.168.100.X" maxlength="15"
             style="font-family:monospace;letter-spacing:.05em;">
    </div>
    <div style="font-size:.82rem;color:var(--muted);margin-bottom:1rem;">
      La IP se cifra con AES-256 antes de guardarse.
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="closeIpModal()">Cancelar</button>
      <button class="btn" onclick="guardarIp()">Guardar IP</button>
    </div>
  </div>
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

<div class="toast" id="toast"></div>

@endsection

@push('scripts')
<script>
const CSRF       = '{{ csrf_token() }}';
let horarioEmpId = null;
let ipEmpId      = null;
let grupoEmpId   = null;
let grupoActual  = true;

// ── Horario modal ─────────────────────────────────────────────────────────────
function openHorarioModal(id, nombre, entrada, salidaAlm, regresoAlm, salida) {
  horarioEmpId = id;
  document.getElementById('horarioModalNombre').textContent = nombre;
  document.getElementById('hEntrada').value    = entrada;
  document.getElementById('hSalida').value     = salida;
  document.getElementById('hSalidaAlm').value  = salidaAlm;
  document.getElementById('hRegresoAlm').value = regresoAlm;
  document.getElementById('horarioModal').classList.add('open');
}
function closeHorarioModal() { document.getElementById('horarioModal').classList.remove('open'); }

async function guardarHorario() {
  const payload = {
    hora_entrada:          document.getElementById('hEntrada').value,
    hora_salida_almuerzo:  document.getElementById('hSalidaAlm').value,
    hora_regreso_almuerzo: document.getElementById('hRegresoAlm').value,
    hora_salida:           document.getElementById('hSalida').value,
  };
  const res  = await fetch(`/admin/horas/empleados/${horarioEmpId}/horario`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': CSRF },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  closeHorarioModal();
  showToast(data.message ?? 'Horario actualizado');
  setTimeout(() => location.reload(), 1200);
}

// ── Grupo modal ───────────────────────────────────────────────────────────────
function openGrupoModal(id, nombre, grupo, esPasante) {
  grupoEmpId  = id;
  grupoActual = grupo;
  document.getElementById('grupoModalNombre').textContent = nombre;
  document.getElementById('pasanteCheck').checked = esPasante;
  selectGrupo(grupo);
  document.getElementById('grupoModal').classList.add('open');
}
function closeGrupoModal() { document.getElementById('grupoModal').classList.remove('open'); }

function selectGrupo(esG1) {
  grupoActual = esG1;
  document.getElementById('optG1').classList.toggle('selected', esG1);
  document.getElementById('optG2').classList.toggle('selected', !esG1);
  document.getElementById('grupoRadio1').checked =  esG1;
  document.getElementById('grupoRadio2').checked = !esG1;
}

async function guardarGrupo() {
  const esPasante = document.getElementById('pasanteCheck').checked;
  const res = await fetch(`/admin/horas/empleados/${grupoEmpId}/grupo`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': CSRF },
    body: JSON.stringify({ grupo: grupoActual, es_pasante: esPasante }),
  });
  const data = await res.json();
  closeGrupoModal();
  showToast(data.message ?? 'Grupo actualizado');
  setTimeout(() => location.reload(), 1200);
}

// ── IP modal ──────────────────────────────────────────────────────────────────
function openIpModal(id, nombre) {
  ipEmpId = id;
  document.getElementById('ipModalNombre').textContent = nombre;
  document.getElementById('ipInput').value = '';
  document.getElementById('ipModal').classList.add('open');
}
function closeIpModal() { document.getElementById('ipModal').classList.remove('open'); }

async function guardarIp() {
  const ip = document.getElementById('ipInput').value.trim();
  if (!ip) return;
  const res  = await fetch(`/admin/horas/empleados/${ipEmpId}/configurar-ip`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': CSRF },
    body: JSON.stringify({ ip_computadora: ip }),
  });
  const data = await res.json();
  closeIpModal();
  showToast(data.message ?? 'IP guardada');
  setTimeout(() => location.reload(), 1200);
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); });
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

function openReporteModal(url) {
  _rBaseUrl = url;
  const h    = new Date();
  const hStr = [h.getFullYear(), String(h.getMonth()+1).padStart(2,'0'), String(h.getDate()).padStart(2,'0')].join('-');
  const mStr = hStr.slice(0, 7);
  document.getElementById('rSemanaRef').value = hStr; autoFillWeekR(hStr);
  document.getElementById('rMesRef').value    = mStr; autoFillMesR(mStr);
  document.getElementById('rRangoDesde').value = '';
  document.getElementById('rRangoHasta').value = '';
  setModoReporte('semana');
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
</script>
@endpush
