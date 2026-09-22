<?php

namespace Tests\Unit;

use Tests\TestCase;

class MobileTokenExpansionSafetyTest extends TestCase
{
    public function test_expansion_preserves_plain_tokens_during_compatibility_phase(): void
    {
        $source = file_get_contents(database_path(
            'migrations/2026_09_01_020000_expand_mobile_token_security.php'
        ));
        $ddl = file_get_contents(database_path('sql/02_expand_mobile_token_security.sql'));

        $this->assertIsString($source);
        $this->assertIsString($ddl);
        $this->assertStringContainsString('ADD COLUMN IF NOT EXISTS token_hash', $ddl);
        $this->assertStringContainsString("hash('sha256'", $source);
        $this->assertStringNotContainsString('DROP COLUMN IF EXISTS token,', $source.$ddl);
        $this->assertStringNotContainsString(
            'UPDATE asistencia.tokens_movil SET token = NULL',
            $source.$ddl,
        );
        $this->assertStringNotContainsString("'expira_en' =>", $source);
        $this->assertStringNotContainsString("'revocado_en' =>", $source);
    }
}
