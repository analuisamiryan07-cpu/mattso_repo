document.addEventListener("DOMContentLoaded", function() {
    const listContainer = document.getElementById('cart-item-list');
    const subtotalEl = document.getElementById('cart-subtotal');
    const ivaEl = document.getElementById('cart-iva');
    const totalEl = document.getElementById('cart-total');
    const countEl = document.getElementById('items-count');
    const form = document.getElementById('checkout-form');

    // Tasa de IVA actual en Ecuador
    const TASA_IVA = 0.15; 

    function formatMoney(amount) {
        return "$" + amount.toFixed(2);
    }

    function renderCart() {
        let cart = JSON.parse(localStorage.getItem('matsso_cart')) || [];
        listContainer.innerHTML = '';

        if(cart.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-basket"></i>
                    <p>No tienes cursos en tu carrito.</p>
                </div>
            `;
            subtotalEl.innerText = "$0.00";
            ivaEl.innerText = "$0.00";
            totalEl.innerText = "$0.00";
            countEl.innerText = "0";
            return;
        }

        let subtotal = 0;
        let totalItems = 0;

        cart.forEach((item, index) => {
            // Compatibilidad hacia atrás: si no tiene cantidad, es 1
            if (!item.cantidad) item.cantidad = 1;
            
            let itemTotal = item.precio * item.cantidad;
            subtotal += itemTotal;
            totalItems += item.cantidad;

            const itemHtml = `
                <div class="cart-card">
                    <div class="cart-card-img">
                        <img src="${item.imagen}" alt="${item.titulo}" onerror="this.src='https://via.placeholder.com/250x150/e2e8f0/a0aec0?text=IMG'">
                    </div>
                    <div class="cart-card-body">
                        <button class="cart-item-remove" onclick="removeFromCart(${index})" title="Eliminar"><i class="far fa-trash-alt"></i></button>
                        <h4 class="cart-card-title">${item.titulo}</h4>
                        <div class="cart-card-badges">
                            <span class="badge badge-modalidad">${item.modalidad}</span>
                        </div>
                        <div class="cart-card-bottom">
                            <div class="cart-card-quantity">
                                <span class="qty-label">Participantes:</span>
                                <div class="qty-controls">
                                    <button type="button" onclick="updateQty(${index}, -1)"><i class="fas fa-minus"></i></button>
                                    <span class="qty-val">${item.cantidad}</span>
                                    <button type="button" onclick="updateQty(${index}, 1)"><i class="fas fa-plus"></i></button>
                                </div>
                            </div>
                            <div class="cart-card-price-info">
                                <span class="valor-unitario">Valor: ${formatMoney(item.precio)}</span>
                                <strong class="valor-total">Total: ${formatMoney(itemTotal)}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            listContainer.insertAdjacentHTML('beforeend', itemHtml);
        });

        // Calcular totales
        const iva = subtotal * TASA_IVA;
        const total = subtotal + iva;

        countEl.innerText = totalItems;
        subtotalEl.innerText = formatMoney(subtotal);
        ivaEl.innerText = formatMoney(iva);
        totalEl.innerText = formatMoney(total);
    }

    window.updateQty = function(index, change) {
        let cart = JSON.parse(localStorage.getItem('matsso_cart')) || [];
        if(cart[index]) {
            if (!cart[index].cantidad) cart[index].cantidad = 1;
            cart[index].cantidad += change;
            if(cart[index].cantidad < 1) cart[index].cantidad = 1; // Mínimo 1
            localStorage.setItem('matsso_cart', JSON.stringify(cart));
            renderCart();
        }
    };

    // Funcionalidad global de eliminación
    window.removeFromCart = function(index) {
        let cart = JSON.parse(localStorage.getItem('matsso_cart')) || [];
        cart.splice(index, 1);
        localStorage.setItem('matsso_cart', JSON.stringify(cart));
        renderCart();
    };

    // Manejo de formulario
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        let cart = JSON.parse(localStorage.getItem('matsso_cart')) || [];
        if(cart.length === 0) {
            alert("No tienes cursos en el carrito para procesar el pago.");
            return;
        }

        const name = document.getElementById('billing-name').value;
        alert(`¡Gracias por tu compra, ${name}!\nTu pedido está siendo procesado.`);
        
        // Limpiar carrito luego de la compra exitosa (simulada)
        localStorage.removeItem('matsso_cart');
        window.location.href = "index2.html.html";
    });

    // Iniciar render
    renderCart();
});
