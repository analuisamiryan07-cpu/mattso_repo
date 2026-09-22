<?php

namespace App\Http\Controllers;

use App\Services\CatalogApiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CatalogAdminController extends Controller
{
    public function __construct(private readonly CatalogApiService $api) {}

    public function index()
    {
        return $this->renderIndex('CERTIFICACION');
    }

    public function indexCapacitaciones()
    {
        return $this->renderIndex('CAPACITACION');
    }

    private function renderIndex(string $tipo)
    {
        try {
            $all      = $this->api->getAll();
            $products = collect($all)->where('tipo', $tipo)->values()->all();
        } catch (\Throwable $e) {
            Log::error('CatalogAdmin::index — ' . $e->getMessage());
            $products = [];
            session()->flash('error', 'No fue posible conectar con el servidor. Intenta de nuevo.');
        }

        return view('catalog.index', compact('products', 'tipo'));
    }

    public function create()
    {
        return view('catalog.create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'titulo'            => ['required', 'string', 'max:255'],
            'tipo'              => ['required', 'in:CERTIFICACION,CAPACITACION'],
            'descripcion'       => ['nullable', 'string'],
            'descripcion_larga' => ['nullable', 'string'],
            'precio'            => ['required', 'numeric', 'min:0'],
            'horas'             => ['nullable', 'integer', 'min:1', 'max:9999'],
            'modalidad'         => ['nullable', 'string', 'max:100'],
            'fecha'             => ['nullable', 'string', 'max:100'],
            'horario'           => ['nullable', 'string', 'max:100'],
            'imagen_url'        => ['nullable', 'string', 'regex:/^\d{2,3}$/'],
        ], [
            'imagen_url.regex' => 'El número de imagen debe tener 2 o 3 dígitos (ej: 01 para capacitaciones, 001 para certificaciones).',
        ]);

        $validated['activo']    = $request->boolean('activo', true);
        $validated['destacado'] = $request->boolean('destacado');

        $indexRoute = $validated['tipo'] === 'CAPACITACION' ? 'capacitaciones.index' : 'catalog.index';

        try {
            $this->api->create($validated);
            return redirect()->route($indexRoute)
                ->with('status', 'Producto "' . $validated['titulo'] . '" creado correctamente.');
        } catch (\Throwable $e) {
            Log::error('CatalogAdmin::store — ' . $e->getMessage());
            return back()->withInput()
                ->with('error', 'No se pudo crear el producto. Intenta de nuevo.');
        }
    }

    public function edit(int $id)
    {
        try {
            $products = $this->api->getAll();
            $product  = collect($products)->firstWhere('id', $id);
        } catch (\Throwable $e) {
            return redirect()->route('catalog.index')
                ->with('error', 'No fue posible cargar el catálogo.');
        }

        if (! $product) {
            return redirect()->route('catalog.index')
                ->with('error', 'Producto no encontrado.');
        }

        return view('catalog.edit', compact('product'));
    }

    public function update(Request $request, int $id)
    {
        $validated = $request->validate([
            'titulo'            => ['required', 'string', 'max:255'],
            'tipo'              => ['required', 'in:CERTIFICACION,CAPACITACION'],
            'descripcion'       => ['nullable', 'string'],
            'descripcion_larga' => ['nullable', 'string'],
            'precio'            => ['required', 'numeric', 'min:0'],
            'horas'             => ['nullable', 'integer', 'min:1', 'max:9999'],
            'modalidad'         => ['nullable', 'string', 'max:100'],
            'fecha'             => ['nullable', 'string', 'max:100'],
            'horario'           => ['nullable', 'string', 'max:100'],
            'imagen_url'        => ['nullable', 'string', 'regex:/^\d{2,3}$/'],
        ], [
            'imagen_url.regex' => 'El número de imagen debe tener 2 o 3 dígitos (ej: 01 para capacitaciones, 001 para certificaciones).',
        ]);

        $validated['activo']    = $request->boolean('activo');
        $validated['destacado'] = $request->boolean('destacado');

        $indexRoute = $validated['tipo'] === 'CAPACITACION' ? 'capacitaciones.index' : 'catalog.index';

        try {
            $this->api->update($id, $validated);
            return redirect()->route($indexRoute)
                ->with('status', 'Producto actualizado correctamente.');
        } catch (\Throwable $e) {
            Log::error('CatalogAdmin::update — ' . $e->getMessage());
            return back()->withInput()
                ->with('error', 'No se pudo actualizar el producto. Intenta de nuevo.');
        }
    }

    public function toggle(int $id)
    {
        try {
            $result = $this->api->toggle($id);
            $estado = ($result['activo'] ?? false) ? 'activado' : 'desactivado';
            return back()->with('status', "Producto {$estado} correctamente.");
        } catch (\Throwable $e) {
            Log::error('CatalogAdmin::toggle — ' . $e->getMessage());
            return back()->with('error', 'No se pudo cambiar el estado del producto.');
        }
    }

    public function destroy(Request $request, int $id)
    {
        $indexRoute = $request->input('_tipo') === 'CAPACITACION' ? 'capacitaciones.index' : 'catalog.index';

        try {
            $this->api->delete($id);
            return redirect()->route($indexRoute)
                ->with('status', 'Producto eliminado correctamente.');
        } catch (\Throwable $e) {
            Log::error('CatalogAdmin::destroy — ' . $e->getMessage());
            return back()->with('error', 'No se pudo eliminar el producto. Puede tener órdenes asociadas.');
        }
    }
}
