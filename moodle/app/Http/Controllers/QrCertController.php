<?php

namespace App\Http\Controllers;

use App\Services\QrCertApiService;
use Illuminate\Http\Request;

class QrCertController extends Controller
{
    private QrCertApiService $api;

    public function __construct(QrCertApiService $api)
    {
        $this->api = $api;
    }

    public function index()
    {
        try {
            $certs = $this->api->getAll();
        } catch (\Throwable $e) {
            $certs = [];
            session()->flash('error', 'Error al cargar los certificados: ' . $e->getMessage());
        }

        $frontendUrl = rtrim((string) config('matsso.frontend_url', 'https://matsso.vercel.app'), '/');

        return view('qr-certs.index', compact('certs', 'frontendUrl'));
    }

    public function create()
    {
        return view('qr-certs.create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombres'          => 'required|string|max:255',
            'certificado'      => 'required|string|max:255',
            'fecha_emision'    => 'required|string|max:50',
            'fecha_expiracion' => 'required|string|max:50',
            'estado'           => 'required|in:VIGENTE,EXPIRADO,SUSPENDIDO',
        ]);

        try {
            $cert = $this->api->create($validated);
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'Error al crear: ' . $e->getMessage());
        }

        return redirect()->route('qr-certs.show', ['id' => $cert['id']])
                         ->with('status', 'Certificado QR creado exitosamente.');
    }

    public function show(Request $request, int $id)
    {
        try {
            $all  = $this->api->getAll();
            $cert = collect($all)->firstWhere('id', $id);
        } catch (\Throwable $e) {
            $cert = null;
        }

        if (!$cert) {
            return redirect()->route('qr-certs.index')->with('error', 'Certificado no encontrado.');
        }

        $frontendUrl  = rtrim((string) config('matsso.frontend_url', 'https://matsso.vercel.app'), '/');
        $verificarUrl = "{$frontendUrl}/verificar/{$cert['codigo']}";

        return view('qr-certs.show', compact('cert', 'verificarUrl'));
    }

    public function destroy(int $id)
    {
        try {
            $this->api->delete($id);
            return redirect()->route('qr-certs.index')->with('status', 'Certificado QR eliminado.');
        } catch (\Throwable $e) {
            return redirect()->route('qr-certs.index')->with('error', 'Error al eliminar: ' . $e->getMessage());
        }
    }
}
