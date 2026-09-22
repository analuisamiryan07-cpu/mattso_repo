<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #1f2937; }
  .page { padding: 30px; }

  /* Cabecera */
  .header-table { width: 100%; border-bottom: 3px solid #0f2a5c; padding-bottom: 12px; margin-bottom: 16px; }
  .doc-title  { font-size: 17px; font-weight: bold; color: #0f2a5c; }
  .doc-number { font-size: 12px; color: #2458b3; font-weight: bold; }
  .doc-date   { font-size: 10px; color: #6b7280; margin-top: 2px; }

  /* Secciones */
  .section { margin-bottom: 14px; }
  .section-title { background: #0f2a5c; color: #fff; font-size: 10px; font-weight: bold; text-transform: uppercase; padding: 5px 10px; }
  .section-body  { border: 1px solid #d1d5db; border-top: none; padding: 10px 12px; }

  /* Etiquetas de campos */
  .field-label { font-size: 9px; color: #6b7280; text-transform: uppercase; }
  .field-value { font-size: 11px; color: #111827; font-weight: bold; }

  /* Tabla de items */
  .items-table { width: 100%; border-collapse: collapse; font-size: 11px; }
  .items-table th { background: #f3f4f6; padding: 7px 10px; text-align: left; font-size: 9px; text-transform: uppercase; color: #374151; border-bottom: 2px solid #d1d5db; }
  .items-table td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
  .items-table .right { text-align: right; }

  /* Totales */
  .totals-table { width: 45%; margin-left: 55%; border-collapse: collapse; margin-top: 10px; }
  .totals-table td { padding: 5px 10px; font-size: 11px; }
  .totals-table .lbl { color: #6b7280; }
  .totals-table .val { text-align: right; }
  .total-final td { font-weight: bold; color: #0f2a5c; font-size: 13px; border-top: 2px solid #0f2a5c; }

  /* Sello */
  .stamp { border: 2px solid #16a34a; border-radius: 4px; display: inline-block; padding: 4px 12px; color: #16a34a; font-weight: bold; font-size: 11px; margin-top: 8px; }

  /* Footer */
  .footer { margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 10px; text-align: center; color: #9ca3af; font-size: 9px; }
</style>
</head>
<body>
<div class="page">

@php
  $total    = (float)($order['total'] ?? 0);
  $subtotal = round($total / 1.15, 2);
  $iva      = round($total - $subtotal, 2);
  $folio    = str_pad((int)($order['id'] ?? 0), 6, '0', STR_PAD_LEFT);
  $fecha    = ($order['fecha_orden'] ?? null)
              ? \Carbon\Carbon::parse($order['fecha_orden'])->setTimezone(config('app.timezone'))->format('d/m/Y H:i')
              : now()->format('d/m/Y H:i');
  $cliente  = $order['cliente'] ?? [];
@endphp

{{-- CABECERA --}}
<table class="header-table" cellpadding="0" cellspacing="0">
  <tr>
    <td style="width:45%;vertical-align:middle;">
      @if($logoPath)
        <img src="{{ $logoPath }}" alt="IN SAPPER" style="max-width:180px;max-height:70px;">
      @else
        <span style="font-size:15px;font-weight:bold;color:#0f2a5c;">IN SAPPER INDUSTRIES</span>
      @endif
    </td>
    <td style="width:55%;vertical-align:middle;text-align:right;">
      <div class="doc-title">COMPROBANTE DE PAGO</div>
      <div class="doc-number">N° REC-{{ $folio }}</div>
      <div class="doc-date">Emisión: {{ now()->format('d/m/Y H:i') }}</div>
      <div class="doc-date">Pago: {{ $fecha }}</div>
    </td>
  </tr>
</table>

{{-- DATOS DEL CLIENTE --}}
<div class="section">
  <div class="section-title">Datos del cliente</div>
  <div class="section-body">
    <table width="100%" cellpadding="4" cellspacing="0">
      <tr>
        <td width="50%" style="vertical-align:top;">
          <div class="field-label">Nombres completos</div>
          <div class="field-value">{{ $cliente['nombre'] ?? '—' }}</div>
          <br>
          <div class="field-label">Cédula / RUC</div>
          <div class="field-value">{{ $cliente['cedula'] ?? '—' }}</div>
          <br>
          <div class="field-label">Teléfono</div>
          <div class="field-value">{{ $cliente['telefono'] ?? '—' }}</div>
        </td>
        <td width="50%" style="vertical-align:top;">
          <div class="field-label">Correo electrónico</div>
          <div class="field-value">{{ $cliente['correo'] ?? '—' }}</div>
          <br>
          <div class="field-label">Dirección</div>
          <div class="field-value">{{ $cliente['direccion'] ?? '—' }}{{ isset($cliente['ciudad']) ? ', ' . $cliente['ciudad'] : '' }}</div>
          <br>
          <div class="field-label">N° Orden</div>
          <div class="field-value">#{{ $order['id'] ?? '—' }}</div>
        </td>
      </tr>
    </table>
  </div>
</div>

{{-- PRODUCTOS --}}
<div class="section">
  <div class="section-title">Detalle de la inscripción</div>
  <div class="section-body" style="padding:0;">
    <table class="items-table">
      <thead>
        <tr>
          <th style="width:55%">Producto / Servicio</th>
          <th class="right" style="width:15%">Cant.</th>
          <th class="right" style="width:15%">P. Unitario</th>
          <th class="right" style="width:15%">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        @foreach($order['items'] ?? [] as $item)
        @php $qty = (int)($item['cantidad'] ?? 1); $precio = (float)($item['precio'] ?? 0); @endphp
        <tr>
          <td>{{ $item['producto'] ?? 'Servicio' }}</td>
          <td class="right">{{ $qty }}</td>
          <td class="right">${{ number_format($precio, 2) }}</td>
          <td class="right">${{ number_format($qty * $precio, 2) }}</td>
        </tr>
        @endforeach
      </tbody>
    </table>
  </div>
</div>

{{-- TOTALES + SELLO --}}
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">
  <tr>
    <td width="55%" style="vertical-align:top;">
      <div class="stamp">&#10004; PAGO CONFIRMADO</div>
      <br>
      <div style="font-size:9px;color:#6b7280;margin-top:6px;">
        Forma de pago: Transferencia / Depósito bancario<br>
        Este documento es válido como comprobante de inscripción.
      </div>
    </td>
    <td width="45%" style="vertical-align:top;">
      <table class="totals-table" cellpadding="0" cellspacing="0">
        <tr>
          <td class="lbl">Subtotal (sin IVA)</td>
          <td class="val">${{ number_format($subtotal, 2) }}</td>
        </tr>
        <tr>
          <td class="lbl">IVA 15%</td>
          <td class="val">${{ number_format($iva, 2) }}</td>
        </tr>
        <tr class="total-final">
          <td class="lbl">TOTAL</td>
          <td class="val">${{ number_format($total, 2) }}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>

{{-- FOOTER --}}
<div class="footer">
  <strong style="color:#0f2a5c;">IN SAPPER Industries</strong> &nbsp;|&nbsp; Conocimiento · Calidad · Confianza<br>
  Este comprobante fue generado electrónicamente y no requiere firma física.
</div>

</div>
</body>
</html>
