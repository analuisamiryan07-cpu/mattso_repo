@extends('layouts.app')
@section('title', 'Editar cliente — MATsso')
@section('content')
@php
    $d         = $defaults;
    $datos_c02 = $d;

    // Documentos que se van a regenerar (inferidos de los nombres de archivo)
    $activeDocs = collect($latestDocument?->nombres_archivos ?? [])
        ->map(fn ($f) => strtolower(substr(basename($f), 0, 3)))
        ->filter(fn ($code) => in_array($code, ['c02','c05','c08','c09','c10','c12']))
        ->unique()->values()->all();
    $isC02 = in_array('c02', $activeDocs);
@endphp

<div class="page-header">
    <div>
        <h1>Editar cliente</h1>
        <p class="muted">Modifica los datos. Al guardar se regeneran los documentos automáticamente.</p>
    </div>
    <a class="btn btn-secondary" href="{{ route('clients.index') }}">← Volver</a>
</div>

@if($latestDocument)
<div class="card" style="background:var(--blue-light);border-color:var(--blue);padding:.85rem 1.1rem;display:flex;gap:.6rem;align-items:center;font-size:.9rem;font-weight:500;color:var(--navy)">
    ↻ Se regenerarán:
    <strong>{{ implode(', ', array_map('strtoupper', $activeDocs)) }}</strong>
    &nbsp;·&nbsp; Generación original: {{ $latestDocument->fecha_generacion?->format('d/m/Y H:i') }}
</div>
@else
<div class="card" style="background:var(--accent-dim);border-color:var(--accent);padding:.85rem 1.1rem;font-size:.9rem;font-weight:500;color:var(--navy)">
    Este cliente aún no tiene documentos generados. Solo se actualizarán sus datos.
</div>
@endif

