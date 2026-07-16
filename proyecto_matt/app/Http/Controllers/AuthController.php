<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\View\View;

class AuthController extends Controller
{
    public function create(): View
    {
        return view('auth.login');
    }

    public function store(LoginRequest $request): RedirectResponse
    {
        $credentials = $request->validated();
        $user = User::query()
            ->where('usuario', $credentials['usuario'])
            ->where('activo', true)
            ->first();

        if (! $user || ! Hash::check($credentials['contrasena'], $user->password_hash)) {
            return back()->withErrors(['usuario' => 'Usuario o contraseña incorrectos.'])->onlyInput('usuario');
        }

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->intended(route($user->isAdministrator() ? 'admin.dashboard' : 'secretary.dashboard'));
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
