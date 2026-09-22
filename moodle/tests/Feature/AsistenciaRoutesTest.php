<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class AsistenciaRoutesTest extends TestCase
{
    public function test_admin_hours_routes_are_registered_and_protected(): void
    {
        $route = Route::getRoutes()->getByName('horas.index');

        $this->assertNotNull($route);
        $this->assertSame('admin/horas', $route->uri());
        $this->assertContains('auth', $route->gatherMiddleware());
        $this->assertContains('role:ADMINISTRADOR', $route->gatherMiddleware());
    }

    public function test_mobile_marking_route_uses_token_middleware(): void
    {
        $route = Route::getRoutes()->match(
            \Illuminate\Http\Request::create('/api/asistencia/marcar', 'POST')
        );

        $this->assertSame('api/asistencia/marcar', $route->uri());
        $this->assertContains(\App\Http\Middleware\MobileTokenAuth::class, $route->gatherMiddleware());
        $this->assertContains('throttle:60,1', $route->gatherMiddleware());
    }
}
