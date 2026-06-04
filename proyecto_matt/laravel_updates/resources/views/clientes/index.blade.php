@extends('layouts.app')

@section('title', 'Gestor de Clientes')

@section('content')
<div class="header-flex">
    <div>
        <h1 style="font-size: 1.6rem; color: var(--navy);">Listado de Clientes / Estudiantes</h1>
        <p style="color: var(--muted); font-size: .9rem;">Genera certificaciones y carnets para los usuarios registrados.</p>
    </div>
    <a href="{{ route('clientes.create') }}" class="btn">+ Registrar Nuevo Cliente</a>
</div>

@if(session('success'))
    <div class="alert alert-success">{{ session('success') }}</div>
@endif
@if(session('error'))
    <div class="alert alert-error">{{ session('error') }}</div>
@endif

<div class="card">
    <form method="GET" action="{{ route('clientes.index') }}" style="margin-bottom: 1.5rem; display: flex; gap: 1rem;">
        <input type="text" name="search" placeholder="🔍 Buscar por Nombre o Cédula..." value="{{ request('search') }}" style="flex: 1; padding: 0.6rem; border: 1px solid var(--border); border-radius: 6px;">
        <button type="submit" class="btn">Buscar</button>
        @if(request('search'))
            <a href="{{ route('clientes.index') }}" class="btn" style="background: var(--muted);">Limpiar</a>
        @endif
    </form>

    <div style="overflow-x: auto;">
        <table class="table">
            <thead>
                <tr>
                    <th>Cédula</th>
                    <th>Nombres Completos</th>
                    <th>Esquema</th>
                    <th>Fecha</th>
                    <th style="text-align: right;">Acción (Generar Documentos)</th>
                </tr>
            </thead>
            <tbody>
                @forelse($clientes as $cliente)
                <tr>
                    <td style="font-weight: 600;">{{ $cliente->cedula }}</td>
                    <td>{{ $cliente->nombre }}</td>
                    <td>{{ $cliente->esquema }}</td>
                    <td>{{ $cliente->fecha->format('d/m/Y') }}</td>
                    <td style="text-align: right;">
                        <a href="{{ route('clientes.generar.form', $cliente) }}" class="btn" style="background: var(--gold-dark); color: #fff; padding: 0.4rem 0.8rem; border-radius: 4px; text-decoration: none;">⚙️ Preparar Certificados</a>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="5" style="text-align: center; color: var(--muted); padding: 2rem;">No hay clientes registrados en la base de datos.</td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>
    
    <div style="margin-top: 1rem;">
        {{ $clientes->links() }}
    </div>
</div>
@endsection
