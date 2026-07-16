<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class AccessTest extends TestCase
{
    public function test_root_redirects_to_login(): void
    {
        $this->get('/')->assertRedirect('/login');
    }

    public function test_login_form_is_available(): void
    {
        $this->get('/login')->assertOk()->assertSee('Iniciar sesión');
    }

    public function test_authenticated_admin_is_sent_to_the_admin_dashboard(): void
    {
        $user = new User([
            'usuario' => 'admin',
            'rol' => User::ROLE_ADMIN,
            'activo' => true,
        ]);
        $user->id = 1;

        $this->actingAs($user);

        $this->get('/login')->assertRedirect('/');
        $this->get('/')->assertRedirect('/admin');
    }

    public function test_authenticated_secretary_is_sent_to_the_secretary_dashboard(): void
    {
        $user = new User([
            'usuario' => 'secretaria',
            'rol' => User::ROLE_SECRETARY,
            'activo' => true,
        ]);
        $user->id = 2;

        $this->actingAs($user)
            ->get('/')
            ->assertRedirect('/secretaria');
    }

    public function test_protected_pages_redirect_guests(): void
    {
        $this->get('/clientes')->assertRedirect('/login');
        $this->get('/admin')->assertRedirect('/login');
    }

    public function test_public_registration_does_not_exist(): void
    {
        $this->get('/register')->assertNotFound();
        $this->post('/register')->assertNotFound();
    }
}
