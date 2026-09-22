<?php

namespace App\Http\Controllers;

use App\Services\CatalogApiService;
use App\Services\PaymentApiService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class PaymentApprovalController extends Controller
{
    public function index(Request $request, PaymentApiService $api): View
    {
        $state   = $request->string('estado', 'PENDIENTE')->toString();
        $allowed = ['PENDIENTE', 'PAGADA', 'RECHAZADA', 'TODOS'];
        $state   = in_array($state, $allowed, true) ? $state : 'PENDIENTE';

        $orders = $api->orders();

        if ($state !== 'TODOS') {
            $orders = array_values(
                array_filter($orders, fn (array $o) => ($o['estado'] ?? '') === $state)
            );
        }

        return view('payments.index', compact('orders', 'state'));
    }

    public function update(Request $request, int $order, PaymentApiService $api): RedirectResponse
    {
        $data = $request->validate([
            'estado' => ['required', Rule::in(['PAGADA', 'RECHAZADA'])],
            'motivo' => ['nullable', 'string', 'max:500'],
        ]);

        if ($data['estado'] === 'RECHAZADA' && blank($data['motivo'] ?? null)) {
            return back()->withErrors(['motivo' => 'Debe indicar el motivo del rechazo.'])->withInput();
        }

        try {
            $api->updateStatus($order, $data['estado'], $data['motivo'] ?? null);
        } catch (\Throwable $e) {
            return back()->withErrors(['api' => 'Error actualizando la orden: ' . $e->getMessage()]);
        }

        $msg = $data['estado'] === 'PAGADA'
            ? '✅ Pago aprobado. La orden fue actualizada en la plataforma web.'
            : '❌ Orden rechazada. La orden fue actualizada en la plataforma web.';

        return back()->with('status', $msg);
    }

    // ── Crear orden de compra a mano (venta por teléfono) ──────────────
    public function createForm(CatalogApiService $catalog): View
    {
        try {
            $productos = collect($catalog->getAll())->where('activo', true)->values()->all();
        } catch (\Throwable $e) {
            $productos = [];
            session()->flash('error', 'No fue posible cargar el catálogo.');
        }

        return view('payments.create', compact('productos'));
    }

    public function store(Request $request, CatalogApiService $catalog, PaymentApiService $api): RedirectResponse
    {
        // El formulario manda hasta 5 filas y deja vacías las que no usa —
        // se descartan ANTES de validar, si no "required" las rechaza.
        $itemsFiltrados = collect($request->input('items', []))
            ->filter(fn ($item) => filled($item['producto_id'] ?? null))
            ->values()
            ->all();
        $request->merge(['items' => $itemsFiltrados]);

        $data = $request->validate([
            'correo' => ['required', 'email'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.producto_id' => ['required', 'integer', 'min:1'],
            'items.*.cantidad' => ['required', 'integer', 'min:1', 'max:10'],
            'monto_pagado_manual' => ['required', 'numeric', 'min:0'],
        ], [
            'items.required' => 'Selecciona al menos un producto.',
            'items.min' => 'Selecciona al menos un producto.',
        ]);

        $usuarios = $catalog->getWebUsers(1, $data['correo']);
        $usuario = collect($usuarios['data'] ?? [])->first(fn ($u) => strcasecmp($u['correo'] ?? '', $data['correo']) === 0);
        if (!$usuario) {
            return back()->withInput()->withErrors([
                'correo' => 'No existe una cuenta con ese correo. La persona debe registrarse primero en la página web (son las mismas credenciales del Aula Virtual).',
            ]);
        }

        try {
            $orden = $api->createOrder((int) $usuario['id'], array_values($data['items']), (float) $data['monto_pagado_manual']);
        } catch (\Throwable $e) {
            return back()->withInput()->with('error', 'No se pudo crear la orden: '.$e->getMessage());
        }

        return redirect()->route('payments.index')->with('status', 'Orden #'.($orden['id'] ?? '?').' creada y pagada. La persona ya está inscrita.');
    }
}
