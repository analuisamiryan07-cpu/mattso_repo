<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Middleware\AdminMiddleware;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
*/

// Redireccionar raíz al login
Route::get('/', function () {
    return redirect()->route('login');
});

// Autenticación Libre
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->name('login.post');
});

// Autenticación Requerida (Pero puede tener password pendiente)
Route::middleware(['auth'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    
    // Rutas de Cambio Obligatorio de Contraseña
    Route::get('/password/change', [AuthController::class, 'showChangePasswordForm'])->name('password.change');
    Route::post('/password/change', [AuthController::class, 'updatePassword'])->name('password.update');
});

// Autenticación Requerida Y Contraseña Actualizada Segura
Route::middleware(['auth', 'force.password.change'])->group(function () {
    
    Route::get('/dashboard', function () {
        return view('admin.dashboard'); 
    })->name('dashboard');

    // Módulo de Clientes/Certificaciones (Acceso Global para todos los empleados logueados)
    Route::resource('clientes', \App\Http\Controllers\ClienteController::class)->except(['show', 'edit', 'update', 'destroy']);
    Route::get('clientes/{cliente}/generar-documentos', [\App\Http\Controllers\DocumentController::class, 'showGenerarForm'])->name('clientes.generar.form');
    Route::post('clientes/{cliente}/generar-documentos', [\App\Http\Controllers\DocumentController::class, 'generar'])->name('clientes.generar');

    // Panel de Administración (Solo Admins usando clase Middleware en lugar de Closure)
    Route::middleware(AdminMiddleware::class)->prefix('admin')->group(function () {
        
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::get('/users/create', [UserController::class, 'create'])->name('users.create');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');

        // Aquí irían las rutas del perfil de "Clientes"
    });
});
