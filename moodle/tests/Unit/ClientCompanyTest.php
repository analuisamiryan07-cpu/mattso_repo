<?php

namespace Tests\Unit;

use App\Models\Client;
use PHPUnit\Framework\TestCase;

class ClientCompanyTest extends TestCase
{
    public function test_the_local_company_catalog_is_explicit_and_stable(): void
    {
        $this->assertSame(
            ['SAPPER', 'MATSSO', 'FUMALU'],
            array_keys(Client::companies()),
        );
    }
}