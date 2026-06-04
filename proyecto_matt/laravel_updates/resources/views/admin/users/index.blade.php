@extends('layouts.app')

@section('title', 'Gestión de Usuarios')

@section('content')
<div class="header-flex">
    <div>
        <h1 style="font-size: 1.6rem; color: var(--navy);">Usuarios del Sistema</h1>
    </div>
    <a href="{{ route('users.create') }}" class="btn">Crear Nuevo Usuario</a>
</div>

<div class="card" style="padding: 0;">
    <table class="table">
        <thead style="background: #f7f9fc;">
            <tr>
                <th>Nombre</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Estado Clave</th>
            </tr>
        </thead>
        <tbody>
            @foreach($users as $u)
            <tr>
                <td>{{ $u->name ?? '---' }}</td>
                <td style="font-weight: 500;">{{ $u->username }}</td>
                <td>
                    <span class="badge {{ $u->role === 'admin' ? 'badge-admin' : 'badge-secretaria' }}">
                        {{ strtoupper($u->role) }}
                    </span>
                </td>
                <td>
                    @if($u->must_change_password)
                        <span style="color: var(--danger); font-size: .8rem;">Pendiente de Cambio</span>
                    @else
                        <span style="color: var(--success); font-size: .8rem;">Actualizada</span>
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>
@endsection
