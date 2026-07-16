<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title', 'MATsso')</title>
    <style>
        :root{--navy:#1e3a7b;--blue:#2d5099;--bg:#eef0f4;--line:#d4d9e5;--muted:#6b7a99;--danger:#b91c1c}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:#1a1a2e;font-family:Inter,Arial,sans-serif}nav{min-height:62px;padding:.7rem 1.4rem;background:#fff;border-bottom:2px solid var(--navy);display:flex;align-items:center;gap:1rem;flex-wrap:wrap}.brand{font-weight:800;color:var(--navy);font-size:1.2rem;text-decoration:none}.links{display:flex;gap:.35rem;flex:1;flex-wrap:wrap}.links a,.link-button{border:0;background:none;color:var(--muted);padding:.5rem .7rem;text-decoration:none;cursor:pointer;font:inherit}.links a:hover{color:var(--navy)}main{max-width:1120px;margin:0 auto;padding:2rem 1rem}.card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:1.25rem;margin-bottom:1rem;box-shadow:0 2px 10px #1e3a7b0d}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem}.stat{font-size:2rem;font-weight:800;color:var(--navy)}h1{margin-top:0}h2{margin-bottom:.35rem}label{display:block;font-weight:600;font-size:.85rem;margin:.65rem 0 .3rem}input,select{width:100%;padding:.7rem;border:1px solid var(--line);border-radius:8px;background:#fff}input:disabled{background:#edf0f5;color:#8791a5}.btn{display:inline-block;border:0;border-radius:8px;background:var(--navy);color:#fff;padding:.7rem 1rem;text-decoration:none;cursor:pointer}.btn-secondary{background:#e8edf8;color:var(--navy)}.btn-danger{background:var(--danger)}.muted{color:var(--muted)}.alert{padding:.8rem 1rem;border-radius:8px;margin-bottom:1rem;background:#eafaf0;color:#166534}.errors{background:#fde8e8;color:var(--danger)}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:.7rem;border-bottom:1px solid #e5e7eb}th{font-size:.78rem;text-transform:uppercase;color:var(--muted)}.badge{display:inline-block;border-radius:99px;padding:.25rem .55rem;background:#e8edf8;color:var(--navy);font-size:.78rem}.form-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:0 1rem}.actions,.section-heading,.repeat-card-heading{display:flex;gap:.75rem;align-items:center;justify-content:space-between;flex-wrap:wrap}.form-section{border-top:1px solid var(--line);margin-top:1.5rem;padding-top:1rem}.repeat-list{display:grid;gap:.75rem;margin-top:1rem}.repeat-card{border:1px solid var(--line);background:#f8f9fc;border-radius:10px;padding:1rem}.checks{display:flex;gap:.7rem;flex-wrap:wrap}.checks label,.check-label{display:flex;align-items:center;gap:.35rem}.checks input,.check-label input,.document-option input{width:auto}.link-danger{border:0;background:none;color:var(--danger);cursor:pointer}.document-option{margin:0}[hidden]{display:none!important}@media(max-width:700px){table{display:block;overflow:auto}}
    </style>
</head>
<body>
@auth
<nav>
    <a class="brand" href="{{ auth()->user()->isAdministrator() ? route('admin.dashboard') : route('secretary.dashboard') }}">MATsso MVC</a>
    <div class="links">
        <a href="{{ route('clients.index') }}">Clientes</a>
        <a href="{{ route('documents.create') }}">Certificaciones</a>
        <a href="{{ route('trainings.index') }}">Capacitaciones</a>
        @if(auth()->user()->isAdministrator())
            <a href="{{ route('users.index') }}">Usuarios</a>
            <a href="{{ route('payments.index') }}">Pagos</a>
        @endif
    </div>
    <span>{{ auth()->user()->nombre_completo ?: auth()->user()->usuario }}</span>
    <form method="POST" action="{{ route('logout') }}">@csrf<button class="link-button">Cerrar sesión</button></form>
</nav>
@endauth
<main>
    @if(session('status'))<div class="alert">{{ session('status') }}</div>@endif
    @if($errors->any())
        <div class="alert errors"><strong>Revisa los datos:</strong><ul>@foreach($errors->all() as $error)<li>{{ $error }}</li>@endforeach</ul></div>
    @endif
    @yield('content')
</main>
</body>
</html>
