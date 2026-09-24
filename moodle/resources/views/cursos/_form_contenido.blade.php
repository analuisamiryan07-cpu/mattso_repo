{{-- Formulario para agregar contenido a UN módulo. Espera $m (módulo) y $curso. --}}
@php $fid = 'contenido-tipo-'.$m['id']; @endphp
<form method="POST" action="{{ route('cursos.contenidos.store', $m['id']) }}" style="margin-top:.6rem;display:flex;gap:.4rem;flex-wrap:wrap;align-items:flex-start">
    @csrf
    <input type="hidden" name="course" value="{{ $curso['id'] }}">
    <select name="item_type" id="{{ $fid }}" onchange="document.getElementById('{{ $fid }}-asig').style.display = this.value==='ASSIGNMENT' ? '' : 'none'; document.getElementById('{{ $fid }}-doc').style.display = this.value==='DOCUMENT' ? '' : 'none';">
        <option value="ASSIGNMENT">Tarea</option>
        <option value="DOCUMENT">Documento / texto</option>
    </select>
    <input type="text" name="titulo" placeholder="Título" maxlength="255" required style="flex:1;min-width:140px">
    <input type="number" name="sequence_order" placeholder="Orden" min="1" max="999" required style="width:70px">
    <textarea name="assignment_instructions" id="{{ $fid }}-asig" placeholder="Instrucciones de la tarea" maxlength="5000" style="flex:2;min-width:180px;min-height:36px"></textarea>
    <textarea name="body_text" id="{{ $fid }}-doc" placeholder="Texto del documento" maxlength="20000" style="flex:2;min-width:180px;min-height:36px;display:none"></textarea>
    <button type="submit" class="btn btn-sm">+ Agregar</button>
</form>
