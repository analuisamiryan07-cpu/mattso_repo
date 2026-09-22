@extends('layouts.app')

@section('title', 'Nuevo Certificado QR — MATsso')

@section('content')
<div class="page-header">
    <div>
        <h1>Nuevo Certificado QR</h1>
        <p class="muted">Genera un código QR único para pegarlo en el certificado físico</p>
    </div>
    <a href="{{ route('qr-certs.index') }}" class="btn btn-secondary">← Volver</a>
</div>

@if(session('error'))
    <div class="alert errors">{{ session('error') }}</div>
@endif

<div class="card" style="max-width:600px">
    <form method="POST" action="{{ route('qr-certs.store') }}">
        @csrf

        <div>
            <label for="nombres">Nombres completos <span style="color:var(--danger)">*</span></label>
            <input type="text" name="nombres" id="nombres" maxlength="255"
                value="{{ old('nombres') }}" required
                placeholder="Ej: Juan Carlos Pérez Rodríguez">
        </div>

        <div style="margin-top:.75rem">
            <label for="certificado">Certificado <span style="color:var(--danger)">*</span></label>
            <input type="text" name="certificado" id="certificado" maxlength="255"
                value="{{ old('certificado') }}" required
                placeholder="Ej: Cosmetología">
        </div>

        <div class="form-grid" style="margin-top:.75rem">
            <div>
                <label for="fecha_emision">Fecha de emisión <span style="color:var(--danger)">*</span></label>
                <input type="text" name="fecha_emision" id="fecha_emision" maxlength="50"
                    value="{{ old('fecha_emision') }}" required
                    placeholder="Ej: 15 de enero de 2025">
            </div>
            <div>
                <label for="fecha_expiracion">Expira <span style="color:var(--danger)">*</span></label>
                <input type="text" name="fecha_expiracion" id="fecha_expiracion" maxlength="50"
                    value="{{ old('fecha_expiracion') }}" required
                    placeholder="Ej: 15 de enero de 2027">
            </div>
        </div>

        <div style="margin-top:.75rem">
            <label for="estado">Estado <span style="color:var(--danger)">*</span></label>
            <select name="estado" id="estado" required>
                <option value="VIGENTE"    {{ old('estado', 'VIGENTE') === 'VIGENTE'    ? 'selected' : '' }}>VIGENTE</option>
                <option value="EXPIRADO"   {{ old('estado') === 'EXPIRADO'   ? 'selected' : '' }}>EXPIRADO</option>
                <option value="SUSPENDIDO" {{ old('estado') === 'SUSPENDIDO' ? 'selected' : '' }}>SUSPENDIDO</option>
            </select>
        </div>

        <div style="display:flex;gap:.75rem;margin-top:1.75rem;flex-wrap:wrap">
            <button type="submit" class="btn">Generar QR</button>
            <a href="{{ route('qr-certs.index') }}" class="btn btn-secondary">Cancelar</a>
        </div>
    </form>
</div>
@endsection
