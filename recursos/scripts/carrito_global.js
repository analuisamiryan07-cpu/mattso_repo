// Sistema Global del Carrito Matsso usando localStorage
window.addToCart = function(titulo, precio, imagen, modalidad) {
    // Evitar salto si se usa en tag a
    if(event) event.preventDefault();

    let cart = JSON.parse(localStorage.getItem('matsso_cart')) || [];
    
    // Validar si el curso ya está en el carrito
    const existe = cart.find(item => item.titulo === titulo);
    if (!existe) {
        cart.push({
            titulo: titulo,
            precio: parseFloat(precio.replace('$', '').replace(',', '')), // Convert "$150.00" a 150.00
            imagen: imagen,
            modalidad: modalidad
        });
        localStorage.setItem('matsso_cart', JSON.stringify(cart));
    }
    
    // Redirigir siempre a carrito.html
    window.location.href = "carrito.html";
};
