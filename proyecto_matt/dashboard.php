<?php
session_start();
if (!isset($_SESSION['usuario'])) {
    header('Location: login.php');
    exit;
}
$usuarioActual = $_SESSION['usuario'];
?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel Principal — MATsso</title>
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
            --gold: #f5c518;
            --bg: #eef0f4;
            --surface: #ffffff;
            --border: #d4d9e5;
            --text: #1a1a2e;
            --muted: #6b7a99;
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
            gap: 1rem;
        }

        .navbar-logo img {
            height: 42px;
            display: block;
        }

        .navbar-search {
            flex: 1;
            max-width: 480px;
            position: relative;
            margin: 0 auto;
        }

        .navbar-search input {
            width: 100%;
            background: #f2f4f8;
            border: 1.5px solid var(--border);
            border-radius: 8px;
            font-family: inherit;
            font-size: .85rem;
            padding: .5rem .9rem .5rem 2.4rem;
            color: var(--text);
            outline: none;
            transition: border-color .2s;
        }

        .navbar-search input:focus {
            border-color: var(--navy);
        }

        .navbar-search .search-icon {
            position: absolute;
            left: .75rem;
            top: 50%;
            transform: translateY(-50%);
            fill: var(--muted);
        }

        /* Dropdown usuario */
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

        .user-avatar svg {
            fill: #fff;
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
            max-width: 960px;
            margin: 0 auto;
        }

        /* ── RESUMEN ESTADÍSTICAS ── */
        .stats-wrapper {
            background: #dfe3ef;
            border-radius: 14px;
            padding: 1.25rem;
            margin-bottom: 1.5rem;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            margin-bottom: 1rem;
        }

        @media(max-width:680px) {
            .stats-grid {
                grid-template-columns: 1fr;
            }
        }

        .stat-card {
            background: var(--surface);
            border-radius: 10px;
            padding: 1.1rem 1.25rem;
            display: flex;
            flex-direction: column;
            gap: .6rem;
            border-left: 5px solid transparent;
        }

        .stat-card.orange {
            border-color: #e8813a;
        }

        .stat-card.green {
            border-color: #2a9d4e;
        }

        .stat-card.gold {
            border-color: #c9a800;
        }

        .stat-top {
            display: flex;
            align-items: center;
            gap: .75rem;
        }

        .stat-icon {
            width: 42px;
            height: 42px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .stat-icon.orange {
            background: #fdeede;
        }

        .stat-icon.green {
            background: #e4f7eb;
        }

        .stat-icon.gold {
            background: #fdf6d8;
        }

        .stat-icon svg {
            width: 22px;
            height: 22px;
        }

        .stat-number {
            font-size: 1.65rem;
            font-weight: 700;
            line-height: 1;
        }

        .stat-label {
            font-size: .78rem;
            color: var(--muted);
            font-weight: 500;
        }

        .stat-details {
            font-size: .78rem;
            color: var(--muted);
            line-height: 1.7;
        }

        .stat-details strong {
            color: var(--text);
            font-weight: 600;
        }

        /* Cards próximas */
        .prox-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }

        @media(max-width:580px) {
            .prox-grid {
                grid-template-columns: 1fr;
            }
        }

        .prox-card {
            background: var(--surface);
            border-radius: 10px;
            padding: 1rem 1.25rem;
            display: flex;
            align-items: flex-start;
            gap: .85rem;
        }

        .prox-icon {
            width: 36px;
            height: 36px;
            background: #e8eaf2;
            border-radius: 7px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            margin-top: 2px;
        }

        .prox-icon svg {
            fill: var(--navy);
            width: 18px;
            height: 18px;
        }

        .prox-title {
            font-size: .88rem;
            font-weight: 700;
            margin-bottom: .3rem;
            color: var(--text);
        }

        .prox-detail {
            font-size: .78rem;
            color: var(--muted);
            line-height: 1.8;
        }

        .prox-detail strong {
            color: var(--text);
        }

        /* ── PANEL DE CONTROL ── */
        .panel-title {
            font-size: 1rem;
            font-weight: 700;
            color: var(--text);
            margin-bottom: 1rem;
        }

        .panel-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: .85rem;
        }

        @media(max-width:600px) {
            .panel-grid {
                grid-template-columns: 1fr 1fr;
            }
        }

        .panel-btn {
            background: var(--navy);
            border-radius: 10px;
            padding: 1.5rem 1rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: .75rem;
            text-decoration: none;
            color: #fff;
            font-size: .85rem;
            font-weight: 600;
            text-align: center;
            transition: background .2s, transform .15s, box-shadow .2s;
            box-shadow: 0 2px 8px rgba(30, 58, 123, .18);
            min-height: 110px;
        }

        .panel-btn:hover {
            background: var(--navy-btn);
            transform: translateY(-2px);
            box-shadow: 0 5px 18px rgba(30, 58, 123, .28);
        }

        .panel-btn svg {
            width: 36px;
            height: 36px;
            fill: #fff;
            opacity: .92;
        }

        /* Fila de 2 centrada */
        .panel-grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: .85rem;
            margin-top: .85rem;
        }

        /* ── FOOTER ── */
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

    <!-- NAVBAR -->
    <nav class="navbar">
        <a class="navbar-logo" href="dashboard.php">
            <img src="assets/img/LogoWeb2_Mesadetrabajo1-960w.png" alt="MATsso">
        </a>
        <div style="display:flex;align-items:center;gap:.2rem;flex:1;">
            <a href="dashboard.php"
                style="display:flex;align-items:center;gap:.4rem;padding:.42rem .7rem;border-radius:7px;font-size:.82rem;font-weight:600;color:var(--navy);background:#e8edf8;text-decoration:none;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                </svg>Dashboard
            </a>
            <a href="clientes.php"
                style="display:flex;align-items:center;gap:.4rem;padding:.42rem .7rem;border-radius:7px;font-size:.82rem;font-weight:500;color:var(--muted);text-decoration:none;transition:background .15s,color .15s;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path
                        d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>Clientes
            </a>
            <a href="capacitaciones.php"
                style="display:flex;align-items:center;gap:.4rem;padding:.42rem .7rem;border-radius:7px;font-size:.82rem;font-weight:500;color:var(--muted);text-decoration:none;transition:background .15s,color .15s;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                </svg>Capacitaciones
            </a>
            <a href="index.php"
                style="display:flex;align-items:center;gap:.4rem;padding:.42rem .7rem;border-radius:7px;font-size:.82rem;font-weight:500;color:var(--muted);text-decoration:none;transition:background .15s,color .15s;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                </svg>Certificaciones
            </a>
        </div>
        <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24">
            <path
                d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
        <input type="search" placeholder="Buscar...">
        </div>

        <div class="user-area" id="userArea">
            <button class="user-btn" onclick="toggleDropdown()">
                <div class="user-avatar">
                    <svg width="16" height="16" viewBox="0 0 24 24">
                        <path
                            d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                    </svg>
                </div>
                <?= htmlspecialchars($usuarioActual)?>
                <svg class="chevron" width="14" height="14" viewBox="0 0 24 24">
                    <path d="M7 10l5 5 5-5z" />
                </svg>
            </button>
            <div class="dropdown">
                <a href="logout.php">
                    <svg width="15" height="15" viewBox="0 0 24 24">
                        <path
                            d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                    </svg>
                    Cerrar sesión
                </a>
            </div>
        </div>
    </nav>

    <main>
        <div class="container">

            <!-- ESTADÍSTICAS -->
            <div class="stats-wrapper">
                <div class="stats-grid">

                    <!-- Clientes -->
                    <div class="stat-card orange">
                        <div class="stat-top">
                            <div class="stat-icon orange">
                                <svg viewBox="0 0 24 24" fill="#e8813a">
                                    <path
                                        d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                                </svg>
                            </div>
                            <div>
                                <div class="stat-number">120</div>
                                <div class="stat-label">Total de clientes</div>
                            </div>
                        </div>
                        <div class="stat-details">
                            <strong>&gt; 84</strong> clientes en capacitaciones<br>
                            <strong>&gt; 36</strong> clientes en certificaciones
                        </div>
                    </div>

                    <!-- Certificados -->
                    <div class="stat-card green">
                        <div class="stat-top">
                            <div class="stat-icon green">
                                <svg viewBox="0 0 24 24" fill="#2a9d4e">
                                    <path
                                        d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />
                                </svg>
                            </div>
                            <div>
                                <div class="stat-number">203</div>
                                <div class="stat-label">Certificados emitidos</div>
                            </div>
                        </div>
                        <div class="stat-details">
                            <strong>&gt; 158</strong> en capacitaciones<br>
                            <strong>&gt; 45</strong> en certificaciones
                        </div>
                    </div>

                    <!-- Tasa aprobación -->
                    <div class="stat-card gold">
                        <div class="stat-top">
                            <div class="stat-icon gold">
                                <svg viewBox="0 0 24 24" fill="#c9a800">
                                    <path
                                        d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
                                </svg>
                            </div>
                            <div>
                                <div class="stat-number">84%</div>
                                <div class="stat-label">Tasa de aprobación</div>
                            </div>
                        </div>
                        <div class="stat-details">
                            <strong>&gt; 134</strong> Personas aprobadas<br>
                            <strong>&gt; 26</strong> Personas reprobadas
                        </div>
                    </div>
                </div>

                <!-- Próximas actividades -->
                <div class="prox-grid">
                    <div class="prox-card">
                        <div class="prox-icon">
                            <svg viewBox="0 0 24 24">
                                <path
                                    d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                            </svg>
                        </div>
                        <div>
                            <div class="prox-title">Capacitaciones próximas</div>
                            <div class="prox-detail">
                                <strong>2</strong> capacitaciones comienzan hoy<br>
                                <strong>4</strong> capacitaciones esta semana
                            </div>
                        </div>
                    </div>
                    <div class="prox-card">
                        <div class="prox-icon">
                            <svg viewBox="0 0 24 24">
                                <path
                                    d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />
                            </svg>
                        </div>
                        <div>
                            <div class="prox-title">Certificaciones próximas</div>
                            <div class="prox-detail">
                                <strong>1</strong> certificaciones comienzan hoy<br>
                                <strong>3</strong> certificaciones esta semana
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- PANEL DE CONTROL -->
            <div class="panel-title">Panel de Control</div>

            <div class="panel-grid">
                <a href="clientes.php" class="panel-btn">
                    <svg viewBox="0 0 24 24">
                        <path
                            d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                    </svg>
                    Clientes
                </a>
                <a href="capacitaciones.php" class="panel-btn">
                    <svg viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                    </svg>
                    Capacitaciones
                </a>
                <a href="index.php" class="panel-btn">
                    <svg viewBox="0 0 24 24">
                        <path
                            d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM18 20H6V4h5v7h7v9z" />
                    </svg>
                    Certificaciones
                </a>
            </div>

            <div class="panel-grid-2">
                <a href="index.php" class="panel-btn">
                    <svg viewBox="0 0 24 24">
                        <path
                            d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                    </svg>
                    Inscripción certificación
                </a>
                <a href="capacitaciones.php" class="panel-btn">
                    <svg viewBox="0 0 24 24">
                        <path
                            d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                    </svg>
                    Inscripción capacitación
                </a>
            </div>

        </div>
    </main>

    <footer>
        Copyright 2025 — Servicio Nacional de Contratación Pública
    </footer>

    <script>
        function toggleDropdown() {
            document.getElementById('userArea').classList.toggle('open');
        }
        document.addEventListener('click', function (e) {
            var area = document.getElementById('userArea');
            if (!area.contains(e.target)) area.classList.remove('open');
        });
    </script>

</body>

</html>