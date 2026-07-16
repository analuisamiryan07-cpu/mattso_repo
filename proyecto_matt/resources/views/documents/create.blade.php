@extends('layouts.app')
@section('title', 'Nueva certificación — MATsso')
@section('content')
@php
    $initialApplications = old('aplicaciones', [['perfil' => '', 'esquema' => '', 'unidades' => []]]);
    $initialTrainings = old('capacitaciones', [['curso' => '', 'institucion' => '', 'fecha' => '', 'horas' => '']]);
    $initialExperiences = old('experiencias', [['fecha_desde' => '', 'fecha_hasta' => '', 'empresa' => '', 'ciudad' => '', 'telefono' => '', 'funcion' => '']]);
@endphp
<h1>Nueva certificación</h1>
<p class="muted">Completa los datos que se insertarán en las plantillas seleccionadas.</p>

<form method="POST" action="{{ route('documents.store') }}" class="card" id="document-form">
    @csrf
    <h2>Documentos</h2>
    <p class="muted">Los datos de C02 permanecen visibles y solo serán obligatorios cuando selecciones ese documento.</p>
    <div class="grid">
        @foreach($documents as $code => $document)
            <label class="card document-option"><input type="checkbox" name="docs[]" value="{{ $code }}" data-document="{{ $code }}" @checked(in_array($code, old('docs', [])))> {{ $document['name'] }}</label>
        @endforeach
    </div>

    <h2>Datos del candidato</h2>
    <div class="form-grid">
        <div><label>Nombre completo</label><input name="nombre" value="{{ old('nombre') }}" required></div>
        <div><label>Cédula</label><input name="cedula" value="{{ old('cedula') }}" required></div>
        <div><label>Teléfono de casa</label><input name="telefono" value="{{ old('telefono') }}" inputmode="numeric" maxlength="10" pattern="\d{1,10}"></div>
        <div><label>Celular personal</label><input name="celular" value="{{ old('celular') }}" inputmode="numeric" maxlength="10" pattern="\d{1,10}"></div>
        <div><label>Correo</label><input type="email" name="correo" value="{{ old('correo') }}"></div>
        <div><label>Edad</label><input type="number" name="edad" value="{{ old('edad') }}" min="1" max="120" data-c02-input></div>
        <div><label>Dirección personal (solo C02)</label><input name="direccion" value="{{ old('direccion') }}" data-c02-input></div>
        <div><label>Fecha general de los documentos</label><input type="date" name="fecha" value="{{ old('fecha', now()->toDateString()) }}" required></div>
        <div><label>Fecha exclusiva del C02</label><input type="date" name="fecha_c02" value="{{ old('fecha_c02') }}"></div>
        <div>
            <label>Provincia</label>
            <select name="provincia" id="province">
                <option value="">Seleccione una provincia</option>
                @foreach(array_keys($locations) as $province)
                    <option value="{{ $province }}" @selected(old('provincia') === $province)>{{ $province }}</option>
                @endforeach
            </select>
        </div>
        <div>
            <label>Ciudad / cantón</label>
            <select name="ciudad" id="city" data-selected="{{ old('ciudad') }}">
                <option value="">Seleccione primero una provincia</option>
            </select>
        </div>
        <div><label>Lugar de examinación</label><input name="lugar" value="{{ old('lugar') }}" required></div>
        <div><label>Tipo de examen</label><select name="tipo_examen" required>@foreach(['TEÓRICA', 'PRÁCTICA', 'TEÓRICA Y PRÁCTICA'] as $type)<option value="{{ $type }}" @selected(old('tipo_examen') === $type)>{{ $type }}</option>@endforeach</select></div>
        <div><label>Puntaje teórico</label><input name="puntaje_teorico" value="{{ old('puntaje_teorico') }}"></div>
        <div><label>Puntaje práctico</label><input name="puntaje_practico" value="{{ old('puntaje_practico') }}"></div>
        <div><label>Secuencia del código C02</label><input name="secuencia_codigo" value="{{ old('secuencia_codigo') }}" maxlength="30" data-c02-input></div>
    </div>

    <section class="form-section">
        <div class="section-heading">
            <div><h2>Perfiles, esquemas y unidades de competencia</h2><p class="muted">El primer esquema es el principal y se reutiliza en C08, C09, C10 y C12. Los adicionales pertenecen al cuadro repetible del C02.</p></div>
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
                        <option value="{{ $examiner['id'] }}" data-scheme="{{ $examiner['scheme'] }}" @selected((string) old('examinador_id') === $examiner['id'])>{{ $examiner['name'] }} — {{ $examiner['scheme'] }}</option>
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
                <div><label>Nombre de las instalaciones</label><input name="instalaciones" value="{{ old('instalaciones') }}"></div>
                <div><label>Dirección</label><input name="direccion_instalacion" value="{{ old('direccion_instalacion') }}"></div>
                <div><label>Sector</label><input name="sector_instalacion" value="{{ old('sector_instalacion') }}"></div>
                <div><label>Teléfono</label><input name="telefono_instalacion" value="{{ old('telefono_instalacion') }}" inputmode="numeric" maxlength="10" pattern="\d{1,10}"></div>
            </div>
    </section>

    <div id="c02-fields">
        <section class="form-section">
            <h2>Educación formal</h2>
            <p class="muted">Marca los niveles que cumple el candidato; al marcarlos se habilitan sus datos.</p>
            <div class="repeat-list">
                @foreach($educationLevels as $key => $label)
                    @php $checked = (bool) old("educaciones.{$key}.seleccionado", false); @endphp
                    <div class="repeat-card education-card">
                        <input type="hidden" name="educaciones[{{ $key }}][seleccionado]" value="0">
                        <label class="check-label"><input type="checkbox" name="educaciones[{{ $key }}][seleccionado]" value="1" data-education-toggle @checked($checked)> {{ $label }}</label>
                        <div class="form-grid education-fields">
                            <div><label>Institución</label><input name="educaciones[{{ $key }}][institucion]" value="{{ old("educaciones.{$key}.institucion") }}"></div>
                            <div><label>País</label><input name="educaciones[{{ $key }}][pais]" value="{{ old("educaciones.{$key}.pais", 'Ecuador') }}"></div>
                            <div><label>Ciudad</label><input name="educaciones[{{ $key }}][ciudad]" value="{{ old("educaciones.{$key}.ciudad") }}"></div>
                            <div><label>Título obtenido</label><input name="educaciones[{{ $key }}][titulo]" value="{{ old("educaciones.{$key}.titulo") }}"></div>
                        </div>
                    </div>
                @endforeach
            </div>
        </section>

        <section class="form-section">
            <div class="section-heading"><div><h2>Capacitación recibida</h2><p class="muted">Agrega cada curso en una fila independiente.</p></div><button type="button" class="btn btn-secondary" id="add-training">+ Agregar capacitación</button></div>
            <div id="trainings" class="repeat-list"></div>
        </section>

        <section class="form-section">
            <div class="section-heading"><div><h2>Experiencia laboral</h2><p class="muted">Las fechas se insertarán en filas consecutivas del C02.</p></div><button type="button" class="btn btn-secondary" id="add-experience">+ Agregar experiencia</button></div>
            <div id="experiences" class="repeat-list"></div>
        </section>
    </div>

    <button class="btn" style="margin-top:1rem">Generar y descargar ZIP</button>
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
    const locations = @json($locations);
    const initialApplications = @json($initialApplications);
    const initialTrainings = @json($initialTrainings);
    const initialExperiences = @json($initialExperiences);

    const province = document.getElementById('province');
    const city = document.getElementById('city');
    function loadCities(selected = '') {
        city.innerHTML = '<option value="">Seleccione una ciudad / cantón</option>';
        (locations[province.value] || []).forEach(name => city.add(new Option(name, name, false, name === selected)));
    }
    province.addEventListener('change', () => loadCities(''));
    loadCities(city.dataset.selected || '');

    function addRepeated(containerId, templateId, data = {}) {
        const container = document.getElementById(containerId);
        const index = Number(container.dataset.nextIndex || 0);
        container.dataset.nextIndex = index + 1;
        const wrapper = document.createElement('div');
        wrapper.innerHTML = document.getElementById(templateId).innerHTML.replaceAll('__INDEX__', index).trim();
        const card = wrapper.firstElementChild;
        card.querySelector('[data-number]').textContent = index + 1;
        const primaryLabel = card.querySelector('[data-primary-label]');
        if (primaryLabel) primaryLabel.textContent = index === 0 ? '(esquema principal)' : '(adicional C02)';
        card.querySelector('[data-remove]').addEventListener('click', () => {
            if (container.children.length > 1) {
                card.remove();
                updateExaminerOptions();
            }
        });
        Object.entries(data || {}).forEach(([key, value]) => {
            const input = card.querySelector(`[name$="[${key}]"]`);
            if (input) input.value = value ?? '';
        });
        container.append(card);
        return card;
    }

    function addApplication(data = {}) {
        const card = addRepeated('applications', 'application-template');
        const select = card.querySelector('[data-scheme]');
        const profile = card.querySelector('[data-profile]');
        select.value = data.esquema || '';
        profile.value = data.perfil || '';
        select.addEventListener('change', updateExaminerOptions);
        (data.unidades || []).forEach(unit => {
            const checkbox = card.querySelector(`[name$="[unidades][]"][value="${unit}"]`);
            if (checkbox) checkbox.checked = true;
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
    const examinerData = @json(collect($examiners)->keyBy('id'));
    function updateExaminerDetails() {
        const examiner = examinerData[examinerSelect.value] || {};
        document.getElementById('examiner-id-number').value = examiner.cedula || '';
        document.getElementById('examiner-phone').value = examiner.phone || '';
    }
    function updateExaminerOptions() {
        updateExaminerDetails();
    }
    examinerSelect.addEventListener('change', updateExaminerDetails);

    updateExaminerOptions();
})();
</script>
@endsection
