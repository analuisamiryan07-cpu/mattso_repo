<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\View\View;

class UserController extends Controller
{
    public function index(): View
    {
        return view('users.index', ['users' => User::query()->latest('created_at')->get()]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $data = $request->validated();

        try {
            User::query()->create([
                'usuario'        => $data['usuario'],
                'nombre_completo' => $data['nombre'],
                'rol'            => $data['rol'],
                'password_hash'  => Hash::make($data['contrasena']),
                'activo'         => true,
            ]);
        } catch (QueryException $e) {
            Log::error('Error al crear usuario: '.$e->getMessage());

            $msg = str_contains($e->getMessage(), 'unique') || str_contains($e->getMessage(), 'duplicate')
                ? 'El nombre de usuario "'.$data['usuario'].'" ya está en uso. Elige otro.'
                : 'Error al guardar en la base de datos. Revisa los logs del servidor.';

            return back()->withInput()->withErrors(['usuario' => $msg]);
        }

        return back()->with('status', 'Usuario creado correctamente.');
    }

    public function toggle(Request $request, User $user): RedirectResponse
    {
        abort_if($request->user()->is($user), 422, 'No puedes desactivar tu propia cuenta.');
        $user->forceFill(['activo' => ! $user->activo])->save();

        return back()->with('status', 'Estado del usuario actualizado.');
    }

    public function changeRole(Request $request, User $user): RedirectResponse
    {
        abort_if($request->user()->is($user), 422, 'No puedes cambiar tu propio rol.');
        $request->validate(['rol' => 'required|in:ADMINISTRADOR,SECRETARIA']);
        $user->forceFill(['rol' => $request->rol])->save();

        return back()->with('status', 'Rol de ' . $user->nombre_completo . ' actualizado.');
    }

    public function changePassword(Request $request, User $user): RedirectResponse
    {
        $request->validate([
            'password'              => 'required|string|min:6|confirmed',
            'password_confirmation' => 'required',
        ]);
        $user->forceFill(['password_hash' => Hash::make($request->password)])->save();

        return back()->with('status', 'Contraseña de ' . $user->nombre_completo . ' actualizada.');
    }
}
