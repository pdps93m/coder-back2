let cart = JSON.parse(localStorage.getItem('cart')) || [];

function addToCart(productId, productName, price, stock) {
    
    const quantity = parseInt(document.getElementById(`qty-${productId}`).value);
    
    if (quantity <= 0 || quantity > stock) {
        alert('❌ Cantidad no válida');
        return;
    }

    // Enviar al backend
    fetch('/api/cart/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            productId: productId,
            quantity: quantity
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateCartCounter();
            
            showSuccessMessage(productName, quantity);
            
            updateLocalStorageCart(productId, productName, price, quantity, stock);
        } else {
            alert('❌ Error: ' + data.message);
        }
    })
    .catch(error => {
        alert('❌ Error al agregar producto al carrito');
    });
}

function updateLocalStorageCart(productId, productName, price, quantity, stock) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            productId: productId,
            name: productName,
            price: price,
            quantity: quantity,
            stock: stock
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
}

function increaseQuantity(productId, maxStock) {
    const qtyInput = document.getElementById(`qty-${productId}`);
    const currentValue = parseInt(qtyInput.value);
    
    if (currentValue < maxStock) {
        qtyInput.value = currentValue + 1;
    }
}

function decreaseQuantity(productId) {
    const qtyInput = document.getElementById(`qty-${productId}`);
    const currentValue = parseInt(qtyInput.value);
    
    if (currentValue > 1) {
        qtyInput.value = currentValue - 1;
    }
}

function updateCartCounter() {
    // Intentar obtener del backend primero
    fetch('/api/cart/session')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.totalItems !== undefined) {
                const counter = document.getElementById('cart-counter');
                if (counter) {
                    counter.textContent = data.totalItems;
                }
            } else {
                // Fallback a localStorage
                updateCartCounterFromLocalStorage();
            }
        })
        .catch(error => {
            updateCartCounterFromLocalStorage();
        });
}

function updateCartCounterFromLocalStorage() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const counter = document.getElementById('cart-counter');
    if (counter) {
        counter.textContent = totalItems;
    }
}

function showSuccessMessage(productName, quantity) {
    // Crear notificación simple
    const message = `✅ ${productName} (${quantity} ${quantity === 1 ? 'unidad' : 'unidades'}) agregado al carrito`;
    
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        font-weight: 600;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    updateCartCounter();
    
    // Verificar que las funciones están disponibles globalmente
    window.addToCart = addToCart;
    window.increaseQuantity = increaseQuantity;
    window.decreaseQuantity = decreaseQuantity;
});
