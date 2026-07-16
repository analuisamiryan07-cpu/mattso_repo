<?php

namespace Tests\Unit;

use App\Models\User;
use PHPUnit\Framework\TestCase;

class UserCompatibilityTest extends TestCase
{
    public function test_user_maps_to_the_authentication_contract(): void
    {
        $user = new User([
            'usuario' => 'admin',
            'password_hash' => 'hash',
            'rol' => User::ROLE_ADMIN,
            'activo' => true,
        ]);

        $this->assertSame('usuarios_admin', $user->getTable());
        $this->assertSame('password_hash', $user->getAuthPasswordName());
        $this->assertSame('hash', $user->getAuthPassword());
        $this->assertTrue($user->isAdministrator());
        $this->assertFalse($user->isSecretary());
    }
}
