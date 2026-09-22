<?php

namespace Tests\Unit;

use App\Services\MobileTokenService;
use Tests\TestCase;

class MobileTokenServiceTest extends TestCase
{
    public function test_hash_is_deterministic_without_exposing_the_token(): void
    {
        $service = app(MobileTokenService::class);
        $raw = str_repeat('a', 64);
        $hash = $service->hash($raw);

        $this->assertSame(64, strlen($hash));
        $this->assertSame(hash('sha256', $raw), $hash);
        $this->assertNotSame($raw, $hash);
    }

    public function test_protected_token_can_be_returned_without_changing_api_contract(): void
    {
        $service = app(MobileTokenService::class);
        $raw = str_repeat('b', 64);
        $protected = $service->protect($raw);

        $this->assertNotSame($raw, $protected);
        $this->assertSame($raw, $service->reveal($protected));
    }

    public function test_legacy_plain_token_remains_compatible(): void
    {
        $service = app(MobileTokenService::class);
        $legacy = str_repeat('c', 64);

        $this->assertSame($legacy, $service->reveal($legacy));
    }
}
