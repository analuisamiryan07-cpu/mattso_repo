@extends('layouts.app')
@section('title', 'Aprobación de Pagos — MATSSO')

@section('content')
<div style="max-width:900px;margin:0 auto;padding:20px 16px;font-family:sans-serif;">

  <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:8px;">
    <h1 style="color:#0A2463;margin:0;">Aprobación de Pagos</h1>
    <a href="{{ route('payments.create') }}" style="background:#0A2463;color:#fff;text-decoration:none;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;">
      + Crear orden de compra
    </a>
  </div>

  {{-- Mensajes de estado --}}
  @if(session('status'))
    <div style="background:#f0fdf4;border:1px solid #86efac;color:#166534;border-radius:6px;padding:12px 16px;margin-bottom:16px;font-size:14px;">
      {{ session('status') }}
    </div>
  @endif

  @if($errors->has('api'))
    <div style="background:#fef2f2;border:1px solid #fca5a5;color:#991b1b;border-radius:6px;padding:12px 16px;margin-bottom:16px;font-size:14px;">
      {{ $errors->first('api') }}
    </div>
  @endif

  {{-- Filtros --}}
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px;">
    @foreach(['PENDIENTE','PAGADA','RECHAZADA','TODOS'] as $filter)
      <a href="{{ route('payments.index', ['estado' => $filter]) }}"
         style="padding:6px 16px;border-radius:20px;text-decoration:none;font-size:13px;font-weight:600;
                background:{{ $state === $filter ? '#0A2463' : '#e5e7eb' }};
                color:{{ $state === $filter ? '#fff' : '#374151' }};">
        {{ $filter }}
      </a>
    @endforeach
  </div>

  @forelse($orders as $order)
    @php
      $isPendiente = ($order['estado'] ?? '') === 'PENDIENTE';
      // Solo TRANSFERENCIA se aprueba a mano (revisando el comprobante). PAYPAL
      // y demás métodos automáticos se confirman solos vía la API de PayPal —
      // el backend además rechaza el update manual para esos casos.
      $esTransferencia = ($order['metodo_pago'] ?? '') === 'TRANSFERENCIA';
    @endphp

    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:20px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">

      {{-- Cabecera de la orden --}}
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
        <h2 style="margin:0;font-size:17px;color:#0A2463;">Orden #{{ (int)($order['id'] ?? 0) }}</h2>
        <span style="padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;
          background:{{ ($order['estado'] ?? '') === 'PENDIENTE' ? '#fef9c3' : (($order['estado'] ?? '') === 'PAGADA' ? '#dcfce7' : '#fee2e2') }};
          color:{{ ($order['estado'] ?? '') === 'PENDIENTE' ? '#854d0e' : (($order['estado'] ?? '') === 'PAGADA' ? '#166534' : '#991b1b') }};">
          {{ $order['estado'] ?? 'Sin estado' }}
        </span>
      </div>

      {{-- Datos del cliente --}}
      <p style="margin:4px 0;font-size:13px;color:#374151;">
        <strong>Cliente:</strong> {{ data_get($order, 'cliente.nombre', '—') }}
        &nbsp;·&nbsp; <strong>Cédula:</strong> {{ data_get($order, 'cliente.cedula', '—') }}
        &nbsp;·&nbsp; <strong>Correo:</strong> {{ data_get($order, 'cliente.correo', '—') }}
      </p>
      <p style="margin:4px 0;font-size:13px;color:#374151;">
        <strong>Total:</strong> ${{ number_format((float)($order['total'] ?? 0), 2) }}
        &nbsp;·&nbsp; <strong>Fecha:</strong> {{ $order['fecha_orden'] ? \Carbon\Carbon::parse($order['fecha_orden'])->format('d/m/Y H:i') : '—' }}
      </p>

      {{-- Productos --}}
      @if(!empty($order['items']))
        <div style="margin:10px 0;">
          <strong style="font-size:13px;">Productos:</strong>
          <ul style="margin:4px 0 0;padding-left:18px;font-size:13px;color:#374151;">
            @foreach($order['items'] as $item)
              <li>{{ $item['producto'] ?? 'Producto' }} × {{ (int)($item['cantidad'] ?? 1) }} — ${{ number_format((float)($item['precio'] ?? 0), 2) }}</li>
            @endforeach
          </ul>
        </div>
      @endif

      {{-- Comprobante --}}
      @if(!empty($order['comprobante_url_segura']))
        @php
          $url = $order['comprobante_url_segura'];
          $isPdf = str_ends_with(strtolower(parse_url($url, PHP_URL_PATH) ?? ''), '.pdf')
                || str_contains(strtolower($url), '/raw/');
        @endphp
        <div style="margin:14px 0;">
          <strong style="font-size:13px;display:block;margin-bottom:8px;">Comprobante de pago:</strong>
          @if($isPdf)
            <a href="{{ $url }}" target="_blank" rel="noopener noreferrer"
               style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:#0A2463;color:#fff;border-radius:6px;font-size:13px;text-decoration:none;">
              📄 Ver PDF del comprobante
            </a>
          @else
            <a href="{{ $url }}" target="_blank" rel="noopener noreferrer">
              <img src="{{ $url }}" alt="Comprobante de pago"
                   style="max-width:100%;max-height:340px;border-radius:6px;border:1px solid #e5e7eb;object-fit:contain;display:block;cursor:zoom-in;" />
            </a>
            <p style="font-size:11px;color:#9ca3af;margin:4px 0 0;">Haz clic en la imagen para verla en tamaño completo.</p>
          @endif
        </div>
      @else
        <p style="font-size:13px;color:#9ca3af;margin:10px 0;">Sin comprobante adjunto.</p>
      @endif

      {{-- Botones de acción (solo para PENDIENTE + TRANSFERENCIA) --}}
      @if($isPendiente && !$esTransferencia)
        <p style="font-size:13px;color:#854d0e;background:#fef9c3;border-radius:6px;padding:10px 14px;margin-top:16px;">
          ⏳ Pago pendiente vía {{ $order['metodo_pago'] ?? 'método automático' }}. Se confirma solo cuando el cliente completa el pago — no requiere aprobación manual.
        </p>
      @endif
      @if($isPendiente && $esTransferencia)
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:16px;padding-top:16px;border-top:1px solid #f3f4f6;">

          {{-- Aprobar --}}
          <form method="POST" action="{{ route('payments.update', (int)$order['id']) }}"
                onsubmit="return confirm('¿Confirmas que deseas APROBAR esta orden #{{ (int)$order['id'] }}?');">
            @csrf
            @method('PATCH')
            <input type="hidden" name="estado" value="PAGADA">
