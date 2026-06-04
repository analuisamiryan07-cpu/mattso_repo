@extends('layouts.app')

@section('title', 'Dashboard')

@section('content')
<div class="header-flex">
    <div>
        <h1 style="font-size: 1.6rem; color: var(--navy);">Panel Principal</h1>
        <p style="color: var(--muted); font-size: .9rem;">Bienvenido al sistema automatizado.</p>
    </div>
</div>

<div class="card">
    <p>Has iniciado sesión exitosamente con el rol: <strong>{{ Auth::user()->role }}</strong>.</p>
    <br>
    @if(Auth::user()->isAdmin())
        <p>Como Administrador, tienes acceso a la gestión de usuarios en la barra superior.</p>
        <br>
        <a href="{{ route('clientes.index') }}" class="btn" style="background: var(--navy); padding: 1rem 2rem; font-size: 1.1rem;">🏢 Ir al Gestor de Clientes</a>
    @else
        <p>Como Secretaria, utiliza el Gestor de Clientes para registrar estudiantes y generar Certificados o Carnets.</p>
        <br>
        <a href="{{ route('clientes.index') }}" class="btn" style="background: var(--gold-dark); color: #fff; padding: 1rem 2rem; font-size: 1.1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">🏢 Abrir Gestor de Clientes</a>
    @endif
</div>
@endsection
