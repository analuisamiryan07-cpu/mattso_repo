@extends('layouts.app')

@section('title', 'Nuevo curso — MATsso')

@section('content')
<div class="page-header">
    <div>
        <h1>Nuevo curso</h1>
        <p class="muted">Datos generales — la imagen, los módulos y el contenido se agregan al guardar.</p>
    </div>
    <a href="{{ route('cursos.index') }}" class="btn btn-secondary">← Volver</a>
</div>

<div class="card" style="max-width:720px">
    <form method="POST" action="{{ route('cursos.store') }}">
        @csrf

        <div class="form-section">
            <h3 style="margin:0 0 .75rem">1. Datos para la página web</h3>

            <div>
                <label for="titulo">Título <span style="color:var(--danger)">*</span></label>
                <input type="text" name="titulo" id="titulo" maxlength="255" value="{{ old('titulo') }}" required
                    placeholder="Ej: Riesgos Laborales">
            </div>

            <div>
                <label for="descripcion">Descripción</label>
                <textarea name="descripcion" id="descripcion" rows="4"
                    placeholder="Texto que aparece en la página de detalle.">{{ old('descripcion') }}</textarea>
            </div>

            <div class="form-grid">
                <div>
                    <label for="precio">Precio (USD) <span style="color:var(--danger)">*</span></label>
                    <input type="number" name="precio" id="precio" min="0" step="0.01" value="{{ old('precio', '0.00') }}" required>
                </div>
                <div>
                    <label for="horas">Horas</label>
                    <input type="number" name="horas" id="horas" min="1" max="9999" value="{{ old('horas') }}" placeholder="Ej: 40">
                </div>
                <div>
                    <label for="modalidad">Modalidad</label>
                    <input type="text" name="modalidad" id="modalidad" maxlength="100" value="{{ old('modalidad', 'Virtual') }}">
                </div>
            </div>
            <p class="muted" style="font-size:.8rem">
                La imagen se sube después de guardar — cada curso tiene su propia carpeta en Cloudinary, no hace falta escribir ningún número.
            </p>
        </div>

        <div class="form-section" style="margin-top:1.5rem">
            <h3 style="margin:0 0 .75rem">2. Modalidad y acceso</h3>

            <div class="checks">
                <label class="check-label">
                    <input type="checkbox" name="modo_moodle" value="1" {{ old('modo_moodle') ? 'checked' : '' }}>
                    Moodle (módulos abiertos, calificación manual)
                </label>
                <label class="check-label">
                    <input type="checkbox" name="modo_coursera" value="1" {{ old('modo_coursera') ? 'checked' : '' }}>
                    Coursera (contenido en orden, autoevaluado)
                </label>
            </div>
            @error('modo_moodle')<p style="color:var(--danger);font-size:.82rem;margin:.3rem 0 0">{{ $message }}</p>@enderror
            <p class="muted" style="font-size:.8rem;margin-top:.4rem">
                Puedes marcar las dos — un mismo curso puede tener contenido separado para cada modalidad.
            </p>

            <div style="max-width:220px;margin-top:1rem">
                <label for="duracion_meses">Duración del acceso (meses) <span style="color:var(--danger)">*</span></label>
                <input type="number" name="duracion_meses" id="duracion_meses" min="1" max="60"
                    value="{{ old('duracion_meses') }}" required placeholder="Ej: 5">
            </div>
            <p class="muted" style="font-size:.8rem">
                Cuenta desde que el estudiante usa su clave, no desde la compra.
            </p>
        </div>

        <div style="display:flex;gap:.75rem;margin-top:1.5rem;flex-wrap:wrap">
            <button type="submit" class="btn">Crear curso</button>
            <a href="{{ route('cursos.index') }}" class="btn btn-secondary">Cancelar</a>
        </div>
    </form>
</div>
@endsection
