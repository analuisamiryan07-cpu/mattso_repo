@extends('layouts.app')
@section('title', 'Panel de secretaría — MATsso')
@section('content')
<h1>Panel de secretaría</h1><p class="muted">Gestión de clientes, certificaciones y capacitaciones.</p>
<div class="grid">
    <a class="card" href="{{ route('clients.index') }}"><h2>Clientes</h2><p class="muted">Consultar historial y documentos.</p></a>
    <a class="card" href="{{ route('documents.create') }}"><h2>Certificaciones</h2><p class="muted">Generar un nuevo paquete documental.</p></a>
    <a class="card" href="{{ route('trainings.index') }}"><h2>Capacitaciones</h2><p class="muted">Consultar el estado del módulo.</p></a>
</div>
@endsection
