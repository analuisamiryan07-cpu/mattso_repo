<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #1f2937; font-size: 15px; margin: 0; padding: 0; background: #f9fafb; }
    .wrap { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,.08); }
    .header { background: #0f2a5c; padding: 32px 40px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 22px; letter-spacing: .02em; }
    .header p  { color: rgba(255,255,255,.7); margin: 6px 0 0; font-size: 13px; }
    .body { padding: 32px 40px; }
    .greeting { font-size: 17px; font-weight: 700; color: #0f2a5c; margin-bottom: 12px; }
    .body p { line-height: 1.7; color: #374151; margin: 0 0 14px; }
    .box { background: #f0f4ff; border-left: 4px solid #2458b3; border-radius: 6px; padding: 16px 20px; margin: 20px 0; }
    .box strong { display: block; color: #0f2a5c; margin-bottom: 6px; font-size: 13px; text-transform: uppercase; letter-spacing: .05em; }
    table.items { width: 100%; border-collapse: collapse; margin-top: 6px; }
    table.items th { text-align: left; font-size: 12px; color: #6b7280; padding: 4px 0; border-bottom: 1px solid #d1d5db; }
    table.items td { padding: 6px 0; font-size: 14px; border-bottom: 1px solid #e5e7eb; }
    .total-row td { font-weight: 700; color: #0f2a5c; border-bottom: none; padding-top: 10px; }
    .badge { display: inline-block; background: #dcfce7; color: #166534; border-radius: 20px; padding: 5px 14px; font-size: 13px; font-weight: 700; margin-bottom: 20px; }
    .footer { background: #f3f4f6; padding: 18px 40px; text-align: center; font-size: 12px; color: #9ca3af; }
    .footer a { color: #2458b3; text-decoration: none; }
  </style>
</head>
<body>
<div class="wrap">

  <div class="header">
    <h1>IN SAPPER Industries</h1>
    <p>Conocimiento · Calidad · Confianza</p>
  </div>

  <div class="body">
    <p class="greeting">Hola, {{ $order['cliente']['nombre'] ?? 'Estimado/a' }} 👋</p>

    <span class="badge">✅ Inscripción confirmada</span>

    <p>
      Nos complace informarte que tu pago ha sido <strong>aprobado exitosamente</strong>.
      Tu inscripción está confirmada y ya formas parte de IN SAPPER Industries.
    </p>

    <div class="box">
      <strong>Detalle de tu orden #{{ $order['id'] ?? '—' }}</strong>
      <table class="items">
        <thead>
          <tr>
            <th>Producto / Servicio</th>
            <th style="text-align:right">Precio</th>
          </tr>
        </thead>
        <tbody>
          @foreach($order['items'] ?? [] as $item)
          <tr>
            <td>{{ $item['producto'] ?? 'Servicio' }} × {{ (int)($item['cantidad'] ?? 1) }}</td>
            <td style="text-align:right">${{ number_format((float)($item['precio'] ?? 0), 2) }}</td>
          </tr>
          @endforeach
          <tr class="total-row">
            <td>TOTAL</td>
            <td style="text-align:right">${{ number_format((float)($order['total'] ?? 0), 2) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p>
      Adjunto a este correo encontrarás tu <strong>comprobante de pago en PDF</strong>
      con el detalle completo de tu inscripción. Guárdalo como respaldo.
    </p>

    <p>
      Si tienes alguna pregunta, no dudes en contactarnos. ¡Estamos aquí para ayudarte!
    </p>

    <p style="color:#6b7280;font-size:13px;margin-top:24px;">
      Atentamente,<br>
      <strong style="color:#0f2a5c">Equipo IN SAPPER Industries</strong>
    </p>
  </div>

  <div class="footer">
    Este correo fue generado automáticamente. Por favor no respondas directamente.<br>
    &copy; {{ date('Y') }} IN SAPPER Industries — Soluciones que generan futuro.
  </div>

</div>
</body>
</html>
