<?php

namespace App\Services;

use App\Models\Client;
use App\Models\GeneratedDocument;
use App\Models\User;
use App\Support\CertificationCatalog;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpWord\TemplateProcessor;
use RuntimeException;
use Throwable;
use ZipArchive;

class DocumentGenerationService
{
    public function __construct()
    {
    }

    public static function templates(string $company = 'SAPPER'): array
    {
        return config("company_templates.{$company}.files", []);
    }

    private function templateRoot(string $company): string
    {
        $path = config("company_templates.{$company}.path", 'document-templates');

        return resource_path($path);
    }

    private function catalogFor(string $company): CertificationCatalog
    {
        return new CertificationCatalog($company);
    }

    private function generatedBasePath(): string
    {
        return rtrim((string) config('matsso.generated_path'), DIRECTORY_SEPARATOR);
    }

    public function regenerate(GeneratedDocument $document, array $input, User $user): int
    {
        $input['empresa'] = $input['empresa'] ?? $document->empresa ?? 'SAPPER';
        $docs = array_values(array_unique(array_filter(
            array_map(fn (string $f): string => strtolower(substr(basename($f), 0, 3)), $document->nombres_archivos ?? []),
            fn (string $code): bool => isset(self::templates($input['empresa'])[$code]),
        )));

        if ($docs === []) {
            $docs = array_keys(self::templates($input['empresa']));
        }

        $input['docs'] = $docs;
        $data = $this->normalize($input);
        $slug = Str::limit(Str::slug($data['NOMBRE'], '_'), 30, '').'_'.now()->format('Ymd_His_u');
        $directory = $this->generatedBasePath().DIRECTORY_SEPARATOR.$slug;
        File::ensureDirectoryExists($directory, 0750);

        try {
            $files = $this->generateSelectedFiles($docs, $data, $directory);
            throw_if($files === [], RuntimeException::class, 'No se generó ningún documento.');

            $zipName = "certificacion_{$slug}.zip";
            $zipPath = $directory.DIRECTORY_SEPARATOR.$zipName;
            $this->zip($files, $zipPath);

            $oldFolder = $this->generatedBasePath().DIRECTORY_SEPARATOR.$document->carpeta;

            DB::transaction(function () use ($document, $input, $slug, $zipName, $files, $user): void {
                $document->update([
                    'carpeta'          => $slug,
                    'zip_ruta'         => $zipName,
                    'n_archivos'       => count($files),
                    'nombres_archivos' => array_map('basename', $files),
                    'empresa'          => $input['empresa'],
                    'generado_por'     => $user->usuario,
                    'fecha_generacion' => now(),
                ]);
            });

            File::deleteDirectory($oldFolder);

            return $document->getKey();
        } catch (Throwable $exception) {
            File::deleteDirectory($directory);
            throw $exception;
        }
    }

    public function generate(array $input, User $user): array
    {
        $data = $this->normalize($input);
        $slug = Str::limit(Str::slug($data['NOMBRE'], '_'), 30, '').'_'.now()->format('Ymd_His_u');
        $directory = $this->generatedBasePath().DIRECTORY_SEPARATOR.$slug;
        File::ensureDirectoryExists($directory, 0750);

        try {
            $files = $this->generateSelectedFiles($input['docs'], $data, $directory);
            throw_if($files === [], RuntimeException::class, 'No se generó ningún documento.');

            $zipName = "certificacion_{$slug}.zip";
            $zipPath = $directory.DIRECTORY_SEPARATOR.$zipName;
            $this->zip($files, $zipPath);

            $documentId = null;
            DB::transaction(function () use ($input, $user, $slug, $zipName, $files, &$documentId): void {
                $normalizedNombre = mb_strtoupper(trim($input['nombre']));
                $empresa = $input['empresa'];

                $clientFields = collect($input)->only([
                    'empresa', 'telefono', 'correo', 'direccion', 'fecha', 'ciudad',
                    'lugar', 'esquema', 'tipo_examen', 'puntaje_teorico', 'puntaje_practico',
                ])->merge([
                    'nombre'    => $normalizedNombre,
                    'datos_c02' => collect($input)->only([
                        'secuencia_codigo', 'fecha_c02', 'edad', 'provincia', 'celular', 'aplicaciones',
                        'instalaciones', 'direccion_instalacion', 'sector_instalacion',
                        'telefono_instalacion', 'educaciones', 'capacitaciones', 'experiencias',
                        'examinador_id',
                    ])->all(),
                ])->all();

                // La cédula identifica a la persona en la base local. La empresa
                // de cada proceso queda registrada en documentos_generados.
                $existing = Client::query()->where('cedula', $input['cedula'])->first();

                if ($existing && mb_strtoupper(trim($existing->nombre)) === $normalizedNombre) {
                    // Misma cédula, mismo nombre → actualiza datos de la misma persona
                    $existing->update($clientFields);
                    $client = $existing->fresh();
                } else {
                    if ($existing) {
                        throw new RuntimeException('La cédula ya pertenece a otro cliente registrado.');
                    }

                    $client = Client::query()->create(
                        array_merge(['cedula' => $input['cedula']], $clientFields)
                    );
                }

                $doc = GeneratedDocument::query()->create([
                    'cliente_id' => $client->getKey(),
                    'empresa' => $empresa,
                    'carpeta' => $slug,
                    'zip_ruta' => $zipName,
                    'n_archivos' => count($files),
                    'nombres_archivos' => array_map('basename', $files),
                    'generado_por' => $user->usuario,
                ]);
                $documentId = $doc->getKey();
            });

            return [
                'path' => $zipPath,
                'download_name' => 'Certificacion_'.Str::slug($data['NOMBRE'], '_').'.zip',
                'document_id' => $documentId,
            ];
        } catch (Throwable $exception) {
            File::deleteDirectory($directory);
            throw $exception;
        }
    }

