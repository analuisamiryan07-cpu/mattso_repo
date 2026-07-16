@extends('layouts.app')
@section('title', 'Pagos — MATsso')
@section('content')
<h1>Aprobación de pagos</h1>
<div class="actions" style="margin-bottom:1rem">@foreach(['PENDIENTE','PAGADA','RECHAZADA','TODOS'] as $filter)<a class="btn" href="{{ route('payments.index', ['estado' => $filter]) }}">{{ $filter }}</a>@endforeach</div>
@forelse($orders as $order)
<div class="card"><div class="actions" style="justify-content:space-between"><h2>Orden #{{ (int)($order['id'] ?? 0) }}</h2><span class="badge">{{ $order['estado'] ?? 'Sin estado' }}</span></div>
    <p><strong>Cliente:</strong> {{ data_get($order, 'cliente.nombre', '—') }} · {{ data_get($order, 'cliente.cedula', '—') }}</p>
    <p><strong>Total:</strong> ${{ number_format((float)($order['total'] ?? 0), 2) }}</p>
    @if(!empty($order['items']))<ul>@foreach($order['items'] as $item)<li>{{ $item['producto'] ?? 'Producto' }} × {{ (int)($item['cantidad'] ?? 1) }}</li>@endforeach</ul>@endif
    @if(!empty($order['comprobante_url_segura']))<p><a href="{{ $order['comprobante_url_segura'] }}" target="_blank" rel="noopener noreferrer">Ver comprobante</a></p>@endif
    @if(($order['estado'] ?? '') === 'PENDIENTE')<div class="actions">
        <form method="POST" action="{{ route('payments.update', (int)$order['id']) }}">@csrf @method('PATCH')<input type="hidden" name="estado" value="PAGADA"><button class="btn">Aprobar</button></form>
        <form method="POST" action="{{ route('payments.update', (int)$order['id']) }}">@csrf @method('PATCH')<input type="hidden" name="estado" value="RECHAZADA"><button class="btn btn-danger">Rechazar</button></form>
    </div>@endif
</div>
@empty<div class="card">No hay órdenes para el filtro seleccionado.</div>@endforelse
@endsection
