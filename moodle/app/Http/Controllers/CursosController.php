<?php

namespace App\Http\Controllers;

use App\Services\CatalogApiService;
use App\Services\LmsApiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Throwable;

// Cursos: aparece entre Capacitaciones y Certificaciones en el menú. Un
// "curso" administrativamente es UNA cosa, pero por debajo son dos filas en
// la nube: un Producto (tipo=CURSO, lo que ve la página pública — igual que
// capacitaciones/certificaciones vía CatalogApiService) y un Course (lo que
// usa el Aula Virtual — módulos, moodle/coursera, vía LmsApiService). Este
// controller mantiene ambos sincronizados para que no se note la diferencia.
class CursosController extends Controller
{
    public function __construct(
        private readonly CatalogApiService $catalog,
        private readonly LmsApiService $lms,
    ) {
    }

    public function dashboard()
    {
        try {
            $cursos = $this->lms->getDashboard();
        } catch (Throwable $e) {
            $cursos = [];
            session()->flash('error', 'No fue posible cargar el panel.');
        }

        return view('cursos.dashboard', compact('cursos'));
    }

    public function index()
    {
        try {
            $cursos = $this->lms->listCourses();
        } catch (Throwable $e) {
            Log::error('Cursos::index — '.$e->getMessage());
            $cursos = [];
            session()->flash('error', 'No fue posible conectar con el Aula Virtual. Intenta de nuevo.');
        }

        return view('cursos.index', compact('cursos'));
    }

    public const MAX_MODULOS = 12;

    public function create()
    {
        try {
            $profesores = collect($this->lms->listarProfesores())->where('activo', true)->values()->all();
        } catch (Throwable $e) {
            $profesores = [];
        }

        return view('cursos.create', ['profesores' => $profesores, 'maxModulos' => self::MAX_MODULOS]);
    }

    public function store(Request $request)
    {
        $validated = $this->validarDatosGenerales($request);
        $modoMoodle = $request->boolean('modo_moodle');
        $modoCoursera = $request->boolean('modo_coursera');
        if (!$modoMoodle && !$modoCoursera) {
            return back()->withInput()->withErrors(['modo_moodle' => 'Elige Moodle, Coursera o ambos.']);
        }

        $profesor = $this->validarProfesor($request, $modoMoodle);
        if ($profesor instanceof \Illuminate\Http\RedirectResponse) {
            return $profesor;
        }
        $modulos = $this->validarModulos($request, $modoCoursera);
        if ($modulos instanceof \Illuminate\Http\RedirectResponse) {
            return $modulos;
        }

        $productoId = null;
        $cursoId = null;
        $avisos = [];
        try {
            $producto = $this->catalog->create([
                'tipo' => 'CURSO',
                'titulo' => $validated['titulo'],
                'descripcion' => $validated['descripcion'] ?? null,
                'descripcion_larga' => $validated['descripcion'] ?? null,
                'precio' => $validated['precio'],
                'horas' => $validated['horas'] ?? null,
                'modalidad' => $validated['modalidad'] ?? null,
                'activo' => true,
            ]);
            $productoId = $producto['id'];

            $curso = $this->lms->createCourse([
                'producto_id' => $productoId,
                'titulo' => $validated['titulo'],
                'descripcion' => $validated['descripcion'] ?? null,
                'modo_moodle' => $modoMoodle,
                'modo_coursera' => $modoCoursera,
                'duracion_meses' => $validated['duracion_meses'],
            ]);
            $cursoId = $curso['id'];
        } catch (Throwable $e) {
            // Todavía no existe el curso — si el producto sí se creó, no dejar
            // un producto "fantasma" visible en la web sin curso detrás.
            if ($productoId) {
                try {
                    $this->catalog->delete($productoId);
                } catch (Throwable $inner) {
                    Log::error('Cursos::store — no se pudo deshacer el producto huérfano '.$productoId.': '.$inner->getMessage());
                }
            }
            Log::error('Cursos::store — '.$e->getMessage());
            return back()->withInput()->with('error', 'No se pudo crear el curso: '.$e->getMessage());
        }

        // De aquí para abajo el curso YA existe — si algo falla, no se
        // deshace nada (perdería lo que sí funcionó): se avisa y la persona
        // completa lo que falte desde "Editar curso".
        if ($profesor) {
            try {
                $this->lms->asignarProfesor($cursoId, $profesor);
            } catch (Throwable $e) {
                Log::error('Cursos::store — no se pudo asignar profesor: '.$e->getMessage());
                $avisos[] = 'El curso se creó, pero no se pudo asignar el profesor: '.$e->getMessage();
            }
        }

        foreach ($modulos as $i => $mod) {
            try {
                $moduloCreado = $this->lms->createModule($cursoId, [
                    'delivery_mode' => 'ASINCRONO_VOD',
                    'titulo' => $mod['titulo'],
                    'descripcion' => $mod['descripcion'] ?? null,
                    'sequence_order' => $i + 1,
                ]);
            } catch (Throwable $e) {
                Log::error('Cursos::store — no se pudo crear el módulo '.($i + 1).': '.$e->getMessage());
                $avisos[] = 'No se pudo crear el módulo "'.$mod['titulo'].'": '.$e->getMessage();
                continue;
            }

            $orden = 1;
            if (!empty($mod['video_url'])) {
                try {
                    $this->lms->createContent($moduloCreado['id'], [
                        'item_type' => 'VIDEO',
                        'titulo' => $mod['titulo'].' — Video',
                        'sequence_order' => $orden++,
                        'cloudinary_public_id' => \Illuminate\Support\Str::slug($mod['titulo']).'-'.$moduloCreado['id'],
                        'cloudinary_url' => $mod['video_url'],
                        'video_duration_seconds' => $mod['video_duration_seconds'],
                    ]);
                } catch (Throwable $e) {
                    $avisos[] = 'Módulo "'.$mod['titulo'].'": no se pudo guardar el video — '.$e->getMessage();
                }
            }
            if (!empty($mod['texto'])) {
                try {
                    $this->lms->createContent($moduloCreado['id'], [
                        'item_type' => 'DOCUMENT',
                        'titulo' => $mod['titulo'].' — Recurso',
                        'sequence_order' => $orden++,
                        'body_text' => $mod['texto'],
                    ]);
                } catch (Throwable $e) {
                    $avisos[] = 'Módulo "'.$mod['titulo'].'": no se pudo guardar el recurso — '.$e->getMessage();
                }
            }
            if (!empty($mod['tarea_titulo']) && !empty($mod['tarea_instrucciones'])) {
                try {
                    $this->lms->createContent($moduloCreado['id'], [
                        'item_type' => 'ASSIGNMENT',
                        'titulo' => $mod['tarea_titulo'],
                        'sequence_order' => $orden++,
                        'assignment_instructions' => $mod['tarea_instrucciones'],
                    ]);
                } catch (Throwable $e) {
                    $avisos[] = 'Módulo "'.$mod['titulo'].'": no se pudo guardar la tarea — '.$e->getMessage();
                }
            }
            // El examen (quiz) todavía no tiene armador de preguntas — se
            // agrega después, desde "Editar curso", cuando esa pantalla exista.
        }

        $mensaje = 'Curso "'.$validated['titulo'].'" creado correctamente.';
        if ($avisos) {
            $mensaje .= ' Ojo: '.implode(' | ', $avisos);
        }

        return redirect()->route('cursos.edit', $cursoId)->with($avisos ? 'error' : 'status', $mensaje);
    }

