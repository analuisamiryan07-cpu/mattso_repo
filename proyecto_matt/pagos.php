<?php
/**
 * pagos.php — Módulo de Aprobación de Pagos
 * Sistema Administrativo Local — MATSSO
 *
 * Se conecta al Backend en la nube (Render) vía API REST
 * para listar órdenes pendientes, ver comprobantes y aprobar/rechazar pagos.
 */
session_start();
if (!isset($_SESSION['usuario'])) {
    header('Location: login.php');
    exit;
}

// ── Configuración ────────────────────────────────────────────────────────────
// Ajusta estas dos variables a tu entorno de producción
$BACKEND_URL = getenv('BACKEND_URL') ?: 'http://localhost:3000';
$ADMIN_KEY   = getenv('ADMIN_API_KEY') ?: 'matsso_admin_key_local';

// ── Función helper: llamada cURL al backend ───────────────────────────────────
function callApi(string $method, string $url, string $adminKey, array $body = []): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'x-admin-key: ' . $adminKey,
        ],
        CURLOPT_CUSTOMREQUEST  => $method,
    ]);
    if ($method === 'PATCH' && !empty($body)) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }
    $raw  = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $data = json_decode($raw, true) ?? [];
    return ['code' => $code, 'data' => $data];
}

// ── Acciones POST (Aprobar / Rechazar) ────────────────────────────────────────
$accionMsg = '';
$accionErr = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $orderId = (int)($_POST['orden_id'] ?? 0);
    $accion  = $_POST['accion'] ?? '';

    if ($orderId > 0 && in_array($accion, ['PAGADA', 'RECHAZADA'], true)) {
        $res = callApi(
            'PATCH',
            "$BACKEND_URL/api/ordenes/$orderId/estado",
            $ADMIN_KEY,
            ['estado' => $accion]
        );
        if ($res['code'] === 200) {
            $accionMsg = $res['data']['mensaje'] ?? 'Estado actualizado.';
        } else {
            $accionErr = 'Error al actualizar la orden. Código: ' . $res['code'];
        }
    }
}

// ── Obtener listado de órdenes ────────────────────────────────────────────────
$res    = callApi('GET', "$BACKEND_URL/api/ordenes", $ADMIN_KEY);
$orders = ($res['code'] === 200 && is_array($res['data'])) ? $res['data'] : [];

// ── Filtro por estado ─────────────────────────────────────────────────────────
$filtro = $_GET['estado'] ?? 'PENDIENTE';
$allowedFiltros = ['PENDIENTE', 'PAGADA', 'RECHAZADA', 'TODOS'];
if (!in_array($filtro, $allowedFiltros, true)) $filtro = 'PENDIENTE';

$ordenesFiltradas = ($filtro === 'TODOS')
    ? $orders
    : array_values(array_filter($orders, fn($o) => $o['estado'] === $filtro));

