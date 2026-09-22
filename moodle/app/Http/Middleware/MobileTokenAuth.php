<?php

namespace App\Http\Middleware;

use App\Models\TokenMovil;
use App\Services\MobileTokenService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class MobileTokenAuth
{
    public function __construct(private readonly MobileTokenService $tokens) {}

    public function handle(Request $request, Closure $next): Response
    {
        $raw = $request->bearerToken() ?? $request->input('token');

        if (!$raw) {
            return response()->json(['error' => 'Debes iniciar sesión de nuevo.'], 401);
        }

        $tokenHash = $this->tokens->hash($raw);
        $tokenRecord = TokenMovil::with('empleado.usuario')
            ->where(function ($query) use ($raw, $tokenHash): void {
                $query->where('token_hash', $tokenHash)
                    ->orWhere(function ($legacy) use ($raw): void {
                        $legacy->whereNull('token_hash')->where('token', $raw);
                    });
            })
            ->first();

        $empleado = $tokenRecord?->empleado;
        // Un empleado está activo solo si lo están AMBOS: su registro de
        // asistencia (estado) y su cuenta de usuario principal (activo). Si
        // se desactiva la cuenta desde el sistema general, esto corta el
        // acceso aquí también — antes solo se revisaba "estado" y alguien
        // desactivado seguía pudiendo marcar con la sesión ya guardada.
        $activo = $empleado
            && $empleado->estado === 'activo'
            && (bool) $empleado->usuario?->activo;

        $revocado = $tokenRecord?->revocado_en !== null;
        $expirado = $tokenRecord?->expira_en?->isPast() ?? false;

        if (!$tokenRecord || !$activo || $revocado || $expirado) {
            return response()->json(['error' => 'Tu sesión ya no es válida o tu cuenta está inactiva. Contacta al administrador.'], 401);
        }

        // Actualiza último uso sin lanzar eventos
        $tokenRecord->updateQuietly(['ultimo_uso' => now()]);

        // Adjunta el empleado a la request para que los controladores lo usen
        $request->attributes->set('empleado', $tokenRecord->empleado);

        return $next($request);
    }
}
