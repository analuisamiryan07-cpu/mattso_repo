@extends('layouts.app')

@section('title', 'Dashboard de Cursos — MATsso')

@section('content')
@if(session('error'))
    <div class="alert errors">✕ {{ session('error') }}</div>
@endif

<div class="page-header">
    <div>
        <h1>Dashboard de Cursos</h1>
        <p class="muted">Todos los cursos, cuántos alumnos tiene cada uno y cuántos ya lo completaron.</p>
    </div>
    <a href="{{ route('cursos.index') }}" class="btn btn-secondary">← Volver a cursos</a>
</div>

<div class="card table-card">
    <table>
        <thead>
            <tr>
                <th>Curso</th>
                <th style="width:9rem">Modalidad</th>
                <th style="width:10rem">Profesor</th>
                <th style="width:7rem">Alumnos</th>
                <th style="width:8rem">Completaron</th>
                <th style="width:5rem"></th>
            </tr>
        </thead>
        <tbody>
        @forelse($cursos as $c)
            <tr>
                <td style="font-weight:600">{{ $c['titulo'] }}</td>
                <td>
                    @if($c['modo_moodle']) <span class="badge">Moodle</span> @endif
                    @if($c['modo_coursera']) <span class="badge">Coursera</span> @endif
                </td>
                <td class="muted">{{ $c['profesor_correo'] ?? '—' }}</td>
                <td class="muted">{{ $c['total_estudiantes'] }}</td>
                <td class="muted">{{ $c['total_completados'] }}</td>
                <td><a href="{{ route('cursos.edit', $c['id']) }}">Ver</a></td>
            </tr>
        @empty
            <tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--muted)">Todavía no hay cursos.</td></tr>
        @endforelse
        </tbody>
    </table>
</div>
@endsection
