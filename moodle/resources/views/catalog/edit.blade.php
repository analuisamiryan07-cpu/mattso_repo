@extends('layouts.app')

@php
    $isCap     = ($product['tipo'] ?? 'CERTIFICACION') === 'CAPACITACION';
    $backRoute = $isCap ? route('capacitaciones.index') : route('catalog.index');
    $backLabel = $isCap ? '← Volver a Capacitaciones' : '← Volver a Certificaciones';
    $imgNum    = $product['imagen_url'] ?? '';
    $cloudImg  = $imgNum ? "https://res.cloudinary.com/ehglt8h8/image/upload/f_auto,q_auto/{$imgNum}_derecha" : '';
@endphp

@section('title', 'Editar Producto — MATsso')

@section('content')
<div class="page-header">
    <div>
        <h1>Editar Producto</h1>
        <p class="muted">ID #{{ $product['id'] }} · {{ $product['tipo'] }}</p>
    </div>
    <a href="{{ $backRoute }}" class="btn btn-secondary">{{ $backLabel }}</a>
</div>

<div style="display:flex;gap:1.5rem;align-items:flex-start">

    {{-- Formulario --}}
    <div class="card" style="flex:1;min-width:0">
        <form method="POST" action="{{ route('catalog.update', $product['id']) }}">
            @csrf
            @method('PUT')

            <div class="form-grid">
                <div>
                    <label for="tipo">Tipo <span style="color:var(--danger)">*</span></label>
                    <select name="tipo" id="tipo" required>
                        <option value="CERTIFICACION" {{ old('tipo', $product['tipo']) === 'CERTIFICACION' ? 'selected' : '' }}>Certificación</option>
                        <option value="CAPACITACION"  {{ old('tipo', $product['tipo']) === 'CAPACITACION'  ? 'selected' : '' }}>Capacitación</option>
                    </select>
                </div>
                <div>
                    <label for="precio">Precio (USD) <span style="color:var(--danger)">*</span></label>
                    <input type="number" name="precio" id="precio" min="0" step="0.01"
                        value="{{ old('precio', $product['precio']) }}" required>
                </div>
            </div>

            <div>
                <label for="titulo">Título <span style="color:var(--danger)">*</span></label>
                <input type="text" name="titulo" id="titulo" maxlength="255"
                    value="{{ old('titulo', $product['titulo']) }}" required>
            </div>

            <div>
                <label for="descripcion_larga">Descripción</label>
                <textarea name="descripcion_larga" id="descripcion_larga" rows="6"
                    placeholder="Texto que aparece en la página de detalle.">{{ old('descripcion_larga', $product['descripcion_larga'] ?? '') }}</textarea>
            </div>

            @if($isCap)
            <div class="form-grid">
                <div>
                    <label for="fecha">Fecha <span class="muted">(ej: 26 y 27 Enero 2025)</span></label>
                    <input type="text" name="fecha" id="fecha" maxlength="100"
                        value="{{ old('fecha', $product['fecha'] ?? '') }}"
                        placeholder="Ej: 26 y 27 Enero 2025">
                </div>
                <div>
                    <label for="horario">Horario <span class="muted">(ej: 18h00 a 21h30)</span></label>
                    <input type="text" name="horario" id="horario" maxlength="100"
                        value="{{ old('horario', $product['horario'] ?? '') }}"
                        placeholder="Ej: 18h00 a 21h30">
                </div>
            </div>
            @endif

            <div class="form-grid">
                <div>
                    <label for="horas">Horas</label>
                    <input type="number" name="horas" id="horas" min="1" max="9999"
                        value="{{ old('horas', $product['horas'] ?? '') }}" placeholder="Ej: 40">
                </div>
                <div>
                    <label for="modalidad">Modalidad</label>
                    <input type="text" name="modalidad" id="modalidad" maxlength="100"
                        value="{{ old('modalidad', $product['modalidad'] ?? '') }}"
                        placeholder="Ej: Virtual, Presencial">
                </div>
                <div>
                    <label for="imagen_url">Número imagen Cloudinary</label>
                    <input type="text" name="imagen_url" id="imagen_url" maxlength="3"
                        value="{{ old('imagen_url', $product['imagen_url'] ?? '') }}" placeholder="01 o 001"
                        pattern="\d{2,3}" title="2 dígitos para capacitaciones (ej: 01) o 3 dígitos para certificaciones (ej: 001)"
                        oninput="updatePreview(this.value)">
                    <p class="muted" style="margin:.3rem 0 0;font-size:.75rem">
                        Capacitaciones: 2 dígitos (01–21) · Certificaciones: 3 dígitos (001–049)
                    </p>
                </div>
            </div>

            <div class="form-section" style="margin-top:1.25rem">
                <div class="checks">
                    <label class="check-label">
                        <input type="hidden" name="activo" value="0">
                        <input type="checkbox" name="activo" value="1"
                            {{ old('activo', ($product['activo'] ?? false) ? '1' : '') ? 'checked' : '' }}>
                        Activo (visible en el sitio web)
                    </label>
                    <label class="check-label">
                        <input type="hidden" name="destacado" value="0">
                        <input type="checkbox" name="destacado" value="1"
                            {{ old('destacado', ($product['destacado'] ?? false) ? '1' : '') ? 'checked' : '' }}>
                        Destacado (aparece en sección principal)
                    </label>
                </div>
            </div>

            <div style="display:flex;gap:.75rem;margin-top:1.5rem;flex-wrap:wrap">
                <button type="submit" class="btn">Guardar cambios</button>
                <a href="{{ $backRoute }}" class="btn btn-secondary">Cancelar</a>
            </div>
        </form>
    </div>

    {{-- Vista previa de imagen (solo capacitaciones) --}}
    @if($isCap)
    <div style="width:280px;flex-shrink:0">
        <div class="card" style="padding:1rem;text-align:center">
            <p class="muted" style="font-size:.8rem;margin-bottom:.75rem">Vista previa imagen</p>
            <img id="img-preview"
                 src="{{ $cloudImg ?: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'260\' height=\'200\'%3E%3Crect width=\'260\' height=\'200\' fill=\'%23e5e7eb\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%236b7280\' font-size=\'13\'%3ESin imagen%3C/text%3E%3C/svg%3E' }}"
                 alt="Vista previa"
                 style="width:100%;border-radius:6px;object-fit:cover;max-height:220px">
            <p class="muted" style="font-size:.75rem;margin-top:.5rem" id="img-label">
                {{ $imgNum ? "{$imgNum}_derecha" : 'Ingresa el número de imagen' }}
            </p>
        </div>
    </div>
    @endif

</div>

<script>
function updatePreview(val) {
    const img   = document.getElementById('img-preview');
    const label = document.getElementById('img-label');
    if (!img) return;
    if (val && /^\d{2,3}$/.test(val)) {
        img.src = `https://res.cloudinary.com/ehglt8h8/image/upload/f_auto,q_auto/${val}_derecha`;
        if (label) label.textContent = `${val}_derecha`;
    } else {
        img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='200'%3E%3Crect width='260' height='200' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-size='13'%3ESin imagen%3C/text%3E%3C/svg%3E";
        if (label) label.textContent = 'Ingresa el número de imagen';
    }
}
</script>
@endsection