<form method="POST" action="{{ route('clients.update', $client) }}" id="document-form" class="card">
    @csrf
    @method('PATCH')
    <input type="hidden" name="empresa" value="{{ old('empresa', $d['empresa'] ?? \App\Models\Client::COMPANY_SAPPER) }}">

    {{-- Docs hidden: se regeneran los mismos del último documento --}}
    @foreach($activeDocs as $doc)
        <input type="hidden" name="docs[]" value="{{ $doc }}">
    @endforeach
    @if(empty($activeDocs))
        {{-- Sin documento previo: regenerar todos --}}
        @foreach(array_keys(\App\Services\DocumentGenerationService::templates()) as $doc)
            <input type="hidden" name="docs[]" value="{{ $doc }}">
        @endforeach
    @endif

    <h2>Datos del candidato</h2>
    <div class="form-grid">
        <div><label>Nombre completo</label><input name="nombre" value="{{ old('nombre', $d['nombre'] ?? '') }}" required></div>
        <div><label>Cédula o RUC</label><input name="cedula" value="{{ old('cedula', $d['cedula'] ?? '') }}" inputmode="numeric" minlength="10" maxlength="13" pattern="(?:[0-9]{10}|[0-9]{10}001)" title="Ingrese 10 dígitos para cédula o 13 para RUC terminado en 001." required></div>
        <div><label>Teléfono de casa</label><input name="telefono" value="{{ old('telefono', $d['telefono'] ?? '') }}" inputmode="numeric" maxlength="10" pattern="\d{1,10}"></div>
        <div><label>Celular personal</label><input name="celular" value="{{ old('celular', $d['celular'] ?? '') }}" inputmode="numeric" maxlength="10" pattern="\d{1,10}"></div>
        <div><label>Correo</label><input type="email" name="correo" value="{{ old('correo', $d['correo'] ?? '') }}"></div>
        <div><label>Edad</label><input type="number" name="edad" value="{{ old('edad', $d['edad'] ?? '') }}" min="1" max="120" data-c02-input></div>
        <div><label>Dirección personal (solo C02)</label><input name="direccion" value="{{ old('direccion', $d['direccion'] ?? '') }}" data-c02-input></div>
        <div><label>Fecha general de los documentos</label><input type="date" name="fecha" value="{{ old('fecha', $d['fecha'] ?? now()->toDateString()) }}" required></div>
        <div><label>Fecha exclusiva del C02</label><input type="date" name="fecha_c02" value="{{ old('fecha_c02', $d['fecha_c02'] ?? '') }}"></div>
        <div>
            <label>Provincia</label>
            <select name="provincia" id="province">
                <option value="">Seleccione una provincia</option>
                @foreach(array_keys($locations) as $province)
                    <option value="{{ $province }}" @selected(old('provincia', $d['provincia'] ?? '') === $province)>{{ $province }}</option>
                @endforeach
            </select>
        </div>
        <div>
            <label>Ciudad / cantón</label>
            <select name="ciudad" id="city" data-selected="{{ old('ciudad', $d['ciudad'] ?? '') }}">
                <option value="">Seleccione primero una provincia</option>
            </select>
        </div>
        <div><label>Lugar de examinación</label><input name="lugar" value="{{ old('lugar', $d['lugar'] ?? '') }}" required></div>
        <div><label>Tipo de examen</label><select name="tipo_examen" required>@foreach(['TEÓRICA', 'PRÁCTICA', 'TEÓRICA Y PRÁCTICA'] as $type)<option value="{{ $type }}" @selected(old('tipo_examen', $d['tipo_examen'] ?? '') === $type)>{{ $type }}</option>@endforeach</select></div>
        <div><label>Puntaje teórico</label><input name="puntaje_teorico" value="{{ old('puntaje_teorico', $d['puntaje_teorico'] ?? '') }}"></div>
        <div><label>Puntaje práctico</label><input name="puntaje_practico" value="{{ old('puntaje_practico', $d['puntaje_practico'] ?? '') }}"></div>
        <div><label>Secuencia del código C02</label><input name="secuencia_codigo" value="{{ old('secuencia_codigo', $d['secuencia_codigo'] ?? '') }}" maxlength="30" data-c02-input></div>
    </div>

    <section class="form-section">
        <div class="section-heading">
            <div><h2>Perfiles, esquemas y unidades de competencia</h2><p class="muted">El primer esquema es el principal y se reutiliza en C08, C09, C10 y C12.</p></div>
            <button type="button" class="btn btn-secondary" id="add-application">+ Agregar esquema</button>
        </div>
        <div id="applications" class="repeat-list"></div>
    </section>

    <section class="form-section" id="examiner-fields">
        <h2>Examinador del C08</h2>
        <p class="muted">Selecciona una persona del catálogo; su cédula y teléfono se completan automáticamente.</p>
        <div class="form-grid">
            <div>
                <label>Examinador</label>
                <select name="examinador_id" id="examiner">
                    <option value="">Seleccione un examinador</option>
                    @foreach($examiners as $examiner)
                        <option value="{{ $examiner['id'] }}" data-scheme="{{ $examiner['scheme'] }}" @selected((string) old('examinador_id', $d['examinador_id'] ?? '') === $examiner['id'])>{{ $examiner['name'] }} — {{ $examiner['scheme'] }}</option>
                    @endforeach
                </select>
            </div>
            <div><label>Cédula del examinador</label><input id="examiner-id-number" readonly></div>
            <div><label>Teléfono del examinador</label><input id="examiner-phone" readonly></div>
        </div>
    </section>

    <section class="form-section">
        <h2>Instalaciones para la examinación</h2>
        <div class="form-grid">
            <div><label>Nombre de las instalaciones</label><input name="instalaciones" value="{{ old('instalaciones', $d['instalaciones'] ?? '') }}"></div>
            <div><label>Dirección</label><input name="direccion_instalacion" value="{{ old('direccion_instalacion', $d['direccion_instalacion'] ?? '') }}"></div>
            <div><label>Sector</label><input name="sector_instalacion" value="{{ old('sector_instalacion', $d['sector_instalacion'] ?? '') }}"></div>
            <div><label>Teléfono</label><input name="telefono_instalacion" value="{{ old('telefono_instalacion', $d['telefono_instalacion'] ?? '') }}" inputmode="numeric" maxlength="10" pattern="\d{1,10}"></div>
        </div>
    </section>

    <div id="c02-fields">
        <section class="form-section">
            <h2>Educación formal</h2>
            <p class="muted">Marca los niveles que cumple el candidato.</p>
            <div class="repeat-list">
                @foreach($educationLevels as $key => $label)
                    @php
                        $eduStored  = $d['educaciones'][$key] ?? [];
                        $checked    = (bool) old("educaciones.{$key}.seleccionado", $eduStored['seleccionado'] ?? false);
                    @endphp
                    <div class="repeat-card education-card">
                        <input type="hidden" name="educaciones[{{ $key }}][seleccionado]" value="0">
                        <label class="check-label"><input type="checkbox" name="educaciones[{{ $key }}][seleccionado]" value="1" data-education-toggle @checked($checked)> {{ $label }}</label>
                        <div class="form-grid education-fields">
                            <div><label>Institución</label><input name="educaciones[{{ $key }}][institucion]" value="{{ old("educaciones.{$key}.institucion", $eduStored['institucion'] ?? '') }}"></div>
                            <div><label>País</label><input name="educaciones[{{ $key }}][pais]" value="{{ old("educaciones.{$key}.pais", $eduStored['pais'] ?? 'Ecuador') }}"></div>
                            <div><label>Ciudad</label><input name="educaciones[{{ $key }}][ciudad]" value="{{ old("educaciones.{$key}.ciudad", $eduStored['ciudad'] ?? '') }}"></div>
                            <div><label>Título obtenido</label><input name="educaciones[{{ $key }}][titulo]" value="{{ old("educaciones.{$key}.titulo", $eduStored['titulo'] ?? '') }}"></div>
                        </div>
                    </div>
                @endforeach
            </div>
        </section>

        <section class="form-section">
            <div class="section-heading"><div><h2>Capacitación recibida</h2><p class="muted">Cada curso en una fila.</p></div><button type="button" class="btn btn-secondary" id="add-training">+ Agregar capacitación</button></div>
            <div id="trainings" class="repeat-list"></div>
        </section>

        <section class="form-section">
            <div class="section-heading"><div><h2>Experiencia laboral</h2></div><button type="button" class="btn btn-secondary" id="add-experience">+ Agregar experiencia</button></div>
            <div id="experiences" class="repeat-list"></div>
        </section>
    </div>

    <div style="display:flex;gap:.75rem;margin-top:1.5rem">
        <button class="btn" type="submit">Guardar y regenerar documentos</button>
        <a class="btn btn-secondary" href="{{ route('clients.index') }}">Cancelar</a>
    </div>
