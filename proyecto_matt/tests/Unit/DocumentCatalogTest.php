<?php

namespace Tests\Unit;

use App\Services\DocumentGenerationService;
use PHPUnit\Framework\TestCase;

class DocumentCatalogTest extends TestCase
{
    public function test_all_document_templates_are_registered(): void
    {
        $this->assertSame(
            ['c02', 'c05', 'c08', 'c09', 'c10', 'c12'],
            array_keys(DocumentGenerationService::templates()),
        );
    }
}
