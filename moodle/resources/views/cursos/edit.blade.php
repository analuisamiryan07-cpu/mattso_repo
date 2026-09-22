@extends('layouts.app')

@section('title', 'Editar curso — MATsso')

@php
    $modulosMoodle = collect($curso['modules'] ?? [])->where('delivery_mode', 'TRADICIONAL')->sortBy('sequence_order');
    $modulosCoursera = collect($curso['modules'] ?? [])->where('delivery_mode', 'ASINCRONO_VOD')->sortBy('sequence_order');
    $cloudBase = 'https://res.cloudinary.com/ehglt8h8/image/upload/f_auto,q_auto,w_400/';
    $folder = $curso['cloudinary_folder'] ?? null;
@endphp

@section('content')
@if(session('error'))
    <div class="alert errors">✕ {{ session('error') }}</div>
@endif

<div class="page-header">
    <div>
        <h1>{{ $curso['titulo'] }}</h1>
        <p class="muted">
            @if($curso['modo_moodle']) <span class="badge">Moodle</span> @endif
            @if($curso['modo_coursera']) <span class="badge">Coursera</span> @endif
        </p>
    </div>
    <a href="{{ route('cursos.index') }}" class="btn btn-secondary">← Volver</a>
</div>

{{-- 1. Datos generales --}}
<div class="card" style="max-width:720px">
    <h3 style="margin:0 0 .75rem">Datos para la página web</h3>
    <form method="POST" action="{{ route('cursos.update', $curso['id']) }}">
        @csrf @method('PUT')
        <div>
            <label for="titulo">Título <span style="color:var(--danger)">*</span></label>
            <input type="text" name="titulo" id="titulo" maxlength="255" value="{{ old('titulo', $curso['titulo']) }}" required>
        </div>
        <div>
            <label for="descripcion">Descripción</label>
            <textarea name="descripcion" id="descripcion" rows="4">{{ old('descripcion', $curso['descripcion'] ?? ($producto['descripcion_larga'] ?? '')) }}</textarea>
        </div>
        <div class="form-grid">
            <div>
                <label for="precio">Precio (USD) <span style="color:var(--danger)">*</span></label>
                <input type="number" name="precio" id="precio" min="0" step="0.01" value="{{ old('precio', $producto['precio'] ?? '0.00') }}" required>
            </div>
            <div>
                <label for="horas">Horas</label>
                <input type="number" name="horas" id="horas" min="1" max="9999" value="{{ old('horas', $producto['horas'] ?? '') }}">
            </div>
            <div>
                <label for="modalidad">Modalidad</label>
                <input type="text" name="modalidad" id="modalidad" maxlength="100" value="{{ old('modalidad', $producto['modalidad'] ?? 'Virtual') }}">
            </div>
        </div>

        <div class="checks" style="margin-top:1rem">
            <label class="check-label">
                <input type="checkbox" name="modo_moodle" value="1" {{ old('modo_moodle', $curso['modo_moodle']) ? 'checked' : '' }}>
                Moodle
            </label>
            <label class="check-label">
                <input type="checkbox" name="modo_coursera" value="1" {{ old('modo_coursera', $curso['modo_coursera']) ? 'checked' : '' }}>
                Coursera
            </label>
        </div>
        @error('modo_moodle')<p style="color:var(--danger);font-size:.82rem;margin:.3rem 0 0">{{ $message }}</p>@enderror

        <div style="max-width:220px;margin-top:.75rem">
            <label for="duracion_meses">Duración del acceso (meses) <span style="color:var(--danger)">*</span></label>
            <input type="number" name="duracion_meses" id="duracion_meses" min="1" max="60"
                value="{{ old('duracion_meses', $curso['duracion_meses']) }}" required>
        </div>

        <button type="submit" class="btn" style="margin-top:1.25rem">Guardar cambios</button>
    </form>
</div>

{{-- 2. Imágenes --}}
<div class="card" style="max-width:900px;margin-top:1.25rem">
    <h3 style="margin:0 0 .75rem">Imágenes (Cloudinary)</h3>
    @if(!$folder)
        <p class="muted">Este curso no tiene carpeta de Cloudinary — no debería pasar, avisa a soporte.</p>
    @else
        <p class="muted" style="font-size:.82rem">Carpeta: <code>Cursos/{{ $folder }}</code></p>
        <div style="display:flex;gap:1.25rem;flex-wrap:wrap">
            @foreach(['hero' => 'Hero (página web)', 'izquierda' => 'Izquierda (detalle)', 'derecha' => 'Derecha (detalle)', 'moodle' => 'Portada Moodle', 'coursera' => 'Portada Coursera'] as $slot => $label)
                <div style="width:160px">
                    <img src="{{ $cloudBase }}Cursos/{{ rawurlencode($folder) }}/{{ $slot === 'moodle' || $slot === 'coursera' ? $slot.'/portada' : $slot }}"
                         alt="{{ $label }}" style="width:100%;height:100px;object-fit:cover;border-radius:8px;border:1px solid var(--border);background:#f3f4f6"
                         onerror="this.style.opacity=0.25">
                    <p class="muted" style="font-size:.75rem;margin:.35rem 0 .35rem">{{ $label }}</p>
                    <form method="POST" action="{{ route('cursos.imagen.store', $curso['id']) }}" enctype="multipart/form-data">
                        @csrf
                        <input type="hidden" name="slot" value="{{ $slot }}">
                        <input type="file" name="imagen" accept="image/jpeg,image/png,image/webp" required style="font-size:.72rem;width:100%">
                        <button type="submit" class="btn btn-sm btn-secondary" style="margin-top:.3rem;width:100%">Subir</button>
                    </form>
                </div>
            @endforeach
        </div>
    @endif
