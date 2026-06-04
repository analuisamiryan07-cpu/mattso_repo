<?php
// includes/navbar.php — Barra de navegación compartida. Variables esperadas: $paginaActual (string)
// Uso: <?php $paginaActual = 'dashboard'; require 'includes/navbar.php'; ?>
?>
<nav class="navbar">
    <a class="navbar-logo" href="dashboard.php">
        <img src="assets/img/LogoWeb2_Mesadetrabajo1-960w.png" alt="MATsso">
    </a>

    <div class="navbar-links">
        <a href="dashboard.php" class="nav-link <?=($paginaActual ?? '') === 'dashboard' ? 'active' : ''?>">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
            </svg>
            Dashboard
        </a>
        <a href="clientes.php" class="nav-link <?=($paginaActual ?? '') === 'clientes' ? 'active' : ''?>">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path
                    d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
            Clientes
        </a>
        <a href="capacitaciones.php" class="nav-link <?=($paginaActual ?? '') === 'capacitaciones' ? 'active' : ''?>">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
            </svg>
            Capacitaciones
        </a>
        <a href="index.php" class="nav-link <?=($paginaActual ?? '') === 'certificaciones' ? 'active' : ''?>">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path
                    d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM18 20H6V4h5v7h7v9z" />
            </svg>
            Certificaciones
        </a>
    </div>

    <div class="user-area" id="userArea">
        <button class="user-btn" onclick="toggleDropdown()">
            <div class="user-avatar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                    <path
                        d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
            </div>
            <?= htmlspecialchars($usuarioActual ?? 'Usuario')?>
            <svg class="chevron" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 10l5 5 5-5z" />
            </svg>
        </button>
        <div class="dropdown">
            <a href="logout.php">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path
                        d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                </svg>
                Cerrar sesión
            </a>
        </div>
    </div>
</nav>

<script>
    function toggleDropdown() {
        document.getElementById('userArea').classList.toggle('open');
    }
    document.addEventListener('click', function (e) {
        var area = document.getElementById('userArea');
        if (area && !area.contains(e.target)) area.classList.remove('open');
    });
</script>