@extends('layouts.app')

@php
    $isCap      = ($tipo ?? 'CERTIFICACION') === 'CAPACITACION';
    $pageTitle  = $isCap ? 'Capacitaciones Web' : 'Certificaciones Web';
    $pageDesc   = $isCap
        ? 'Gestiona las capacitaciones visibles en el sitio público'
        : 'Gestiona las certificaciones visibles en el sitio público';
    $newUrl     = route('catalog.create', ['tipo' => $tipo ?? 'CERTIFICACION']);
@endphp

@section('title', $pageTitle . ' — MATsso')

@section('content')
@if(session('error'))
    <div class="alert errors">✕ {{ session('error') }}</div>
@endif

<div class="page-header">
    <div>
        <h1>{{ $pageTitle }}</h1>
        <p class="muted">{{ $pageDesc }}</p>
    </div>
    <a href="{{ $newUrl }}" class="btn">+ Nuevo</a>
</div>

{{-- Filtro activo/inactivo --}}
<div class="card" style="padding:.75rem 1.25rem;margin-bottom:1rem;">
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;align-items:center;">
        <span style="font-size:.8rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-right:.25rem;">Filtrar:</span>
        <button class="filter-btn active" data-filter="all">Todos ({{ count($products) }})</button>
        <button class="filter-btn" data-filter="activo">
            Activos ({{ collect($products)->where('activo', true)->count() }})
        </button>
        <button class="filter-btn" data-filter="inactivo">
            Inactivos ({{ collect($products)->where('activo', false)->count() + collect($products)->whereNull('activo')->count() }})
        </button>
    </div>
</div>

<div class="card table-card">
    <table id="catalog-table">
        <thead>
            <tr>
                <th style="width:3.5rem">#</th>
                <th>Título</th>
                <th style="width:6rem">Precio</th>
                <th style="width:5rem">Horas</th>
                <th style="width:5.5rem">Img #</th>
                <th style="width:5rem">Dest.</th>
                <th style="width:5.5rem">Estado</th>
                <th style="width:10rem;text-align:right">Acciones</th>
            </tr>
        </thead>
        <tbody>
        @forelse($products as $p)
            <tr class="catalog-row"
                data-activo="{{ ($p['activo'] ?? false) ? 'activo' : 'inactivo' }}">
                <td style="color:var(--muted);font-size:.8rem">{{ $loop->iteration }}</td>
                <td style="font-weight:600;max-width:360px">
                    <span title="{{ $p['titulo'] }}">{{ Str::limit($p['titulo'], 75) }}</span>
                    @if($p['descripcion'])
                        <p class="muted" style="margin:.15rem 0 0;font-size:.78rem">{{ Str::limit($p['descripcion'], 80) }}</p>
                    @endif
                </td>
                <td style="font-variant-numeric:tabular-nums">${{ number_format($p['precio'], 2) }}</td>
                <td style="color:var(--muted)">{{ $p['horas'] ? $p['horas'].'h' : '—' }}</td>
                <td style="font-family:monospace;font-size:.88rem">{{ $p['imagen_url'] ?: '—' }}</td>
                <td>
                    @if($p['destacado'])
                        <span class="badge badge-green">⭐ Sí</span>
                    @else
                        <span style="color:var(--muted);font-size:.82rem">No</span>
                    @endif
                </td>
                <td>
                    @if($p['activo'] ?? false)
                        <span class="badge badge-green">Activo</span>
                    @else
                        <span class="badge badge-red">Inactivo</span>
                    @endif
                </td>
                <td>
                    <div class="action-btns">
                        <a href="{{ route('catalog.edit', $p['id']) }}" class="btn btn-secondary btn-sm">Editar</a>

                        {{-- Toggle activo --}}
                        <form method="POST" action="{{ route('catalog.toggle', $p['id']) }}">
                            @csrf @method('PATCH')
                            <button type="submit" class="btn btn-sm {{ ($p['activo'] ?? false) ? 'btn-danger' : '' }}"
                                style="{{ ($p['activo'] ?? false) ? '' : 'background:var(--success)' }}"
                                title="{{ ($p['activo'] ?? false) ? 'Desactivar' : 'Activar' }}"
                                onclick="return confirm('¿{{ ($p['activo'] ?? false) ? 'Desactivar' : 'Activar' }} este producto?')">
                                {{ ($p['activo'] ?? false) ? '⏸' : '▶' }}
                            </button>
                        </form>

                        {{-- Eliminar --}}
                        <form method="POST" action="{{ route('catalog.destroy', $p['id']) }}">
                            @csrf @method('DELETE')
                            <input type="hidden" name="_tipo" value="{{ $p['tipo'] }}">
                            <button type="submit" class="btn btn-danger btn-sm" title="Eliminar"
                                onclick="return confirm('¿Eliminar permanentemente «{{ addslashes($p['titulo']) }}»? Esta acción no se puede deshacer.')">
                                🗑
                            </button>
                        </form>
                    </div>
                </td>
            </tr>
        @empty
            <tr><td colspan="8" style="text-align:center;padding:2.5rem;color:var(--muted)">
                No hay productos en este catálogo. <a href="{{ $newUrl }}">Crea el primero</a>.
            </td></tr>
        @endforelse
        </tbody>
    </table>
</div>

<style>
.filter-btn {
    border: 1.5px solid var(--border);
    background: var(--surface);
    color: var(--navy);
    padding: .35rem .85rem;
    border-radius: 99px;
    font: inherit;
    font-size: .82rem;
    font-weight: 600;
    cursor: pointer;
    transition: background .12s, border-color .12s, color .12s;
}
.filter-btn:hover { background: var(--blue-light); border-color: var(--blue); }
.filter-btn.active { background: var(--navy); color: #fff; border-color: var(--navy); }
</style>

<script>
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const filter = this.dataset.filter;
        document.querySelectorAll('.catalog-row').forEach(row => {
            if (filter === 'all') {
                row.hidden = false;
            } else {
                row.hidden = row.dataset.activo !== filter;
            }
        });
    });
});
</script>
@endsection
