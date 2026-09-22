<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\User;
use App\Services\CatalogApiService;
use App\Services\PaymentApiService;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function __construct(
        private CatalogApiService $api,
        private PaymentApiService $paymentApi,
    ) {}

    public function admin(): View
    {
        $documentClientCount = Client::query()->whereHas('generatedDocuments')->count();
        $clientRecordsWithoutDocuments = Client::query()->whereDoesntHave('generatedDocuments')->count();

        // ── Catálogo ──────────────────────────────────────────────────────────
        try {
            $webResult    = $this->api->getWebUsers(1, '');
            $webUserCount = $webResult['meta']['total'] ?? '—';
        } catch (\Throwable) {
            $webUserCount = '—';
        }

        try {
            $all       = $this->api->getAll();
            $certCount = collect($all)->where('tipo', 'CERTIFICACION')->where('activo', true)->count();
            $capCount  = collect($all)->where('tipo', 'CAPACITACION')->where('activo', true)->count();
        } catch (\Throwable) {
            $certCount = '—';
            $capCount  = '—';
        }

        // ── Órdenes ───────────────────────────────────────────────────────────
        $orders          = [];
        $totalRevenue    = 0;
        $pendingCount    = 0;
        $pendingAmount   = 0;
        $paidCount       = 0;
        $rejectedCount   = 0;
        $revenueByMonth  = [];
        $ordersByMonth   = [];

        try {
            $orders = $this->paymentApi->orders();

            foreach ($orders as $order) {
                $total  = (float) ($order['total'] ?? 0);
                $estado = $order['estado'] ?? '';
                $fecha  = $order['fecha_orden'] ?? null;
                $mes    = $fecha
                    ? \Carbon\Carbon::parse($fecha)->setTimezone(config('app.timezone'))->format('Y-m')
                    : null;

                if ($estado === 'PAGADA') {
                    $totalRevenue += $total;
                    $paidCount++;
                    if ($mes) {
                        $revenueByMonth[$mes]  = ($revenueByMonth[$mes]  ?? 0) + $total;
                        $ordersByMonth[$mes]   = ($ordersByMonth[$mes]   ?? 0) + 1;
                    }
                } elseif ($estado === 'PENDIENTE') {
                    $pendingCount++;
                    $pendingAmount += $total;
                } elseif ($estado === 'RECHAZADA') {
                    $rejectedCount++;
                }
            }

            // Últimos 6 meses ordenados
            ksort($revenueByMonth);
            ksort($ordersByMonth);
            $revenueByMonth = array_slice($revenueByMonth, -6, 6, true);
            $ordersByMonth  = array_slice($ordersByMonth,  -6, 6, true);

        } catch (\Throwable $e) {
            // Si falla la API de órdenes, mostramos ceros
        }

        return view('dashboard.admin', [
            'documentClientCount' => $documentClientCount,
            'clientRecordsWithoutDocuments' => $clientRecordsWithoutDocuments,
            'certCount'     => $certCount,
            'capCount'      => $capCount,
            'userCount'     => User::query()->count(),
            'webUserCount'  => $webUserCount,
            // Métricas de órdenes
            'totalRevenue'  => $totalRevenue,
            'pendingCount'  => $pendingCount,
            'pendingAmount' => $pendingAmount,
            'paidCount'     => $paidCount,
            'rejectedCount' => $rejectedCount,
            'revenueByMonth' => $revenueByMonth,
            'ordersByMonth'  => $ordersByMonth,
        ]);
    }

    public function secretary(): View
    {
        return view('dashboard.secretary');
    }
}
