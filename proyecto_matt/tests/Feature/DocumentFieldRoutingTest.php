<?php

namespace Tests\Feature;

use App\Services\DocumentGenerationService;
use Illuminate\Support\Facades\File;
use PhpOffice\PhpSpreadsheet\IOFactory;
use ReflectionClass;
use Tests\TestCase;
use ZipArchive;

class DocumentFieldRoutingTest extends TestCase
{
    public function test_dates_addresses_and_examiner_are_routed_to_the_correct_documents(): void
    {
        $directory = storage_path('framework/testing/document-field-routing');
        File::deleteDirectory($directory);
        File::ensureDirectoryExists($directory);

        try {
            $service = app(DocumentGenerationService::class);
            $reflection = new ReflectionClass($service);
            $data = $reflection->getMethod('normalize')->invoke($service, $this->input());
            $files = $reflection->getMethod('generateSelectedFiles')->invoke($service, ['c02', 'c08', 'c09', 'c10', 'c12'], $data, $directory);

            $c02 = IOFactory::load($files[0]);
            $this->assertSame('12 de abril de 2026', $c02->getSheet(0)->getCell('I8')->getValue());
            $this->assertSame('DOMICILIO PRIVADO DEL CANDIDATO', $c02->getSheet(0)->getCell('E26')->getValue());
            $c02->disconnectWorksheets();

            $c08Text = $this->documentText($files[1]);
            $installationAddress = 'DIRECCIÓN DE LAS INSTALACIONES';
            $this->assertStringContainsString($installationAddress, $c08Text);
            $this->assertStringNotContainsString('CENTRO DE EXAMINACIÓN PRINCIPAL, Guayas', $c08Text);
            $this->assertStringContainsString('10 de marzo de 2026', $c08Text);
            $this->assertStringContainsString('1712345678', $c08Text);
            $this->assertStringContainsString('0999999999', $c08Text);
            $this->assertStringNotContainsString('0987654321', $c08Text);
            $this->assertStringContainsString('ALAVA MACIAS FATIMA ESPERANZA', $c08Text);
            $this->assertStringContainsString('1308176336', $c08Text);
            $this->assertStringContainsString('0980067174', $c08Text);
            $this->assertStringNotContainsString('DOMICILIO PRIVADO DEL CANDIDATO', $c08Text);
            $this->assertStringNotContainsString('ejemplo de como', $c08Text);
            $this->assertSame(['bold' => true, 'size' => '24'], $this->runFormatting($files[1], '1308176336'));
            $this->assertSame(['bold' => true, 'size' => '24'], $this->runFormatting($files[1], '0980067174'));

            $c09Text = $this->documentText($files[2]);
            $this->assertStringContainsString($installationAddress, $c09Text);
            $this->assertStringNotContainsString('DOMICILIO PRIVADO DEL CANDIDATO', $c09Text);

            $c10Text = $this->documentText($files[3]);
            $this->assertStringContainsString('Guayaquil 10 de marzo de 2026', $c10Text);
            $this->assertStringContainsString('CUIDADO DE PERSONAS ADULTAS MAYORES', $c10Text);
            $this->assertStringNotContainsString('12 de abril de 2026', $c10Text);
            $this->assertStringNotContainsString('ejemplo', $c10Text);

            $c12 = IOFactory::load($files[4]);
            $this->assertSame($installationAddress, $c12->getSheet(0)->getCell('G86')->getValue());
            $c12->disconnectWorksheets();
        } finally {
            File::deleteDirectory($directory);
        }
    }

    private function documentText(string $path): string
    {
        $zip = new ZipArchive;
        $zip->open($path);
        $xml = $zip->getFromName('word/document.xml');
        $zip->close();
        $document = new \DOMDocument;
        $document->loadXML($xml);
        $xpath = new \DOMXPath($document);

        return collect(iterator_to_array($xpath->query('//*[local-name()="t"]')))
            ->map(fn (\DOMNode $node): string => $node->textContent)
            ->implode(' ');
    }

    private function runFormatting(string $path, string $text): array
    {
        $zip = new ZipArchive;
        $zip->open($path);
        $xml = $zip->getFromName('word/document.xml');
        $zip->close();
        $document = new \DOMDocument;
        $document->loadXML($xml);
        $xpath = new \DOMXPath($document);

        foreach ($xpath->query('//*[local-name()="t"]') as $node) {
            if ($node->textContent !== $text) {
                continue;
            }
            $run = $node->parentNode;
            $size = $xpath->query('./*[local-name()="rPr"]/*[local-name()="sz"]', $run)->item(0);

            return [
                'bold' => $xpath->query('./*[local-name()="rPr"]/*[local-name()="b"]', $run)->length > 0,
                'size' => $size?->getAttributeNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'val'),
            ];
        }

        return ['bold' => false, 'size' => null];
    }

    private function input(): array
    {
        return [
            'secuencia_codigo' => '002-2026',
            'nombre' => 'Persona de prueba',
            'cedula' => '1712345678',
            'telefono' => '0987654321',
            'celular' => '0999999999',
            'correo' => 'persona@example.test',
            'edad' => 35,
            'direccion' => 'DOMICILIO PRIVADO DEL CANDIDATO',
            'fecha' => '2026-03-10',
            'fecha_c02' => '2026-04-12',
            'provincia' => 'Guayas',
            'ciudad' => 'Guayaquil',
            'lugar' => 'CENTRO DE EXAMINACIÓN PRINCIPAL',
            'tipo_examen' => 'TEÓRICA',
            'puntaje_teorico' => '',
            'puntaje_practico' => '',
            'examinador_id' => '1',
            'aplicaciones' => [[
                'perfil' => 'Cuidado de Personas Adultas Mayores',
                'esquema' => 'Cuidado de Personas Adultas Mayores',
                'unidades' => [1],
            ]],
            'instalaciones' => 'Instalaciones Matsso',
            'direccion_instalacion' => 'DIRECCIÓN DE LAS INSTALACIONES',
            'sector_instalacion' => 'Centro',
            'telefono_instalacion' => '0222222222',
            'educaciones' => [
                'secundaria' => ['seleccionado' => true, 'institucion' => 'Colegio', 'pais' => 'Ecuador', 'ciudad' => 'Guayaquil', 'titulo' => 'Bachiller'],
            ],
            'capacitaciones' => [['curso' => 'Curso', 'institucion' => 'Instituto', 'fecha' => '2026-01-01', 'horas' => 40]],
            'experiencias' => [['fecha_desde' => '2025-01-01', 'fecha_hasta' => '2025-12-31', 'empresa' => 'Empresa', 'ciudad' => 'Guayaquil', 'telefono' => '0999999998', 'funcion' => 'Técnico']],
        ];
    }
}
