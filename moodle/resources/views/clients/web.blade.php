@extends('layouts.app')
@section('title', 'Clientes Web — MATsso')
@section('content')

<div class="page-header">
    <div>
        <h1>Clientes web</h1>
        <p class="muted">Usuarios registrados en la plataforma en línea (Supabase).</p>
    </div>
    <a href="{{ route('clients.index') }}" class="btn btn-secondary">← Clientes local</a>
</div>

@if($error)
    <div class="alert errors" style="margin-bottom:1.25rem">
        <div><strong>Error de conexión:</strong> {{ $error }}</div>
    </div>
@endif

<form method="GET" class="card search-bar">
    <input aria-label="Buscar" name="buscar" value="{{ $search }}"
           placeholder="Buscar por nombre, cédula o correo…">
    <button class="btn">Buscar</button>
    @if($search !== '')
        <a class="btn btn-secondary" href="{{ route('clients.web') }}">Limpiar</a>
    @endif
</form>

<div class="card table-card">
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Cédula</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Ciudad</th>
                <th>Rol</th>
                <th>Estado</th>
            </tr>
        </thead>
        <tbody>
            @forelse($users as $user)
            <tr>
                <td class="muted" style="font-variant-numeric:tabular-nums">{{ $user['id'] }}</td>
                <td><strong>{{ $user['nombre'] }}</strong></td>
                <td class="muted">{{ $user['cedula'] }}</td>
                <td class="muted">{{ $user['correo'] }}</td>
                <td class="muted">{{ $user['telefono'] }}</td>
                <td class="muted">{{ $user['ciudad'] }}</td>
                <td><span class="badge badge-blue">{{ $user['rol'] }}</span></td>
                <td>
                    @if($user['activo'])
                        <span class="badge badge-green">Activo</span>
                    @else
                        <span class="badge badge-red">Inactivo</span>
                    @endif
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="8" style="text-align:center;padding:2rem;color:var(--muted)">
                    {{ $error ? 'Sin datos por error de conexión.' : 'No se encontraron usuarios web.' }}
                </td>
            </tr>
            @endforelse
        </tbody>
    </table>

    {{-- Paginación simple (la data viene de API, no de Eloquent) --}}
    @if(($meta['pages'] ?? 1) > 1)
    <div class="pagination-wrapper">
        <nav>
            @if($meta['page'] > 1)
                <a href="{{ request()->fullUrlWithQuery(['page' => $meta['page'] - 1]) }}">‹ Anterior</a>
            @else
                <span aria-disabled="true">‹ Anterior</span>
            @endif

            @for($p = max(1, $meta['page'] - 2); $p <= min($meta['pages'], $meta['page'] + 2); $p++)
                @if($p === $meta['page'])
                    <span aria-current="page">{{ $p }}</span>
                @else
                    <a href="{{ request()->fullUrlWithQuery(['page' => $p]) }}">{{ $p }}</a>
                @endif
            @endfor

            @if($meta['page'] < $meta['pages'])
                <a href="{{ request()->fullUrlWithQuery(['page' => $meta['page'] + 1]) }}">Siguiente ›</a>
            @else
                <span aria-disabled="true">Siguiente ›</span>
            @endif
        </nav>
    </div>
    @endif
</div>

<p class="muted" style="margin-top:.5rem;font-size:.78rem">
    Total: {{ $meta['total'] ?? 0 }} usuarios · Página {{ $meta['page'] ?? 1 }} de {{ $meta['pages'] ?? 1 }}
</p>

@endsection
