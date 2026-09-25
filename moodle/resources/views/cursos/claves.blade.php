@extends('layouts.app')

@section('title', 'Generar clave — MATsso')

@section('content')
@if(session('error'))
    <div class="alert errors">✕ {{ session('error') }}</div>
@endif

<div class="page-header">
    <div>
        <h1>Generar clave</h1>
        <p class="muted">Busca la compra del curso (por correo del comprador o número de orden) y genera su clave de acceso.</p>
    </div>
    <a href="{{ route('cursos.index') }}" class="btn btn-secondary">← Volver a cursos</a>
</div>

<div class="card" style="max-width:640px">
    <form method="GET" action="{{ route('cursos.claves.buscar') }}" style="display:flex;gap:.6rem;flex-wrap:wrap;align-items:flex-end">
        <div style="flex:1;min-width:220px">
            <label for="correo">Correo del comprador</label>
            <input type="email" name="correo" id="correo" value="{{ old('correo', $busqueda['correo'] ?? '') }}" placeholder="persona@correo.com">
        </div>
        <div style="width:140px">
            <label for="orden_id">N.º de orden</label>
            <input type="number" name="orden_id" id="orden_id" min="1" value="{{ old('orden_id', $busqueda['orden_id'] ?? '') }}">
        </div>
        <button type="submit" class="btn">Buscar</button>
    </form>
</div>

@isset($disponibles)
<div class="card table-card" style="margin-top:1.25rem">
    <table>
        <thead>
            <tr>
                <th>Orden</th>
                <th>Fecha</th>
                <th>Curso</th>
                <th style="width:8rem">Modalidad</th>
                <th style="width:6rem">Duración</th>
                <th style="width:8rem"></th>
            </tr>
        </thead>
        <tbody>
        @forelse($disponibles as $d)
            <tr>
                <td>#{{ $d['orden_id'] }}</td>
                <td class="muted">{{ \Illuminate\Support\Carbon::parse($d['fecha'])->format('d/m/Y') }}</td>
                <td>{{ $d['curso_titulo'] }}</td>
                <td>
                    @if($d['modo_moodle']) <span class="badge">Moodle</span> @endif
                    @if($d['modo_coursera']) <span class="badge">Coursera</span> @endif
                </td>
                <td class="muted">{{ $d['duracion_meses'] }} meses</td>
                <td>
                    <form method="POST" action="{{ route('cursos.claves.generar') }}"
                        onsubmit="return confirm('¿Generar la clave para esta compra? Se enviará por correo.')">
                        @csrf
                        <input type="hidden" name="orden_item_id" value="{{ $d['orden_item_id'] }}">
                        <button type="submit" class="btn btn-sm">Generar</button>
                    </form>
                </td>
            </tr>
        @empty
            <tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--muted)">
                No hay compras de curso pagadas sin clave para esta búsqueda.
            </td></tr>
        @endforelse
        </tbody>
    </table>
</div>
@endisset

@isset($historial)
<div class="card table-card" style="margin-top:1.25rem">
    <h3 style="margin:1rem 1rem 0">Historial de claves</h3>
    <p class="muted" style="margin:.25rem 1rem 1rem;font-size:.82rem">
        Si una clave sigue "Pendiente", presiona "Generar" arriba para esa misma compra y se reenvía por correo — no hace falta revocarla.
    </p>
    <table>
        <thead>
            <tr><th>Orden</th><th>Curso</th><th style="width:11rem">Código</th><th>Generada</th><th style="width:7rem">Estado</th></tr>
        </thead>
        <tbody>
        @forelse($historial as $h)
            <tr>
                <td>#{{ $h['orden_id'] }}</td>
                <td>{{ $h['curso_titulo'] }}</td>
                <td>
                    @if($h['codigo'])
                        <span class="clave-oculta" data-codigo="{{ $h['codigo'] }}" style="font-family:monospace;letter-spacing:.05em">••••••••••</span>
                        <button type="button" class="btn-ojo" onclick="mostrarCodigo(this)" title="Mostrar" style="background:none;border:none;cursor:pointer;padding:0 4px">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    @else
                        <span class="muted">— (sin código)</span>
                    @endif
                </td>
                <td class="muted">{{ \Illuminate\Support\Carbon::parse($h['generado_at'])->format('d/m/Y H:i') }}</td>
                <td>
                    @if($h['estado'] === 'CANJEADA')
                        <span class="badge badge-green">Canjeada</span>
                    @elseif($h['estado'] === 'REVOCADA')
                        <span class="badge badge-red">Revocada</span>
                    @else
                        <span class="badge">Pendiente</span>
                    @endif
                </td>
            </tr>
        @empty
            <tr><td colspan="5" style="text-align:center;padding:1.5rem;color:var(--muted)">Sin claves generadas todavía para esta búsqueda.</td></tr>
        @endforelse
        </tbody>
    </table>
</div>
@endisset

<div class="card" style="max-width:480px;margin-top:1.25rem">
    <h3 style="margin:0 0 .5rem;font-size:1rem">Revocar una clave sin usar</h3>
    <p class="muted" style="font-size:.82rem">Solo funciona si el estudiante todavía no la canjeó. Pide el número de compra (orden_item_id) — aparece en los logs si la generaste desde aquí.</p>
    <form method="POST" action="{{ route('cursos.claves.revocar') }}" style="display:flex;gap:.5rem"
        onsubmit="return confirm('¿Revocar esta clave?')">
        @csrf
        <input type="number" name="orden_item_id" min="1" required placeholder="N.º de compra">
        <button type="submit" class="btn btn-danger btn-sm">Revocar</button>
    </form>
</div>

<script>
function mostrarCodigo(boton) {
    const span = boton.previousElementSibling;
    const oculto = span.textContent.indexOf('•') !== -1;
    span.textContent = oculto ? span.dataset.codigo : '••••••••••';
    boton.querySelector('i').className = oculto ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
}
</script>
@endsection
