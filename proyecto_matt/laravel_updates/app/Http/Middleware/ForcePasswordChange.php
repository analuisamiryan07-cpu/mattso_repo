<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class ForcePasswordChange
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check() && Auth::user()->must_change_password) {
            // Prevenir loops infinitos: si ya esta en las rutas de cambio de clave o logout, dejar pasar
            $excludedRoutes = ['password.change', 'password.update', 'logout'];
            
            if (!$request->routeIs($excludedRoutes)) {
                return redirect()->route('password.change');
            }
        }

        return $next($request);
    }
}
