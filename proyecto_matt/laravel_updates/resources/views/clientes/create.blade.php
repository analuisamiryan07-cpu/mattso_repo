@extends('layouts.app')

@section('title', 'Registrar Cliente')

@section('content')
<style>
/* Estilos extraídos del prototipo MATsso original */
.req { color: var(--danger); margin-left: 2px; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem 1.75rem; margin-bottom: 1.25rem; box-shadow: 0 1px 4px rgba(0,0,0,.06); }
.card-title { font-size: .75rem; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; color: var(--navy); margin-bottom: 1.2rem; padding-bottom: .65rem; border-bottom: 2px solid var(--navy); display: flex; align-items: center; gap: .5rem; }
.card-title svg { fill: var(--navy); flex-shrink: 0; }
.grid { display: grid; gap: 1rem; }
.grid-2 { grid-template-columns: 1fr 1fr; }
@media(max-width: 600px) { .grid-2 { grid-template-columns: 1fr; } }
.field { display: flex; flex-direction: column; gap: .35rem; }
label { font-size: .78rem; font-weight: 600; color: var(--muted); letter-spacing: .02em; }
input[type="text"], input[type="email"], input[type="tel"], input[type="date"], input[type="number"], select { background: #f7f9fc; border: 1.5px solid var(--border); border-radius: 7px; color: var(--text); font-family: inherit; font-size: .875rem; padding: .58rem .85rem; width: 100%; transition: border-color .2s, box-shadow .2s; outline: none; }
input:focus, select:focus { border-color: var(--navy-light); box-shadow: 0 0 0 3px rgba(30,58,123,.12); background: #fff; }
.radio-group { display: flex; gap: .65rem; flex-wrap: wrap; }
.radio-btn { display: flex; align-items: center; gap: .4rem; background: #f7f9fc; border: 1.5px solid var(--border); border-radius: 7px; padding: .5rem 1rem; cursor: pointer; font-size: .86rem; font-weight: 500; transition: border-color .2s, background .2s; user-select: none; color: var(--text); }
.radio-btn input[type="radio"] { accent-color: var(--navy); }
.radio-btn:has(input:checked) { border-color: var(--navy); background: rgba(30,58,123,.07); color: var(--navy); }
.btn-wrap { text-align: center; margin-top: .75rem; }
button[type="submit"] { display: inline-flex; align-items: center; gap: .6rem; background: var(--navy); color: #fff; font-family: inherit; font-size: .95rem; font-weight: 600; border: none; border-radius: 8px; padding: .85rem 2.5rem; cursor: pointer; transition: background .2s, transform .15s, box-shadow .2s; box-shadow: 0 3px 12px rgba(30,58,123,.3); }
button[type="submit"]:hover { background: var(--navy-light); transform: translateY(-1px); box-shadow: 0 5px 18px rgba(30,58,123,.35); }
.header-flex { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; }
.header-flex h1 { font-size: 1.6rem; font-weight: 700; color: var(--text); }
.header-flex p { color: var(--muted); font-size: .88rem; margin-top: .3rem; }
.btn-volver { background: none; border: 1.5px solid var(--border); color: var(--text); padding: .6rem 1rem; border-radius: 7px; text-decoration: none; font-size:.85rem; font-weight:600; display: inline-flex; gap: .4rem; align-items: center; transition: background .2s; }
.btn-volver:hover { background: #f2f4f8; }
</style>

<div class="header-flex">
    <div>
        <h1>Registrar Nuevo Cliente</h1>
        <p>Ingresa los datos del candidato una sola vez para alimentar el motor de certificados.</p>
    </div>
    <a href="{{ route('clientes.index') }}" class="btn-volver">
        <svg width="15" height="15" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/></svg>
        Volver al Listado
    </a>
</div>

@if ($errors->any())
    <div class="alert alert-error" style="background:#fdf0ef; border-left:4px solid var(--danger); padding:1rem; border-radius:8px; margin-bottom:1.5rem; color:var(--danger);">
        <strong style="display:block; margin-bottom:0.5rem;">Por favor, corrige los siguientes errores:</strong>
        <ul style="margin-left: 1.5rem; font-size: .85rem;">
            @foreach ($errors->all() as $error)
                <li>{{ $error }}</li>
            @endforeach
        </ul>
    </div>
@endif

<form method="POST" action="{{ route('clientes.store') }}">
    @csrf
    
    <!-- ── DATOS DEL CANDIDATO ── -->
    <div class="card">
        <div class="card-title">
            <svg width="15" height="15" viewBox="0 0 24 24">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
            Datos del candidato
        </div>
        <div class="grid grid-2">
            <div class="field">
                <label for="nombre">Nombre completo <span class="req">*</span></label>
                <input type="text" id="nombre" name="nombre" value="{{ old('nombre') }}" required placeholder="Ej: BONILLA SANCHEZ JOSELIN MARCELA">
            </div>
            <div class="field">
                <label for="cedula">Número de cédula <span class="req">*</span></label>
                <input type="text" id="cedula" name="cedula" value="{{ old('cedula') }}" required placeholder="Ej: 0202514915" maxlength="13">
            </div>
            <div class="field">
                <label for="edad">Edad (Años cumplidos)</label>
                <input type="number" id="edad" name="edad" value="{{ old('edad') }}" placeholder="Ej: 25">
            </div>
            <div class="field">
                <label for="telefono">Teléfono fijo</label>
                <input type="tel" id="telefono" name="telefono" value="{{ old('telefono') }}" placeholder="Ej: 022800111">
            </div>
            <div class="field">
                <label for="celular1">Teléfono celular</label>
                <input type="tel" id="celular1" name="celular1" value="{{ old('celular1') }}" placeholder="Ej: 0959139068">
            </div>
            <div class="field">
                <label for="correo">Correo electrónico</label>
                <input type="email" id="correo" name="correo" value="{{ old('correo') }}" placeholder="Ej: correo@gmail.com">
            </div>
            <div class="field" style="grid-column: 1 / -1;">
                <label for="direccion">Dirección</label>
                <input type="text" id="direccion" name="direccion" value="{{ old('direccion') }}" placeholder="Ej: Juan Abel Echeverría y Fernando Sánchez de Orellana">
            </div>
        </div>
    </div>

    <!-- ── DATOS DEL EXAMEN ── -->
    <div class="card">
        <div class="card-title">
            <svg width="15" height="15" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
            </svg>
            Datos del examen y certificación
        </div>
        <div class="grid grid-2">
            <div class="field">
                <label for="fecha">Fecha del trámite <span class="req">*</span></label>
                <input type="date" id="fecha" name="fecha" value="{{ old('fecha', date('Y-m-d')) }}" required>
            </div>
            <div class="field">
                <label for="lugar">Lugar de examinación completo (SMD_lugarcompleto)</label>
                <input type="text" id="lugar" name="lugar" value="{{ old('lugar') }}" placeholder="Ej: INSTALACIONES EXTERNA — EMPRESA COORED">
            </div>
            <div class="field" style="grid-column: 1 / -1;">
                <label for="esquema">Esquema de certificación</label>
                <select id="esquema" name="esquema" required>
                    <option value="">-- Seleccionar Esquema --</option>
                    @foreach($esquemas as $esq)
                        <option value="{{ $esq }}" {{ old('esquema') == $esq ? 'selected' : '' }}>{{ $esq }}</option>
                    @endforeach
                </select>
            </div>
        </div>
    </div>

    <!-- ── DATOS DEL EXAMINADOR ── -->
    <div class="card">
        <div class="card-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            Datos del Examinador
        </div>
        <div class="grid grid-2">
            <div class="field" style="grid-column: 1 / -1;">
                <label for="select_examinador">Examinador Evaluador</label>
                <select id="select_examinador" onchange="fillExaminador(this)">
                    <option value="">-- Personalizado / Ingresar Manualmente --</option>
                    @foreach($examinadores as $exa)
                        <option value="{{ $exa['nombre'] }}" data-ced="{{ $exa['cedula'] }}" data-tel="{{ $exa['telefono'] }}">
                            {{ $exa['nombre'] }}
                        </option>
                    @endforeach
                </select>
            </div>
            
            <div class="field" style="grid-column: 1 / -1;">
                <label for="nombre_examinador">Nombre del Examinador (SMD_nombreexaminadordoc)</label>
                <input type="text" id="nombre_examinador" name="nombre_examinador" value="{{ old('nombre_examinador') }}">
            </div>
            <div class="field">
                <label for="cedula_examinador">Cédula del Examinador</label>
                <input type="text" id="cedula_examinador" name="cedula_examinador" value="{{ old('cedula_examinador') }}">
            </div>
            <div class="field">
                <label for="telefono_examinador">Teléfono del Examinador</label>
                <input type="text" id="telefono_examinador" name="telefono_examinador" value="{{ old('telefono_examinador') }}">
            </div>
        </div>
    </div>
    
    <script>
    function fillExaminador(sel) {
        if(!sel.value) return;
        var opt = sel.options[sel.selectedIndex];
        document.getElementById('nombre_examinador').value = opt.value;
        document.getElementById('cedula_examinador').value = opt.getAttribute('data-ced');
        document.getElementById('telefono_examinador').value = opt.getAttribute('data-tel');
    }
    </script>

    <!-- ── DATOS CURRICULARES (Opcional) ── -->
    <div class="card">
        <div class="card-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM18 20H6V4h5v7h7v9z"/>
            </svg>
            Hoja de Vida (Educación y Experiencia)
        </div>
        <div class="grid grid-2">
            <div class="field" style="grid-column: 1 / -1; font-weight: bold; border-bottom: 1px solid var(--border); padding-bottom: 5px; color: var(--navy);">Nivel de Educación</div>
            <div class="field">
                <label>Institución Educativa</label>
                <input type="text" name="cv_metadata[nombreinstitucion]" value="{{ old('cv_metadata.nombreinstitucion') }}" placeholder="Ej: UNIDAD EDUCATIVA FAE N5">
            </div>
            <div class="field">
                <label>País</label>
                <input type="text" name="cv_metadata[pais_amano]" value="{{ old('cv_metadata.pais_amano', 'ECUADOR') }}">
            </div>
            <div class="field">
                <label>Ciudad</label>
                <input type="text" name="cv_metadata[ciudad_amano]" value="{{ old('cv_metadata.ciudad_amano') }}" placeholder="Ej: LATACUNGA">
            </div>
            <div class="field">
                <label>Título Obtenido</label>
                <input type="text" name="cv_metadata[tituloobtenido]" value="{{ old('cv_metadata.tituloobtenido', 'BACHILLERATO') }}">
            </div>
            
            <div class="field" style="margin-top: 1rem; grid-column: 1 / -1; font-weight: bold; border-bottom: 1px solid var(--border); padding-bottom: 5px; color: var(--navy);">Capacitación Relevante</div>
            <div class="field" style="grid-column: 1 / -1;">
                <label>Nombre del Curso</label>
                <input type="text" name="cv_metadata[curso]" value="{{ old('cv_metadata.curso', 'CUIDADO DE PERSONAS ADULTAS MAYORES') }}">
            </div>
            <div class="field">
                <label>Institución que impartió</label>
                <input type="text" name="cv_metadata[institucion_curso]" value="{{ old('cv_metadata.institucion_curso', 'CORED') }}">
            </div>
            <div class="field">
                <label>Fechas del Curso</label>
                <input type="text" name="cv_metadata[fechacurso]" value="{{ old('cv_metadata.fechacurso', 'JUN - ENE 2026') }}">
            </div>
            <div class="field">
                <label>Horas del Curso</label>
                <input type="text" name="cv_metadata[horas]" value="{{ old('cv_metadata.horas', '240') }}">
            </div>

            <div class="field" style="margin-top: 1rem; grid-column: 1 / -1; font-weight: bold; border-bottom: 1px solid var(--border); padding-bottom: 5px; color: var(--navy);">Experiencia Laboral</div>
            <div class="field">
                <label>Fecha de Ingreso</label>
                <input type="text" name="cv_metadata[fechadesde]" value="{{ old('cv_metadata.fechadesde') }}" placeholder="Ej: 11/06/2024">
            </div>
            <div class="field">
                <label>Fecha de Salida</label>
                <input type="text" name="cv_metadata[fechahasta]" value="{{ old('cv_metadata.fechahasta') }}" placeholder="Ej: 07/01/2026">
            </div>
            <div class="field" style="grid-column: 1 / -1;">
                <label>Empresa</label>
                <input type="text" name="cv_metadata[empresa]" value="{{ old('cv_metadata.empresa') }}" placeholder="Ej: RED DE MUJERES COTOPAXI">
            </div>
            <div class="field" style="grid-column: 1 / -1;">
                <label>Cargo / Funciones</label>
                <input type="text" name="cv_metadata[cargo]" value="{{ old('cv_metadata.cargo') }}" placeholder="Ej: Cuidado de Adultos Mayores">
            </div>
        </div>
    </div>

    <div class="btn-wrap">
        <button type="submit">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM18 20H6V4h5v7h7v9z" />
            </svg>
            Guardar Cliente en la Base de Datos
        </button>
    </div>
</form>
@endsection
