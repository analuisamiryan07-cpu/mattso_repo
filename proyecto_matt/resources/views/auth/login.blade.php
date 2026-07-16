@extends('layouts.app')
@section('title', 'Iniciar sesión — MATsso')
@section('content')
<div class="card" style="max-width:420px;margin:8vh auto">
    <h1>Iniciar sesión</h1>
    <p class="muted">Acceso administrativo MATsso</p>
    <form method="POST" action="{{ route('login.store') }}">
        @csrf
        <label for="usuario">Usuario</label>
        <input id="usuario" name="usuario" value="{{ old('usuario') }}" required autofocus autocomplete="username">
        <label for="contrasena">Contraseña</label>
        <input id="contrasena" type="password" name="contrasena" required autocomplete="current-password">
        <button class="btn" style="width:100%;margin-top:1rem">Ingresar</button>
    </form>
</div>
@endsection
