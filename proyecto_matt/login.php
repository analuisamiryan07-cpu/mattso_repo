<?php
session_start();

require_once __DIR__ . '/includes/db.php';

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = trim($_POST['usuario'] ?? '');
    $pass = trim($_POST['contrasena'] ?? '');

    try {
        $stmt = $pdo->prepare("SELECT usuario, password_hash, rol FROM public.usuarios_admin WHERE usuario = :user AND activo = true");
        $stmt->execute(['user' => $user]);
        $row = $stmt->fetch();

        if ($row && password_verify($pass, $row['password_hash'])) {
            $_SESSION['usuario'] = $row['usuario'];
            $_SESSION['rol'] = $row['rol'];
            header('Location: dashboard.php');
            exit;
        } else {
            $error = 'Usuario o contraseña incorrectos.';
        }
    } catch (PDOException $e) {
        $error = 'Error de conexión con la base de datos.';
    }
}
?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Iniciar sesión — MATsso</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        *,
        *::before,
        *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Inter', sans-serif;
            background: #e8eaed;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        }

        .login-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.5rem;
            width: 100%;
            max-width: 420px;
        }

        /* Logo */
        .logo-block {
            text-align: center;
        }

        .logo-block img {
            width: 260px;
            max-width: 100%;
        }

        /* Card */
        .card {
            background: #fff;
            border-radius: 12px;
            padding: 2rem 2.25rem;
            width: 100%;
            box-shadow: 0 2px 16px rgba(0, 0, 0, .10);
        }

        /* Alerta error */
        .alert-error {
            background: #fdf0ef;
            border: 1px solid #e74c3c;
            border-radius: 7px;
            color: #c0392b;
            font-size: .82rem;
            padding: .65rem .9rem;
            margin-bottom: 1.1rem;
            display: flex;
            align-items: center;
            gap: .5rem;
        }

        .field {
            margin-bottom: 1.1rem;
        }

        label {
            display: block;
            font-size: .83rem;
            font-weight: 500;
            color: #333;
            margin-bottom: .4rem;
        }

        input[type="text"],
        input[type="password"] {
            width: 100%;
            background: #f5f5f5;
            border: 1.5px solid #ddd;
            border-radius: 8px;
            font-family: inherit;
            font-size: .9rem;
            padding: .65rem .9rem;
            color: #222;
            outline: none;
            transition: border-color .2s, background .2s;
        }

        input:focus {
            border-color: #1e3a7b;
            background: #fff;
            box-shadow: 0 0 0 3px rgba(30, 58, 123, .1);
        }

        .btn-login {
            width: 100%;
            background: #111;
            color: #fff;
            font-family: inherit;
            font-size: .95rem;
            font-weight: 600;
            border: none;
            border-radius: 8px;
            padding: .75rem;
            cursor: pointer;
            margin-top: .4rem;
            transition: background .2s, transform .1s;
            letter-spacing: .02em;
        }

        .btn-login:hover {
            background: #2d2d2d;
        }

        .btn-login:active {
            transform: scale(.99);
        }
    </style>
</head>

<body>

    <div class="login-wrapper">

        <div class="logo-block">
            <img src="assets/img/LogoWeb2_Mesadetrabajo1-960w.png"
                alt="MATsso — Certificación y Capacitación Profesional">
        </div>

        <div class="card">

            <?php if ($error): ?>
            <div class="alert-error">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <?= htmlspecialchars($error)?>
            </div>
            <?php
endif; ?>

            <form method="POST" action="">
                <div class="field">
                    <label for="usuario">Usuario</label>
                    <input type="text" id="usuario" name="usuario"
                        value="<?= htmlspecialchars($_POST['usuario'] ?? '')?>" placeholder="Mnanaluisa" required
                        autocomplete="username">
                </div>
                <div class="field">
                    <label for="contrasena">Contraseña</label>
                    <input type="password" id="contrasena" name="contrasena" placeholder="••••••••" required
                        autocomplete="current-password">
                </div>
                <button type="submit" class="btn-login">Ingresar</button>
            </form>

        </div>

    </div>

</body>

</html>