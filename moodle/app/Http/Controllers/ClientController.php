<?php

namespace App\Http\Controllers;

use App\Http\Requests\GenerateDocumentsRequest;
use App\Models\Client;
use App\Models\GeneratedDocument;
use App\Services\DocumentGenerationService;
use App\Support\CertificationCatalog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\View\View;
use DOMDocument;
use DOMXPath;
use RuntimeException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\Process\Process;
use Throwable;
use ZipArchive;

class ClientController extends Controller
{
    public function index(Request $request): View
    {
        $search = mb_substr(trim($request->string('buscar')->toString()), 0, 100);
        $empresa = $request->string('empresa')->toString();
        $documents = GeneratedDocument::query()
            ->with('client')
            ->when($search !== '', fn ($query) => $query->whereHas(
                'client',
                fn ($clientQuery) => $clientQuery
                    ->where('nombre', 'ilike', "%{$search}%")
                    ->orWhere('cedula', 'ilike', "%{$search}%"),
            ))
            ->when(array_key_exists($empresa, Client::companies()), fn ($query) => $query->where('empresa', $empresa))
            ->latest('fecha_generacion')
            ->paginate(25)
            ->withQueryString();

        return view('clients.index', compact('documents', 'search', 'empresa'));
    }

    public function edit(Client $client, CertificationCatalog $catalog): View
    {
        $catalog = new CertificationCatalog($client->empresa ?: Client::COMPANY_SAPPER);
        $latestDocument  = $client->generatedDocuments()->latest('fecha_generacion')->first();
        $datos_c02       = $client->datos_c02 ?? [];

        $defaults = array_merge([
            'empresa'          => $client->empresa,
            'nombre'           => $client->nombre,
            'cedula'           => $client->cedula,
            'telefono'         => $client->telefono,
            'correo'           => $client->correo,
            'direccion'        => $client->direccion,
            'fecha'            => $client->fecha?->format('Y-m-d'),
            'ciudad'           => $client->ciudad,
            'lugar'            => $client->lugar,
            'tipo_examen'      => $client->tipo_examen,
            'puntaje_teorico'  => $client->puntaje_teorico,
            'puntaje_practico' => $client->puntaje_practico,
        ], $datos_c02);

        $initialApplications = old('aplicaciones', $datos_c02['aplicaciones'] ?? [['perfil' => '', 'esquema' => '', 'unidades' => []]]);
        $initialTrainings    = old('capacitaciones', $datos_c02['capacitaciones'] ?? [['curso' => '', 'institucion' => '', 'fecha' => '', 'horas' => '']]);
        $initialExperiences  = old('experiencias', $datos_c02['experiencias'] ?? [['fecha_desde' => '', 'fecha_hasta' => '', 'empresa' => '', 'ciudad' => '', 'telefono' => '', 'funcion' => '']]);

        return view('clients.edit', [
            'client'              => $client,
            'latestDocument'      => $latestDocument,
            'defaults'            => $defaults,
            'initialApplications' => $initialApplications,
            'initialTrainings'    => $initialTrainings,
            'initialExperiences'  => $initialExperiences,
            'schemes'             => $catalog->schemes(),
            'profiles'            => $catalog->profileNames(),
            'examiners'           => $catalog->examiners(),
            'locations'           => config('c02.locations'),
            'educationLevels'     => config('c02.education_levels'),
        ]);
    }

    public function update(
        Client $client,
        GenerateDocumentsRequest $request,
        DocumentGenerationService $service,
    ): RedirectResponse {
        $input = $request->validated();

        $client->update([
            'empresa'          => $input['empresa'],
            'nombre'           => mb_strtoupper($input['nombre']),
            'cedula'           => $input['cedula'],
            'telefono'         => $input['telefono'] ?? null,
            'correo'           => $input['correo'] ?? null,
            'direccion'        => $input['direccion'] ?? null,
            'fecha'            => $input['fecha'],
            'ciudad'           => $input['ciudad'] ?? null,
            'lugar'            => $input['lugar'],
            'esquema'          => $input['esquema'] ?? null,
            'tipo_examen'      => $input['tipo_examen'],
            'puntaje_teorico'  => $input['puntaje_teorico'] ?? null,
            'puntaje_practico' => $input['puntaje_practico'] ?? null,
            'datos_c02'        => collect($input)->only([
                'secuencia_codigo', 'fecha_c02', 'edad', 'provincia', 'celular', 'aplicaciones',
                'instalaciones', 'direccion_instalacion', 'sector_instalacion',
                'telefono_instalacion', 'educaciones', 'capacitaciones', 'experiencias',
                'examinador_id',
            ])->all(),
        ]);

        $latestDocument = $client->generatedDocuments()->latest('fecha_generacion')->first();

        if ($latestDocument) {
            $documentId = $service->regenerate($latestDocument, $input, $request->user());

            return redirect()
                ->route('clients.index')
                ->with('download_id', $documentId)
                ->with('status', 'Datos actualizados y documentos regenerados. La descarga iniciará en un momento.');
        }

        return redirect()
            ->route('clients.index')
            ->with('status', 'Cliente actualizado correctamente.');
    }

