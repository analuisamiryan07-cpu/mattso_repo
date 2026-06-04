<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'MATsso - Expansión de Dominio')</title>
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
            justify-content: space-between;
        }

        .navbar-logo {
            font-weight: 700;
            color: var(--navy);
            text-decoration: none;
            font-size: 1.2rem;
        }

        .user-area {
            display: flex;
            gap: 1rem;
            align-items: center;
        }

        main {
            flex: 1;
            padding: 2rem 1rem 3rem;
            max-width: 900px;
            margin: 0 auto;
            width: 100%;
        }

        .card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 1.5rem 1.75rem;
            box-shadow: 0 1px 4px rgba(0, 0, 0, .06);
            margin-bottom: 1.5rem;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: .5rem;
            background: var(--navy);
            color: #fff;
            font-family: inherit;
            font-size: .95rem;
            font-weight: 600;
            border: none;
            border-radius: 8px;
            padding: .65rem 1.5rem;
            cursor: pointer;
            text-decoration: none;
            transition: background .2s;
        }

        .btn:hover {
            background: var(--navy-light);
        }

        .btn-danger {
            background: #fff;
            border: 1px solid var(--danger);
            color: var(--danger);
        }

        .btn-danger:hover {
            background: #fdf0ef;
        }

        .input-group {
            margin-bottom: 1rem;
            display: flex;
            flex-direction: column;
            gap: .4rem;
        }

        .input-group label {
            font-size: .85rem;
            font-weight: 600;
            color: var(--muted);
        }

        .input-group input,
        .input-group select {
            background: #f7f9fc;
            border: 1.5px solid var(--border);
            border-radius: 7px;
            padding: .6rem .85rem;
            font-family: inherit;
            font-size: .9rem;
            outline: none;
        }

        .input-group input:focus,
        .input-group select:focus {
            border-color: var(--navy-light);
            background: #fff;
        }

        .alert {
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1.5rem;
            font-size: .9rem;
        }

        .alert-error {
            background: #fdf0ef;
            color: var(--danger);
            border-left: 4px solid var(--danger);
        }

        .alert-success {
            background: #edfbf1;
            color: var(--success);
            border-left: 4px solid var(--success);
        }

        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
        }

        .table th,
        .table td {
            padding: .75rem;
            text-align: left;
            border-bottom: 1px solid var(--border);
            font-size: .9rem;
        }

        .table th {
            color: var(--muted);
            font-weight: 600;
        }

        .badge {
            padding: .2rem .6rem;
            border-radius: 20px;
            font-size: .75rem;
            font-weight: 600;
        }

        .badge-admin {
            background: #eef2ff;
            color: var(--navy-light);
        }

        .badge-secretaria {
            background: #fff8e1;
            color: var(--gold-dark);
        }

        footer {
            background: var(--navy-dark);
            color: rgba(255, 255, 255, .55);
            text-align: center;
            padding: 1rem;
            margin-top: auto;
            font-size: .8rem;
        }

        .header-flex {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }
    </style>
</head>

<body>

    @auth
        <nav class="navbar">
            <a class="navbar-logo" href="{{ route('dashboard') }}">Matsso</a>
            <div class="user-area">
                <span style="font-size: .9rem; font-weight: 600;">{{ Auth::user()->name ?? Auth::user()->username }}
                    ({{ Auth::user()->role }})</span>
                @if(Auth::user()->isAdmin())
                    <a href="{{ route('users.index') }}"
                        style="color:var(--navy); font-size: .85rem; font-weight: 600; text-decoration: none;">Gestión de
                        Usuarios</a>
                @endif
                <form action="{{ route('logout') }}" method="POST" style="display: inline;">
                    @csrf
                    <button type="submit" class="btn btn-danger" style="padding: .4rem .8rem; font-size: .8rem;">Cerrar
                        sesión</button>
                </form>
            </div>
        </nav>
    @endauth

    <main>
        @if(session('success'))
            <div class="alert alert-success">{{ session('success') }}</div>
        @endif
        @if(session('status'))
            <div class="alert alert-success">{{ session('status') }}</div>
        @endif
        @if($errors->any())
            <div class="alert alert-error">
                <ul style="margin-left: 1.5rem;">
                    @foreach($errors->all() as $err)
                        <li>{{ $err }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        @yield('content')
    </main>

    <footer>
        &copy; {{ date('Y') }} Matsso / Zapperindustries
    </footer>
</body>

</html>