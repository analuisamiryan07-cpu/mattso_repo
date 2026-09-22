<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CatalogAdminController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\PaymentApprovalController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\QrCertController;
use App\Http\Controllers\WebClientController;
use App\Http\Controllers\CursosController;
use App\Http\Controllers\Admin\HorasController;
use App\Http\Controllers\Admin\ReporteController;
use App\Http\Controllers\Api\AsistenciaApiController;
use App\Http\Middleware\MobileTokenAuth;
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
    Route::get('/clientes/web', [WebClientController::class, 'index'])->name('clients.web');
    Route::get('/clientes/documentos/{document}/zip', [ClientController::class, 'download'])->name('clients.documents.download');
    Route::get('/clientes/documentos/{document}/pdf', [ClientController::class, 'downloadPdf'])->name('clients.documents.pdf');
    Route::get('/clientes/documentos/{document}/archivo/{file}', [ClientController::class, 'downloadFile'])->name('clients.documents.file');
    Route::get('/clientes/{client}/editar', [ClientController::class, 'edit'])->name('clients.edit');
    Route::patch('/clientes/{client}', [ClientController::class, 'update'])->name('clients.update');
    Route::get('/documentos/nuevo', [DocumentController::class, 'create'])->name('documents.create');
    Route::post('/documentos', [DocumentController::class, 'store'])->name('documents.store');
    Route::get('/capacitaciones', [CatalogAdminController::class, 'indexCapacitaciones'])
        ->middleware('role:'.User::ROLE_ADMIN)
        ->name('capacitaciones.index');

    Route::prefix('admin')->middleware('role:'.User::ROLE_ADMIN)->group(function (): void {
        Route::get('/', [DashboardController::class, 'admin'])->name('admin.dashboard');
        Route::get('/usuarios', [UserController::class, 'index'])->name('users.index');
        Route::post('/usuarios', [UserController::class, 'store'])->name('users.store');
        Route::patch('/usuarios/{user}/estado',   [UserController::class, 'toggle'])->name('users.toggle');
        Route::patch('/usuarios/{user}/rol',      [UserController::class, 'changeRole'])->name('users.role');
        Route::patch('/usuarios/{user}/password', [UserController::class, 'changePassword'])->name('users.password');
        Route::get('/pagos', [PaymentApprovalController::class, 'index'])->name('payments.index');
        Route::get('/pagos/nueva-orden', [PaymentApprovalController::class, 'createForm'])->name('payments.create');
        Route::post('/pagos/nueva-orden', [PaymentApprovalController::class, 'store'])->name('payments.store');
        Route::patch('/pagos/{order}', [PaymentApprovalController::class, 'update'])->name('payments.update');

        // ── Certificados QR ───────────────────────────────────────────────────
        Route::prefix('qr-certs')->name('qr-certs.')->group(function (): void {
            Route::get('/',        [QrCertController::class, 'index'])->name('index');
            Route::get('/nuevo',   [QrCertController::class, 'create'])->name('create');
            Route::post('/',       [QrCertController::class, 'store'])->name('store');
            Route::get('/{id}',    [QrCertController::class, 'show'])->name('show');
            Route::delete('/{id}', [QrCertController::class, 'destroy'])->name('destroy');
        });

        // ── Panel de catálogo web (Certificaciones / Capacitaciones) ─────────
        Route::prefix('catalogo')->name('catalog.')->group(function (): void {
            Route::get('/',            [CatalogAdminController::class, 'index'])->name('index');
            Route::get('/nuevo',       [CatalogAdminController::class, 'create'])->name('create');
            Route::post('/',           [CatalogAdminController::class, 'store'])->name('store');
            Route::get('/{id}/editar', [CatalogAdminController::class, 'edit'])->name('edit');
            Route::put('/{id}',        [CatalogAdminController::class, 'update'])->name('update');
            Route::patch('/{id}/toggle', [CatalogAdminController::class, 'toggle'])->name('toggle');
            Route::delete('/{id}',     [CatalogAdminController::class, 'destroy'])->name('destroy');
        });

        // ── Cursos (Aula Virtual: producto + curso LMS sincronizados) ────────
        Route::prefix('cursos')->name('cursos.')->group(function (): void {
            Route::get('/',       [CursosController::class, 'index'])->name('index');
            Route::get('/nuevo',  [CursosController::class, 'create'])->name('create');
            Route::post('/',      [CursosController::class, 'store'])->name('store');

            // Buscador de "Generar clave" — va antes de {course} para no chocar.
            Route::get('/claves/buscar',    [CursosController::class, 'buscarClaves'])->name('claves.buscar');
            Route::post('/claves/generar',  [CursosController::class, 'generarClave'])->name('claves.generar');
            Route::post('/claves/revocar',  [CursosController::class, 'revocarClave'])->name('claves.revocar');

            Route::get('/{course}/editar',  [CursosController::class, 'edit'])->whereUuid('course')->name('edit');
            Route::put('/{course}',         [CursosController::class, 'update'])->whereUuid('course')->name('update');
            Route::patch('/{course}/estado', [CursosController::class, 'toggle'])->whereUuid('course')->name('toggle');
            Route::post('/{course}/modulos', [CursosController::class, 'storeModule'])->whereUuid('course')->name('modulos.store');
            Route::post('/{course}/imagen',  [CursosController::class, 'uploadImagen'])->whereUuid('course')->name('imagen.store');
            Route::post('/modulos/{module}/contenidos', [CursosController::class, 'storeContent'])->whereUuid('module')->name('contenidos.store');
        });

        // ── Control de Horas ──────────────────────────────────────────────────
        Route::prefix('horas')->name('horas.')->group(function (): void {
            Route::get('/',                              [HorasController::class, 'index'])->name('index');
            Route::get('/empleado/{id}',                 [HorasController::class, 'detalle'])->name('detalle');
            Route::patch('/empleados/{id}/horario',      [HorasController::class, 'actualizarHorario'])->name('horario');
            Route::patch('/empleados/{id}/configurar-ip',[HorasController::class, 'configurarIp'])->name('ip');
            Route::patch('/empleados/{id}/grupo',        [HorasController::class, 'asignarGrupo'])->name('grupo');
            Route::post('/empleado/{id}/nota',           [HorasController::class, 'guardarNota'])->name('nota.guardar');
            Route::delete('/empleado/{id}/nota',         [HorasController::class, 'borrarNota'])->name('nota.borrar');
            Route::get('/reporte/global',                [ReporteController::class, 'global'])->name('reporte.global');
            Route::get('/reporte/empleado/{id}',         [ReporteController::class, 'empleado'])->name('reporte.empleado');
        });
    });
});

Route::prefix('api/asistencia')
    ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class])
    ->middleware(['throttle:60,1'])
    ->group(function () {
        Route::post('/registrar', [AsistenciaApiController::class, 'registrar']);
        Route::post('/login',     [AsistenciaApiController::class, 'login']);

        Route::middleware(MobileTokenAuth::class)->group(function () {
            Route::post('/marcar',    [AsistenciaApiController::class, 'marcar']);
            Route::get('/estado-hoy', [AsistenciaApiController::class, 'estadoHoy']);
        });
    });
