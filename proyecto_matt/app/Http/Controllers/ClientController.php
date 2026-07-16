<?php

namespace App\Http\Controllers;

use App\Models\GeneratedDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\View\View;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ClientController extends Controller
{
    public function index(Request $request): View
    {
        $search = mb_substr(trim($request->string('buscar')->toString()), 0, 100);
        $documents = GeneratedDocument::query()
            ->with('client')
            ->when($search !== '', fn ($query) => $query->whereHas(
                'client',
                fn ($clientQuery) => $clientQuery
                    ->where('nombre', 'ilike', "%{$search}%")
                    ->orWhere('cedula', 'ilike', "%{$search}%"),
            ))
            ->latest('fecha_generacion')
            ->paginate(25)
            ->withQueryString();

        return view('clients.index', compact('documents', 'search'));
    }

    public function download(GeneratedDocument $document): BinaryFileResponse
    {
        $zip = basename((string) $document->zip_ruta);

        return response()->download($this->resolveFile($document, $zip), $zip);
    }

    public function downloadFile(GeneratedDocument $document, string $file): BinaryFileResponse
    {
        $file = basename($file);
        $allowed = array_map('basename', $document->nombres_archivos ?? []);
        abort_unless(in_array($file, $allowed, true), 404);

        return response()->download($this->resolveFile($document, $file), $file);
    }

    private function resolveFile(GeneratedDocument $document, string $file): string
    {
        $folder = basename((string) $document->carpeta);
        abort_if($folder === '' || $file === '', 404);

        $privatePath = "generated/{$folder}/{$file}";
        abort_unless(Storage::disk('local')->exists($privatePath), 404);

        return Storage::disk('local')->path($privatePath);
    }
}
