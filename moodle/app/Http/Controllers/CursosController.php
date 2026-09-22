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

    public function create()
    {
        return view('cursos.create');
    }

    public function store(Request $request)
    {
        $validated = $this->validarDatosGenerales($request);

        if (!$request->boolean('modo_moodle') && !$request->boolean('modo_coursera')) {
            return back()->withInput()->withErrors(['modo_moodle' => 'Elige Moodle, Coursera o ambos.']);
        }

        $productoId = null;
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

            $this->lms->createCourse([
                'producto_id' => $productoId,
                'titulo' => $validated['titulo'],
                'descripcion' => $validated['descripcion'] ?? null,
                'modo_moodle' => $request->boolean('modo_moodle'),
                'modo_coursera' => $request->boolean('modo_coursera'),
                'duracion_meses' => $validated['duracion_meses'],
            ]);
        } catch (Throwable $e) {
            // Si el curso (LMS) falló pero el producto (catálogo) sí se creó,
            // no dejar un producto "fantasma" visible en la web sin curso detrás.
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

        return redirect()->route('cursos.index')->with('status', 'Curso "'.$validated['titulo'].'" creado correctamente.');
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

        return view('cursos.edit', compact('curso', 'producto'));
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
        // Por ahora solo tareas (ASSIGNMENT) — video y documento se habilitan
        // en la fase de cargas de archivos; quiz tiene su propia pantalla.
        $validated = $request->validate([
            'course' => ['required', 'string'],
            'titulo' => ['required', 'string', 'max:255'],
            'sequence_order' => ['required', 'integer', 'min:1', 'max:999'],
            'assignment_instructions' => ['required', 'string', 'max:5000'],
        ]);

        try {
            $this->lms->createContent($module, [
                'item_type' => 'ASSIGNMENT',
                'titulo' => $validated['titulo'],
                'sequence_order' => $validated['sequence_order'],
                'assignment_instructions' => $validated['assignment_instructions'],
            ]);
        } catch (Throwable $e) {
            return back()->with('error', 'No se pudo crear el contenido: '.$e->getMessage());
        }

        return redirect()->route('cursos.edit', $validated['course'])->with('status', 'Contenido agregado.');
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
        $validated = $request->validate([
            'correo' => ['nullable', 'email'],
            'orden_id' => ['nullable', 'integer', 'min:1'],
        ]);
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
