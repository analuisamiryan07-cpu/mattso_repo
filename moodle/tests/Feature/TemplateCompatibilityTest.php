<?php

namespace Tests\Feature;

use App\Services\DocumentGenerationService;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpWord\TemplateProcessor;
use Tests\TestCase;

class TemplateCompatibilityTest extends TestCase
{
    public function test_every_document_template_can_be_opened(): void
    {
        foreach (DocumentGenerationService::templates() as $template) {
            $path = resource_path('document-templates/'.$template['file']);
            $this->assertFileExists($path);

            if ($template['type'] === 'docx') {
                $processor = new TemplateProcessor($path);
                $this->assertIsArray($processor->getVariables());
            } else {
                $spreadsheet = IOFactory::load($path);
                $this->assertGreaterThan(0, $spreadsheet->getSheetCount());
                $spreadsheet->disconnectWorksheets();
            }
        }
    }
}