</div>

{{-- 3. Contenido Moodle --}}
@if($curso['modo_moodle'])
<div class="card" style="margin-top:1.25rem">
    <h3 style="margin:0 0 .75rem">Contenido — Moodle</h3>
    @foreach($modulosMoodle as $m)
        <div style="border:1px solid var(--border);border-radius:8px;padding:.85rem 1rem;margin-bottom:.75rem">
            <strong>{{ $m['sequence_order'] }}. {{ $m['titulo'] }}</strong>
            <ul style="margin:.5rem 0 0;padding-left:1.1rem">
                @forelse($m['content_items'] as $ci)
                    <li>{{ $ci['sequence_order'] }}. [{{ $ci['item_type'] }}] {{ $ci['titulo'] }}</li>
                @empty
                    <li class="muted">Sin contenido todavía.</li>
                @endforelse
            </ul>
            <form method="POST" action="{{ route('cursos.contenidos.store', $m['id']) }}" style="margin-top:.6rem;display:flex;gap:.4rem;flex-wrap:wrap">
                @csrf
                <input type="hidden" name="course" value="{{ $curso['id'] }}">
                <input type="text" name="titulo" placeholder="Título de la tarea" maxlength="255" required style="flex:2;min-width:160px">
                <input type="number" name="sequence_order" placeholder="Orden" min="1" max="999" required style="width:80px">
                <input type="text" name="assignment_instructions" placeholder="Instrucciones" maxlength="5000" required style="flex:3;min-width:200px">
                <button type="submit" class="btn btn-sm">+ Tarea</button>
            </form>
        </div>
    @endforeach

    <form method="POST" action="{{ route('cursos.modulos.store', $curso['id']) }}" style="display:flex;gap:.4rem;flex-wrap:wrap;align-items:flex-end">
        @csrf
        <input type="hidden" name="delivery_mode" value="TRADICIONAL">
        <div><label style="font-size:.78rem">Nuevo módulo</label><input type="text" name="titulo" placeholder="Título" maxlength="255" required></div>
        <div><label style="font-size:.78rem">Orden</label><input type="number" name="sequence_order" min="1" max="999" required style="width:80px"></div>
        <button type="submit" class="btn btn-sm btn-secondary">+ Módulo</button>
    </form>
</div>
@endif

{{-- 4. Contenido Coursera --}}
@if($curso['modo_coursera'])
<div class="card" style="margin-top:1.25rem">
    <h3 style="margin:0 0 .75rem">Contenido — Coursera</h3>
    @foreach($modulosCoursera as $m)
        <div style="border:1px solid var(--border);border-radius:8px;padding:.85rem 1rem;margin-bottom:.75rem">
            <strong>{{ $m['sequence_order'] }}. {{ $m['titulo'] }}</strong>
            <ul style="margin:.5rem 0 0;padding-left:1.1rem">
                @forelse($m['content_items'] as $ci)
                    <li>{{ $ci['sequence_order'] }}. [{{ $ci['item_type'] }}] {{ $ci['titulo'] }}</li>
                @empty
                    <li class="muted">Sin contenido todavía.</li>
                @endforelse
            </ul>
            <form method="POST" action="{{ route('cursos.contenidos.store', $m['id']) }}" style="margin-top:.6rem;display:flex;gap:.4rem;flex-wrap:wrap">
                @csrf
                <input type="hidden" name="course" value="{{ $curso['id'] }}">
                <input type="text" name="titulo" placeholder="Título de la tarea" maxlength="255" required style="flex:2;min-width:160px">
                <input type="number" name="sequence_order" placeholder="Orden" min="1" max="999" required style="width:80px">
                <input type="text" name="assignment_instructions" placeholder="Instrucciones" maxlength="5000" required style="flex:3;min-width:200px">
                <button type="submit" class="btn btn-sm">+ Tarea</button>
            </form>
        </div>
    @endforeach

    <form method="POST" action="{{ route('cursos.modulos.store', $curso['id']) }}" style="display:flex;gap:.4rem;flex-wrap:wrap;align-items:flex-end">
        @csrf
        <input type="hidden" name="delivery_mode" value="ASINCRONO_VOD">
        <div><label style="font-size:.78rem">Nuevo módulo</label><input type="text" name="titulo" placeholder="Título" maxlength="255" required></div>
        <div><label style="font-size:.78rem">Orden</label><input type="number" name="sequence_order" min="1" max="999" required style="width:80px"></div>
        <button type="submit" class="btn btn-sm btn-secondary">+ Módulo</button>
    </form>
    <p class="muted" style="font-size:.8rem;margin-top:.5rem">Video y cuestionarios (quiz) se agregan en una fase siguiente.</p>
</div>
@endif
@endsection
