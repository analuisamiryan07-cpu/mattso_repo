<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\PaymentApprovalController;
use App\Http\Controllers\TrainingController;
use App\Http\Controllers\UserController;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    if (! Auth::check()) {
        return redirect()->route('login');
    }

    return redirect()->route(Auth::user()->isAdministrator()
        ? 'admin.dashboard'
        : 'secretary.dashboard');
});

Route::middleware('guest')->group(function (): void {
    Route::get('/login', [AuthController::class, 'create'])->name('login');
    Route::post('/login', [AuthController::class, 'store'])->middleware('throttle:5,1')->name('login.store');
});

Route::post('/logout', [AuthController::class, 'destroy'])->middleware('auth')->name('logout');

Route::middleware('auth')->group(function (): void {
    Route::get('/secretaria', [DashboardController::class, 'secretary'])
        ->middleware('role:'.User::ROLE_SECRETARY)->name('secretary.dashboard');

    Route::get('/clientes', [ClientController::class, 'index'])->name('clients.index');
    Route::get('/clientes/documentos/{document}/zip', [ClientController::class, 'download'])->name('clients.documents.download');
    Route::get('/clientes/documentos/{document}/archivo/{file}', [ClientController::class, 'downloadFile'])->name('clients.documents.file');
    Route::get('/documentos/nuevo', [DocumentController::class, 'create'])->name('documents.create');
    Route::post('/documentos', [DocumentController::class, 'store'])->name('documents.store');
    Route::get('/capacitaciones', [TrainingController::class, 'index'])->name('trainings.index');

    Route::prefix('admin')->middleware('role:'.User::ROLE_ADMIN)->group(function (): void {
        Route::get('/', [DashboardController::class, 'admin'])->name('admin.dashboard');
        Route::get('/usuarios', [UserController::class, 'index'])->name('users.index');
        Route::post('/usuarios', [UserController::class, 'store'])->name('users.store');
        Route::patch('/usuarios/{user}/estado', [UserController::class, 'toggle'])->name('users.toggle');
        Route::get('/pagos', [PaymentApprovalController::class, 'index'])->name('payments.index');
        Route::patch('/pagos/{order}', [PaymentApprovalController::class, 'update'])->name('payments.update');
    });
});
