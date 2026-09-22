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
            <div><label>Rol</label>
                <select name="rol">
                    <option value="SECRETARIA">Examinador</option>
                    <option value="ADMINISTRADOR">Administrador</option>
                </select>
            </div>
            <div><label>Contraseña</label><input type="password" name="contrasena" required></div>
            <div><label>Confirmar contraseña</label><input type="password" name="contrasena_confirmation" required></div>
        </div>
        <button class="btn" style="margin-top:1rem">Crear usuario</button>
    </form>
</div>

<div class="card table-card">
    <table>
        <thead>
            <tr>
                <th>Usuario</th>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Estado</th>
                <th style="text-align:right">Acciones</th>
            </tr>
        </thead>
        <tbody>
        @foreach($users as $user)
        <tr>
            <td>{{ $user->usuario }}</td>
            <td>{{ $user->nombre_completo }}</td>
            <td>
                @if(!auth()->user()->is($user) && $user->rol !== 'VENDEDOR')
                    <form method="POST" action="{{ route('users.role', $user) }}" style="display:flex;gap:.4rem;align-items:center;">
                        @csrf @method('PATCH')
                        <select name="rol" style="width:auto;padding:.3rem .55rem;font-size:.82rem;">
                            <option value="ADMINISTRADOR" @selected($user->rol === 'ADMINISTRADOR')>Administrador</option>
                            <option value="SECRETARIA"    @selected($user->rol === 'SECRETARIA')>Examinador</option>
                        </select>
                        <button class="btn btn-sm btn-secondary" type="submit">Guardar</button>
                    </form>
                @else
                    <span class="badge badge-blue">
                        {{ $user->rol === 'SECRETARIA' ? 'Examinador' : ($user->rol === 'VENDEDOR' ? 'Vendedor' : 'Administrador') }}
                    </span>
                @endif
            </td>
            <td>
                <span class="badge {{ $user->activo ? 'badge-green' : 'badge-red' }}">
                    {{ $user->activo ? 'Activo' : 'Inactivo' }}
                </span>
            </td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-sm btn-accent"
                            onclick="openPwdModal({{ $user->id }}, '{{ addslashes($user->nombre_completo ?: $user->usuario) }}')">
                        Contraseña
                    </button>
                    @if(!auth()->user()->is($user))
                    <form method="POST" action="{{ route('users.toggle', $user) }}">
                        @csrf @method('PATCH')
                        <button class="btn btn-sm {{ $user->activo ? 'btn-danger' : 'btn-secondary' }}">
                            {{ $user->activo ? 'Desactivar' : 'Activar' }}
                        </button>
                    </form>
                    @endif
                </div>
            </td>
        </tr>
        @endforeach
        </tbody>
    </table>
</div>

{{-- Modal cambio de contraseña --}}
<div id="pwd-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1000;align-items:center;justify-content:center;">
    <div style="background:#fff;border-radius:12px;padding:2rem;max-width:420px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,.2);">
        <h2 id="pwd-modal-title" style="margin:0 0 1.25rem;">Cambiar contraseña</h2>
        <form id="pwd-form" method="POST">
            @csrf @method('PATCH')
            <label>Nueva contraseña</label>
            <input type="password" name="password" required minlength="6" autocomplete="new-password">
            <label style="margin-top:.75rem">Confirmar contraseña</label>
            <input type="password" name="password_confirmation" required autocomplete="new-password">
            <div style="display:flex;gap:.75rem;margin-top:1.5rem;justify-content:flex-end;">
                <button type="button" class="btn btn-secondary" onclick="closePwdModal()">Cancelar</button>
                <button type="submit" class="btn">Guardar</button>
            </div>
        </form>
    </div>
</div>

@push('scripts')
<script>
function openPwdModal(id, name) {
    document.getElementById('pwd-modal-title').textContent = 'Cambiar contraseña — ' + name;
    document.getElementById('pwd-form').action = '/admin/usuarios/' + id + '/password';
    document.getElementById('pwd-form').reset();
    var overlay = document.getElementById('pwd-overlay');
    overlay.style.display = 'flex';
    overlay.querySelector('input[name="password"]').focus();
}
function closePwdModal() {
    document.getElementById('pwd-overlay').style.display = 'none';
}
document.getElementById('pwd-overlay').addEventListener('click', function(e) {
    if (e.target === this) closePwdModal();
});
</script>
@endpush
@endsection