</form>

<template id="application-template">
    <div class="repeat-card">
        <div class="repeat-card-heading"><strong>Solicitud <span data-number></span> <small class="muted" data-primary-label></small></strong><button type="button" class="link-danger" data-remove>Eliminar</button></div>
        <div class="form-grid">
            <div><label>Perfil profesional</label><select name="aplicaciones[__INDEX__][perfil]" data-profile required><option value="">Seleccione un perfil</option>@foreach($profiles as $profile)<option value="{{ $profile }}">{{ $profile }}</option>@endforeach</select></div>
            <div><label>Esquema de certificación</label><select name="aplicaciones[__INDEX__][esquema]" data-scheme required><option value="">Seleccione un esquema</option>@foreach($schemes as $item)<option value="{{ $item['scheme'] }}">{{ $item['scheme'] }}</option>@endforeach</select></div>
        </div>
        <label>Unidades de competencia que aplican</label>
        <div class="checks">@for($unit = 1; $unit <= 5; $unit++)<label><input type="checkbox" name="aplicaciones[__INDEX__][unidades][]" value="{{ $unit }}" data-c02-input> UC{{ $unit }}</label>@endfor</div>
    </div>
</template>

<template id="training-template">
    <div class="repeat-card">
        <div class="repeat-card-heading"><strong>Capacitación <span data-number></span></strong><button type="button" class="link-danger" data-remove>Eliminar</button></div>
        <div class="form-grid">
            <div><label>Nombre del curso</label><input name="capacitaciones[__INDEX__][curso]"></div>
            <div><label>Institución o empresa</label><input name="capacitaciones[__INDEX__][institucion]"></div>
            <div><label>Fecha</label><input type="date" name="capacitaciones[__INDEX__][fecha]"></div>
            <div><label>Horas</label><input type="number" min="1" max="99999" name="capacitaciones[__INDEX__][horas]"></div>
        </div>
    </div>
</template>

