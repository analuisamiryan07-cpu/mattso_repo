@extends('layouts.app')

@section('title', 'Profesores — MATsso')

@section('content')
@if(session('error'))
    <div class="alert errors">✕ {{ session('error') }}</div>
@endif

<div class="page-header">
    <div>
        <h1>Profesores</h1>
        <p class="muted">Solo para cursos Moodle — el profesor sube recursos y califica. Coursera no usa profesor.</p>
    </div>
    <a href="{{ route('cursos.index') }}" class="btn btn-secondary">← Volver a cursos</a>
</div>

<div class="card" style="max-width:520px;margin-bottom:1.25rem">
    <h3 style="margin:0 0 .75rem">Crear o ascender profesor</h3>
    <form method="POST" action="{{ route('profesores.store') }}">
        @csrf
        <label>Correo</label>
        <input type="email" name="correo" value="{{ old('correo') }}" required placeholder="docente@sapper-industries.com">
        <p class="muted" style="font-size:.78rem;margin:.4rem 0">
            Si el correo ya tiene cuenta, se asciende a profesor. Si no existe, se crea una y le llega un correo para definir su contraseña — nunca se reutiliza ninguna clave administrativa.
        </p>
        <button type="submit" class="btn" style="margin-top:.5rem">Crear / ascender</button>
    </form>
</div>

<div class="card table-card">
    <table>
        <thead><tr><th>Correo</th><th>Nombre</th><th style="width:6rem">Estado</th><th style="width:8rem"></th></tr></thead>
        <tbody>
        @forelse($profesores as $p)
            <tr>
                <td>{{ $p['correo'] }}</td>
                <td class="muted">{{ $p['nombre'] ?? '—' }}</td>
                <td>
                    @if($p['activo'])<span class="badge badge-green">Activo</span>@else<span class="badge badge-red">Inactivo</span>@endif
                </td>
                <td>
                    <form method="POST" action="{{ route('profesores.toggle', $p['id']) }}">
                        @csrf @method('PATCH')
                        <input type="hidden" name="activo" value="{{ $p['activo'] ? '0' : '1' }}">
                        <button type="submit" class="btn btn-sm {{ $p['activo'] ? 'btn-danger' : '' }}"
                            style="{{ $p['activo'] ? '' : 'background:var(--success)' }}"
                            onclick="return confirm('¿{{ $p['activo'] ? 'Desactivar' : 'Activar' }} a este profesor?')">
                            {{ $p['activo'] ? 'Desactivar' : 'Activar' }}
                        </button>
                    </form>
                </td>
            </tr>
        @empty
            <tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--muted)">No hay profesores todavía.</td></tr>
        @endforelse
        </tbody>
    </table>
</div>
@endsection
