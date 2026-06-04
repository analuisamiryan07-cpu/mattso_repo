<?php
session_start();
if (!isset($_SESSION['usuario'])) {
    header('Location: login.php');
    exit;
}
$usuarioActual = $_SESSION['usuario'];
?>
<?php require_once 'includes/auth.php'; ?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistema de Certificación — MATsso</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
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
            --navy-light: #2d4e9e;
            --gold: #f5c518;
            --gold-dark: #d4a900;
            --bg: #f0f2f5;
            --surface: #ffffff;
            --border: #d0d7e3;
            --text: #1a1a2e;
            --muted: #6b7a99;
            --success: #1a8a34;
            --danger: #c0392b;
            --radius: 10px;
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
            padding: 2rem 1rem 3rem;
        }

        .container {
            max-width: 880px;
            margin: 0 auto;
        }

        /* ── PAGE HEADER ── */
        .page-header {
            margin-bottom: 1.75rem;
        }

        .page-header h1 {
            font-size: 1.6rem;
            font-weight: 700;
            color: var(--text);
        }

        .page-header p {
            color: var(--muted);
            font-size: .88rem;
            margin-top: .3rem;
        }

        /* ── ALERTS ── */
        .alert {
            padding: .85rem 1.1rem;
            border-radius: var(--radius);
            margin-bottom: 1.5rem;
            font-size: .875rem;
            display: flex;
            align-items: flex-start;
            gap: .65rem;
            border-left: 4px solid;
        }

        .alert-success {
            background: #edfbf1;
            border-color: var(--success);
            color: #145a24;
        }

        .alert-error {
            background: #fdf0ef;
            border-color: var(--danger);
            color: var(--danger);
        }

        .alert a {
            color: inherit;
            font-weight: 600;
        }

        /* ── CARD ── */
        .card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 1.5rem 1.75rem;
            margin-bottom: 1.25rem;
            box-shadow: 0 1px 4px rgba(0, 0, 0, .06);
        }

        .card-title {
            font-size: .75rem;
            font-weight: 700;
            letter-spacing: .09em;
            text-transform: uppercase;
            color: var(--navy);
            margin-bottom: 1.2rem;
            padding-bottom: .65rem;
            border-bottom: 2px solid var(--navy);
            display: flex;
            align-items: center;
            gap: .5rem;
        }

        .card-title svg {
            fill: var(--navy);
            flex-shrink: 0;
        }

        /* ── GRID ── */
        .grid {
            display: grid;
            gap: 1rem;
        }

        .grid-2 {
            grid-template-columns: 1fr 1fr;
        }

        .grid-3 {
            grid-template-columns: 1fr 1fr 1fr;
        }

        @media(max-width: 600px) {

            .grid-2,
            .grid-3 {
                grid-template-columns: 1fr;
            }
        }

        /* ── FIELDS ── */
        .field {
            display: flex;
            flex-direction: column;
            gap: .35rem;
        }

        label {
            font-size: .78rem;
            font-weight: 600;
            color: var(--muted);
            letter-spacing: .02em;
        }

        label span.req {
            color: var(--danger);
            margin-left: 2px;
        }

        input[type="text"],
        input[type="email"],
        input[type="tel"],
        input[type="date"],
        input[type="number"],
        select,
        textarea {
            background: #f7f9fc;
            border: 1.5px solid var(--border);
            border-radius: 7px;
            color: var(--text);
            font-family: inherit;
            font-size: .875rem;
            padding: .58rem .85rem;
            width: 100%;
            transition: border-color .2s, box-shadow .2s;
            outline: none;
        }

        input:focus,
        select:focus,
        textarea:focus {
            border-color: var(--navy-light);
            box-shadow: 0 0 0 3px rgba(30, 58, 123, .12);
            background: #fff;
        }

        textarea {
            resize: vertical;
            min-height: 72px;
        }

        /* ── RADIO BUTTONS ── */
        .radio-group {
            display: flex;
            gap: .65rem;
            flex-wrap: wrap;
        }

        .radio-btn {
            display: flex;
            align-items: center;
            gap: .4rem;
            background: #f7f9fc;
            border: 1.5px solid var(--border);
            border-radius: 7px;
            padding: .5rem 1rem;
            cursor: pointer;
            font-size: .86rem;
            font-weight: 500;
            transition: border-color .2s, background .2s;
            user-select: none;
            color: var(--text);
        }

        .radio-btn input[type="radio"] {
            accent-color: var(--navy);
        }

        .radio-btn:has(input:checked) {
            border-color: var(--navy);
            background: rgba(30, 58, 123, .07);
            color: var(--navy);
        }

        /* ── DOCUMENTOS CHECKBOX ── */
        .docs-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
            gap: .75rem;
        }

        .doc-check {
            display: flex;
            align-items: flex-start;
            gap: .6rem;
            background: #f7f9fc;
            border: 1.5px solid var(--border);
            border-radius: 8px;
            padding: .75rem;
            cursor: pointer;
            transition: border-color .2s, background .2s;
        }

        .doc-check:has(input:checked) {
            border-color: var(--navy);
            background: rgba(30, 58, 123, .06);
        }

        .doc-check input[type="checkbox"] {
            accent-color: var(--navy);
            margin-top: 3px;
            flex-shrink: 0;
        }

        .doc-info {
            display: flex;
            flex-direction: column;
            gap: .2rem;
        }

        .doc-code {
            font-size: .68rem;
            font-weight: 800;
            letter-spacing: .1em;
            color: var(--gold-dark);
            text-transform: uppercase;
        }

        .doc-name {
            font-size: .78rem;
            color: var(--muted);
            line-height: 1.35;
        }

        /* ── BOTÓN ── */
        .btn-wrap {
            text-align: center;
            margin-top: .75rem;
        }

        button[type="submit"] {
            display: inline-flex;
            align-items: center;
            gap: .6rem;
            background: var(--navy);
            color: #fff;
            font-family: inherit;
            font-size: .95rem;
            font-weight: 600;
            border: none;
            border-radius: 8px;
            padding: .85rem 2.5rem;
            cursor: pointer;
            transition: background .2s, transform .15s, box-shadow .2s;
            box-shadow: 0 3px 12px rgba(30, 58, 123, .3);
        }

        button[type="submit"]:hover {
            background: var(--navy-light);
            transform: translateY(-1px);
            box-shadow: 0 5px 18px rgba(30, 58, 123, .35);
        }

        button[type="submit"]:active {
            transform: translateY(0);
        }

        /* ── FOOTER ── */
        footer {
            background: var(--navy-dark);
            color: rgba(255, 255, 255, .55);
            text-align: center;
            font-size: .75rem;
            padding: 1rem;
            margin-top: auto;
        }
    </style>
