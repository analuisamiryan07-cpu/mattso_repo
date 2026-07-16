<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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
        User::query()->create([
            'usuario' => $data['usuario'],
            'nombre_completo' => $data['nombre'],
            'rol' => $data['rol'],
            'password_hash' => Hash::make($data['contrasena']),
            'activo' => true,
        ]);

        return back()->with('status', 'Usuario creado correctamente.');
    }

    public function toggle(Request $request, User $user): RedirectResponse
    {
        abort_if($request->user()->is($user), 422, 'No puedes desactivar tu propia cuenta.');
        $user->forceFill(['activo' => ! $user->activo])->save();

        return back()->with('status', 'Estado del usuario actualizado.');
    }
}
