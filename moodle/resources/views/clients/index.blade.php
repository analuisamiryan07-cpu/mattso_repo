@extends('layouts.app')
@section('title', 'Clientes — MATsso')
@section('content')

{{-- Auto-descarga cuando se redirige desde generación de documentos --}}
@if(session('download_id'))
<a id="auto-dl" href="{{ route('clients.documents.download', session('download_id')) }}" style="display:none" aria-hidden="true">descargar</a>
<script>window.addEventListener('DOMContentLoaded', function(){ document.getElementById('auto-dl').click(); });</script>
@endif

<div class="page-header">
    <div>
        <h1>Historial de clientes</h1>
        <p class="muted">Generaciones documentales registradas.</p>
    </div>
    <a class="btn" href="{{ route('documents.create') }}">+ Nueva certificación</a>
</div>

<form method="GET" class="card search-bar">
    <input aria-label="Buscar cliente" name="buscar" value="{{ $search }}" placeholder="Buscar por nombre o cédula…">
    <select name="empresa" aria-label="Filtrar por empresa">
        <option value="">Todas las empresas</option>
        @foreach(\App\Models\Client::companies() as $value => $label)
            <option value="{{ $value }}" @selected($empresa === $value)>{{ $label }}</option>
        @endforeach
    </select>
    <button class="btn">Buscar</button>
    @if($search !== '')
        <a class="btn btn-secondary" href="{{ route('clients.index') }}">Limpiar</a>
    @endif
</form>

<div class="card table-card">
    <table>
        <thead>
            <tr>
                <th>Cliente</th>
                <th>Empresa</th>
                <th>Cédula</th>
                <th>Fecha</th>
                <th>Archivos</th>
                <th style="text-align:right">Acciones</th>
            </tr>
        </thead>
        <tbody>
            @forelse($documents as $document)
            <tr>
                <td><strong>{{ $document->client?->nombre ?? 'Cliente no disponible' }}</strong></td>
                <td>{{ \App\Models\Client::companies()[$document->empresa ?? $document->client?->empresa] ?? 'Sin clasificar' }}</td>
                <td class="muted">{{ $document->client?->cedula ?? '—' }}</td>
                <td class="muted">{{ $document->fecha_generacion?->format('d/m/Y H:i') ?? '—' }}</td>
                <td>
                    @foreach($document->nombres_archivos ?? [] as $file)
                        <div><a class="file-link" href="{{ route('clients.documents.file', [$document, 'file' => $file]) }}">{{ $file }}</a></div>
                    @endforeach
                </td>
                <td>
                    <div class="action-btns">
                        @if($document->client)
                            <a class="btn btn-secondary btn-sm" href="{{ route('clients.edit', $document->client) }}">Editar</a>
                        @endif
                        <a class="btn btn-sm" href="{{ route('clients.documents.download', $document) }}">Descargar ZIP</a>
                        <a class="btn btn-secondary btn-sm" href="{{ route('clients.documents.pdf', $document) }}">Crear PDF</a>
                    </div>
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="6" style="text-align:center;padding:2rem;color:var(--muted)">No hay generaciones registradas.</td>
            </tr>
            @endforelse
        </tbody>
    </table>
    <div class="pagination-wrapper">{{ $documents->links() }}</div>
</div>

@endsection
