@extends('layouts.app')
@section('title', 'Usuarios — MATsso')
@section('content')
<h1>Usuarios</h1>
<div class="card">
    <h2>Crear usuario</h2>
    <form method="POST" action="{{ route('users.store') }}">@csrf
        <div class="form-grid">
            <div><label>Nombre completo</label><input name="nombre" value="{{ old('nombre') }}" required></div>
            <div><label>Usuario</label><input name="usuario" value="{{ old('usuario') }}" required></div>
            <div><label>Rol</label><select name="rol"><option value="SECRETARIA">Secretaria</option><option value="ADMINISTRADOR">Administrador</option></select></div>
            <div><label>Contraseña</label><input type="password" name="contrasena" required></div>
            <div><label>Confirmar contraseña</label><input type="password" name="contrasena_confirmation" required></div>
        </div><button class="btn" style="margin-top:1rem">Crear usuario</button>
    </form>
</div>
<div class="card"><table><thead><tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Estado</th><th></th></tr></thead><tbody>
@foreach($users as $user)<tr><td>{{ $user->usuario }}</td><td>{{ $user->nombre_completo }}</td><td>{{ $user->rol }}</td><td><span class="badge">{{ $user->activo ? 'Activo' : 'Inactivo' }}</span></td><td>@if(!auth()->user()->is($user))<form method="POST" action="{{ route('users.toggle', $user) }}">@csrf @method('PATCH')<button class="btn">Cambiar estado</button></form>@endif</td></tr>@endforeach
</tbody></table></div>
@endsection
