<?php

namespace Tests\Unit;

use App\Support\CertificationCatalog;
use Tests\TestCase;

class CompanyCatalogTest extends TestCase
{
    public function test_matsso_catalog_is_loaded_from_its_company_file(): void
    {
        $catalog = new CertificationCatalog('MATSSO');

        $this->assertCount(19, $catalog->schemes());
        $this->assertCount(19, $catalog->examiners());
        $this->assertContains('GESTIÓN AMBIENTAL', $catalog->schemeNames());
    }
}