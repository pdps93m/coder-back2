
let currentAction = null;
let currentProductId = null;


document.addEventListener('DOMContentLoaded', function() {
    initializeCartEvents();
    updateCartDisplay();
});



async function updateCartQuantity(productId, currentQuantity, change, maxStock) {
    const newQuantity = currentQuantity + change;
    
    if (newQuantity <= 0) {
        showConfirmModal(
            'Eliminar Producto',
            '¿Estás seguro de que quieres eliminar este producto del carrito?',
            () => removeFromCart(productId)
        );
        return;
    }
    
    if (newQuantity > maxStock) {
        showNotification(`❌ Solo hay ${maxStock} unidades disponibles`, 'error');
        return;
    }

    try {
        showLoading(true);
        
        const response = await fetch(`/api/carts/my-cart/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ quantity: newQuantity })
        });

        if (response.ok) {
            showUpdateModal(`Cantidad actualizada a ${newQuantity} unidades`);
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            const error = await response.json();
            showNotification(`❌ ${error.message || 'Error al actualizar cantidad'}`, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('❌ Error de conexión', 'error');
    } finally {
        showLoading(false);
    }
}

async function removeFromCart(productId, productName = 'este producto') {
    try {
        showLoading(true);
        
        const response = await fetch(`/api/carts/my-cart/products/${productId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showUpdateModal(`${productName} eliminado del carrito`);
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            const error = await response.json();
            showNotification(`❌ ${error.message || 'Error al eliminar producto'}`, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('❌ Error de conexión', 'error');
    } finally {
        showLoading(false);
    }
}

async function clearCart() {
    showConfirmModal(
        'Vaciar Carrito',
        '¿Estás seguro de que quieres eliminar todos los productos del carrito? Esta acción no se puede deshacer.',
        async () => {
            try {
                showLoading(true);
                
                const response = await fetch('/api/carts/my-cart', {
                    method: 'DELETE'
                });

                if (response.ok) {
                    showUpdateModal('Carrito vaciado exitosamente');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } else {
                    const error = await response.json();
                    showNotification(`❌ ${error.message || 'Error al vaciar carrito'}`, 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('❌ Error de conexión', 'error');
            } finally {
                showLoading(false);
            }
        }
    );
}



function showConfirmModal(title, message, onConfirm) {
    const modal = document.getElementById('confirm-modal');
    const titleElement = document.getElementById('modal-title');
    const messageElement = document.getElementById('modal-message');
    const confirmButton = document.getElementById('confirm-action');
    
    titleElement.textContent = title;
    messageElement.textContent = message;
    
    
    const newConfirmButton = confirmButton.cloneNode(true);
    confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
    
    
    newConfirmButton.addEventListener('click', () => {
        closeConfirmModal();
        onConfirm();
    });
    
    modal.style.display = 'block';
}

function closeConfirmModal() {
    const modal = document.getElementById('confirm-modal');
    modal.style.display = 'none';
}

function showUpdateModal(message) {
    const modal = document.getElementById('update-modal');
    const messageElement = document.getElementById('update-message');
    
    messageElement.textContent = message;
    modal.style.display = 'block';
    
    
    setTimeout(() => {
        closeUpdateModal();
    }, 3000);
}

function closeUpdateModal() {
    const modal = document.getElementById('update-modal');
    modal.style.display = 'none';
}

function showNotification(message, type = 'info') {
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    
    setTimeout(() => notification.classList.add('show'), 100);
    
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

function showLoading(show) {
    const existingLoader = document.querySelector('.loading-overlay');
    
    if (show && !existingLoader) {
        const loader = document.createElement('div');
        loader.className = 'loading-overlay';
        loader.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Actualizando carrito...</p>
            </div>
        `;
        document.body.appendChild(loader);
    } else if (!show && existingLoader) {
        document.body.removeChild(existingLoader);
    }
}



function updateCartDisplay() {
    if (window.updateCartCounter) {
        window.updateCartCounter();
    }
    
    
    const cartItems = document.querySelectorAll('.cart-item');
    cartItems.forEach((item, index) => {
        setTimeout(() => {
            item.classList.add('fade-in');
        }, index * 100);
    });
}


function initializeCartEvents() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('close')) {
            closeConfirmModal();
            closeUpdateModal();
        }
    });

    
    window.addEventListener('click', function(e) {
        const confirmModal = document.getElementById('confirm-modal');
        const updateModal = document.getElementById('update-modal');
        
        if (e.target === confirmModal) {
            closeConfirmModal();
        }
        if (e.target === updateModal) {
            closeUpdateModal();
        }
    });

    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') {
            e.preventDefault();
        }
    });
}



function formatPrice(price) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
    }).format(price);
}

function calculateItemTotal(price, quantity) {
    return price * quantity;
}


function handleNetworkError(error) {
    console.error('Network error:', error);
    showNotification('❌ Error de conexión. Verifica tu conexión a internet.', 'error');
}


function redirectAfterSuccess(url, delay = 2000) {
    setTimeout(() => {
        window.location.href = url;
    }, delay);
}
