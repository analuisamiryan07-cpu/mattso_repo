<?php

namespace Tests\Feature;

use App\Services\DocumentGenerationService;
use Illuminate\Support\Facades\File;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpWord\TemplateProcessor;
use ReflectionClass;
use Tests\TestCase;

class DocumentMarkerCoverageTest extends TestCase
{
    public function test_every_marker_is_removed_from_a_generated_preview(): void
    {
        $directory = storage_path('framework/testing/document-marker-coverage');
        File::deleteDirectory($directory);
        File::ensureDirectoryExists($directory);

        try {
            $service = app(DocumentGenerationService::class);
            $reflection = new ReflectionClass($service);
            $data = $reflection->getMethod('normalize')->invoke($service, [
                'nombre' => 'Persona de prueba',
                'cedula' => '0000000000',
                'telefono' => '0999999999',
                'correo' => 'prueba@example.test',
                'direccion' => 'Dirección de prueba',
                'fecha' => '2026-07-14',
                'ciudad' => 'Quito',
                'lugar' => 'Instalaciones de prueba',
                'esquema' => 'Esquema de prueba',
                'tipo_examen' => 'TEÓRICA',
                'puntaje_teorico' => '90',
                'puntaje_practico' => '',
            ]);

            $files = $reflection->getMethod('generateSelectedFiles')->invoke(
                $service,
                array_keys(DocumentGenerationService::templates()),
                $data,
                $directory,
            );

            $this->assertCount(6, $files);
            foreach ($files as $file) {
                if (str_ends_with($file, '.docx')) {
                    $this->assertSame([], (new TemplateProcessor($file))->getVariables(), basename($file));

                    continue;
                }

                $spreadsheet = IOFactory::load($file);
                $residuals = [];
                foreach ($spreadsheet->getAllSheets() as $sheet) {
                    foreach ($sheet->getRowIterator() as $row) {
                        $cells = $row->getCellIterator();
                        $cells->setIterateOnlyExistingCells(true);
                        foreach ($cells as $cell) {
                            $value = $cell->getValue();
                            if (is_string($value) && preg_match('/(?:\$\{|\{\{|#\{)SMD_/u', $value) === 1) {
                                $residuals[] = $sheet->getTitle().'!'.$cell->getCoordinate();
                            }
                        }
                    }
                }
                $spreadsheet->disconnectWorksheets();
                $this->assertSame([], $residuals, basename($file));
            }
        } finally {
            File::deleteDirectory($directory);
        }
    }
}