    public function download(GeneratedDocument $document): BinaryFileResponse
    {
        $zip = basename((string) $document->zip_ruta);

        return response()->download($this->resolveFile($document, $zip), $zip);
    }

    public function downloadPdf(GeneratedDocument $document): StreamedResponse
    {
        $tempDirectory = sys_get_temp_dir().DIRECTORY_SEPARATOR.'matsso_pdf_'.bin2hex(random_bytes(8));
        $profileDirectory = $tempDirectory.DIRECTORY_SEPARATOR.'libreoffice-profile';

        try {
            throw_unless(mkdir($tempDirectory, 0700, true), RuntimeException::class, 'No se pudo crear el directorio temporal.');
            throw_unless(mkdir($profileDirectory, 0700, true), RuntimeException::class, 'No se pudo crear el perfil temporal.');

            $pdfFiles = [];
            foreach ($document->nombres_archivos ?? [] as $storedName) {
                $storedName = basename((string) $storedName);
                $extension = strtolower(pathinfo($storedName, PATHINFO_EXTENSION));
                throw_unless(in_array($extension, ['docx', 'xlsx'], true), RuntimeException::class, 'El paquete contiene un formato no convertible.');

                $source = $this->resolveFile($document, $storedName);
                $conversionSource = $this->prepareSourceForPdf($source, $storedName, $tempDirectory);
                $filter = $extension === 'xlsx' ? 'pdf:calc_pdf_Export' : 'pdf:writer_pdf_Export';
                $process = new Process([
                    'libreoffice',
                    '-env:UserInstallation=file://'.$profileDirectory,
                    '--headless',
                    '--nologo',
                    '--nodefault',
                    '--nolockcheck',
                    '--norestore',
                    '--convert-to',
                    $filter,
                    '--outdir',
                    $tempDirectory,
                    $conversionSource,
                ]);
                $process->setTimeout(60);
                $process->run();

                throw_unless($process->isSuccessful(), RuntimeException::class, 'LibreOffice no pudo convertir uno de los documentos.');

                $pdf = $tempDirectory.DIRECTORY_SEPARATOR.pathinfo($storedName, PATHINFO_FILENAME).'.pdf';
                throw_unless(is_file($pdf) && filesize($pdf) > 0, RuntimeException::class, 'No se generó uno de los PDF esperados.');
                $this->assertValidA4Pdf($pdf, strtolower(substr($storedName, 0, 3)));
                $pdfFiles[] = $pdf;
            }

            throw_if($pdfFiles === [], RuntimeException::class, 'La generación no contiene archivos convertibles.');

            $zipName = pathinfo(basename((string) $document->zip_ruta), PATHINFO_FILENAME).'_PDF.zip';
            $zipPath = $tempDirectory.DIRECTORY_SEPARATOR.$zipName;
            $zip = new ZipArchive();
            throw_unless($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true, RuntimeException::class, 'No se pudo crear el ZIP de PDF.');
            foreach ($pdfFiles as $pdf) {
                if (! $zip->addFile($pdf, basename($pdf))) {
                    $zip->close();
                    throw new RuntimeException('No se pudo agregar un PDF al ZIP.');
                }
            }
            throw_unless($zip->close(), RuntimeException::class, 'No se pudo cerrar el ZIP de PDF.');

            return response()->streamDownload(function () use ($zipPath, $tempDirectory): void {
                try {
                    $stream = fopen($zipPath, 'rb');
                    throw_unless($stream !== false, RuntimeException::class, 'No se pudo leer el ZIP de PDF.');
                    fpassthru($stream);
                    fclose($stream);
                } finally {
                    $this->removeTemporaryDirectory($tempDirectory);
                }
            }, $zipName, ['Content-Type' => 'application/zip']);
        } catch (Throwable $exception) {
            $this->removeTemporaryDirectory($tempDirectory);
            report($exception);
            abort(500, 'No se pudo crear el paquete PDF. Inténtalo nuevamente.');
        }
    }

    public function downloadFile(GeneratedDocument $document, string $file): BinaryFileResponse
    {
        $file    = basename($file);
        $allowed = array_map('basename', $document->nombres_archivos ?? []);
        abort_unless(in_array($file, $allowed, true), 404);

        return response()->download($this->resolveFile($document, $file), $file);
    }

