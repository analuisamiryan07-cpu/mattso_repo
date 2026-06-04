<?php
// includes/auth.php — Verificación de sesión. Incluir en cada página protegida.
if (session_status() === PHP_SESSION_NONE)
    session_start();
if (!isset($_SESSION['usuario'])) {
    header('Location: login.php');
    exit;
}
$usuarioActual = $_SESSION['usuario'];