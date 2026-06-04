@extends('layouts.app')

@section('title', 'Iniciar Sesión')

@section('content')
    <div style="max-width: 400px; margin: 4rem auto;">
        <div class="card">
            <h2 style="text-align: center; color: var(--navy); margin-bottom: 1.5rem;">Bienvenido a Matsso</h2>

            <form method="POST" action="{{ route('login.post') }}">
                @csrf
                <div class="input-group">
                    <label for="username">Nombre de Usuario</label>
                    <input type="text" name="username" id="username" value="{{ old('username') }}" required autofocus>
                </div>

                <div class="input-group">
                    <label for="password">Contraseña</label>
                    <input type="password" name="password" id="password" required>
                </div>

                <button type="submit" class="btn" style="width: 100%; margin-top: 1rem;">Ingresar al sistema</button>
            </form>
        </div>
    </div>
@endsection