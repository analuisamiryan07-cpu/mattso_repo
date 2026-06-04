@extends('layouts.app')

@section('title', 'Crear Usuario')

@section('content')
<div class="header-flex">
    <h1 style="font-size: 1.6rem; color: var(--navy);">Alta de Usuario</h1>
    <a href="{{ route('users.index') }}" class="btn btn-danger" style="color:var(--text);border-color:var(--border);">Volver</a>
</div>

<div class="card" style="max-width: 600px;">
    <form method="POST" action="{{ route('users.store') }}">
        @csrf
        
        <div class="input-group">
            <label>Nombre del Empleado</label>
            <input type="text" name="name" value="{{ old('name') }}" required>
        </div>

        <div class="input-group">
            <label>Nombre de Usuario (Login)</label>
            <input type="text" name="username" value="{{ old('username') }}" required>
        </div>

        <div class="input-group">
            <label>Correo Electrónico (Opcional)</label>
            <input type="email" name="email" value="{{ old('email') }}">
        </div>

        <div class="input-group">
            <label>Rol en el Sistema</label>
            <select name="role" required>
                <option value="secretaria">Secretaria (Operativo)</option>
                <option value="admin">Administrador (Total)</option>
            </select>
        </div>

        <div class="alert alert-success" style="margin-top: 1.5rem;">
            <strong>Nota de Seguridad:</strong> La contraseña temporal será <code>123qwe</code>. 
            El usuario estará obligado a cambiarla en su primer inicio de sesión.
        </div>

        <button type="submit" class="btn">Crear Cuenta</button>
    </form>
</div>
@endsection
