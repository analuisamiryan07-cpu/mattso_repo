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
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpWord\TemplateProcessor;
use RuntimeException;
use Throwable;
use ZipArchive;

class DocumentGenerationService
{
    private const TEMPLATES = [
        'c02' => ['name' => 'C02 Solicitud', 'file' => 'c02_solicitud.xlsx', 'type' => 'xlsx'],
        'c05' => ['name' => 'C05 Ética', 'file' => 'c05_etica.docx', 'type' => 'docx'],
        'c08' => ['name' => 'C08 Asistencia', 'file' => 'c08_asistencia.docx', 'type' => 'docx'],
        'c09' => ['name' => 'C09 Acuerdo', 'file' => 'c09_acuerdo.docx', 'type' => 'docx'],
        'c10' => ['name' => 'C10 Notificación', 'file' => 'c10_notificacion.docx', 'type' => 'docx'],
        'c12' => ['name' => 'C12 Encuesta', 'file' => 'c12_encuesta.xlsx', 'type' => 'xlsx'],
    ];

    public function __construct(private readonly CertificationCatalog $catalog)
    {
    }

    public static function templates(): array
    {
        return self::TEMPLATES;
    }

    public function generate(array $input, User $user): array
    {
        $data = $this->normalize($input);
        $slug = Str::limit(Str::slug($data['NOMBRE'], '_'), 30, '').'_'.now()->format('Ymd_His_u');
        $directory = storage_path("app/private/generated/{$slug}");
        File::ensureDirectoryExists($directory, 0750);

        try {
            $files = $this->generateSelectedFiles($input['docs'], $data, $directory);
            throw_if($files === [], RuntimeException::class, 'No se generó ningún documento.');

            $zipName = "certificacion_{$slug}.zip";
            $zipPath = $directory.DIRECTORY_SEPARATOR.$zipName;
            $this->zip($files, $zipPath);

            DB::transaction(function () use ($input, $user, $slug, $zipName, $files): void {
                $client = Client::query()->updateOrCreate(
                    ['cedula' => $input['cedula']],
                    collect($input)->only([
                        'nombre', 'telefono', 'correo', 'direccion', 'fecha', 'ciudad',
                        'lugar', 'esquema', 'tipo_examen', 'puntaje_teorico', 'puntaje_practico',
                    ])->merge([
                        'nombre' => mb_strtoupper($input['nombre']),
                        'datos_c02' => collect($input)->only([
                            'secuencia_codigo', 'fecha_c02', 'edad', 'provincia', 'celular', 'aplicaciones',
                            'instalaciones', 'direccion_instalacion', 'sector_instalacion',
                            'telefono_instalacion', 'educaciones', 'capacitaciones', 'experiencias',
                            'examinador_id',
                        ])->all(),
                    ])->all(),
                );

                GeneratedDocument::query()->create([
                    'cliente_id' => $client->getKey(),
                    'carpeta' => $slug,
                    'zip_ruta' => $zipName,
                    'n_archivos' => count($files),
                    'nombres_archivos' => array_map('basename', $files),
                    'generado_por' => $user->usuario,
                ]);
            });

            return [
                'path' => $zipPath,
                'download_name' => 'Certificacion_'.Str::slug($data['NOMBRE'], '_').'.zip',
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
            $template = self::TEMPLATES[$code] ?? null;
            if (! $template) {
                continue;
            }

            $source = rtrim(config('matsso.template_path'), DIRECTORY_SEPARATOR)
                .DIRECTORY_SEPARATOR.$template['file'];
            throw_unless(is_file($source), RuntimeException::class, "Plantilla no encontrada: {$template['file']}");

            $extension = $template['type'];
            $filename = mb_strtoupper($code).'_'.Str::slug($data['NOMBRE'], '_').'_'.$data['FECHA_RAW'].'.'.$extension;
            $output = $directory.DIRECTORY_SEPARATOR.$filename;

            if ($code === 'c02') {
                $this->generateC02($source, $output, $data);
            } elseif ($extension === 'docx') {
                $this->generateDocx($source, $output, $data);
            } else {
                $this->generateXlsx($source, $output, $data);
            }
            $files[] = $output;
        }

        return $files;
    }

    private function generateDocx(string $source, string $output, array $data): void
    {
        $processor = new TemplateProcessor($source);
        $markers = $this->markers($data);
        $unknown = array_values(array_diff($processor->getVariables(), array_keys($markers)));
        throw_if($unknown !== [], RuntimeException::class, 'Marcadores DOCX sin mapear: '.implode(', ', $unknown));

        foreach ($markers as $marker => $value) {
            $processor->setValue($marker, (string) $value);
        }
        $processor->saveAs($output);
    }

    private function generateXlsx(string $source, string $output, array $data): void
    {
        $spreadsheet = IOFactory::load($source);
        $this->replaceSpreadsheetMarkers($spreadsheet, $this->markers($data));

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

        $this->fillApplicationRows($sheet, $data['APLICACIONES']);
        $this->fillEducationRows($sheet, $data['EDUCACIONES']);
        $this->fillTrainingRows($sheet, $data['CAPACITACIONES']);
        $this->fillExperienceRows($sheet, $data['EXPERIENCIAS']);
        $this->replaceSpreadsheetMarkers($spreadsheet, $this->markers($data));

        IOFactory::createWriter($spreadsheet, 'Xlsx')->save($output);
        $spreadsheet->disconnectWorksheets();
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
        $sheet->setCellValueExplicit($coordinate, $value, DataType::TYPE_STRING);
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
        $examiner = $this->catalog->examiner($input['examinador_id'] ?? null) ?? [];

        return [
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
            'TELEFONO_CANDIDATO' => $data['CELULAR'] ?: $data['TELEFONO'],
            'LUGAR_EXAMEN' => $data['DIRECCION_INSTALACION'],
            'DIRECCION_EXAMEN' => $data['DIRECCION_INSTALACION'],
            'CIUDAD_FECHA' => trim($data['CIUDAD'].' '.$data['FECHA']),
        ];

        $markers = [];
        $definitions = config('document_markers');
        foreach ($definitions as $canonical => $definition) {
            $value = $values[$canonical] ?? '';
            foreach ($definition['markers'] as $marker) {
                $markers[trim($marker)] = $value;
            }
        }

        return $markers;
    }
}
