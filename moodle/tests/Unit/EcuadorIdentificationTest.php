<?php

namespace Tests\Unit;

use App\Rules\EcuadorIdentification;
use Tests\TestCase;

class EcuadorIdentificationTest extends TestCase
{
    public function test_accepts_ten_digit_identity_and_full_ruc_ending_in_001(): void
    {
        $this->assertTrue($this->passes('1712345678'));
        $this->assertTrue($this->passes('1712345678001'));
    }

    public function test_rejects_wrong_lengths_non_digits_and_invalid_ruc_suffix(): void
    {
        $this->assertFalse($this->passes('171234567'));
        $this->assertFalse($this->passes('171234567890'));
        $this->assertFalse($this->passes('1712345678002'));
        $this->assertFalse($this->passes('17123A5678'));
        $this->assertFalse($this->passes('171-234-5678'));
    }

    private function passes(string $value): bool
    {
        $failed = false;

        (new EcuadorIdentification)->validate(
            'cedula',
            $value,
            function () use (&$failed): void {
                $failed = true;
            },
        );

        return ! $failed;
    }
}