    private function generateSelectedFiles(array $selected, array $data, string $directory): array
    {
        $files = [];
        foreach (array_unique($selected) as $code) {
            $template = self::templates($data['EMPRESA'] ?? 'SAPPER')[$code] ?? null;
            if (! $template) {
                continue;
            }

            $source = $this->templateRoot($data['EMPRESA'] ?? 'SAPPER')
                .DIRECTORY_SEPARATOR.$template['file'];
            throw_unless(is_file($source), RuntimeException::class, "Plantilla no encontrada: {$template['file']}");

            $extension = $template['type'];
            $filename = mb_strtoupper($code).'_'.Str::slug($data['NOMBRE'], '_').'_'.$data['FECHA_RAW'].'.'.$extension;
            $output = $directory.DIRECTORY_SEPARATOR.$filename;

            if ($code === 'c02') {
                if (($data['EMPRESA'] ?? 'SAPPER') === 'FUMALU') {
                    $this->generateFumaluC02($source, $output, $data);
                } else {
                    $this->generateC02($source, $output, $data);
                }
            } elseif ($extension === 'docx') {
                $this->generateDocx($source, $output, $data);
                if ($code === 'c08' && ($data['EMPRESA'] ?? 'SAPPER') === 'MATSSO') {
                    $this->adjustC08RowHeight($output, (string) ($data['NOMBRE'] ?? ''));
                }
            } elseif ($code === 'c12' && ($data['EMPRESA'] ?? 'SAPPER') === 'FUMALU') {
                $this->generateFumaluC12($source, $output, $data);
            } else {
                $this->generateXlsx($source, $output, $data);
            }
            $files[] = $output;
        }

        return $files;
    }

    private function generateDocx(string $source, string $output, array $data): void
    {
        $markers = $this->markers($data);

        // TemplateProcessor maneja marcadores partidos entre w:r runs (spell-check, formato, etc.)
        $processor = new TemplateProcessor($source);
        $unknown = array_values(array_diff($processor->getVariables(), array_keys($markers)));
        throw_if($unknown !== [], RuntimeException::class, 'Marcadores DOCX sin mapear: '.implode(', ', $unknown));

        foreach ($markers as $marker => $value) {
            $processor->setValue($marker, htmlspecialchars((string) $value, ENT_XML1 | ENT_COMPAT, 'UTF-8'));
        }
        $processor->saveAs($output);

        // TemplateProcessor puede perder imágenes de encabezados al re-empaquetar el ZIP.
        // Restaurar media y relaciones de header/footer desde la plantilla original.
        $this->restoreHeaderMedia($source, $output);
    }

    private function restoreHeaderMedia(string $source, string $output): void
    {
        $src = new ZipArchive();
        $out = new ZipArchive();

        if ($src->open($source) !== true || $out->open($output) !== true) {
            $src->close();
            return;
        }

        for ($i = 0; $i < $src->numFiles; $i++) {
            $name = $src->getNameIndex($i);
            // Restaurar archivos de imagen y relaciones de encabezado/pie
            if (
                str_starts_with($name, 'word/media/')
                || preg_match('/^word\/_rels\/(header|footer)\d*\.xml\.rels$/', $name)
            ) {
                $out->addFromString($name, $src->getFromIndex($i));
            }
        }

        $src->close();
        $out->close();
    }

