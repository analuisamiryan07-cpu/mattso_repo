<?php

namespace Tests\Unit;

use App\Http\Middleware\EnsureRole;
use App\Models\User;
use Illuminate\Http\Request;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;

class EnsureRoleTest extends TestCase
{
    public function test_active_user_with_expected_role_can_continue(): void
    {
        $request = Request::create('/admin');
        $request->setUserResolver(fn () => new User(['rol' => User::ROLE_ADMIN, 'activo' => true]));

        $response = (new EnsureRole)->handle($request, fn () => new Response('ok'), User::ROLE_ADMIN);

        $this->assertSame(200, $response->getStatusCode());
    }

    public function test_user_with_wrong_role_is_rejected(): void
    {
        $request = Request::create('/admin');
        $request->setUserResolver(fn () => new User(['rol' => User::ROLE_SECRETARY, 'activo' => true]));
        $this->expectException(HttpException::class);

        (new EnsureRole)->handle($request, fn () => new Response('ok'), User::ROLE_ADMIN);
    }
}
