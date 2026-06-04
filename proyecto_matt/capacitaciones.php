<?php require_once 'includes/auth.php'; ?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Capacitaciones — MATsso</title>
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
        }

        body {
            font-family: 'Inter', sans-serif;
            background: var(--bg);
            color: var(--text);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        /* ── NAVBAR (mismo estilo que clientes) ── */
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

        /* ── CONTENT ── */
        main {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }

        .coming-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 3rem 2.5rem;
            text-align: center;
            max-width: 480px;
            width: 100%;
            box-shadow: 0 2px 16px rgba(30, 58, 123, .07);
        }

        .coming-icon {
            width: 80px;
            height: 80px;
            background: #e8edf8;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
        }

        .coming-icon svg {
            fill: var(--navy);
            width: 40px;
            height: 40px;
        }

        .coming-title {
            font-size: 1.35rem;
            font-weight: 700;
            margin-bottom: .6rem;
        }

        .coming-text {
            font-size: .88rem;
            color: var(--muted);
            line-height: 1.7;
            margin-bottom: 1.75rem;
        }

        .badge-soon {
            display: inline-flex;
            align-items: center;
            gap: .4rem;
            background: linear-gradient(135deg, var(--navy) 0%, #4a6fa5 100%);
            color: #fff;
            font-size: .78rem;
            font-weight: 600;
            letter-spacing: .06em;
            text-transform: uppercase;
            padding: .35rem .9rem;
            border-radius: 999px;
            margin-bottom: 1.5rem;
        }

        .features {
            list-style: none;
            text-align: left;
            display: flex;
            flex-direction: column;
            gap: .6rem;
            margin-bottom: 2rem;
        }

        .features li {
            display: flex;
            align-items: flex-start;
            gap: .6rem;
            font-size: .84rem;
            color: var(--muted);
        }

        .features li svg {
            fill: var(--navy);
            flex-shrink: 0;
            margin-top: 1px;
        }

        .features li strong {
            color: var(--text);
        }

        .btn-back {
            display: inline-flex;
            align-items: center;
            gap: .45rem;
            background: var(--navy);
            color: #fff;
            text-decoration: none;
            font-size: .85rem;
            font-weight: 600;
            border-radius: 8px;
            padding: .65rem 1.4rem;
            transition: background .2s;
        }

        .btn-back:hover {
            background: var(--navy-btn);
        }

        .btn-back svg {
            fill: #fff;
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

    <?php $paginaActual = 'capacitaciones';
require 'includes/navbar.php'; ?>

    <main>
        <div class="coming-card">

            <div class="badge-soon">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                    <path
                        d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z" />
                </svg>
                Próximamente
            </div>

            <div class="coming-icon">
                <svg viewBox="0 0 24 24">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                </svg>
            </div>

            <div class="coming-title">Módulo de Capacitaciones</div>
            <div class="coming-text">
                Este módulo está en desarrollo. Aquí podrás gestionar y registrar todas las capacitaciones de la
                empresa.
            </div>

            <ul class="features">
                <li>
                    <svg width="16" height="16" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    <span><strong>Registro de capacitaciones</strong> — alta, edición y seguimiento</span>
                </li>
                <li>
                    <svg width="16" height="16" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    <span><strong>Listado de participantes</strong> por capacitación</span>
                </li>
                <li>
                    <svg width="16" height="16" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    <span><strong>Generación automática</strong> de documentos de capacitación</span>
                </li>
                <li>
                    <svg width="16" height="16" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    <span><strong>Estadísticas</strong> de asistencia y aprobación</span>
                </li>
            </ul>

            <a href="dashboard.php" class="btn-back">
                <svg width="15" height="15" viewBox="0 0 24 24">
                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                </svg>
                Volver al Dashboard
            </a>

        </div>
    </main>

    <footer>Copyright 2025 — Servicio Nacional de Contratación Pública</footer>
</body>

</html>