    /**
     * Mantiene C08 grande para nombres habituales y reduce únicamente las ocho
     * filas de personas cuando el nombre necesita más líneas. De este modo el
     * formato conserva exactamente sus dos páginas en LibreOffice.
     */
    private function adjustC08RowHeight(string $output, string $candidateName): void
    {
        $nameLength = mb_strlen($candidateName);
        $rowHeight = match (true) {
            $nameLength > 110 => 600,
            $nameLength > 55 => 700,
            default => 875,
        };

        if ($rowHeight === 875) {
            return;
        }

        $zip = new ZipArchive();
        throw_unless($zip->open($output) === true, RuntimeException::class, 'No se pudo ajustar el tamaño del C08.');

        try {
            $xml = $zip->getFromName('word/document.xml');
            throw_unless(is_string($xml) && $xml !== '', RuntimeException::class, 'El C08 generado no contiene su estructura principal.');
            $document = new \DOMDocument();
            throw_unless(@$document->loadXML($xml), RuntimeException::class, 'La estructura XML del C08 generado es inválida.');
            $xpath = new \DOMXPath($document);
            $wordNamespace = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
            $adjusted = 0;

            foreach ($xpath->query('//*[local-name()="trHeight"]') as $height) {
                if ($height->getAttributeNS($wordNamespace, 'val') !== '875') {
                    continue;
                }
                $height->setAttributeNS($wordNamespace, 'w:val', (string) $rowHeight);
                $adjusted++;
            }

            throw_unless($adjusted === 8, RuntimeException::class, 'El C08 no contiene las ocho filas ajustables esperadas.');
            throw_unless($zip->addFromString('word/document.xml', $document->saveXML()), RuntimeException::class, 'No se pudo guardar el tamaño dinámico del C08.');
        } finally {
            $zip->close();
        }
    }

    private function generateXlsx(string $source, string $output, array $data): void
    {
        $spreadsheet = IOFactory::load($source);
        $this->replaceSpreadsheetMarkers($spreadsheet, $this->markers($data));

        IOFactory::createWriter($spreadsheet, 'Xlsx')->save($output);
        $spreadsheet->disconnectWorksheets();
    }

    private function generateFumaluC12(string $source, string $output, array $data): void
    {
        $spreadsheet = IOFactory::load($source);
        $sheet = $spreadsheet->getSheet(0);
        $printArea = (string) $sheet->getPageSetup()->getPrintArea();
        throw_unless(
            strtoupper($printArea) === 'A1:AC89',
            RuntimeException::class,
            'La plantilla C12 FUMALU cambió su área útil; se requiere revisión antes de generar.'
        );

        $this->replaceSpreadsheetMarkers($spreadsheet, $this->markers($data));
        $sheet->getPageSetup()->setFitToPage(true);
        $sheet->getPageSetup()->setFitToWidth(1);
        $sheet->getPageSetup()->setFitToHeight(0);
        $sheet->getPageSetup()->setPrintArea('A1:AC89');

        IOFactory::createWriter($spreadsheet, 'Xlsx')->save($output);
        $spreadsheet->disconnectWorksheets();
    }

    private function replaceSpreadsheetMarkers(Spreadsheet $spreadsheet, array $markers): void
    {
        foreach ($spreadsheet->getAllSheets() as $sheet) {
            foreach ($sheet->getRowIterator() as $row) {
                $cells = $row->getCellIterator();
                $cells->setIterateOnlyExistingCells(true);
                foreach ($cells as $cell) {
                    $value = $cell->getValue();
                    if (! is_string($value)) {
                        continue;
                    }
                    $replaced = preg_replace_callback('/(?:\$\{|\{\{)([^{}]+)(?:\}|\}\})/u', function (array $match) use ($markers): string {
                        $token = trim($match[1]);
                        throw_unless(array_key_exists($token, $markers), RuntimeException::class, "Marcador XLSX sin mapear: {$token}");

                        return (string) $markers[$token];
                    }, $value);
                    if ($replaced !== $value) {
                        $cell->setValueExplicit($replaced, DataType::TYPE_STRING);
                    }
                }
            }
        }
    }

    private function generateC02(string $source, string $output, array $data): void
    {
        $spreadsheet = IOFactory::load($source);
        $sheet = $spreadsheet->getSheet(0);

        // Leer columnas y fila final del Print_Area definido en la plantilla (ej: "A1:M94")
        $templatePrintArea = (string) $sheet->getPageSetup()->getPrintArea();
        throw_unless(
            preg_match('/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i', trim($templatePrintArea), $m),
            RuntimeException::class,
            'La plantilla C02 no contiene un Print_Area válido.'
        );

        $startCol = strtoupper($m[1]);
        $startRow = (int) $m[2];
        $endCol = strtoupper($m[3]);
        $originalLastRow = (int) $m[4];

        $this->fillApplicationRows($sheet, $data['APLICACIONES']);
        $this->fillEducationRows($sheet, $data['EDUCACIONES']);
        $this->fillTrainingRows($sheet, $data['CAPACITACIONES']);
        $this->fillExperienceRows($sheet, $data['EXPERIENCIAS']);
        $this->replaceSpreadsheetMarkers($spreadsheet, $this->markers($data));

        // Ajustar celda principal de nombre de candidato (E12:M12)
        $nameLen = mb_strlen($data['NOMBRE'] ?? '');
        $sheet->getStyle('E12:M12')->getAlignment()
            ->setWrapText(true)
            ->setVertical(Alignment::VERTICAL_CENTER)
            ->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $nameRowHeight = match (true) {
            $nameLen > 110 => 42,
            $nameLen > 55 => 28,
            default => 18,
        };
        $sheet->getRowDimension(12)->setRowHeight($nameRowHeight);

        // Sumar exactamente las filas insertadas por cada sección
        $extraRows = max(0, count($data['APLICACIONES']) - 1)
                   + max(0, count($data['CAPACITACIONES']) - 3)
                   + max(0, count($data['EXPERIENCIAS']) - 2);

        $lastDataRow = $originalLastRow + $extraRows;

        // Ajustar celda de nombre de candidato en bloque de firma (fila ~92 + extraRows)
        for ($r = 85; $r <= $lastDataRow; $r++) {
            $val = (string) $sheet->getCell("E{$r}")->getValue();
            if ($val !== '' && ! empty($data['NOMBRE']) && str_contains($val, $data['NOMBRE'])) {
                $sheet->getStyle("E{$r}:I{$r}")->getAlignment()
                    ->setWrapText(true)
                    ->setVertical(Alignment::VERTICAL_CENTER)
                    ->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sigRowHeight = match (true) {
                    $nameLen > 110 => 36,
                    $nameLen > 55 => 26,
                    default => 16,
                };
                $sheet->getRowDimension($r)->setRowHeight($sigRowHeight);
            }
        }

        $sheet->getPageSetup()->setFitToPage(true);
        $sheet->getPageSetup()->setFitToWidth(1);
        $sheet->getPageSetup()->setFitToHeight(0);
        $sheet->getPageSetup()->setPrintArea("{$startCol}{$startRow}:{$endCol}{$lastDataRow}");

        IOFactory::createWriter($spreadsheet, 'Xlsx')->save($output);
        $spreadsheet->disconnectWorksheets();
    }

