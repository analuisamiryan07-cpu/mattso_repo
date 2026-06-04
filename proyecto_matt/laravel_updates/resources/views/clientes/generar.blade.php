@extends('layouts.app')

@section('title', 'Preparar Certificados')

@section('content')
<style>
/* Estilos premium extraídos del prototipo MATsso original */
.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem 1.75rem; margin-bottom: 1.25rem; box-shadow: 0 1px 4px rgba(0,0,0,.06); }
.card-title { font-size: .75rem; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; color: var(--navy); margin-bottom: 1.2rem; padding-bottom: .65rem; border-bottom: 2px solid var(--navy); display: flex; align-items: center; gap: .5rem; }
.card-title svg { fill: var(--navy); flex-shrink: 0; }
.docs-grid { display: grid; gap: 1rem; }
.doc-card { display: flex; flex-direction: column; gap: .75rem; background: #f7f9fc; border: 1.5px solid var(--border); border-radius: 8px; padding: 1rem; transition: border-color .2s, background .2s; }
.doc-card:has(input.doc-main-check:checked) { border-color: var(--navy); background: rgba(30,58,123,.03); }

.doc-header { display: flex; align-items: center; gap: .6rem; cursor: pointer; }
.doc-header input[type="checkbox"] { accent-color: var(--navy); width: 1.1rem; height: 1.1rem; cursor: pointer; }
.doc-code { font-size: .75rem; font-weight: 800; letter-spacing: .1em; color: var(--gold-dark); text-transform: uppercase; background: #fff8e1; padding: .15rem .45rem; border-radius: 4px;}
.doc-name { font-size: .9rem; color: var(--text); font-weight: 600; }

.doc-formats { margin-left: 1.7rem; display: flex; gap: 1rem; padding-top: .5rem; border-top: 1px dashed var(--border); }
.format-radio { display: flex; align-items: center; gap: .3rem; font-size: .8rem; color: var(--muted); cursor: pointer; }
.format-radio input[type="radio"] { accent-color: var(--danger); cursor: pointer; }

.btn-wrap { text-align: center; margin-top: 1.5rem; }
button[type="submit"] { display: inline-flex; align-items: center; gap: .6rem; background: var(--navy); color: #fff; font-family: inherit; font-size: 1rem; font-weight: 600; border: none; border-radius: 8px; padding: .9rem 2.5rem; cursor: pointer; transition: background .2s, transform .15s, box-shadow .2s; box-shadow: 0 3px 12px rgba(30,58,123,.3); width: 100%; justify-content: center;}
button[type="submit"]:hover { background: var(--navy-light); transform: translateY(-1px); box-shadow: 0 5px 18px rgba(30,58,123,.35); }
.header-flex { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; }
.header-flex h1 { font-size: 1.6rem; font-weight: 700; color: var(--text); }
.header-flex p { color: var(--muted); font-size: .88rem; margin-top: .3rem; }
.btn-volver { background: none; border: 1.5px solid var(--border); color: var(--text); padding: .6rem 1rem; border-radius: 7px; text-decoration: none; font-size:.85rem; font-weight:600; display: inline-flex; gap: .4rem; align-items: center; transition: background .2s; }
.btn-volver:hover { background: #f2f4f8; }
.client-stamp { background: #eef2ff; color: var(--navy); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid var(--navy); font-weight: 500; font-size: .95rem; }
</style>

<div class="header-flex">
    <div>
        <h1>Exportador de Certificados</h1>
        <p>Selecciona qué documentos imprimir y en qué formato.</p>
    </div>
    <a href="{{ route('clientes.index') }}" class="btn-volver">
        <svg width="15" height="15" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/></svg>
        Volver al Listado
    </a>
</div>

<div class="client-stamp">
    <strong>Candidato Seleccionado:</strong> {{ $cliente->nombre }} (C.I: {{ $cliente->cedula }})<br>
    <span style="font-size: .85rem; color: var(--muted);">Esquema: {{ $cliente->esquema }}</span>
</div>

<form method="POST" action="{{ route('clientes.generar', $cliente) }}">
    @csrf
    
    <div class="card">
        <div class="card-title">
            <svg width="15" height="15" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM18 20H6V4h5v7h7v9z" />
            </svg>
            Selección Individual de Documentos
        </div>

        <div class="docs-grid">
            
            <!-- C02: Es base EXCEL en plantillas reales, formato Word acá lo referiré a Office vs PDF -->
            <label class="doc-card">
                <div class="doc-header">
                    <input type="checkbox" name="docs[]" value="c02" class="doc-main-check" checked>
                    <span class="doc-code">C02</span>
                    <span class="doc-name">Solicitud para la certificación de personas</span>
                </div>
                <div class="doc-formats">
                    <span style="font-size:.75rem; font-weight:600; color:var(--muted);">Formato:</span>
                    <label class="format-radio">
                        <input type="radio" name="format[c02]" value="office" checked> 📊 Original (Excel)
                    </label>
                    <label class="format-radio" style="color: var(--danger);">
                        <input type="radio" name="format[c02]" value="pdf"> 📕 Imprimible (PDF)
                    </label>
                </div>
            </label>

            <!-- C05: Base Word -->
            <label class="doc-card">
                <div class="doc-header">
                    <input type="checkbox" name="docs[]" value="c05" class="doc-main-check" checked>
                    <span class="doc-code">C05</span>
                    <span class="doc-name">Código de ética y conducta para el examinado</span>
                </div>
                <div class="doc-formats">
                    <span style="font-size:.75rem; font-weight:600; color:var(--muted);">Formato:</span>
                    <label class="format-radio" style="color: var(--navy-light);">
                        <input type="radio" name="format[c05]" value="office" checked> 📝 Original (Word)
                    </label>
                    <label class="format-radio" style="color: var(--danger);">
                        <input type="radio" name="format[c05]" value="pdf"> 📕 Imprimible (PDF)
                    </label>
                </div>
            </label>

            <!-- C08: Base Word -->
            <label class="doc-card">
                <div class="doc-header">
                    <input type="checkbox" name="docs[]" value="c08" class="doc-main-check" checked>
                    <span class="doc-code">C08</span>
                    <span class="doc-name">Lista de asistencia a la examinación</span>
                </div>
                <div class="doc-formats">
                    <span style="font-size:.75rem; font-weight:600; color:var(--muted);">Formato:</span>
                    <label class="format-radio" style="color: var(--navy-light);">
                        <input type="radio" name="format[c08]" value="office" checked> 📝 Original (Word)
                    </label>
                    <label class="format-radio" style="color: var(--danger);">
                        <input type="radio" name="format[c08]" value="pdf"> 📕 Imprimible (PDF)
                    </label>
                </div>
            </label>

            <!-- C09: Base Word -->
            <label class="doc-card">
                <div class="doc-header">
                    <input type="checkbox" name="docs[]" value="c09" class="doc-main-check" checked>
                    <span class="doc-code">C09</span>
                    <span class="doc-name">Acuerdo de cumplimiento para personas certificadas</span>
                </div>
                <div class="doc-formats">
                    <span style="font-size:.75rem; font-weight:600; color:var(--muted);">Formato:</span>
                    <label class="format-radio" style="color: var(--navy-light);">
                        <input type="radio" name="format[c09]" value="office" checked> 📝 Original (Word)
                    </label>
                    <label class="format-radio" style="color: var(--danger);">
                        <input type="radio" name="format[c09]" value="pdf"> 📕 Imprimible (PDF)
                    </label>
                </div>
            </label>

            <!-- C10: Base Word -->
            <label class="doc-card">
                <div class="doc-header">
                    <input type="checkbox" name="docs[]" value="c10" class="doc-main-check" checked>
                    <span class="doc-code">C10</span>
                    <span class="doc-name">Notificación de certificación o no certificación</span>
                </div>
                <div class="doc-formats">
                    <span style="font-size:.75rem; font-weight:600; color:var(--muted);">Formato:</span>
                    <label class="format-radio" style="color: var(--navy-light);">
                        <input type="radio" name="format[c10]" value="office" checked> 📝 Original (Word)
                    </label>
                    <label class="format-radio" style="color: var(--danger);">
                        <input type="radio" name="format[c10]" value="pdf"> 📕 Imprimible (PDF)
                    </label>
                </div>
            </label>

            <!-- C12: Base Excel -->
            <label class="doc-card">
                <div class="doc-header">
                    <input type="checkbox" name="docs[]" value="c12" class="doc-main-check" checked>
                    <span class="doc-code">C12</span>
                    <span class="doc-name">Encuesta de satisfacción para el examinado</span>
                </div>
                <div class="doc-formats">
                    <span style="font-size:.75rem; font-weight:600; color:var(--muted);">Formato:</span>
                    <label class="format-radio">
                        <input type="radio" name="format[c12]" value="office" checked> 📊 Original (Excel)
                    </label>
                    <label class="format-radio" style="color: var(--danger);">
                        <input type="radio" name="format[c12]" value="pdf"> 📕 Imprimible (PDF)
                    </label>
                </div>
            </label>

        </div>
    </div>

    <div class="btn-wrap">
        <button type="submit" onclick="this.innerHTML='⏳ Procesando... Por favor, no cierres esta ventana';">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
            Exportar Zip con Documentos Configurados
        </button>
    </div>
</form>

<script>
    // JS para que si desmarcan el checkbox principal, los radio buttons se deshabiliten visualmente
    document.querySelectorAll('.doc-main-check').forEach(check => {
        check.addEventListener('change', function() {
            let formatDiv = this.closest('.doc-card').querySelector('.doc-formats');
            if(this.checked) {
                formatDiv.style.opacity = '1';
                formatDiv.style.pointerEvents = 'auto';
            } else {
                formatDiv.style.opacity = '0.5';
                formatDiv.style.pointerEvents = 'none';
            }
        });
    });
</script>
@endsection
