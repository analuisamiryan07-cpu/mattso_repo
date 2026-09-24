<?php

namespace App\Http\Controllers;

use App\Services\LmsApiService;
use Illuminate\Http\Request;
use Throwable;

// Profesores del Aula Virtual — solo tiene sentido para Moodle (el profesor
// sube recursos y califica; Coursera es autoevaluado, sin profesor). Crear
// aquí NO reutiliza ninguna contraseña administrativa: al profesor le llega
// un correo para definir la suya, igual que "olvidé mi contraseña".
class ProfesoresController extends Controller
{
    public function __construct(private readonly LmsApiService $lms)
    {
    }

    public function index()
    {
        try {
            $profesores = $this->lms->listarProfesores();
        } catch (Throwable $e) {
            $profesores = [];
            session()->flash('error', 'No fue posible conectar con el Aula Virtual.');
        }

        return view('profesores.index', compact('profesores'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'correo' => ['required', 'email'],
            'cliente_id' => ['nullable', 'integer', 'min:1'],
        ]);

        try {
            $this->lms->crearOAscenderProfesor($validated['correo'], $validated['cliente_id'] ?? null);
        } catch (Throwable $e) {
            return back()->withInput()->with('error', 'No se pudo crear el profesor: '.$e->getMessage());
        }

        return back()->with('status', 'Profesor creado — se le mandó un correo para definir su contraseña.');
    }

    public function toggle(Request $request, int $usuarioId)
    {
        $activo = $request->boolean('activo');
        try {
            $this->lms->cambiarActivoProfesor($usuarioId, $activo);
        } catch (Throwable $e) {
            return back()->with('error', 'No se pudo cambiar el estado: '.$e->getMessage());
        }

        return back()->with('status', $activo ? 'Profesor activado.' : 'Profesor desactivado.');
    }
}