    /**
     * El C02 FUMALU no comparte la cuadrícula de SAPPER/MATSSO: su formulario
     * está en la segunda hoja, imprime B:N y cada solicitud ocupa dos filas.
     * Mantener esta ruta separada evita alterar las plantillas ya operativas.
     */
    private function generateFumaluC02(string $source, string $output, array $data): void
    {
        $spreadsheet = IOFactory::load($source);
        $sheet = $this->sheetContainingMarker($spreadsheet, 'SMD_perfil_profesional');
        $templatePrintArea = (string) $sheet->getPageSetup()->getPrintArea();
        throw_unless(
            preg_match('/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i', trim($templatePrintArea), $matches),
            RuntimeException::class,
            'La plantilla C02 FUMALU no contiene un Print_Area válido.'
        );

        [$startCol, $startRow, $endCol, $originalLastRow] = [
            strtoupper($matches[1]),
            (int) $matches[2],
            strtoupper($matches[3]),
            (int) $matches[4],
        ];
        throw_unless(
            $startCol === 'B' && $endCol === 'N',
            RuntimeException::class,
            'La cuadrícula del C02 FUMALU cambió; se requiere revisión antes de generar.'
        );

        $this->fillFumaluApplicationRows($sheet, $data['APLICACIONES']);
        $this->fillFumaluEducationRows($sheet, $data['EDUCACIONES']);
        $this->fillFumaluTrainingRows($sheet, $data['CAPACITACIONES']);
        $this->fillFumaluExperienceRows($sheet, $data['EXPERIENCIAS']);

        $sheet->getStyle('D12:N12')->getAlignment()
            ->setWrapText(true)
            ->setVertical(Alignment::VERTICAL_CENTER)
            ->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $nameLength = mb_strlen((string) ($data['NOMBRE'] ?? ''));
        $sheet->getRowDimension(12)->setRowHeight(match (true) {
            $nameLength > 110 => 42,
            $nameLength > 55 => 28,
            default => 18,
        });

        $this->replaceSpreadsheetMarkers($spreadsheet, $this->markers($data));

        $extraRows = (max(0, count($data['APLICACIONES']) - 1) * 2)
            + max(0, count($data['CAPACITACIONES']) - 2)
            + max(0, count($data['EXPERIENCIAS']) - 2);
        $lastDataRow = $originalLastRow + $extraRows;

        $sheet->getPageSetup()->setFitToPage(true);
        $sheet->getPageSetup()->setFitToWidth(1);
        $sheet->getPageSetup()->setFitToHeight(0);
        $sheet->getPageSetup()->setPrintArea("{$startCol}{$startRow}:{$endCol}{$lastDataRow}");

        IOFactory::createWriter($spreadsheet, 'Xlsx')->save($output);
        $spreadsheet->disconnectWorksheets();
    }

