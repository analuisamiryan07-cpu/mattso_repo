<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title', 'MATsso')</title>
    <style>
        /* ── Tokens ── */
        :root {
            --navy:       #0f2a5c;
            --navy-mid:   #1a3d7a;
            --blue:       #2458b3;
            --blue-light: #e8eef8;
            --accent:     #f5a623;
            --accent-dim: #fef3dc;
            --success:    #15803d;
            --success-bg: #dcfce7;
            --danger:     #b91c1c;
            --danger-bg:  #fee2e2;
            --bg:         #f0f2f8;
            --surface:    #ffffff;
            --border:     #dde1ec;
            --text:       #111827;
            --muted:      #64748b;
            --shadow-sm:  0 1px 3px rgba(15,42,92,.08), 0 1px 2px rgba(15,42,92,.05);
            --shadow-md:  0 4px 16px rgba(15,42,92,.10), 0 2px 6px rgba(15,42,92,.06);
            --radius:     10px;
        }

        /* ── Reset ── */
        *, *::before, *::after { box-sizing: border-box; }
        body {
            margin: 0;
            background: var(--bg);
            color: var(--text);
            font-family: 'Segoe UI', system-ui, -apple-system, Arial, sans-serif;
            font-size: 15px;
            line-height: 1.6;
        }

        /* ── Nav ── */
        nav {
            position: sticky;
            top: 0;
            z-index: 100;
            background: var(--navy);
            padding: 0 1.5rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            min-height: 60px;
            box-shadow: 0 2px 12px rgba(0,0,0,.25);
        }
        .brand {
            display: inline-flex;
            align-items: center;
            text-decoration: none;
            white-space: nowrap;
        }
        .brand-logo { height: 38px; width: auto; display: block; }
        .brand span { color: var(--accent); }
        .nav-links {
            display: flex;
            gap: .15rem;
            flex: 1;
            flex-wrap: wrap;
        }
        .nav-links a {
            color: rgba(255,255,255,.7);
            text-decoration: none;
            padding: .45rem .85rem;
            border-radius: 6px;
            font-size: .9rem;
            font-weight: 500;
            transition: background .15s, color .15s;
        }
        .nav-links a:hover,
        .nav-links a.active { background: rgba(255,255,255,.12); color: #fff; }
        .nav-user {
            color: rgba(255,255,255,.65);
            font-size: .85rem;
            white-space: nowrap;
        }
        .link-button {
            border: 0;
            background: none;
            color: rgba(255,255,255,.65);
            cursor: pointer;
            font: inherit;
            font-size: .85rem;
            padding: .45rem .75rem;
            border-radius: 6px;
            transition: background .15s, color .15s;
        }
        .link-button:hover { background: rgba(255,255,255,.1); color: #fff; }

        /* ── Main ── */
        main {
            max-width: 1160px;
            margin: 0 auto;
            padding: 2rem 1.25rem;
        }

        /* ── Page header ── */
        .page-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 1rem;
            flex-wrap: wrap;
            margin-bottom: 1.5rem;
        }
        .page-header h1 { margin: 0 0 .2rem; }
        .page-header .muted { margin: 0; }

        /* ── Headings ── */
        h1 {
            font-size: 1.65rem;
            font-weight: 800;
            color: var(--navy);
            margin: 0 0 .25rem;
            letter-spacing: -.02em;
        }
        h2 {
            font-size: 1.05rem;
            font-weight: 700;
            color: var(--navy);
            margin: 0 0 .35rem;
        }

        /* ── Alert / flash ── */
        .alert {
            display: flex;
            align-items: center;
            gap: .6rem;
            padding: .85rem 1.1rem;
            border-radius: var(--radius);
            margin-bottom: 1.25rem;
            font-weight: 500;
            font-size: .9rem;
            border-left: 4px solid;
        }
        .alert { background: var(--success-bg); color: var(--success); border-color: var(--success); }
        .alert.errors { background: var(--danger-bg); color: var(--danger); border-color: var(--danger); }
        .alert ul { margin: .4rem 0 0; padding-left: 1.2rem; }

        /* ── Card ── */
        .card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 1.5rem;
            margin-bottom: 1.25rem;
            box-shadow: var(--shadow-sm);
        }
        .card h2 { margin-bottom: 1rem; }
        .table-card { padding: 0; overflow: hidden; }
        .table-card h2 { padding: 1.25rem 1.5rem 0; }

        /* ── Search bar ── */
        .search-bar {
            display: flex;
            gap: .75rem;
            align-items: center;
            padding: 1rem 1.25rem;
        }
        .search-bar input { flex: 1; margin: 0; }

        /* ── Buttons ── */
        .btn {
            display: inline-flex;
            align-items: center;
            gap: .4rem;
            border: 0;
            border-radius: 7px;
            background: var(--navy);
            color: #fff;
            padding: .6rem 1.1rem;
            font: inherit;
            font-size: .88rem;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            white-space: nowrap;
            transition: background .15s, box-shadow .15s, transform .1s;
            box-shadow: 0 1px 3px rgba(15,42,92,.2);
        }
        .btn:hover { background: var(--navy-mid); box-shadow: 0 2px 8px rgba(15,42,92,.25); }
        .btn:active { transform: translateY(1px); }
        .btn-secondary { background: var(--blue-light); color: var(--navy); box-shadow: none; }
        .btn-secondary:hover { background: #d8e3f3; }
        .btn-danger { background: var(--danger); }
        .btn-danger:hover { background: #991b1b; }
        .btn-sm { padding: .4rem .8rem; font-size: .82rem; }
        .btn-accent { background: var(--accent); color: var(--navy); }
        .btn-accent:hover { background: #e09215; }

        /* ── Table ── */
        table { width: 100%; border-collapse: collapse; }
        thead tr { background: #f7f9fd; border-bottom: 2px solid var(--border); }
        th {
            text-align: left;
            padding: .85rem 1.25rem;
            font-size: .75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: .06em;
            color: var(--muted);
        }
        td {
            padding: .85rem 1.25rem;
            border-bottom: 1px solid var(--border);
            vertical-align: middle;
        }
        tbody tr:last-child td { border-bottom: 0; }
        tbody tr:hover { background: #f8faff; }
        .action-btns { display: flex; gap: .5rem; justify-content: flex-end; flex-wrap: wrap; }
        .file-link {
            color: var(--blue);
            text-decoration: none;
            font-size: .83rem;
            display: inline-block;
            padding: .1rem 0;
        }
        .file-link:hover { text-decoration: underline; }

        /* ── Pagination ── */
        .pagination-wrapper {
            padding: 1rem 1.25rem;
            display: flex;
            justify-content: flex-end;
        }
        .pagination-wrapper nav { display: flex; gap: .3rem; align-items: center; flex-wrap: wrap; }
        .pagination-wrapper span, .pagination-wrapper a {
            display: inline-flex; align-items: center; justify-content: center;
            min-width: 2rem; height: 2rem; padding: 0 .5rem;
            border-radius: 6px; font-size: .83rem; font-weight: 500;
            color: var(--navy); text-decoration: none; border: 1px solid var(--border);
            background: var(--surface);
        }
        .pagination-wrapper a:hover { background: var(--blue-light); }
        .pagination-wrapper span[aria-current] { background: var(--navy); color: #fff; border-color: var(--navy); }
        .pagination-wrapper span[aria-disabled] { color: var(--muted); pointer-events: none; }

        /* ── Forms ── */
        label {
            display: block;
            font-weight: 600;
            font-size: .83rem;
            margin: .7rem 0 .3rem;
            color: var(--navy);
        }
        input, select, textarea {
            width: 100%;
            padding: .65rem .85rem;
            border: 1.5px solid var(--border);
            border-radius: 7px;
            background: var(--surface);
            color: var(--text);
            font: inherit;
            font-size: .9rem;
            transition: border-color .15s, box-shadow .15s;
            outline: none;
        }
        input:focus, select:focus, textarea:focus {
            border-color: var(--blue);
            box-shadow: 0 0 0 3px rgba(36,88,179,.12);
        }
        input:disabled { background: #f0f2f8; color: var(--muted); }
        input[type="checkbox"], input[type="radio"] { width: auto; }
        .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
            gap: 0 1.25rem;
        }

        /* ── Form sections ── */
        .form-section {
            border-top: 1px solid var(--border);
            margin-top: 1.75rem;
            padding-top: 1.25rem;
        }
        .section-heading {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 1rem;
            flex-wrap: wrap;
            margin-bottom: 1rem;
        }
        .repeat-list { display: grid; gap: .75rem; margin-top: .75rem; }
        .repeat-card {
            border: 1.5px solid var(--border);
            background: #f7f9fd;
            border-radius: 8px;
            padding: 1.1rem;
        }
        .repeat-card-heading {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: .75rem;
        }
        .checks { display: flex; gap: .75rem; flex-wrap: wrap; margin-top: .5rem; }
        .checks label, .check-label { display: flex; align-items: center; gap: .4rem; font-weight: 500; font-size: .88rem; }

        /* ── Document options grid ── */
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: .75rem; margin: .75rem 0 1.25rem; }
        .document-option {
            margin: 0;
            border: 1.5px solid var(--border);
            border-radius: 8px;
            padding: .85rem 1rem;
            display: flex;
            align-items: center;
            gap: .6rem;
            cursor: pointer;
            font-weight: 600;
            font-size: .88rem;
            transition: border-color .15s, background .15s;
        }
        .document-option:hover { border-color: var(--blue); background: var(--blue-light); }
        .document-option input { width: auto; }

        /* ── Education card ── */
        .education-card .education-fields { margin-top: .75rem; }

        /* ── Link danger ── */
        .link-danger { border: 0; background: none; color: var(--danger); cursor: pointer; font: inherit; font-size: .83rem; font-weight: 600; padding: .2rem .5rem; border-radius: 5px; }
        .link-danger:hover { background: var(--danger-bg); }

        /* ── Nav dropdown (Clientes) ── */
        .nav-dd-wrap {
            position: relative;
        }
        .nav-dd-btn {
            border: 0;
            background: none;
            color: rgba(255,255,255,.7);
            cursor: pointer;
            font: inherit;
            font-size: .9rem;
            font-weight: 500;
            padding: .45rem .85rem;
            border-radius: 6px;
            display: flex;
            align-items: center;
            gap: .3rem;
            transition: background .15s, color .15s;
        }
        .nav-dd-btn:hover,
        .nav-dd-btn.active { background: rgba(255,255,255,.12); color: #fff; }
        .nav-dd-arrow { font-size: .7rem; opacity: .75; transition: transform .15s; }
        .nav-dd-menu {
            display: none;
            position: absolute;
            top: calc(100% + 6px);
            left: 0;
            background: #1a3d7a;
            border-radius: 8px;
            min-width: 160px;
            box-shadow: 0 8px 24px rgba(0,0,0,.25);
            overflow: hidden;
            z-index: 200;
        }
        .nav-dd-menu a {
            display: block;
            color: rgba(255,255,255,.8);
            padding: .6rem 1rem;
            font-size: .88rem;
            font-weight: 500;
            text-decoration: none;
            transition: background .12s, color .12s;
            white-space: nowrap;
        }
        .nav-dd-menu a:hover,
        .nav-dd-menu a.active { background: rgba(255,255,255,.12); color: #fff; }
        .nav-dd-wrap:hover .nav-dd-menu,
        .nav-dd-wrap:focus-within .nav-dd-menu { display: block; }
        .nav-dd-wrap:hover .nav-dd-arrow { transform: rotate(180deg); }

        /* ── Misc ── */
        .muted { color: var(--muted); font-size: .88rem; margin: 0; }
        .stat { font-size: 2.2rem; font-weight: 800; color: var(--navy); }
        .badge { display: inline-flex; align-items: center; border-radius: 99px; padding: .2rem .65rem; font-size: .75rem; font-weight: 700; letter-spacing: .02em; }
        .badge-blue { background: var(--blue-light); color: var(--navy); }
        .badge-green { background: var(--success-bg); color: var(--success); }
        .badge-red { background: var(--danger-bg); color: var(--danger); }
        [hidden] { display: none !important; }

        /* ── Actions bar ── */
        .actions { display: flex; gap: .75rem; align-items: center; justify-content: space-between; flex-wrap: wrap; margin-bottom: 1.25rem; }

        /* ── Responsive ── */
        @media (max-width: 700px) {
            .table-card { overflow-x: auto; }
            table { min-width: 560px; }
            .page-header { flex-direction: column; }
            .search-bar { flex-wrap: wrap; }
        }
    </style>
    @stack('styles')
</head>
<body>
@auth
<nav>
    <a class="brand" href="{{ auth()->user()->isAdministrator() ? route('admin.dashboard') : route('secretary.dashboard') }}">
        <img src="/images/spr-logo.png" alt="SPR" class="brand-logo">
    </a>
    <div class="nav-links">
        <div class="nav-dd-wrap">
            <button class="nav-dd-btn @if(request()->routeIs('clients.*')) active @endif">
                Clientes <span class="nav-dd-arrow">▾</span>
            </button>
            <div class="nav-dd-menu">
                <a href="{{ route('clients.index') }}" @class(['active' => request()->routeIs('clients.index')])>Clientes local</a>
                <a href="{{ route('clients.web') }}"   @class(['active' => request()->routeIs('clients.web')])>Clientes web</a>
            </div>
        </div>
        @if(auth()->user()->isAdministrator())
            <div class="nav-dd-wrap">
                <button class="nav-dd-btn @if(request()->routeIs('capacitaciones.*') || request()->routeIs('cursos.*') || request()->routeIs('catalog.*')) active @endif">
                    Programas <span class="nav-dd-arrow">▾</span>
                </button>
                <div class="nav-dd-menu">
                    <a href="{{ route('capacitaciones.index') }}" @class(['active' => request()->routeIs('capacitaciones.*')])>Capacitaciones</a>
                    <a href="{{ route('cursos.index') }}" @class(['active' => request()->routeIs('cursos.*')])>Cursos</a>
                    <a href="{{ route('catalog.index') }}" @class(['active' => request()->routeIs('catalog.*')])>Certificaciones</a>
                </div>
            </div>
            <a href="{{ route('qr-certs.index') }}" @class(['active' => request()->routeIs('qr-certs.*')])>QR Certs</a>
            <a href="{{ route('users.index') }}" @class(['active' => request()->routeIs('users.*')])>Usuarios</a>
            <a href="{{ route('payments.index') }}" @class(['active' => request()->routeIs('payments.*')])>Pagos</a>
            <a href="{{ route('horas.index') }}" @class(['active' => request()->routeIs('horas.*')])>Gestión de Horas</a>
        @endif
    </div>
    <span class="nav-user">{{ auth()->user()->nombre_completo ?: auth()->user()->usuario }}</span>
    <form method="POST" action="{{ route('logout') }}">@csrf<button class="link-button">Cerrar sesión</button></form>
</nav>
@endauth
<main>
    @if(session('status'))
        <div class="alert">✓ {{ session('status') }}</div>
    @endif
    @if($errors->any())
        <div class="alert errors">
            <div><strong>Revisa los datos:</strong><ul>@foreach($errors->all() as $error)<li>{{ $error }}</li>@endforeach</ul></div>
        </div>
    @endif
    @yield('content')
</main>
@stack('scripts')
</body>
</html>