</head>

<body>

    <!-- NAVBAR -->
    <nav class="navbar">
        <a class="navbar-logo" href="dashboard.php">
            <img src="assets/img/LogoWeb2_Mesadetrabajo1-960w.png" alt="MATsso">
        </a>
        <div class="navbar-search">
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

            <div class="page-header">
                <h1>Sistema de Certificación de Personas</h1>
                <p>Ingresa los datos del candidato una sola vez y genera todos los documentos automáticamente.</p>
            </div>

            <?php if (isset($_GET['ok'])): ?>
            <div class="alert alert-success">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
                <div>¡Documentos generados correctamente! <a href="generados/">Ver carpeta de documentos →</a></div>
            </div>
            <?php
endif; ?>

            <?php if (isset($_GET['error'])): ?>
            <div class="alert alert-error">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                    <path
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                Error al generar documentos:
                <?= htmlspecialchars($_GET['error'])?>
            </div>
            <?php
endif; ?>

            <form method="POST" action="generar.php">

                <!-- ── DATOS DEL CANDIDATO ── -->
                <div class="card">
                    <div class="card-title">
                        <svg width="15" height="15" viewBox="0 0 24 24">
                            <path
                                d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                        </svg>
                        Datos del candidato
                    </div>
                    <div class="grid grid-2">
                        <div class="field">
                            <label for="nombre">Nombre completo <span class="req">*</span></label>
                            <input type="text" id="nombre" name="nombre" required
                                placeholder="Ej: BONILLA SANCHEZ JOSELIN MARCELA">
                        </div>
                        <div class="field">
                            <label for="cedula">Número de cédula <span class="req">*</span></label>
                            <input type="text" id="cedula" name="cedula" required placeholder="Ej: 0202514915"
                                maxlength="13">
                        </div>
                        <div class="field">
                            <label for="telefono">Teléfono celular</label>
                            <input type="tel" id="telefono" name="telefono" placeholder="Ej: 0959139068">
                        </div>
                        <div class="field">
                            <label for="correo">Correo electrónico</label>
                            <input type="email" id="correo" name="correo" placeholder="Ej: correo@gmail.com">
                        </div>
                        <div class="field" style="grid-column: 1 / -1;">
                            <label for="direccion">Dirección</label>
                            <input type="text" id="direccion" name="direccion"
                                placeholder="Ej: Juan Abel Echeverría y Fernando Sánchez de Orellana">
                        </div>
                    </div>
                </div>

                <!-- ── DATOS DEL EXAMEN ── -->
                <div class="card">
                    <div class="card-title">
                        <svg width="15" height="15" viewBox="0 0 24 24">
                            <path
                                d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                        </svg>
                        Datos del examen
                    </div>
                    <div class="grid grid-2">
                        <div class="field">
                            <label for="fecha">Fecha del examen 2 hasta 3 dias antes de esta fecha<span
                                    class="req">*</span></label>
                            <input type="date" id="fecha" name="fecha" required>
                        </div>
                        <div class="field">
                            <label for="ciudad">Ciudad</label>
                            <input type="text" id="ciudad" name="ciudad" placeholder="Ej: Latacunga">
                        </div>
                        <div class="field" style="grid-column: 1 / -1;">
                            <label for="lugar">Lugar de examinación <span class="req">*</span></label>
                            <input type="text" id="lugar" name="lugar" required
                                placeholder="Ej: INSTALACIONES EXTERNA — EMPRESA COORED">
                        </div>
                        <div class="field" style="grid-column: 1 / -1;">
                            <label for="esquema">Esquema de certificación <span class="req">*</span></label>
                            <input type="text" id="esquema" name="esquema" required
                                placeholder="Ej: CUIDADO DE PERSONAS ADULTAS MAYORES">
                        </div>
                        <div class="field" style="grid-column: 1 / -1;">
                            <label>Tipo de examen <span class="req">*</span></label>
                            <div class="radio-group">
                                <label class="radio-btn">
                                    <input type="radio" name="tipo_examen" value="TEÓRICA" required> Teórica
                                </label>
                                <label class="radio-btn">
                                    <input type="radio" name="tipo_examen" value="PRÁCTICA"> Práctica
                                </label>
                                <label class="radio-btn">
                                    <input type="radio" name="tipo_examen" value="TEÓRICA Y PRÁCTICA"> Teórica y
                                    Práctica
                                </label>
                            </div>
                        </div>
                        <div class="field">
                            <label for="puntaje_teorico">Puntaje examen teórico (%)</label>
                            <input type="number" id="puntaje_teorico" name="puntaje_teorico" min="0" max="100"
                                placeholder="Ej: 85">
                        </div>
                        <div class="field">
                            <label for="puntaje_practico">Puntaje examen práctico (%)</label>
                            <input type="number" id="puntaje_practico" name="puntaje_practico" min="0" max="100"
                                placeholder="Ej: 100">
                        </div>
                    </div>
                </div>

                <!-- ── DOCUMENTOS A GENERAR ── -->
                <div class="card">
                    <div class="card-title">
                        <svg width="15" height="15" viewBox="0 0 24 24">
                            <path
                                d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM18 20H6V4h5v7h7v9z" />
                        </svg>
                        Documentos a generar
                    </div>
                    <div class="docs-grid">
                        <label class="doc-check">
                            <input type="checkbox" name="docs[]" value="c02" checked>
                            <div class="doc-info">
                                <span class="doc-code">C02</span>
                                <span class="doc-name">Solicitud para la certificación de personas</span>
                            </div>
                        </label>
                        <label class="doc-check">
                            <input type="checkbox" name="docs[]" value="c05" checked>
                            <div class="doc-info">
                                <span class="doc-code">C05</span>
                                <span class="doc-name">Código de ética y conducta para el examinado</span>
                            </div>
                        </label>
                        <label class="doc-check">
                            <input type="checkbox" name="docs[]" value="c08" checked>
                            <div class="doc-info">
                                <span class="doc-code">C08</span>
                                <span class="doc-name">Lista de asistencia a la examinación</span>
                            </div>
                        </label>
                        <label class="doc-check">
                            <input type="checkbox" name="docs[]" value="c09" checked>
                            <div class="doc-info">
                                <span class="doc-code">C09</span>
                                <span class="doc-name">Acuerdo de cumplimiento para personas certificadas</span>
                            </div>
                        </label>
                        <label class="doc-check">
                            <input type="checkbox" name="docs[]" value="c10" checked>
                            <div class="doc-info">
                                <span class="doc-code">C10</span>
                                <span class="doc-name">Notificación de certificación o no certificación</span>
                            </div>
                        </label>
                        <label class="doc-check">
                            <input type="checkbox" name="docs[]" value="c12" checked>
                            <div class="doc-info">
                                <span class="doc-code">C12</span>
                                <span class="doc-name">Encuesta de satisfacción para el examinado</span>
                            </div>
                        </label>
                    </div>
                </div>

                <div class="btn-wrap">
                    <button type="submit">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                            <path
                                d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM18 20H6V4h5v7h7v9z" />
                        </svg>
                        Generar Documentos
                    </button>
                </div>
            </form>

        </div>
    </main>

    <footer>
        Copyright 2025 — MATsso / SAPPERPROTECTION CIA LTDA &nbsp;·&nbsp;
        <?= date('Y')?>
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