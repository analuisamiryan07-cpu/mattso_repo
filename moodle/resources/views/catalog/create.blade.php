@extends('layouts.app')

@php
    $defaultTipo = old('tipo', request()->query('tipo', 'CERTIFICACION'));
    $backRoute   = $defaultTipo === 'CAPACITACION' ? route('capacitaciones.index') : route('catalog.index');
    $pageTitle   = $defaultTipo === 'CAPACITACION' ? 'Nueva Capacitación' : 'Nueva Certificación';
@endphp

@section('title', $pageTitle . ' — MATsso')

@section('content')
<div class="page-header">
    <div>
        <h1>{{ $pageTitle }}</h1>
        <p class="muted">Agrega el producto al catálogo del sitio web</p>
    </div>
    <a href="{{ $backRoute }}" class="btn btn-secondary">← Volver</a>
</div>

<div class="card" style="max-width:720px">
    <form method="POST" action="{{ route('catalog.store') }}">
        @csrf

        <div class="form-grid">
            <div>
                <label for="tipo">Tipo <span style="color:var(--danger)">*</span></label>
                <select name="tipo" id="tipo" required>
                    <option value="">— Selecciona —</option>
                    <option value="CERTIFICACION" {{ $defaultTipo === 'CERTIFICACION' ? 'selected' : '' }}>Certificación</option>
                    <option value="CAPACITACION"  {{ $defaultTipo === 'CAPACITACION'  ? 'selected' : '' }}>Capacitación</option>
                </select>
            </div>
            <div>
                <label for="precio">Precio (USD) <span style="color:var(--danger)">*</span></label>
                <input type="number" name="precio" id="precio" min="0" step="0.01"
                    value="{{ old('precio', '0.00') }}" required>
            </div>
        </div>

        <div>
            <label for="titulo">Título <span style="color:var(--danger)">*</span></label>
            <input type="text" name="titulo" id="titulo" maxlength="255"
                value="{{ old('titulo') }}" required
                placeholder="Ej: Cosmetología">
        </div>

        <div>
            <label for="descripcion_larga">Descripción</label>
            <textarea name="descripcion_larga" id="descripcion_larga" rows="6"
                placeholder="Texto que aparece en la página de detalle.">{{ old('descripcion_larga') }}</textarea>
        </div>

        <div class="form-grid" id="cap-fields" style="{{ $defaultTipo !== 'CAPACITACION' ? 'display:none' : '' }}">
            <div>
                <label for="fecha">Fecha <span class="muted">(ej: 26 y 27 Enero 2025)</span></label>
                <input type="text" name="fecha" id="fecha" maxlength="100"
                    value="{{ old('fecha') }}" placeholder="Ej: 26 y 27 Enero 2025">
            </div>
            <div>
                <label for="horario">Horario <span class="muted">(ej: 18h00 a 21h30)</span></label>
                <input type="text" name="horario" id="horario" maxlength="100"
                    value="{{ old('horario') }}" placeholder="Ej: 18h00 a 21h30">
            </div>
        </div>

        <script>
            document.getElementById('tipo').addEventListener('change', function() {
                document.getElementById('cap-fields').style.display =
                    this.value === 'CAPACITACION' ? '' : 'none';
            });
        </script>

        <div class="form-grid">
            <div>
                <label for="horas">Horas</label>
                <input type="number" name="horas" id="horas" min="1" max="9999"
                    value="{{ old('horas') }}" placeholder="Ej: 40">
            </div>
            <div>
                <label for="modalidad">Modalidad</label>
                <input type="text" name="modalidad" id="modalidad" maxlength="100"
                    value="{{ old('modalidad', 'Virtual') }}"
                    placeholder="Ej: Virtual, Presencial">
            </div>
            <div>
                <label for="imagen_url">Número imagen Cloudinary</label>
                <input type="text" name="imagen_url" id="imagen_url" maxlength="3"
                    value="{{ old('imagen_url') }}" placeholder="01 o 001"
                    pattern="\d{2,3}" title="2 dígitos para capacitaciones (ej: 01) o 3 dígitos para certificaciones (ej: 001)">
                <p class="muted" style="margin:.3rem 0 0;font-size:.75rem">
                    Capacitaciones: 2 dígitos (01–21) · Certificaciones: 3 dígitos (001–049)
                </p>
            </div>
        </div>

        <div class="form-section" style="margin-top:1.25rem">
            <div class="checks">
                <label class="check-label">
                    <input type="hidden" name="activo" value="0">
                    <input type="checkbox" name="activo" value="1" {{ old('activo', '1') ? 'checked' : '' }}>
                    Activo (visible en el sitio web)
                </label>
                <label class="check-label">
                    <input type="hidden" name="destacado" value="0">
                    <input type="checkbox" name="destacado" value="1" {{ old('destacado') ? 'checked' : '' }}>
                    Destacado (aparece en sección principal)
                </label>
            </div>
        </div>

        <div style="display:flex;gap:.75rem;margin-top:1.5rem;flex-wrap:wrap">
            <button type="submit" class="btn">Crear producto</button>
            <a href="{{ $backRoute }}" class="btn btn-secondary">Cancelar</a>
        </div>
    </form>
</div>
@endsection
