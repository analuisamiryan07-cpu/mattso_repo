<?php

namespace Tests\Unit;

use App\Services\DocumentGenerationService;
use Tests\TestCase;

class CompanyTemplatesTest extends TestCase
{
    public function test_matsso_exposes_the_six_document_codes(): void
    {
        $templates = DocumentGenerationService::templates('MATSSO');

        $this->assertSame(['c02', 'c05', 'c08', 'c09', 'c10', 'c12'], array_keys($templates));
        $this->assertSame('C02.Matsso.xlsx', $templates['c02']['file']);
        $this->assertSame('c12_encuesta_de_satisfaccion_para_el_examinado (1).docx', $templates['c12']['file']);
    }
}