<?php

namespace Tests\Unit;

use Tests\TestCase;

class MobileTokenEncryptionMigrationSafetyTest extends TestCase
{
    public function test_migration_preserves_raw_token_value_and_validates_its_hash(): void
    {
        $source = file_get_contents(database_path(
            'migrations/2026_09_01_030000_encrypt_legacy_mobile_tokens.php'
        ));

        $this->assertIsString($source);
        $this->assertStringContainsString('$tokens->reveal($stored)', $source);
        $this->assertStringContainsString('$tokens->hash($raw)', $source);
        $this->assertStringContainsString('$tokens->protect($raw)', $source);
        $this->assertStringNotContainsString("update(['token' => null", strtolower($source));
        $this->assertStringContainsString('No se restaura texto legible automáticamente', $source);
    }
}
