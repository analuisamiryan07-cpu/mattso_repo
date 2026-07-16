<?php

namespace App\Http\Controllers;

use App\Services\PaymentApiService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class PaymentApprovalController extends Controller
{
    public function index(Request $request, PaymentApiService $api): View
    {
        $state = $request->string('estado', 'PENDIENTE')->toString();
        $allowed = ['PENDIENTE', 'PAGADA', 'RECHAZADA', 'TODOS'];
        $state = in_array($state, $allowed, true) ? $state : 'PENDIENTE';
        $orders = $api->orders();

        if ($state !== 'TODOS') {
            $orders = array_values(array_filter($orders, fn (array $order) => ($order['estado'] ?? '') === $state));
        }

        return view('payments.index', compact('orders', 'state'));
    }

    public function update(Request $request, int $order, PaymentApiService $api): RedirectResponse
    {
        $data = $request->validate(['estado' => ['required', Rule::in(['PAGADA', 'RECHAZADA'])]]);
        $api->updateStatus($order, $data['estado']);

        return back()->with('status', 'Estado del pago actualizado.');
    }
}
