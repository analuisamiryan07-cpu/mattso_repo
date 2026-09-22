@extends('layouts.app')

@section('title', 'Certificados QR — MATsso')

@section('content')
<div class="page-header">
    <div>
        <h1>Certificados QR</h1>
        <p class="muted">Códigos QR de verificación para certificados físicos</p>
    </div>
    <a href="{{ route('qr-certs.create') }}" class="btn">+ Nuevo certificado QR</a>
</div>

@if(session('error'))
    <div class="alert errors">{{ session('error') }}</div>
@endif

<div class="card table-card">
    <table>
        <thead>
            <tr>
                <th>Nombres</th>
                <th>Certificado</th>
                <th>Emisión</th>
                <th>Expira</th>
                <th>Estado</th>
                <th>Código</th>
                <th style="text-align:right">Acciones</th>
            </tr>
        </thead>
        <tbody>
            @forelse($certs as $cert)
            <tr>
                <td style="font-weight:600">{{ $cert['nombres'] }}</td>
                <td style="max-width:200px">{{ $cert['certificado'] }}</td>
                <td>{{ $cert['fecha_emision'] }}</td>
                <td>{{ $cert['fecha_expiracion'] }}</td>
                <td>
                    @if($cert['estado'] === 'VIGENTE')
                        <span class="badge badge-green">VIGENTE</span>
                    @elseif($cert['estado'] === 'EXPIRADO')
                        <span class="badge badge-red">EXPIRADO</span>
                    @else
                        <span class="badge badge-blue">{{ $cert['estado'] }}</span>
                    @endif
                </td>
                <td>
                    <code style="font-size:.8rem;background:#f0f2f8;padding:.2rem .4rem;border-radius:4px">{{ $cert['codigo'] }}</code>
                </td>
                <td>
                    <div class="action-btns">
                        <a href="{{ route('qr-certs.show', $cert['id']) }}" class="btn btn-secondary btn-sm">Ver QR</a>
                        <form method="POST" action="{{ route('qr-certs.destroy', $cert['id']) }}"
                              onsubmit="return confirm('¿Eliminar este certificado QR?')">
                            @csrf
                            @method('DELETE')
                            <button type="submit" class="btn btn-danger btn-sm">Eliminar</button>
                        </form>
                    </div>
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="7" style="text-align:center;padding:2.5rem;color:var(--muted)">
                    No hay certificados QR. <a href="{{ route('qr-certs.create') }}">Crear el primero</a>.
                </td>
            </tr>
            @endforelse
        </tbody>
    </table>
</div>
@endsection
