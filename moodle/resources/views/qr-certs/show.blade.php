@extends('layouts.app')

@section('title', 'QR — ' . $cert['nombres'] . ' — MATsso')

@section('content')
<div class="page-header">
    <div>
        <h1>Certificado QR generado</h1>
        <p class="muted">Escanea el código o copia el enlace para verificar</p>
    </div>
    <div style="display:flex;gap:.75rem">
        <a href="{{ route('qr-certs.create') }}" class="btn btn-accent">+ Nuevo QR</a>
        <a href="{{ route('qr-certs.index') }}" class="btn btn-secondary">← Volver</a>
    </div>
</div>

<div style="display:flex;gap:1.5rem;align-items:flex-start;flex-wrap:wrap">

    {{-- QR Code --}}
    <div class="card" style="width:280px;flex-shrink:0;text-align:center;padding:1.5rem">
        <p class="muted" style="margin-bottom:1rem;font-weight:600;font-size:.85rem">CÓDIGO QR DE VERIFICACIÓN</p>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=240x240&data={{ urlencode($verificarUrl) }}"
             alt="QR Verificación"
             style="width:240px;height:240px;border:1px solid var(--border);border-radius:8px">
        <p style="margin-top:.75rem;font-size:.75rem;color:var(--muted);word-break:break-all">
            {{ $cert['codigo'] }}
        </p>
        <a href="https://api.qrserver.com/v1/create-qr-code/?size=600x600&data={{ urlencode($verificarUrl) }}"
           download="qr-{{ $cert['codigo'] }}.png"
           class="btn btn-secondary btn-sm" style="margin-top:.75rem;width:100%;justify-content:center">
            Descargar QR (PNG)
        </a>
    </div>

    {{-- Datos del certificado --}}
    <div class="card" style="flex:1;min-width:280px">
        <h2 style="margin-bottom:1.25rem">Datos del certificado</h2>

        <table style="width:100%;border-collapse:collapse">
            <tbody>
                <tr>
                    <td style="padding:.65rem 0;border-bottom:1px solid var(--border);color:var(--muted);font-size:.83rem;font-weight:600;width:40%">NOMBRES COMPLETOS</td>
                    <td style="padding:.65rem 0;border-bottom:1px solid var(--border);font-weight:600">{{ $cert['nombres'] }}</td>
                </tr>
                <tr>
                    <td style="padding:.65rem 0;border-bottom:1px solid var(--border);color:var(--muted);font-size:.83rem;font-weight:600">CERTIFICADO</td>
                    <td style="padding:.65rem 0;border-bottom:1px solid var(--border)">{{ $cert['certificado'] }}</td>
                </tr>
                <tr>
                    <td style="padding:.65rem 0;border-bottom:1px solid var(--border);color:var(--muted);font-size:.83rem;font-weight:600">FECHA DE EMISIÓN</td>
                    <td style="padding:.65rem 0;border-bottom:1px solid var(--border)">{{ $cert['fecha_emision'] }}</td>
                </tr>
                <tr>
                    <td style="padding:.65rem 0;border-bottom:1px solid var(--border);color:var(--muted);font-size:.83rem;font-weight:600">EXPIRA</td>
                    <td style="padding:.65rem 0;border-bottom:1px solid var(--border)">{{ $cert['fecha_expiracion'] }}</td>
                </tr>
                <tr>
                    <td style="padding:.65rem 0;color:var(--muted);font-size:.83rem;font-weight:600">ESTADO</td>
                    <td style="padding:.65rem 0">
                        @if($cert['estado'] === 'VIGENTE')
                            <span class="badge badge-green">VIGENTE</span>
                        @elseif($cert['estado'] === 'EXPIRADO')
                            <span class="badge badge-red">EXPIRADO</span>
                        @else
                            <span class="badge badge-blue">{{ $cert['estado'] }}</span>
                        @endif
                    </td>
                </tr>
            </tbody>
        </table>

        <div style="margin-top:1.5rem">
            <label style="font-size:.83rem;font-weight:600;color:var(--navy);display:block;margin-bottom:.4rem">Enlace de verificación</label>
            <div style="display:flex;gap:.5rem;align-items:center">
                <input type="text" id="verify-url" value="{{ $verificarUrl }}" readonly
                    style="flex:1;background:#f0f2f8;border-color:var(--border);font-size:.83rem;cursor:text">
                <button onclick="copyUrl()" class="btn btn-secondary btn-sm" id="copy-btn">Copiar</button>
            </div>
        </div>
    </div>

</div>

<script>
function copyUrl() {
    const input = document.getElementById('verify-url');
    navigator.clipboard.writeText(input.value).then(() => {
        const btn = document.getElementById('copy-btn');
        btn.textContent = '¡Copiado!';
        setTimeout(() => { btn.textContent = 'Copiar'; }, 2000);
    });
}
</script>
@endsection
