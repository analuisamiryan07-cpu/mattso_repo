<?php
require_once 'includes/auth.php';
require_once 'includes/db.php';

// ── Leer el historial de documentos generados desde la BD ──────────────────────────────
$registros = [];

try {
    $stmt = $pdo->query("
        SELECT 
            c.nombre, 
            d.carpeta, 
            d.zip_ruta as zip, 
            d.fecha_generacion, 
            d.n_archivos, 
            d.nombres_archivos 
        FROM public.documentos_generados d
        JOIN public.clientes c ON d.cliente_id = c.id
        ORDER BY d.fecha_generacion DESC
    ");
    
    while ($row = $stmt->fetch()) {
        $fechaDir = date('d/m/Y', strtotime($row['fecha_generacion']));
        $horaDir = date('H:i', strtotime($row['fecha_generacion']));
        $archivos = json_decode($row['nombres_archivos'], true) ?: [];
        
        $registros[] = [
            'carpeta' => $row['carpeta'],
            'nombre' => $row['nombre'],
            'fecha' => $fechaDir,
            'hora' => $horaDir,
            'nArchivos' => $row['n_archivos'],
            'archivos' => $archivos,
            'zip' => $row['zip']
        ];
    }
} catch (PDOException $e) {
    // Manejar error si es necesario
}

$totalCandidatos = count($registros);
?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clientes — MATsso</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        *,
        *::before,
        *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        :root {
            --navy: #1e3a7b;
            --navy-dark: #16306a;
            --navy-btn: #2d5099;
            --bg: #eef0f4;
            --surface: #ffffff;
            --border: #d4d9e5;
            --text: #1a1a2e;
            --muted: #6b7a99;
            --success: #2a9d4e;
        }

        body {
            font-family: 'Inter', sans-serif;
            background: var(--bg);
            color: var(--text);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        /* ── NAVBAR ── */
        .navbar {
            background: var(--surface);
            border-bottom: 2px solid var(--navy);
            display: flex;
            align-items: center;
            padding: 0 1.5rem;
            height: 62px;
            position: sticky;
            top: 0;
            z-index: 200;
            gap: 1.25rem;
        }

        .navbar-logo img {
            height: 42px;
            display: block;
        }

        .navbar-links {
            display: flex;
            align-items: center;
            gap: .25rem;
            flex: 1;
        }

        .nav-link {
            display: flex;
            align-items: center;
            gap: .4rem;
            padding: .45rem .75rem;
            border-radius: 7px;
            font-size: .83rem;
            font-weight: 500;
            color: var(--muted);
            text-decoration: none;
            transition: background .15s, color .15s;
        }

        .nav-link:hover {
            background: #f0f2f8;
            color: var(--navy);
        }

        .nav-link.active {
            background: #e8edf8;
            color: var(--navy);
            font-weight: 600;
        }

        .nav-link svg {
            fill: currentColor;
            flex-shrink: 0;
        }

        .user-area {
            position: relative;
            margin-left: auto;
        }

        .user-btn {
            display: flex;
            align-items: center;
            gap: .5rem;
            background: none;
            border: 1.5px solid var(--border);
            border-radius: 8px;
            padding: .38rem .75rem;
            cursor: pointer;
            font-family: inherit;
            font-size: .83rem;
            font-weight: 500;
            color: var(--text);
            transition: background .2s;
        }

        .user-btn:hover {
            background: #f2f4f8;
        }

        .user-avatar {
            width: 30px;
            height: 30px;
            background: var(--navy);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .chevron {
            fill: var(--muted);
            transition: transform .2s;
        }

        .user-area.open .chevron {
            transform: rotate(180deg);
        }

        .dropdown {
            display: none;
            position: absolute;
            right: 0;
            top: calc(100% + 6px);
            background: var(--surface);
            border: 1.5px solid var(--border);
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, .10);
            min-width: 160px;
            overflow: hidden;
            z-index: 300;
        }

        .user-area.open .dropdown {
            display: block;
        }

        .dropdown a {
            display: flex;
            align-items: center;
            gap: .5rem;
            padding: .7rem 1rem;
            font-size: .84rem;
            color: var(--text);
            text-decoration: none;
            transition: background .15s;
        }

        .dropdown a:hover {
            background: #f2f4f8;
        }

        .dropdown a svg {
            fill: var(--muted);
            flex-shrink: 0;
        }

        /* ── MAIN ── */
        main {
            flex: 1;
            padding: 1.75rem 1.25rem 2.5rem;
        }

        .container {
            max-width: 1000px;
            margin: 0 auto;
        }

        .page-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1.5rem;
            flex-wrap: wrap;
            gap: 1rem;
        }

        .page-title {
            font-size: 1.3rem;
            font-weight: 700;
        }

        .page-subtitle {
            font-size: .82rem;
            color: var(--muted);
            margin-top: .2rem;
        }

        .btn-primary {
            display: inline-flex;
            align-items: center;
            gap: .45rem;
            background: var(--navy);
            color: #fff;
            text-decoration: none;
            font-size: .85rem;
            font-weight: 600;
            border-radius: 8px;
            padding: .6rem 1.2rem;
            transition: background .2s;
        }

        .btn-primary:hover {
            background: var(--navy-btn);
        }

        .btn-primary svg {
            fill: #fff;
        }

        /* ── BUSCADOR ── */
        .search-bar {
            position: relative;
            margin-bottom: 1.25rem;
        }

        .search-bar svg {
            position: absolute;
            left: .85rem;
            top: 50%;
            transform: translateY(-50%);
            fill: var(--muted);
        }

        .search-bar input {
            width: 100%;
            background: var(--surface);
            border: 1.5px solid var(--border);
            border-radius: 9px;
            font-family: inherit;
            font-size: .88rem;
            padding: .65rem 1rem .65rem 2.5rem;
            outline: none;
            transition: border-color .2s;
        }

        .search-bar input:focus {
            border-color: var(--navy);
        }

        /* ── TABLA ── */
        .table-wrap {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 12px;
            overflow: hidden;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        thead {
            background: #f4f6fb;
        }

        th {
            padding: .75rem 1rem;
            text-align: left;
            font-size: .75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: .06em;
            color: var(--muted);
            border-bottom: 1px solid var(--border);
        }

        td {
            padding: .85rem 1rem;
            font-size: .85rem;
            border-bottom: 1px solid #f0f2f8;
            vertical-align: middle;
        }

        tr:last-child td {
            border-bottom: none;
        }

        tr:hover td {
            background: #f8f9fd;
        }

        .nombre-cell {
            font-weight: 600;
            color: var(--text);
        }

        .date-cell {
            color: var(--muted);
            font-size: .8rem;
        }

        .badge {
            display: inline-flex;
            align-items: center;
            gap: .3rem;
            background: #e4f7eb;
            color: var(--success);
            font-size: .75rem;
            font-weight: 600;
            padding: .25rem .6rem;
            border-radius: 999px;
        }

        .badge svg {
            fill: var(--success);
        }

        .actions {
            display: flex;
            gap: .5rem;
        }

        .btn-icon {
            display: inline-flex;
            align-items: center;
            gap: .35rem;
            background: #f0f2f8;
            border: 1px solid var(--border);
            border-radius: 7px;
            padding: .4rem .75rem;
            font-size: .78rem;
            font-weight: 500;
            color: var(--navy);
            text-decoration: none;
            cursor: pointer;
            transition: background .15s;
            white-space: nowrap;
        }

        .btn-icon:hover {
            background: #e2e7f5;
        }

        .btn-icon svg {
            fill: var(--navy);
            flex-shrink: 0;
        }

        .empty-state {
            text-align: center;
            padding: 3rem;
            color: var(--muted);
        }

        .empty-state svg {
            fill: var(--muted);
            margin-bottom: .75rem;
            opacity: .4;
        }

        /* Modal */
        .modal-bg {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, .35);
            z-index: 500;
            align-items: center;
            justify-content: center;
        }

        .modal-bg.open {
            display: flex;
        }

        .modal {
            background: #fff;
            border-radius: 12px;
            padding: 1.5rem;
            width: 90%;
            max-width: 460px;
            box-shadow: 0 8px 40px rgba(0, 0, 0, .18);
        }

        .modal-title {
            font-size: 1rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: var(--text);
        }

        .file-list {
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: .6rem;
        }

        .file-list li a {
            display: flex;
            align-items: center;
            gap: .6rem;
            padding: .6rem .85rem;
            background: #f4f6fb;
            border: 1px solid var(--border);
            border-radius: 8px;
            font-size: .83rem;
            color: var(--navy);
            text-decoration: none;
            font-weight: 500;
            transition: background .15s;
        }

        .file-list li a:hover {
            background: #e8edf8;
        }

        .file-list li a svg {
            fill: var(--navy);
            flex-shrink: 0;
        }

        .ext-xlsx {
            color: #1d6f42 !important;
        }

        .ext-xlsx svg {
            fill: #1d6f42 !important;
        }

        .modal-close {
            display: block;
            margin-top: 1rem;
            text-align: center;
            font-size: .82rem;
            color: var(--muted);
            cursor: pointer;
        }

        .modal-close:hover {
            color: var(--text);
        }

        footer {
            background: var(--navy-dark);
            color: rgba(255, 255, 255, .55);
            text-align: center;
            font-size: .75rem;
            padding: 1rem;
        }
    </style>
</head>

<body>

    <?php $paginaActual = 'clientes';
require 'includes/navbar.php'; ?>

    <main>
        <div class="container">

            <div class="page-header">
                <div>
                    <div class="page-title">Historial de Clientes</div>
                    <div class="page-subtitle">
                        <?= $totalCandidatos?> candidato
                        <?= $totalCandidatos !== 1 ? 's' : ''?> registrado
                        <?= $totalCandidatos !== 1 ? 's' : ''?>
                    </div>
                </div>
                <a href="index.php" class="btn-primary">
                    <svg width="15" height="15" viewBox="0 0 24 24">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                    Nueva certificación
                </a>
            </div>

            <div class="search-bar">
                <svg width="15" height="15" viewBox="0 0 24 24">
                    <path
                        d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
                <input type="search" id="busqueda" placeholder="Buscar por nombre de candidato...">
            </div>

            <div class="table-wrap">
                <?php if (empty($registros)): ?>
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24">
                        <path
                            d="M20 6h-2.18c.07-.44.18-.88.18-1.34C18 2.99 16.34 2 14.5 2c-1.09 0-2.03.5-2.66 1.26L11 4.27l-1.01-1.01C9.35 2.5 8.41 2 7.5 2 5.66 2 4 2.99 4 4.66c0 .46.1.9.18 1.34H2l1 12h18l1-12z" />
                    </svg>
                    <p style="font-size:.95rem;font-weight:600;margin-bottom:.3rem">No hay candidatos aún</p>
                    <p style="font-size:.82rem">Genera documentos en la sección de certificaciones para verlos aquí.</p>
                </div>
                <?php
else: ?>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Nombre del candidato</th>
                            <th>Fecha generado</th>
                            <th>Documentos</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="tablaBody">
                        <?php foreach ($registros as $i => $r): ?>
                        <tr class="fila-candidato" data-nombre="<?= htmlspecialchars(strtolower($r['nombre']))?>">
                            <td style="color:var(--muted);font-size:.8rem">
                                <?= $i + 1?>
                            </td>
                            <td class="nombre-cell">
                                <?= htmlspecialchars(str_replace('_', ' ', $r['nombre']))?>
                            </td>
                            <td class="date-cell">
                                <?= $r['fecha']?><br>
                                <span style="font-size:.75rem">
                                    <?= $r['hora']?>
                                </span>
                            </td>
                            <td>
                                <span class="badge">
                                    <svg width="11" height="11" viewBox="0 0 24 24">
                                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                                    </svg>
                                    <?= $r['nArchivos']?> archivo
                                    <?= $r['nArchivos'] !== 1 ? 's' : ''?>
                                </span>
                            </td>
                            <td>
                                <div class="actions">
                                    <button class="btn-icon"
                                        onclick="abrirModal(<?= htmlspecialchars(json_encode($r['archivos']))?>, '<?= addslashes($r['carpeta'])?>')">
                                        <svg width="13" height="13" viewBox="0 0 24 24">
                                            <path
                                                d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8a3 3 0 100 6 3 3 0 000-6z" />
                                        </svg>
                                        Ver
                                    </button>
                                    <?php if ($r['zip']): ?>
                                    <a class="btn-icon"
                                        href="generados/<?= urlencode($r['carpeta'])?>/<?= urlencode($r['zip'])?>"
                                        download>
                                        <svg width="13" height="13" viewBox="0 0 24 24">
                                            <path d="M5 20h14v-2H5v2zm7-18l-4 4h2.5v4h3V6H16l-4-4z" />
                                        </svg>
                                        ZIP
                                    </a>
                                    <?php
        endif; ?>
                                </div>
                            </td>
                        </tr>
                        <?php
    endforeach; ?>
                    </tbody>
                </table>
                <?php
endif; ?>
            </div>
        </div>
    </main>

    <!-- Modal de archivos -->
    <div class="modal-bg" id="modalBg" onclick="cerrarModal(event)">
        <div class="modal">
            <div class="modal-title" id="modalTitulo">Documentos generados</div>
            <ul class="file-list" id="modalLista"></ul>
            <div class="modal-close" onclick="document.getElementById('modalBg').classList.remove('open')">Cerrar</div>
        </div>
    </div>

    <footer>Copyright 2025 — Servicio Nacional de Contratación Pública</footer>

    <script>
        // ── Búsqueda en tiempo real ──────────────────────────────────────────────────
        document.getElementById('busqueda').addEventListener('input', function () {
            var q = this.value.toLowerCase();
            document.querySelectorAll('.fila-candidato').forEach(function (row) {
                row.style.display = row.dataset.nombre.includes(q) ? '' : 'none';
            });
        });

        // ── Modal de archivos ────────────────────────────────────────────────────────
        function abrirModal(archivos, carpeta) {
            document.getElementById('modalTitulo').textContent = 'Documentos — ' + carpeta.replace(/_/g, ' ');
            var lista = document.getElementById('modalLista');
            lista.innerHTML = '';
            archivos.forEach(function (f) {
                var esXlsx = f.endsWith('.xlsx');
                var claseExt = esXlsx ? 'ext-xlsx' : '';
                var iconPath = esXlsx
                    ? 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z'
                    : 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5z';
                lista.innerHTML += '<li><a class="' + claseExt + '" href="generados/' + encodeURIComponent(carpeta) + '/' + encodeURIComponent(f) + '" download>' +
                    '<svg width="14" height="14" viewBox="0 0 24 24"><path d="' + iconPath + '"/></svg>' + f + '</a></li>';
            });
            document.getElementById('modalBg').classList.add('open');
        }
        function cerrarModal(e) {
            if (e.target === document.getElementById('modalBg')) {
                document.getElementById('modalBg').classList.remove('open');
            }
        }
    </script>
</body>

</html>