<template id="experience-template">
    <div class="repeat-card">
        <div class="repeat-card-heading"><strong>Experiencia <span data-number></span></strong><button type="button" class="link-danger" data-remove>Eliminar</button></div>
        <div class="form-grid">
            <div><label>Desde</label><input type="date" name="experiencias[__INDEX__][fecha_desde]"></div>
            <div><label>Hasta</label><input type="date" name="experiencias[__INDEX__][fecha_hasta]"></div>
            <div><label>Empresa</label><input name="experiencias[__INDEX__][empresa]"></div>
            <div><label>Ciudad / dirección</label><input name="experiencias[__INDEX__][ciudad]"></div>
            <div><label>Teléfono</label><input name="experiencias[__INDEX__][telefono]" inputmode="numeric" maxlength="10" pattern="\d{1,10}"></div>
            <div><label>Función</label><input name="experiencias[__INDEX__][funcion]"></div>
        </div>
    </div>
</template>

<script>
(() => {
    const locations            = @json($locations);
    const initialApplications  = @json($initialApplications);
    const initialTrainings     = @json($initialTrainings);
    const initialExperiences   = @json($initialExperiences);

    const province = document.getElementById('province');
    const city     = document.getElementById('city');
    function loadCities(selected = '') {
        city.innerHTML = '<option value="">Seleccione una ciudad / cantón</option>';
        (locations[province.value] || []).forEach(name => city.add(new Option(name, name, false, name === selected)));
    }
    province.addEventListener('change', () => loadCities(''));
    loadCities(city.dataset.selected || '');

    function addRepeated(containerId, templateId, data = {}) {
        const container = document.getElementById(containerId);
        const index     = Number(container.dataset.nextIndex || 0);
        container.dataset.nextIndex = index + 1;
        const wrapper   = document.createElement('div');
        wrapper.innerHTML = document.getElementById(templateId).innerHTML.replaceAll('__INDEX__', index).trim();
        const card = wrapper.firstElementChild;
        card.querySelector('[data-number]').textContent = index + 1;
        const primaryLabel = card.querySelector('[data-primary-label]');
        if (primaryLabel) primaryLabel.textContent = index === 0 ? '(esquema principal)' : '(adicional C02)';
        card.querySelector('[data-remove]').addEventListener('click', () => {
            const minimumItems = containerId === 'trainings' ? 0 : 1;
            if (container.children.length > minimumItems) { card.remove(); }
        });
        Object.entries(data || {}).forEach(([key, value]) => {
            const input = card.querySelector(`[name$="[${key}]"]`);
            if (input) input.value = value ?? '';
        });
        container.append(card);
        return card;
    }

    function addApplication(data = {}) {
        const card    = addRepeated('applications', 'application-template');
        const select  = card.querySelector('[data-scheme]');
        const profile = card.querySelector('[data-profile]');
        select.value  = data.esquema || '';
        profile.value = data.perfil  || '';
        (data.unidades || []).forEach(unit => {
            const cb = card.querySelector(`[name$="[unidades][]"][value="${unit}"]`);
            if (cb) cb.checked = true;
        });
    }

    initialApplications.forEach(addApplication);
    initialTrainings.forEach(data => addRepeated('trainings', 'training-template', data));
    initialExperiences.forEach(data => addRepeated('experiences', 'experience-template', data));

    document.getElementById('add-application').addEventListener('click', () => addApplication());
    document.getElementById('add-training').addEventListener('click', () => addRepeated('trainings', 'training-template'));
    document.getElementById('add-experience').addEventListener('click', () => addRepeated('experiences', 'experience-template'));

    document.querySelectorAll('[data-education-toggle]').forEach(toggle => {
        const update = () => toggle.closest('.education-card').querySelectorAll('.education-fields input').forEach(input => input.disabled = !toggle.checked);
        toggle.addEventListener('change', update);
        update();
    });

    const examinerSelect = document.getElementById('examiner');
    const examinerData   = @json(collect($examiners)->keyBy('id'));
    function updateExaminerDetails() {
        const examiner = examinerData[examinerSelect.value] || {};
        document.getElementById('examiner-id-number').value = examiner.cedula || '';
        document.getElementById('examiner-phone').value     = examiner.phone  || '';
    }
    examinerSelect.addEventListener('change', updateExaminerDetails);
    updateExaminerDetails();
})();
</script>
@endsection
