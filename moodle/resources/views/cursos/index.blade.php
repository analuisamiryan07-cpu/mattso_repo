@extends('layouts.app')

@section('title', 'Cursos — MATsso')

@section('content')
@if(session('error'))
    <div class="alert errors">✕ {{ session('error') }}</div>
@endif

<div class="page-header">
    <div>
        <h1>Cursos</h1>
        <p class="muted">Cursos del Aula Virtual — Moodle y Coursera. Aparecen en la página pública cuando están activos.</p>
    </div>
    <div style="display:flex;gap:.6rem;flex-wrap:wrap">
        <a href="{{ route('profesores.index') }}" class="btn btn-secondary">Profesores</a>
        <a href="{{ route('cursos.claves.buscar') }}" class="btn btn-secondary">Generar clave</a>
        <a href="{{ route('cursos.create') }}" class="btn">+ Nuevo curso</a>
    </div>
</div>

<div class="card table-card">
    <table>
        <thead>
            <tr>
                <th>Título</th>
                <th style="width:9rem">Modalidad</th>
                <th style="width:6rem">Duración</th>
                <th style="width:5rem">Módulos</th>
                <th style="width:6rem">Matrículas</th>
                <th style="width:5.5rem">Estado</th>
                <th style="width:9rem;text-align:right">Acciones</th>
            </tr>
        </thead>
        <tbody>
        @forelse($cursos as $c)
            <tr>
                <td style="font-weight:600;max-width:360px">
                    <span title="{{ $c['titulo'] }}">{{ Str::limit($c['titulo'], 75) }}</span>
                </td>
                <td>
                    @if($c['modo_moodle']) <span class="badge">Moodle</span> @endif
                    @if($c['modo_coursera']) <span class="badge">Coursera</span> @endif
                </td>
                <td class="muted">{{ $c['duracion_meses'] ? $c['duracion_meses'].' meses' : '— sin configurar' }}</td>
                <td class="muted">{{ $c['_count']['modules'] ?? 0 }}</td>
                <td class="muted">{{ $c['_count']['enrollments'] ?? 0 }}</td>
                <td>
                    @if($c['is_active'])
                        <span class="badge badge-green">Activo</span>
                    @else
                        <span class="badge badge-red">Inactivo</span>
                    @endif
                </td>
                <td>
                    <div class="action-btns">
                        <a href="{{ route('cursos.edit', $c['id']) }}" class="btn btn-secondary btn-sm">Editar</a>
                        <form method="POST" action="{{ route('cursos.toggle', $c['id']) }}">
                            @csrf @method('PATCH')
                            <input type="hidden" name="activo" value="{{ $c['is_active'] ? '0' : '1' }}">
                            <button type="submit" class="btn btn-sm {{ $c['is_active'] ? 'btn-danger' : '' }}"
                                style="{{ $c['is_active'] ? '' : 'background:var(--success)' }}"
                                title="{{ $c['is_active'] ? 'Desactivar' : 'Activar' }}"
                                onclick="return confirm('¿{{ $c['is_active'] ? 'Desactivar' : 'Activar' }} este curso?')">
                                {{ $c['is_active'] ? '⏸' : '▶' }}
                            </button>
                        </form>
                    </div>
                </td>
            </tr>
        @empty
            <tr><td colspan="7" style="text-align:center;padding:2.5rem;color:var(--muted)">
                No hay cursos todavía. <a href="{{ route('cursos.create') }}">Crea el primero</a>.
            </td></tr>
        @endforelse
        </tbody>
    </table>
</div>
@endsection