$totalPendiente = count(array_filter($orders, fn($o) => $o['estado'] === 'PENDIENTE'));
$totalPagada    = count(array_filter($orders, fn($o) => $o['estado'] === 'PAGADA'));
$totalRechazada = count(array_filter($orders, fn($o) => $o['estado'] === 'RECHAZADA'));
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aprobación de Pagos — MATSSO</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
            --navy: #1e3a7b; --navy-dark: #16306a; --gold: #f5c518;
            --bg: #eef0f4; --surface: #ffffff; --border: #d4d9e5;
            --text: #1a1a2e; --muted: #6b7a99;
            --green: #16a34a; --red: #dc2626; --amber: #d97706;
        }

        body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }

        /* NAVBAR */
        .navbar {
            background: var(--surface); border-bottom: 2px solid var(--navy);
            display: flex; align-items: center; padding: 0 1.5rem; height: 62px;
            position: sticky; top: 0; z-index: 200; gap: 1rem;
        }
        .navbar-brand { font-size: 1.1rem; font-weight: 700; color: var(--navy); text-decoration: none; }
        .navbar-user { margin-left: auto; font-size: .85rem; color: var(--muted); }
        .navbar-user strong { color: var(--navy); }
        .btn-logout {
            margin-left: 1rem; padding: .4rem .9rem; background: #fef2f2; color: var(--red);
            border: 1px solid #fecaca; border-radius: 6px; font-size: .8rem; font-weight: 600;
            text-decoration: none; transition: background .2s;
        }
        .btn-logout:hover { background: #fee2e2; }

        .page { max-width: 1200px; margin: 0 auto; padding: 2rem 1.5rem; }

        h1 { font-size: 1.5rem; font-weight: 700; color: var(--navy); margin-bottom: .4rem; }
        .subtitle { font-size: .9rem; color: var(--muted); margin-bottom: 2rem; }

        /* ALERTAS */
        .alert {
            padding: .85rem 1.2rem; border-radius: 8px; font-size: .88rem;
            font-weight: 500; margin-bottom: 1.5rem;
        }
        .alert-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: var(--green); }
        .alert-error   { background: #fef2f2; border: 1px solid #fecaca; color: var(--red); }

        /* STATS */
        .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; }
        .stat-card {
            background: var(--surface); border-radius: 12px; padding: 1.25rem 1.5rem;
            border: 1.5px solid var(--border); display: flex; align-items: center; gap: 1rem;
        }
        .stat-icon { font-size: 1.8rem; }
        .stat-num { font-size: 1.8rem; font-weight: 800; }
        .stat-label { font-size: .78rem; color: var(--muted); font-weight: 600; text-transform: uppercase; }
        .stat-card.pending .stat-num { color: var(--amber); }
        .stat-card.paid .stat-num    { color: var(--green); }
        .stat-card.rejected .stat-num{ color: var(--red); }

        /* FILTROS */
        .filter-bar { display: flex; gap: .6rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .filter-btn {
            padding: .5rem 1.1rem; border-radius: 999px; font-size: .82rem; font-weight: 600;
            text-decoration: none; border: 1.5px solid var(--border); color: var(--muted);
            background: var(--surface); transition: all .2s;
        }
        .filter-btn:hover { border-color: var(--navy); color: var(--navy); }
        .filter-btn.active { background: var(--navy); color: white; border-color: var(--navy); }

        /* TABLA / CARDS */
        .orders-grid { display: flex; flex-direction: column; gap: 1rem; }

        .order-card {
            background: var(--surface); border-radius: 12px; border: 1.5px solid var(--border);
            overflow: hidden; transition: box-shadow .2s;
        }
        .order-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.08); }

        .order-header {
            display: flex; align-items: center; justify-content: space-between;
            padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); gap: 1rem; flex-wrap: wrap;
        }
        .order-id { font-size: .82rem; color: var(--muted); }
        .order-id strong { color: var(--navy); font-size: 1rem; }
        .order-date { font-size: .78rem; color: var(--muted); }

        .badge {
            padding: .3rem .8rem; border-radius: 999px; font-size: .72rem; font-weight: 700;
            text-transform: uppercase; letter-spacing: .5px;
        }
        .badge-pendiente { background: #fef3c7; color: #92400e; }
        .badge-pagada    { background: #dcfce7; color: #166534; }
        .badge-rechazada { background: #fee2e2; color: #991b1b; }

        .order-body { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; padding: 1.25rem; }

        .order-section h4 { font-size: .75rem; font-weight: 700; color: var(--muted); text-transform: uppercase; margin-bottom: .6rem; }

        .client-info p { font-size: .84rem; color: var(--text); line-height: 1.7; }
        .client-info p strong { color: var(--navy); }

        .items-list { list-style: none; }
        .items-list li { font-size: .82rem; color: var(--text); padding: .2rem 0; border-bottom: 1px solid var(--border); }
        .items-list li:last-child { border: none; }
        .item-price { float: right; font-weight: 600; color: var(--navy); }

        .order-total { font-size: 1.3rem; font-weight: 800; color: var(--navy); margin-top: .4rem; }
        .order-total small { font-size: .75rem; color: var(--muted); font-weight: 400; }

        /* Comprobante */
        .comprobante-box { margin-top: .5rem; }
        .comprobante-box a {
            display: inline-flex; align-items: center; gap: .4rem;
            font-size: .82rem; font-weight: 600; color: var(--navy);
            text-decoration: none; padding: .4rem .9rem;
            background: #f0f4ff; border: 1px solid #bfcbf7; border-radius: 6px;
        }
        .comprobante-box a:hover { background: #e0e8ff; }
        .no-comprobante { font-size: .8rem; color: var(--muted); font-style: italic; }

        /* Acciones */
        .order-actions {
            display: flex; gap: .75rem; padding: 1rem 1.25rem;
            border-top: 1px solid var(--border); background: #f9fafb; flex-wrap: wrap;
        }
        .btn-approve, .btn-reject {
            padding: .55rem 1.3rem; border-radius: 7px; font-size: .85rem;
            font-weight: 700; border: none; cursor: pointer; transition: all .2s;
        }
        .btn-approve { background: var(--green); color: white; }
        .btn-approve:hover { background: #15803d; }
        .btn-reject  { background: var(--red); color: white; }
        .btn-reject:hover  { background: #b91c1c; }
        .btn-disabled { opacity: .45; cursor: not-allowed; }

        .empty-state {
            text-align: center; padding: 4rem 2rem; background: var(--surface);
            border-radius: 12px; border: 1.5px solid var(--border);
        }
        .empty-state p { font-size: 1rem; color: var(--muted); }

        @media (max-width: 768px) {
            .stats { grid-template-columns: 1fr; }
            .order-body { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>

<nav class="navbar">
    <a href="dashboard.php" class="navbar-brand">⬅ Panel MATSSO</a>
    <span style="flex:1"></span>
    <span class="navbar-user">Sesión: <strong><?= htmlspecialchars($usuarioActual ?? 'Admin') ?></strong></span>
    <a href="logout.php" class="btn-logout">Cerrar sesión</a>
</nav>

<div class="page">
    <h1>💳 Módulo de Aprobación de Pagos</h1>
    <p class="subtitle">Revisa las órdenes recibidas, verifica el comprobante de transferencia y aprueba o rechaza cada pago.</p>

    <?php if ($accionMsg): ?>
        <div class="alert alert-success">✅ <?= htmlspecialchars($accionMsg) ?></div>
    <?php endif; ?>
    <?php if ($accionErr): ?>
        <div class="alert alert-error">❌ <?= htmlspecialchars($accionErr) ?></div>
    <?php endif; ?>
    <?php if ($res['code'] !== 200): ?>
        <div class="alert alert-error">⚠️ No se pudo conectar con el servidor backend (<?= htmlspecialchars($BACKEND_URL) ?>). Código: <?= (int)$res['code'] ?>. Verifica que el servidor esté activo y que ADMIN_API_KEY esté configurada.</div>
    <?php endif; ?>

    <!-- Estadísticas -->
    <div class="stats">
        <div class="stat-card pending">
            <div class="stat-icon">⏳</div>
            <div>
                <div class="stat-num"><?= $totalPendiente ?></div>
                <div class="stat-label">Pendientes</div>
            </div>
        </div>
        <div class="stat-card paid">
            <div class="stat-icon">✅</div>
            <div>
                <div class="stat-num"><?= $totalPagada ?></div>
                <div class="stat-label">Aprobadas</div>
            </div>
        </div>
        <div class="stat-card rejected">
            <div class="stat-icon">❌</div>
            <div>
                <div class="stat-num"><?= $totalRechazada ?></div>
                <div class="stat-label">Rechazadas</div>
            </div>
        </div>
    </div>

    <!-- Filtros -->
    <div class="filter-bar">
        <?php foreach (['PENDIENTE' => 'Pendientes', 'PAGADA' => 'Aprobadas', 'RECHAZADA' => 'Rechazadas', 'TODOS' => 'Todas'] as $val => $label): ?>
            <a href="?estado=<?= $val ?>" class="filter-btn <?= $filtro === $val ? 'active' : '' ?>">
                <?= $label ?>
            </a>
        <?php endforeach; ?>
    </div>

    <!-- Órdenes -->
    <div class="orders-grid">
        <?php if (empty($ordenesFiltradas)): ?>
            <div class="empty-state">
                <p>No hay órdenes con estado <strong><?= htmlspecialchars($filtro) ?></strong>.</p>
            </div>
        <?php else: ?>
            <?php foreach ($ordenesFiltradas as $orden): ?>
                <?php
                    $estado = $orden['estado'];
                    $badgeClass = match($estado) {
                        'PAGADA'    => 'badge-pagada',
                        'RECHAZADA' => 'badge-rechazada',
                        default     => 'badge-pendiente',
                    };
                    $isPending = ($estado === 'PENDIENTE');
                ?>
                <div class="order-card">
                    <div class="order-header">
                        <div class="order-id">
                            Orden <strong>#<?= (int)$orden['id'] ?></strong>
                        </div>
                        <div class="order-date">
                            📅 <?= htmlspecialchars(date('d M Y, H:i', strtotime($orden['fecha_orden']))) ?>
                        </div>
                        <span class="badge <?= $badgeClass ?>"><?= htmlspecialchars($estado) ?></span>
                    </div>

                    <div class="order-body">
                        <!-- Cliente -->
                        <div class="order-section">
                            <h4>👤 Cliente</h4>
                            <div class="client-info">
                                <p><strong>Nombre:</strong> <?= htmlspecialchars($orden['cliente']['nombre']) ?></p>
                                <p><strong>Cédula:</strong> <?= htmlspecialchars($orden['cliente']['cedula']) ?></p>
                                <p><strong>Correo:</strong> <?= htmlspecialchars($orden['cliente']['correo']) ?></p>
                                <p><strong>Teléfono:</strong> <?= htmlspecialchars($orden['cliente']['telefono']) ?></p>
                            </div>
                        </div>

                        <!-- Ítems -->
                        <div class="order-section">
                            <h4>📦 Cursos / Certificaciones</h4>
                            <ul class="items-list">
                                <?php foreach ($orden['items'] as $item): ?>
                                    <li>
                                        <?= htmlspecialchars($item['producto']) ?>
                                        (x<?= (int)$item['cantidad'] ?>)
                                        <span class="item-price">$<?= number_format($item['precio'] * $item['cantidad'], 2) ?></span>
                                    </li>
                                <?php endforeach; ?>
                            </ul>
                        </div>

                        <!-- Total y Comprobante -->
                        <div class="order-section">
                            <h4>💰 Total con IVA</h4>
                            <div class="order-total">
                                $<?= number_format($orden['total'], 2) ?>
                                <small>(IVA incluido)</small>
                            </div>

                            <h4 style="margin-top:1.2rem;">🧾 Comprobante</h4>
                            <div class="comprobante-box">
                                <?php if (!empty($orden['comprobante_url'])): ?>
                                    <a href="<?= htmlspecialchars($BACKEND_URL . $orden['comprobante_url']) ?>" target="_blank" rel="noopener">
                                        🖼️ Ver Comprobante
                                    </a>
                                <?php else: ?>
                                    <span class="no-comprobante">Sin comprobante adjunto</span>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>

                    <!-- Acciones -->
                    <div class="order-actions">
                        <?php if ($isPending): ?>
                            <form method="POST" style="display:inline;" onsubmit="return confirm('¿Aprobar el pago de la orden #<?= (int)$orden['id'] ?>?')">
                                <input type="hidden" name="orden_id" value="<?= (int)$orden['id'] ?>">
                                <input type="hidden" name="accion" value="PAGADA">
                                <button type="submit" class="btn-approve">✅ Aprobar Pago</button>
                            </form>
                            <form method="POST" style="display:inline;" onsubmit="return confirm('¿Rechazar la orden #<?= (int)$orden['id'] ?>?')">
                                <input type="hidden" name="orden_id" value="<?= (int)$orden['id'] ?>">
                                <input type="hidden" name="accion" value="RECHAZADA">
                                <button type="submit" class="btn-reject">❌ Rechazar</button>
                            </form>
                        <?php else: ?>
                            <button class="btn-approve btn-disabled" disabled>✅ Aprobar Pago</button>
                            <button class="btn-reject btn-disabled" disabled>❌ Rechazar</button>
                            <span style="font-size:.82rem; color:var(--muted);">Esta orden ya fue procesada.</span>
                        <?php endif; ?>
                    </div>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>
</div>

</body>
</html>
