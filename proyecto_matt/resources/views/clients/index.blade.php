@extends('layouts.app')
@section('title', 'Clientes — MATsso')
@section('content')
<div class="actions" style="justify-content:space-between"><div><h1>Historial de clientes</h1><p class="muted">Generaciones documentales registradas.</p></div><a class="btn" href="{{ route('documents.create') }}">Nueva certificación</a></div>
<form method="GET" class="card actions"><input aria-label="Buscar cliente" name="buscar" value="{{ $search }}" placeholder="Nombre o cédula"><button class="btn">Buscar</button>@if($search !== '')<a href="{{ route('clients.index') }}">Limpiar</a>@endif</form>
<div class="card"><table><thead><tr><th>Cliente</th><th>Cédula</th><th>Fecha</th><th>Archivos</th><th></th></tr></thead><tbody>
@forelse($documents as $document)<tr><td>{{ $document->client?->nombre ?? 'Cliente no disponible' }}</td><td>{{ $document->client?->cedula ?? '—' }}</td><td>{{ $document->fecha_generacion?->format('d/m/Y H:i') ?? '—' }}</td><td>@foreach($document->nombres_archivos ?? [] as $file)<div><a href="{{ route('clients.documents.file', [$document, 'file' => $file]) }}">{{ $file }}</a></div>@endforeach</td><td><a class="btn" href="{{ route('clients.documents.download', $document) }}">Descargar ZIP</a></td></tr>@empty<tr><td colspan="5">No hay generaciones registradas.</td></tr>@endforelse
</tbody></table>{{ $documents->links() }}</div>
@endsection
