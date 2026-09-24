@extends('layouts.app')

@section('title', 'Nuevo curso — MATsso')

@section('content')
<div class="page-header">
    <div>
        <h1>Nuevo curso</h1>
        <p class="muted">Todo en un solo formulario — la imagen se sube después de guardar (cada curso tiene su propia carpeta en Cloudinary).</p>
    </div>
    <div style="display:flex;gap:.6rem">
        <a href="{{ route('cursos.dashboard') }}" class="btn btn-secondary">Ver dashboard</a>
        <a href="{{ route('cursos.index') }}" class="btn btn-secondary">← Volver</a>
    </div>
</div>

<form method="POST" action="{{ route('cursos.store') }}">
    @csrf

    {{-- 1. Página web --}}
    <div class="card" style="max-width:720px">
        <h3 style="margin:0 0 .75rem">1. Datos para la página web</h3>

        <label for="titulo">Título <span style="color:var(--danger)">*</span></label>
        <input type="text" name="titulo" id="titulo" maxlength="255" value="{{ old('titulo') }}" required placeholder="Ej: Riesgos Laborales">

        <label for="descripcion">Descripción</label>
        <textarea name="descripcion" id="descripcion" rows="3">{{ old('descripcion') }}</textarea>

        <div class="form-grid">
            <div>
                <label for="precio">Precio (USD) <span style="color:var(--danger)">*</span></label>
                <input type="number" name="precio" id="precio" min="0" step="0.01" value="{{ old('precio', '0.00') }}" required>
            </div>
            <div>
                <label for="horas">Horas</label>
                <input type="number" name="horas" id="horas" min="1" max="9999" value="{{ old('horas') }}">
            </div>
            <div>
                <label for="modalidad">Modalidad</label>
                <input type="text" name="modalidad" id="modalidad" maxlength="100" value="{{ old('modalidad', 'Virtual') }}">
            </div>
        </div>

        <div class="checks" style="margin-top:.75rem">
            <label class="check-label"><input type="checkbox" name="modo_moodle" id="modo_moodle" value="1" {{ old('modo_moodle') ? 'checked' : '' }}> Moodle</label>
            <label class="check-label"><input type="checkbox" name="modo_coursera" id="modo_coursera" value="1" {{ old('modo_coursera') ? 'checked' : '' }}> Coursera</label>
        </div>
        @error('modo_moodle')<p style="color:var(--danger);font-size:.82rem;margin:.3rem 0 0">{{ $message }}</p>@enderror

        <div style="max-width:220px;margin-top:.75rem">
            <label for="duracion_meses">Duración del acceso (meses) <span style="color:var(--danger)">*</span></label>
            <input type="number" name="duracion_meses" id="duracion_meses" min="1" max="60" value="{{ old('duracion_meses') }}" required>
        </div>
        <p class="muted" style="font-size:.8rem">Cuenta desde que el estudiante usa su clave, no desde la compra.</p>
    </div>

    {{-- 2. Moodle --}}
    <div class="card" id="parte-moodle" style="max-width:720px;margin-top:1.25rem">
        <h3 style="margin:0 0 .5rem">2. Moodle — profesor y acceso</h3>
        <p class="muted" style="font-size:.82rem">Esto se guarda solo si marcaste "Moodle" arriba, en la parte 1. El profesor sube recursos y califica — solo ve este curso y a los estudiantes que se inscriban en él, nunca otros cursos.</p>

        <div style="display:flex;gap:1.25rem;flex-wrap:wrap;margin:.75rem 0">
            <label class="check-label"><input type="radio" name="profesor_modo" value="ninguno" checked onchange="mostrarProfesor(this)"> Sin profesor por ahora</label>
            <label class="check-label"><input type="radio" name="profesor_modo" value="existente" onchange="mostrarProfesor(this)"> Elegir uno existente</label>
            <label class="check-label"><input type="radio" name="profesor_modo" value="nuevo" onchange="mostrarProfesor(this)"> Crear uno nuevo</label>
        </div>

        <div id="profesor-existente" style="display:none">
            @if(count($profesores) === 0)
                <p class="muted" style="font-size:.82rem">Todavía no hay profesores activos — usa "Crear uno nuevo".</p>
            @else
                <select name="profesor_usuario_id">
                    <option value="">— Elige un profesor —</option>
                    @foreach($profesores as $p)
                        <option value="{{ $p['id'] }}" {{ old('profesor_usuario_id') == $p['id'] ? 'selected' : '' }}>{{ $p['correo'] }}</option>
                    @endforeach
                </select>
            @endif
        </div>
        <div id="profesor-nuevo" style="display:none">
            <input type="email" name="profesor_correo" placeholder="correo@sapper-industries.com" value="{{ old('profesor_correo') }}">
            <p class="muted" style="font-size:.78rem;margin:.3rem 0 0">Si el correo ya tiene cuenta, se asciende a profesor. Si no, se crea y le llega un correo para definir su contraseña — nunca se reutiliza una clave administrativa.</p>
        </div>
    </div>

    {{-- 3. Coursera --}}
    <div class="card" id="parte-coursera" style="margin-top:1.25rem">
        <h3 style="margin:0 0 .5rem">3. Coursera — módulos</h3>
        <p class="muted" style="font-size:.82rem">Esto se guarda solo si marcaste "Coursera" arriba, en la parte 1. Sin profesor — se autoevalúa. Puedes dejarlo en 0 y agregar módulos después desde "Editar curso".</p>

        <div style="max-width:200px;margin:.75rem 0">
            <label for="num_modulos">¿Cuántos módulos?</label>
            <input type="number" name="num_modulos" id="num_modulos" min="0" max="{{ $maxModulos }}" value="{{ old('num_modulos', 0) }}" oninput="mostrarModulos(this.value)">
        </div>

        <div id="modulos-lista">
            @for($i = 1; $i <= $maxModulos; $i++)
                <div class="modulo-bloque" data-n="{{ $i }}" style="display:none;border:1px solid var(--border);border-radius:8px;padding:.9rem 1rem;margin-bottom:.75rem">
                    <strong>Módulo {{ $i }}</strong>
                    <div class="form-grid" style="margin-top:.5rem">
                        <div>
                            <label>Título</label>
                            <input type="text" name="modulos[{{ $i }}][titulo]" maxlength="255" value="{{ old("modulos.$i.titulo") }}">
                        </div>
                        <div>
                            <label>Descripción</label>
                            <input type="text" name="modulos[{{ $i }}][descripcion]" maxlength="2000" value="{{ old("modulos.$i.descripcion") }}">
                        </div>
                    </div>
                    <div class="form-grid" style="margin-top:.5rem">
                        <div>
                            <label>URL del video (opcional)</label>
                            <input type="text" name="modulos[{{ $i }}][video_url]" maxlength="500" value="{{ old("modulos.$i.video_url") }}" placeholder="https://res.cloudinary.com/...">
                        </div>
                        <div>
                            <label>Duración del video (segundos)</label>
                            <input type="number" name="modulos[{{ $i }}][video_duration_seconds]" min="1" value="{{ old("modulos.$i.video_duration_seconds") }}">
                        </div>
                    </div>
                    <label style="margin-top:.5rem;display:block">Recurso — texto (opcional)</label>
                    <textarea name="modulos[{{ $i }}][texto]" rows="2" maxlength="20000">{{ old("modulos.$i.texto") }}</textarea>
                    <div class="form-grid" style="margin-top:.5rem">
                        <div>
                            <label>Título de la tarea (opcional)</label>
                            <input type="text" name="modulos[{{ $i }}][tarea_titulo]" maxlength="255" value="{{ old("modulos.$i.tarea_titulo") }}">
                        </div>
                        <div>
                            <label>Instrucciones de la tarea</label>
                            <input type="text" name="modulos[{{ $i }}][tarea_instrucciones]" maxlength="5000" value="{{ old("modulos.$i.tarea_instrucciones") }}">
                        </div>
                    </div>
                    <p class="muted" style="font-size:.76rem;margin:.4rem 0 0">El examen (quiz) se arma después, desde "Editar curso" — todavía no tiene un armador de preguntas.</p>
                </div>
            @endfor
        </div>
    </div>

    <div style="display:flex;gap:.75rem;margin-top:1.5rem;flex-wrap:wrap">
        <button type="submit" class="btn">Crear curso</button>
        <a href="{{ route('cursos.index') }}" class="btn btn-secondary">Cancelar</a>
    </div>
</form>

<script>
// Las 3 partes se ven siempre — Moodle/Coursera arriba solo marcan qué se
// guarda de cada una al enviar el formulario, no esconden nada.
function mostrarProfesor(radio) {
    document.getElementById('profesor-existente').style.display = radio.value === 'existente' ? '' : 'none';
    document.getElementById('profesor-nuevo').style.display = radio.value === 'nuevo' ? '' : 'none';
}

function mostrarModulos(n) {
    n = parseInt(n, 10) || 0;
    document.querySelectorAll('.modulo-bloque').forEach(function (bloque) {
        bloque.style.display = parseInt(bloque.dataset.n, 10) <= n ? '' : 'none';
    });
}
mostrarModulos(document.getElementById('num_modulos').value);
</script>
@endsection