    private function resolveFile(GeneratedDocument $document, string $file): string
    {
        $folder = basename((string) $document->carpeta);
        abort_if($folder === '' || $file === '', 404);

        // Primary: configured path (default storage or second disk)
        $basePath = rtrim(config('matsso.generated_path', storage_path('app/private/generated')), DIRECTORY_SEPARATOR);
        $absolute = $basePath.DIRECTORY_SEPARATOR.$folder.DIRECTORY_SEPARATOR.$file;

        if (is_file($absolute)) {
            return $absolute;
        }

        // Fallback: local disk (for documents generated before second disk was configured)
        $fallback = Storage::disk('local')->path("generated/{$folder}/{$file}");
        abort_unless(is_file($fallback), 404);

        return $fallback;
    }

    /**
     * Normaliza una copia efímera de cada DOCX a A4 antes de convertirla.
     * Los documentos almacenados y la base de datos permanecen inalterados.
     */
    private function prepareSourceForPdf(string $source, string $storedName, string $tempDirectory): string
    {
        if (strtolower(pathinfo($storedName, PATHINFO_EXTENSION)) !== 'docx') {
            return $source;
        }

        $inputDirectory = $tempDirectory.DIRECTORY_SEPARATOR.'office-input';
        if (! is_dir($inputDirectory)) {
            throw_unless(mkdir($inputDirectory, 0700, true), RuntimeException::class, 'No se pudo preparar el documento para PDF.');
        }

        $prepared = $inputDirectory.DIRECTORY_SEPARATOR.basename($storedName);
        throw_unless(copy($source, $prepared), RuntimeException::class, 'No se pudo preparar el documento para PDF.');

        $zip = new ZipArchive();
        throw_unless($zip->open($prepared) === true, RuntimeException::class, 'Uno de los documentos Word está dañado.');

        try {
            $xml = $zip->getFromName('word/document.xml');
            throw_unless(is_string($xml) && $xml !== '', RuntimeException::class, 'El documento Word no contiene su estructura principal.');

            $document = new DOMDocument();
            throw_unless(@$document->loadXML($xml), RuntimeException::class, 'La estructura XML de uno de los documentos Word es inválida.');
            $xpath = new DOMXPath($document);
            $pageSizes = $xpath->query('//*[local-name()="sectPr"]/*[local-name()="pgSz"]');
            throw_unless($pageSizes !== false && $pageSizes->length > 0, RuntimeException::class, 'El documento Word no declara tamaño de página.');

            $wordNamespace = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
            $landscape = strtolower(substr(basename($storedName), 0, 3)) === 'c08';
            foreach ($pageSizes as $pageSize) {
                $pageSize->setAttributeNS($wordNamespace, 'w:w', $landscape ? '16838' : '11906');
                $pageSize->setAttributeNS($wordNamespace, 'w:h', $landscape ? '11906' : '16838');
                if ($landscape) {
                    $pageSize->setAttributeNS($wordNamespace, 'w:orient', 'landscape');
                } else {
                    $pageSize->removeAttributeNS($wordNamespace, 'orient');
                }
            }

            throw_unless($zip->addFromString('word/document.xml', $document->saveXML()), RuntimeException::class, 'No se pudo normalizar el tamaño A4.');
        } finally {
            $zip->close();
        }

        return $prepared;
    }

    private function assertValidA4Pdf(string $pdf, string $code): void
    {
        $content = file_get_contents($pdf);
        throw_unless(is_string($content) && str_starts_with($content, '%PDF-'), RuntimeException::class, 'LibreOffice produjo un PDF inválido.');
        preg_match_all('/\/Type\s*\/Page\b/', $content, $pages);
        throw_unless(count($pages[0]) > 0, RuntimeException::class, 'LibreOffice produjo un PDF sin páginas verificables.');

        preg_match('/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/', $content, $mediaBox);
        throw_unless(count($mediaBox) === 3, RuntimeException::class, 'No se pudo verificar el tamaño del PDF.');
        $width = (float) $mediaBox[1];
        $height = (float) $mediaBox[2];
        [$expectedWidth, $expectedHeight] = $code === 'c08' ? [841.89, 595.30] : [595.30, 841.89];
        throw_unless(
            abs($width - $expectedWidth) < 1 && abs($height - $expectedHeight) < 1,
            RuntimeException::class,
            'Uno de los PDF no tiene formato A4.',
        );
    }

    private function removeTemporaryDirectory(string $directory): void
    {
        if (! is_dir($directory)) {
            return;
        }

        $items = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($directory, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST,
        );
        foreach ($items as $item) {
            $item->isDir() ? @rmdir($item->getPathname()) : @unlink($item->getPathname());
        }
        @rmdir($directory);
    }
}
