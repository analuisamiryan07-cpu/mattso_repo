<?php

namespace App\Services;

use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;

class MobileTokenService
{
    public function hash(string $rawToken): string
    {
        return hash('sha256', $rawToken);
    }

    public function protect(string $rawToken): string
    {
        return Crypt::encryptString($rawToken);
    }

    public function reveal(string $storedToken): string
    {
        try {
            return Crypt::decryptString($storedToken);
        } catch (DecryptException) {
            // Compatibilidad temporal con los 13 tokens productivos existentes.
            return $storedToken;
        }
    }
}
