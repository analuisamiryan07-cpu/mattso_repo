@extends('layouts.app')

@section('title', 'Actualizar Contraseña')

@section('content')
<div style="max-width: 500px; margin: 3rem auto;">
    <div class="card" style="border-top: 4px solid var(--danger);">
        <h2 style="color: var(--text); margin-bottom: .5rem;">Seguridad Obligatoria</h2>
        <p style="color: var(--muted); font-size: .9rem; margin-bottom: 1.5rem;">
            Por políticas de seguridad, debes cambiar tu contraseña predeterminada antes de poder acceder al sistema.
        </p>

        <form method="POST" action="{{ route('password.update') }}">
            @csrf
            <div class="input-group">
                <label for="current_password">Contraseña Actual</label>
                <input type="password" name="current_password" required>
            </div>
            
            <div class="input-group">
                <label for="password">Nueva Contraseña (Mínimo 8 caracteres)</label>
                <input type="password" name="password" required>
            </div>

            <div class="input-group">
                <label for="password_confirmation">Confirmar Nueva Contraseña</label>
                <input type="password" name="password_confirmation" required>
            </div>
            
            <button type="submit" class="btn" style="width: 100%; margin-top: 1rem;">Guardar y Continuar</button>
        </form>
    </div>
</div>
@endsection