    private function validarProfesor(Request $request, bool $modoMoodle): int|null|\Illuminate\Http\RedirectResponse
    {
        if (!$modoMoodle || $request->input('profesor_modo', 'ninguno') === 'ninguno') {
            return null;
        }

        if ($request->input('profesor_modo') === 'existente') {
            $v = $request->validate(['profesor_usuario_id' => ['required', 'integer', 'min:1']]);
            return (int) $v['profesor_usuario_id'];
        }

        // 'nuevo': se crea (o asciende) primero, y se devuelve su id para asignar después.
        $v = $request->validate(['profesor_correo' => ['required', 'email']]);
        try {
            $creado = $this->lms->crearOAscenderProfesor($v['profesor_correo']);
            return (int) $creado['id'];
        } catch (Throwable $e) {
            return back()->withInput()->with('error', 'No se pudo crear el profesor: '.$e->getMessage());
        }
    }

    /** @return array|\Illuminate\Http\RedirectResponse */
    private function validarModulos(Request $request, bool $modoCoursera)
    {
        if (!$modoCoursera) {
            return [];
        }

        $num = (int) $request->input('num_modulos', 0);
        if ($num < 0 || $num > self::MAX_MODULOS) {
            return back()->withInput()->withErrors(['num_modulos' => 'El número de módulos debe estar entre 0 y '.self::MAX_MODULOS.'.']);
        }
        if ($num === 0) {
            return [];
        }

        $rules = [];
        for ($i = 1; $i <= $num; $i++) {
            $rules["modulos.$i.titulo"] = ['required', 'string', 'max:255'];
            $rules["modulos.$i.descripcion"] = ['nullable', 'string', 'max:2000'];
            $rules["modulos.$i.video_url"] = ['nullable', 'url', 'max:500'];
            $rules["modulos.$i.video_duration_seconds"] = ['nullable', 'integer', 'min:1', 'required_with:modulos.'.$i.'.video_url'];
            $rules["modulos.$i.texto"] = ['nullable', 'string', 'max:20000'];
            $rules["modulos.$i.tarea_titulo"] = ['nullable', 'string', 'max:255'];
            $rules["modulos.$i.tarea_instrucciones"] = ['nullable', 'string', 'max:5000', 'required_with:modulos.'.$i.'.tarea_titulo'];
        }

        $validator = validator($request->all(), $rules);
        if ($validator->fails()) {
            return back()->withInput()->withErrors($validator);
        }

        $data = $validator->validated();
        return array_values($data['modulos'] ?? []);
    }

