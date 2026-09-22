<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

final class EcuadorIdentification implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || preg_match('/^\d{10}(?:001)?$/D', $value) !== 1) {
            $fail('La cédula debe tener 10 dígitos o el RUC 13 dígitos y terminar en 001.');
        }
    }
}
