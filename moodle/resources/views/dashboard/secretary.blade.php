@extends('layouts.app')
@section('title', 'Panel de examinador — MATsso')
@section('content')

<h1>Panel de examinador</h1>
<p class="muted" style="margin-bottom:1.75rem">Gestión de clientes de la plataforma.</p>

<div style="display:flex;gap:.75rem;flex-wrap:wrap">
    <a href="{{ route('clients.index') }}" class="btn">Clientes local</a>
    <a href="{{ route('clients.web') }}" class="btn btn-secondary">Clientes web</a>
</div>

@endsection