    public function edit(string $course)
    {
        try {
            $curso = $this->lms->getCourse($course);
            $productos = $this->catalog->getAll();
            $producto = collect($productos)->firstWhere('id', $curso['producto_id']);
        } catch (Throwable $e) {
            return redirect()->route('cursos.index')->with('error', 'No fue posible cargar el curso.');
        }

        // Solo hace falta si el curso tiene Moodle habilitado — un curso
        // 100% Coursera no necesita elegir profesor.
        $profesores = [];
        if ($curso['modo_moodle'] ?? false) {
            try {
                $profesores = collect($this->lms->listarProfesores())->where('activo', true)->values()->all();
            } catch (Throwable $e) {
                // No es motivo para romper la pantalla completa del curso.
            }
        }

        return view('cursos.edit', compact('curso', 'producto', 'profesores'));
    }

    public function update(Request $request, string $course)
    {
        $validated = $this->validarDatosGenerales($request);

        if (!$request->boolean('modo_moodle') && !$request->boolean('modo_coursera')) {
            return back()->withInput()->withErrors(['modo_moodle' => 'Elige Moodle, Coursera o ambos.']);
        }

        try {
            $curso = $this->lms->getCourse($course);

            $this->lms->updateCourse($course, [
                'titulo' => $validated['titulo'],
                'descripcion' => $validated['descripcion'] ?? null,
                'modo_moodle' => $request->boolean('modo_moodle'),
                'modo_coursera' => $request->boolean('modo_coursera'),
                'duracion_meses' => $validated['duracion_meses'],
            ]);

            if ($curso['producto_id'] ?? null) {
                $this->catalog->update($curso['producto_id'], [
                    'tipo' => 'CURSO',
                    'titulo' => $validated['titulo'],
                    'descripcion' => $validated['descripcion'] ?? null,
                    'descripcion_larga' => $validated['descripcion'] ?? null,
                    'precio' => $validated['precio'],
                    'horas' => $validated['horas'] ?? null,
                    'modalidad' => $validated['modalidad'] ?? null,
                ]);
            }
        } catch (Throwable $e) {
            Log::error('Cursos::update — '.$e->getMessage());
            return back()->withInput()->with('error', 'No se pudo actualizar el curso: '.$e->getMessage());
        }

        return redirect()->route('cursos.edit', $course)->with('status', 'Curso actualizado correctamente.');
    }

    public function toggle(Request $request, string $course)
    {
        $activo = $request->boolean('activo');
        try {
            $curso = $this->lms->getCourse($course);
            $this->lms->updateCourse($course, ['is_active' => $activo]);
            if ($curso['producto_id'] ?? null) {
                $this->catalog->toggle($curso['producto_id']);
            }
        } catch (Throwable $e) {
            Log::error('Cursos::toggle — '.$e->getMessage());
            return back()->with('error', 'No se pudo cambiar el estado del curso.');
        }

        return back()->with('status', $activo ? 'Curso activado.' : 'Curso desactivado.');
    }

    // ── Módulos y contenido (dentro de "editar curso") ─────────────────
    public function storeModule(Request $request, string $course)
    {
        $validated = $request->validate([
            'delivery_mode' => ['required', Rule::in(['TRADICIONAL', 'ASINCRONO_VOD'])],
            'titulo' => ['required', 'string', 'max:255'],
            'sequence_order' => ['required', 'integer', 'min:1', 'max:999'],
        ]);

        try {
            $this->lms->createModule($course, $validated);
        } catch (Throwable $e) {
            return back()->with('error', 'No se pudo crear el módulo: '.$e->getMessage());
        }

        return back()->with('status', 'Módulo agregado.');
    }