<button type="submit"
                    style="padding:9px 20px;background:#16a34a;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;">
              ✅ Aprobar pago
            </button>
          </form>

          {{-- Rechazar (con motivo) --}}
          <details style="flex:1;min-width:220px;">
            <summary style="padding:9px 20px;background:#dc2626;color:#fff;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;list-style:none;display:inline-block;">
              ❌ Rechazar pago
            </summary>
            <div style="margin-top:10px;padding:14px;background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;">
              <form method="POST" action="{{ route('payments.update', (int)$order['id']) }}">
                @csrf
                @method('PATCH')
                <input type="hidden" name="estado" value="RECHAZADA">
                <label style="display:block;font-size:13px;font-weight:600;color:#991b1b;margin-bottom:6px;">
                  Motivo del rechazo <span style="color:#dc2626">*</span>
                </label>
                <textarea name="motivo" rows="3" required maxlength="500"
                          placeholder="Ej: La imagen es ilegible. Por favor, sube una captura más clara del comprobante."
                          style="width:100%;padding:8px;border:1px solid #fca5a5;border-radius:4px;font-size:13px;resize:vertical;box-sizing:border-box;"></textarea>
                @error('motivo')
                  <p style="color:#dc2626;font-size:12px;margin:4px 0 0;">{{ $message }}</p>
                @enderror
                <button type="submit"
                        style="margin-top:10px;padding:8px 18px;background:#dc2626;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;">
                  Confirmar rechazo
                </button>
              </form>
            </div>
          </details>

        </div>
      @endif

    </div>
  @empty
    <div style="text-align:center;padding:40px;color:#6b7280;font-size:15px;">
      No hay órdenes para el filtro <strong>{{ $state }}</strong>.
    </div>
  @endforelse

</div>
@endsection
