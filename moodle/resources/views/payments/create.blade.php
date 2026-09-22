@extends('layouts.app')
@section('title', 'Crear orden de compra — MATSSO')

@section('content')
<div style="max-width:700px;margin:0 auto;padding:20px 16px;font-family:sans-serif;">
    <h1 style="color:#0A2463;margin-bottom:4px;">Crear orden de compra</h1>
    <p style="color:#6b7280;font-size:13px;margin:0 0 20px;">
        Para ventas por teléfono. Nace directamente <strong>PAGADA</strong> — no pasa por aprobación. La persona debe ya tener cuenta en la página web (mismas credenciales del Aula Virtual).
    </p>

    @if(session('error'))
        <div style="background:#fef2f2;border:1px solid #fca5a5;color:#991b1b;border-radius:6px;padding:12px 16px;margin-bottom:16px;font-size:14px;">
            {{ session('error') }}
        </div>
    @endif
    @if($errors->any())
        <div style="background:#fef2f2;border:1px solid #fca5a5;color:#991b1b;border-radius:6px;padding:12px 16px;margin-bottom:16px;font-size:14px;">
            <ul style="margin:0;padding-left:18px">
                @foreach($errors->all() as $error)<li>{{ $error }}</li>@endforeach
            </ul>
        </div>
    @endif

    <form method="POST" action="{{ route('payments.store') }}" style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:20px;">
        @csrf

        <div style="margin-bottom:14px;">
            <label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:4px;">Correo del comprador *</label>
            <input type="email" name="correo" value="{{ old('correo') }}" required placeholder="persona@correo.com"
                style="width:100%;padding:8px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;">
        </div>

        <label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;">Productos *</label>
        @for($i = 0; $i < 5; $i++)
            <div style="display:flex;gap:8px;margin-bottom:8px;">
                <select name="items[{{ $i }}][producto_id]" style="flex:3;padding:8px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;">
                    <option value="">— {{ $i === 0 ? 'Selecciona un producto' : '(opcional)' }} —</option>
                    @foreach($productos as $p)
                        <option value="{{ $p['id'] }}" {{ old("items.$i.producto_id") == $p['id'] ? 'selected' : '' }}>
                            [{{ $p['tipo'] }}] {{ $p['titulo'] }} — ${{ number_format($p['precio'], 2) }}
                        </option>
                    @endforeach
                </select>
                <input type="number" name="items[{{ $i }}][cantidad]" min="1" max="10" value="{{ old("items.$i.cantidad", 1) }}"
                    style="width:70px;padding:8px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;" placeholder="Cant.">
            </div>
        @endfor
        <p style="font-size:12px;color:#6b7280;margin:-2px 0 14px;">Deja vacías las filas que no necesites.</p>

        <div style="margin-bottom:16px;">
            <label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:4px;">Monto total pagado (USD) *</label>
            <input type="number" name="monto_pagado_manual" min="0" step="0.01" value="{{ old('monto_pagado_manual') }}" required
                style="width:200px;padding:8px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;">
            <p style="font-size:12px;color:#6b7280;margin:4px 0 0;">Registro de lo cobrado — el total de la orden se calcula igual que una compra web (precio de catálogo + IVA).</p>
        </div>

        <div style="display:flex;gap:10px;">
            <button type="submit" style="background:#0A2463;color:#fff;border:none;padding:9px 20px;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;">
                Crear orden (PAGADA)
            </button>
            <a href="{{ route('payments.index') }}" style="padding:9px 20px;color:#374151;text-decoration:none;font-size:14px;">Cancelar</a>
        </div>
    </form>
</div>
@endsection