    public function storeContent(Request $request, string $module)
    {
        // Tarea (con instrucciones) o documento/texto (con contenido escrito).
        // Video y quiz (examen, con banco de preguntas) quedan pendientes.
        $validated = $request->validate([
            'course' => ['required', 'string'],
            'item_type' => ['required', Rule::in(['ASSIGNMENT', 'DOCUMENT'])],
            'titulo' => ['required', 'string', 'max:255'],
            'sequence_order' => ['required', 'integer', 'min:1', 'max:999'],
            'assignment_instructions' => ['required_if:item_type,ASSIGNMENT', 'nullable', 'string', 'max:5000'],
            'body_text' => ['required_if:item_type,DOCUMENT', 'nullable', 'string', 'max:20000'],
        ]);

        try {
            $this->lms->createContent($module, [
                'item_type' => $validated['item_type'],
                'titulo' => $validated['titulo'],
                'sequence_order' => $validated['sequence_order'],
                'assignment_instructions' => $validated['assignment_instructions'] ?? null,
                'body_text' => $validated['body_text'] ?? null,
            ]);
        } catch (Throwable $e) {
            return back()->with('error', 'No se pudo crear el contenido: '.$e->getMessage());
        }

        return redirect()->route('cursos.edit', $validated['course'])->with('status', 'Contenido agregado.');
    }

    public function asignarProfesor(Request $request, string $course)
    {
        $validated = $request->validate(['profesor_usuario_id' => ['required', 'integer', 'min:1']]);

        try {
            $this->lms->asignarProfesor($course, $validated['profesor_usuario_id']);
        } catch (Throwable $e) {
            return back()->with('error', 'No se pudo asignar el profesor: '.$e->getMessage());
        }

        return redirect()->route('cursos.edit', $course)->with('status', 'Profesor asignado.');
    }

    public function uploadImagen(Request $request, string $course)
    {
        $validated = $request->validate([
            'slot' => ['required', Rule::in(['hero', 'izquierda', 'derecha', 'moodle', 'coursera'])],
            'imagen' => ['required', 'image', 'mimes:jpeg,png,webp', 'max:5120'],
        ]);

        try {
            $this->lms->uploadCourseImage($course, $validated['slot'], $request->file('imagen'));
        } catch (Throwable $e) {
            return back()->with('error', 'No se pudo subir la imagen: '.$e->getMessage());
        }

        return back()->with('status', 'Imagen subida correctamente.');
    }

    // ── Claves de acceso ────────────────────────────────────────────────
    public function buscarClaves(Request $request)
    {
        // Al entrar por primera vez (desde el botón "Generar clave") no hay
        // ni correo ni orden en la URL todavía — eso es normal, se muestra
        // el formulario vacío, sin buscar nada y sin error. El error de
        // "indica el correo o la orden" es solo para cuando SÍ se envía el
        // formulario con los dos campos en blanco.
        $seEnvioElFormulario = $request->has('correo') || $request->has('orden_id');

        $validated = $request->validate([
            'correo' => ['nullable', 'email'],
            'orden_id' => ['nullable', 'integer', 'min:1'],
        ]);

        if (!$seEnvioElFormulario) {
            return view('cursos.claves', ['disponibles' => null, 'busqueda' => []]);
        }

        if (blank($validated['correo'] ?? null) && blank($validated['orden_id'] ?? null)) {
            return back()->withErrors(['correo' => 'Indica el correo del comprador o el número de orden.']);
        }

        try {
            $disponibles = $this->lms->listarClavesDisponibles($validated['correo'] ?? null, $validated['orden_id'] ?? null);
        } catch (Throwable $e) {
            return back()->with('error', $e->getMessage());
        }

        return view('cursos.claves', ['disponibles' => $disponibles, 'busqueda' => $validated]);
    }

    public function generarClave(Request $request)
    {
        $validated = $request->validate(['orden_item_id' => ['required', 'integer', 'min:1']]);

        try {
            $resultado = $this->lms->generarClave($validated['orden_item_id']);
        } catch (Throwable $e) {
            return back()->with('error', 'No se pudo generar la clave: '.$e->getMessage());
        }

        return back()->with('status', 'Clave generada y enviada por correo. Curso: '.($resultado['course_id'] ?? '—'));
    }

    public function revocarClave(Request $request)
    {
        $validated = $request->validate(['orden_item_id' => ['required', 'integer', 'min:1']]);

        try {
            $this->lms->revocarClave($validated['orden_item_id']);
        } catch (Throwable $e) {
            return back()->with('error', 'No se pudo revocar la clave: '.$e->getMessage());
        }

        return back()->with('status', 'Clave revocada.');
    }

    private function validarDatosGenerales(Request $request): array
    {
        return $request->validate([
            'titulo' => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'precio' => ['required', 'numeric', 'min:0'],
            'horas' => ['nullable', 'integer', 'min:1', 'max:9999'],
            'modalidad' => ['nullable', 'string', 'max:100'],
            'duracion_meses' => ['required', 'integer', 'min:1', 'max:60'],
        ]);
    }
}