    private function fillFumaluApplicationRows(Worksheet $sheet, array $applications): void
    {
        $baseRow = $this->markerRow($sheet, 'SMD_perfil_profesional');
        $extraBlocks = max(0, count($applications) - 1);
        if ($extraBlocks > 0) {
            $sheet->insertNewRowBefore($baseRow + 2, $extraBlocks * 2);
            for ($block = 1; $block <= $extraBlocks; $block++) {
                $row = $baseRow + ($block * 2);
                $this->cloneFumaluRowStyle($sheet, $baseRow, $row);
                $this->cloneFumaluRowStyle($sheet, $baseRow + 1, $row + 1);
                $sheet->mergeCells("B{$row}:D".($row + 1));
                $sheet->mergeCells("E{$row}:I".($row + 1));
            }
        }

        foreach ($applications as $offset => $application) {
            $row = $baseRow + ($offset * 2);
            $this->writeString($sheet, "B{$row}", $application['perfil']);
            $this->writeString($sheet, "E{$row}", $application['esquema']);
            foreach (range(1, 5) as $unit) {
                $column = chr(ord('I') + $unit);
                $this->writeString($sheet, "{$column}{$row}", in_array($unit, $application['unidades'], true) ? 'X' : '');
            }
            $sheet->getStyle("B{$row}:N".($row + 1))->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_CENTER)
                ->setVertical(Alignment::VERTICAL_CENTER)
                ->setWrapText(true);
        }
    }

    private function fillFumaluEducationRows(Worksheet $sheet, array $educations): void
    {
        $secondaryRow = $this->markerRow($sheet, 'SMD_educacion_institucion');
        $rows = [
            'lectoescritura' => $secondaryRow - 2,
            'primaria' => $secondaryRow - 1,
            'secundaria' => $secondaryRow,
            'artesano' => $secondaryRow + 1,
            'tercer_nivel' => $secondaryRow + 2,
            'cuarto_nivel' => $secondaryRow + 3,
        ];

        foreach ($rows as $level => $row) {
            $education = $educations[$level] ?? [];
            $selected = (bool) ($education['seleccionado'] ?? false);
            $this->writeString($sheet, "C{$row}", $selected ? ($education['institucion'] ?? '') : '');
            $this->writeString($sheet, "I{$row}", $selected ? ($education['pais'] ?? '') : '');
            $this->writeString($sheet, "J{$row}", $selected ? ($education['ciudad'] ?? '') : '');
            $this->writeString($sheet, "K{$row}", $selected ? ($education['titulo'] ?? '') : '');
            $sheet->getStyle("C{$row}:N{$row}")->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_CENTER)
                ->setVertical(Alignment::VERTICAL_CENTER)
                ->setWrapText(true);
        }
    }

    private function fillFumaluTrainingRows(Worksheet $sheet, array $trainings): void
    {
        $baseRow = $this->markerRow($sheet, 'SMD_capacitacion_institucion');
        $extraRows = max(0, count($trainings) - 2);
        if ($extraRows > 0) {
            $sheet->insertNewRowBefore($baseRow + 2, $extraRows);
            for ($offset = 2; $offset < 2 + $extraRows; $offset++) {
                $row = $baseRow + $offset;
                $this->cloneFumaluRowStyle($sheet, $baseRow, $row);
                $sheet->mergeCells("B{$row}:F{$row}");
                $sheet->mergeCells("G{$row}:I{$row}");
                $sheet->mergeCells("J{$row}:K{$row}");
                $sheet->mergeCells("L{$row}:N{$row}");
            }
        }

        if (count($trainings) === 0) {
            $this->writeString($sheet, "B{$baseRow}", '');
            $this->writeString($sheet, "G{$baseRow}", '');
            $this->writeString($sheet, "J{$baseRow}", '');
            $this->writeString($sheet, "L{$baseRow}", '');
        }

        foreach ($trainings as $offset => $training) {
            $row = $baseRow + $offset;
            $this->writeString($sheet, "B{$row}", $training['curso']);
            $this->writeString($sheet, "G{$row}", $training['institucion']);
            $this->writeString($sheet, "J{$row}", $this->formatInputDate($training['fecha']));
            $this->writeString($sheet, "L{$row}", (string) $training['horas']);
            $sheet->getStyle("B{$row}:N{$row}")->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_CENTER)
                ->setVertical(Alignment::VERTICAL_CENTER)
                ->setWrapText(true);
        }
    }

    private function fillFumaluExperienceRows(Worksheet $sheet, array $experiences): void
    {
        $baseRow = $this->markerRow($sheet, 'SMD_experiencia_fecha_desde');
        $extraRows = max(0, count($experiences) - 2);
        if ($extraRows > 0) {
            $sheet->insertNewRowBefore($baseRow + 2, $extraRows);
            for ($offset = 2; $offset < 2 + $extraRows; $offset++) {
                $row = $baseRow + $offset;
                $this->cloneFumaluRowStyle($sheet, $baseRow, $row);
                $sheet->mergeCells("D{$row}:G{$row}");
                $sheet->mergeCells("H{$row}:I{$row}");
                $sheet->mergeCells("K{$row}:N{$row}");
            }
        }

        if (count($experiences) === 0) {
            $this->writeString($sheet, "B{$baseRow}", '');
            $this->writeString($sheet, "C{$baseRow}", '');
            $this->writeString($sheet, "D{$baseRow}", '');
            $this->writeString($sheet, "H{$baseRow}", '');
            $this->writeString($sheet, "J{$baseRow}", '');
            $this->writeString($sheet, "K{$baseRow}", '');
        }

        foreach ($experiences as $offset => $experience) {
            $row = $baseRow + $offset;
            $this->writeString($sheet, "B{$row}", $this->formatInputDate($experience['fecha_desde']));
            $this->writeString($sheet, "C{$row}", $this->formatInputDate($experience['fecha_hasta']));
            $this->writeString($sheet, "D{$row}", $experience['empresa']);
            $this->writeString($sheet, "H{$row}", $experience['ciudad']);
            $this->writeString($sheet, "J{$row}", $experience['telefono']);
            $this->writeString($sheet, "K{$row}", $experience['funcion']);
        }
    }

    private function sheetContainingMarker(Spreadsheet $spreadsheet, string $marker): Worksheet
    {
        foreach ($spreadsheet->getAllSheets() as $sheet) {
            foreach ($sheet->getCoordinates(false) as $coordinate) {
                $value = $sheet->getCell($coordinate)->getValue();
                if (is_string($value) && str_contains($value, $marker)) {
                    return $sheet;
                }
            }
        }

        throw new RuntimeException("No se encontró el marcador {$marker} en ninguna hoja del C02.");
    }

    private function cloneFumaluRowStyle(Worksheet $sheet, int $sourceRow, int $targetRow): void
    {
        foreach (range('B', 'N') as $column) {
            $sheet->duplicateStyle($sheet->getStyle("{$column}{$sourceRow}"), "{$column}{$targetRow}");
        }
        $sheet->getRowDimension($targetRow)->setRowHeight($sheet->getRowDimension($sourceRow)->getRowHeight());
    }

    private function fillApplicationRows(Worksheet $sheet, array $applications): void
    {
        $baseRow = $this->markerRow($sheet, 'SMD_perfil_profesional');
        $extraRows = max(0, count($applications) - 1);
        if ($extraRows > 0) {
            $sheet->insertNewRowBefore($baseRow + 1, $extraRows);
            for ($offset = 1; $offset <= $extraRows; $offset++) {
                $row = $baseRow + $offset;
                $this->cloneRowStyle($sheet, $baseRow, $row);
                $sheet->mergeCells("A{$row}:B{$row}");
                $sheet->mergeCells("C{$row}:H{$row}");
            }
        }

        foreach ($applications as $offset => $application) {
            $row = $baseRow + $offset;
            $this->writeString($sheet, "A{$row}", $application['perfil']);
            $this->writeString($sheet, "C{$row}", $application['esquema']);
            for ($unit = 1; $unit <= 5; $unit++) {
                $this->writeString($sheet, chr(72 + $unit).$row, in_array($unit, $application['unidades'], true) ? 'X' : '');
            }
            $sheet->getStyle("A{$row}:M{$row}")->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_CENTER)
                ->setVertical(Alignment::VERTICAL_CENTER)
                ->setWrapText(true);
        }
    }

    private function fillEducationRows(Worksheet $sheet, array $educations): void
    {
        $secondaryRow = $this->markerRow($sheet, 'SMD_educacion_institucion');
        $rowByLevel = [
            'lectoescritura' => $secondaryRow - 2,
            'primaria' => $secondaryRow - 1,
            'secundaria' => $secondaryRow,
            'artesano' => $secondaryRow + 1,
            'tercer_nivel' => $secondaryRow + 2,
            'cuarto_nivel' => $secondaryRow + 3,
        ];

        foreach ($rowByLevel as $level => $row) {
            $education = $educations[$level] ?? [];
            $selected = (bool) ($education['seleccionado'] ?? false);
            $this->writeString($sheet, "B{$row}", $selected ? ($education['institucion'] ?? '') : '');
            $this->writeString($sheet, "H{$row}", $selected ? ($education['pais'] ?? '') : '');
            $this->writeString($sheet, "I{$row}", $selected ? ($education['ciudad'] ?? '') : '');
            $this->writeString($sheet, "J{$row}", $selected ? ($education['titulo'] ?? '') : '');

            $sheet->getStyle("B{$row}:M{$row}")->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_CENTER)
                ->setVertical(Alignment::VERTICAL_CENTER)
                ->setWrapText(true);
        }
    }

    private function fillTrainingRows(Worksheet $sheet, array $trainings): void
    {
        $baseRow = $this->markerRow($sheet, 'SMD_capacitacion_institucion');
        $capacity = 3;
        $extraRows = max(0, count($trainings) - $capacity);
        if ($extraRows > 0) {
            $sheet->insertNewRowBefore($baseRow + $capacity, $extraRows);
            for ($offset = $capacity; $offset < $capacity + $extraRows; $offset++) {
                $row = $baseRow + $offset;
                $this->cloneRowStyle($sheet, $baseRow, $row);
                $sheet->mergeCells("A{$row}:E{$row}");
                $sheet->mergeCells("F{$row}:H{$row}");
                $sheet->mergeCells("I{$row}:J{$row}");
                $sheet->mergeCells("K{$row}:M{$row}");
            }
        }

        foreach ($trainings as $offset => $training) {
            $row = $baseRow + $offset;
            $this->writeString($sheet, "A{$row}", $training['curso']);
            $this->writeString($sheet, "F{$row}", $training['institucion']);
            $this->writeString($sheet, "I{$row}", $this->formatInputDate($training['fecha']));
            $this->writeString($sheet, "K{$row}", (string) $training['horas']);

            $sheet->getStyle("A{$row}:M{$row}")->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_CENTER)
                ->setVertical(Alignment::VERTICAL_CENTER)
                ->setWrapText(true);
        }
    }

    private function fillExperienceRows(Worksheet $sheet, array $experiences): void
    {
        $baseRow = $this->markerRow($sheet, 'SMD_experiencia_fecha_desde');
        $capacity = 2;
        $extraRows = max(0, count($experiences) - $capacity);
        if ($extraRows > 0) {
            $sheet->insertNewRowBefore($baseRow + $capacity, $extraRows);
            for ($offset = $capacity; $offset < $capacity + $extraRows; $offset++) {
                $row = $baseRow + $offset;
                $this->cloneRowStyle($sheet, $baseRow, $row);
                $sheet->mergeCells("C{$row}:F{$row}");
                $sheet->mergeCells("G{$row}:H{$row}");
                $sheet->mergeCells("J{$row}:M{$row}");
            }
        }

        foreach ($experiences as $offset => $experience) {
            $row = $baseRow + $offset;
            $this->writeString($sheet, "A{$row}", $this->formatInputDate($experience['fecha_desde']));
            $this->writeString($sheet, "B{$row}", $this->formatInputDate($experience['fecha_hasta']));
            $this->writeString($sheet, "C{$row}", $experience['empresa']);
            $this->writeString($sheet, "G{$row}", $experience['ciudad']);
            $this->writeString($sheet, "I{$row}", $experience['telefono']);
            $this->writeString($sheet, "J{$row}", $experience['funcion']);
        }
    }

    private function markerRow(Worksheet $sheet, string $marker): int
    {
        foreach ($sheet->getCoordinates(false) as $coordinate) {
            $value = $sheet->getCell($coordinate)->getValue();
            if (is_string($value) && str_contains($value, $marker)) {
                return $sheet->getCell($coordinate)->getRow();
            }
        }

        throw new RuntimeException("No se encontró el marcador {$marker} en C02.");
    }

    private function cloneRowStyle(Worksheet $sheet, int $sourceRow, int $targetRow): void
    {
        foreach (range('A', 'M') as $column) {
            $sheet->duplicateStyle($sheet->getStyle("{$column}{$sourceRow}"), "{$column}{$targetRow}");
        }
        $sheet->getRowDimension($targetRow)->setRowHeight($sheet->getRowDimension($sourceRow)->getRowHeight());
    }

    private function writeString(Worksheet $sheet, string $coordinate, string $value): void
    {
        $sheet->setCellValueExplicit($coordinate, $this->documentValue($value), DataType::TYPE_STRING);
    }

    private function documentValue(mixed $value): string
    {
        $value = (string) $value;

        return trim($value) === '000' ? '-' : $value;
    }

    private function formatInputDate(string $date): string
    {
        return Carbon::createFromFormat('Y-m-d', $date)->format('d/m/Y');
    }

    private function zip(array $files, string $output): void
    {
        $zip = new ZipArchive;
        throw_unless($zip->open($output, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true,
            RuntimeException::class, 'No se pudo crear el archivo ZIP.');
        foreach ($files as $file) {
            $zip->addFile($file, basename($file));
        }
        $zip->close();
    }

    private function normalize(array $input): array
    {
        $date = Carbon::createFromFormat('Y-m-d', $input['fecha']);
        $c02Date = isset($input['fecha_c02'])
            ? Carbon::createFromFormat('Y-m-d', $input['fecha_c02'])
            : $date;
        $months = [1 => 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

        $applications = collect($input['aplicaciones'] ?? [])->map(fn (array $application): array => [
            'perfil' => mb_strtoupper($application['perfil']),
            'esquema' => mb_strtoupper($application['esquema']),
            'unidades' => array_map('intval', $application['unidades'] ?? []),
        ])->values()->all();
        $firstApplication = $applications[0] ?? ['perfil' => '', 'esquema' => '', 'unidades' => []];
        $educations = $input['educaciones'] ?? [];
        $firstEducation = collect($educations)->first(fn (array $education): bool => (bool) ($education['seleccionado'] ?? false), []);
        $trainings = array_values($input['capacitaciones'] ?? []);
        $firstTraining = $trainings[0] ?? [];
        $experiences = array_values($input['experiencias'] ?? []);
        $firstExperience = $experiences[0] ?? [];
        $company = $input['empresa'] ?? 'SAPPER';
        $examiner = $this->catalogFor($company)->examiner($input['examinador_id'] ?? null) ?? [];

        return [
            'EMPRESA' => $company,
            'SECUENCIA_CODIGO' => $input['secuencia_codigo'] ?? '',
            'NOMBRE' => mb_strtoupper($input['nombre']),
            'CEDULA' => $input['cedula'],
            'TELEFONO' => $input['telefono'] ?? '',
            'CELULAR' => $input['celular'] ?? '',
            'CORREO' => $input['correo'] ?? '',
            'EDAD' => $input['edad'] ?? '',
            'DIRECCION' => $input['direccion'] ?? '',
            'FECHA' => $date->day.' de '.$months[$date->month].' de '.$date->year,
            'FECHA_C02' => $c02Date->day.' de '.$months[$c02Date->month].' de '.$c02Date->year,
            'FECHA_RAW' => $input['fecha'],
            'PROVINCIA' => $input['provincia'] ?? '',
            'CIUDAD' => $input['ciudad'] ?? '',
            'LUGAR' => mb_strtoupper($input['lugar']),
            'PERFIL_PROFESIONAL' => $firstApplication['perfil'],
            'ESQUEMA' => $firstApplication['esquema'],
            'UNIDAD_COMPETENCIA_1' => in_array(1, $firstApplication['unidades'], true) ? 'X' : '',
            'UNIDAD_COMPETENCIA_2' => in_array(2, $firstApplication['unidades'], true) ? 'X' : '',
            'UNIDAD_COMPETENCIA_3' => in_array(3, $firstApplication['unidades'], true) ? 'X' : '',
            'UNIDAD_COMPETENCIA_4' => in_array(4, $firstApplication['unidades'], true) ? 'X' : '',
            'UNIDAD_COMPETENCIA_5' => in_array(5, $firstApplication['unidades'], true) ? 'X' : '',
            'INSTALACIONES' => $input['instalaciones'] ?? '',
            'DIRECCION_INSTALACION' => $input['direccion_instalacion'] ?? '',
            'SECTOR_INSTALACION' => $input['sector_instalacion'] ?? '',
            'TELEFONO_INSTALACION' => $input['telefono_instalacion'] ?? '',
            'EDUCACION_INSTITUCION' => $firstEducation['institucion'] ?? '',
            'EDUCACION_PAIS' => $firstEducation['pais'] ?? '',
            'EDUCACION_CIUDAD' => $firstEducation['ciudad'] ?? '',
            'EDUCACION_TITULO' => $firstEducation['titulo'] ?? '',
            'CAPACITACION_CURSO' => $firstTraining['curso'] ?? '',
            'CAPACITACION_INSTITUCION' => $firstTraining['institucion'] ?? '',
            'CAPACITACION_FECHA' => isset($firstTraining['fecha']) ? $this->formatInputDate($firstTraining['fecha']) : '',
            'CAPACITACION_HORAS' => $firstTraining['horas'] ?? '',
            'EXPERIENCIA_FECHA_DESDE' => isset($firstExperience['fecha_desde']) ? $this->formatInputDate($firstExperience['fecha_desde']) : '',
            'EXPERIENCIA_FECHA_HASTA' => isset($firstExperience['fecha_hasta']) ? $this->formatInputDate($firstExperience['fecha_hasta']) : '',
            'EXPERIENCIA_EMPRESA' => $firstExperience['empresa'] ?? '',
            'EXPERIENCIA_CIUDAD' => $firstExperience['ciudad'] ?? '',
            'EXPERIENCIA_TELEFONO' => $firstExperience['telefono'] ?? '',
            'EXPERIENCIA_FUNCION' => $firstExperience['funcion'] ?? '',
            'EXAMINADOR_NOMBRE' => isset($examiner['name']) ? mb_strtoupper($examiner['name']) : '',
            'EXAMINADOR_CEDULA' => $examiner['cedula'] ?? '',
            'EXAMINADOR_TELEFONO' => $examiner['phone'] ?? '',
            'APLICACIONES' => $applications,
            'EDUCACIONES' => $educations,
            'CAPACITACIONES' => $trainings,
            'EXPERIENCIAS' => $experiences,
            'TIPO_EXAMEN' => $input['tipo_examen'],
            'PUNTAJE_TEORICO' => $input['puntaje_teorico'] ?? '',
            'PUNTAJE_PRACTICO' => $input['puntaje_practico'] ?? '',
        ];
    }

    private function markers(array $data): array
    {
        $values = $data + [
            'TELEFONO_CANDIDATO' => $data['TELEFONO'] ?? '',
            'LUGAR_EXAMEN' => $data['DIRECCION_INSTALACION'],
            'DIRECCION_EXAMEN' => $data['DIRECCION_INSTALACION'],
            'CIUDAD_FECHA' => trim($data['CIUDAD'].' '.$data['FECHA']),
        ];

        $markers = [];
        $definitions = config('document_markers');
        foreach ($definitions as $canonical => $definition) {
            $value = $this->documentValue($values[$canonical] ?? '');
            foreach ($definition['markers'] as $marker) {
                $markers[trim($marker)] = $value;
            }
        }

        return $markers;
    }
}
