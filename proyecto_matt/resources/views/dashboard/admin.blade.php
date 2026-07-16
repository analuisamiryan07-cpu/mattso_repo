@extends('layouts.app')
@section('title', 'Panel administrativo — MATsso')
@section('content')
<h1>Panel administrativo</h1><p class="muted">Resumen del sistema local.</p>
<div class="grid">
    <div class="card"><div class="stat">{{ $clientCount }}</div><div>Clientes</div></div>
    <div class="card"><div class="stat">{{ $documentCount }}</div><div>Generaciones</div></div>
    <div class="card"><div class="stat">{{ $userCount }}</div><div>Usuarios</div></div>
</div>
<div class="card actions"><a class="btn" href="{{ route('documents.create') }}">Nueva certificación</a><a class="btn" href="{{ route('payments.index') }}">Revisar pagos</a><a class="btn" href="{{ route('users.index') }}">Administrar usuarios</a></div>
@endsection
