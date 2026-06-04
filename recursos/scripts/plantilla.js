document.addEventListener("DOMContentLoaded", function() {
    // Obtener el ID de la url, ejemplo: plantilla.html?id=contacto
    const urlParams = new URLSearchParams(window.location.search);
    const pageId = urlParams.get('id');

    const appContent = document.getElementById('app-content');
    
    if (!appContent) return;

    if (pageId && typeof pageData !== 'undefined' && pageData[pageId]) {
        // Encontramos los datos, inyectar el HTML:
        appContent.innerHTML = pageData[pageId];
        
        // Si hay scripts embebidos en el string (del Elementor original), 
        // a veces es necesario reactivarlos. Pero como la copia fue brutal, 
        // simplemente inyectarlo debería mostrar el HTML correcto:
        
        // Opcional: Hacer scroll arriba luego del cambio
        window.scrollTo(0, 0);
    } else {
        // Fallback
        appContent.innerHTML = `
            <div style="padding: 100px 20px; text-align: center;">
                <h2>Lo sentimos, no encontramos la página solicitada.</h2>
                <a href="index.html" style="color: #0170B9; text-decoration: underline;">Volver al inicio</a>
            </div>
        `;
    }
});
