let currentStep = 1;
let formData = {
    shipping: {},
    payment: {},
    cart: {}
};

document.addEventListener('DOMContentLoaded', function() {
    initializeCheckout();
    setupEventListeners();
    loadCartData();
});


function initializeCheckout() {
    setupFormValidation();
    
   
    setupPaymentMethods();
    
    
    setupInputFormatting();
    
   
    loadUserData();
}


function setupEventListeners() {
   
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleFormSubmit);
    }
    
    
    const paymentMethods = document.querySelectorAll('.payment-method');
    paymentMethods.forEach(method => {
        method.addEventListener('click', handlePaymentMethodChange);
    });
    
   
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearError);
    });
}


async function loadCartData() {
    try {
        const response = await fetch('/api/cart/session', {
            method: 'GET',
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar el carrito');
        }
        
        const data = await response.json();
        
        if (!data.success || !data.cart || !data.cart.products || data.cart.products.length === 0) {
            window.location.href = '/carrito';
            return;
        }
        
        formData.cart = data.cart;
        
    } catch (error) {
        showError('Error al cargar los datos del carrito');
    }
}


function loadUserData() {
    
}


function setupFormValidation() {
}


function setupPaymentMethods() {
    const cardForm = document.getElementById('card-form');
    
    
    function toggleCardForm() {
        const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked');
        if (selectedMethod) {
            const isCard = selectedMethod.value === 'credit_card' || selectedMethod.value === 'debit_card';
            if (cardForm) {
                cardForm.style.display = isCard ? 'block' : 'none';
            }
        }
    }
    
    
    toggleCardForm();
    
    
    const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', toggleCardForm);
    });
}


function setupInputFormatting() {
    
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
            let formattedValue = value.replace(/(.{4})/g, '$1 ').trim();
            e.target.value = formattedValue;
        });
    }
    
    
    const expiryInput = document.getElementById('expiryDate');
    if (expiryInput) {
        expiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }
    
    
    const cvvInput = document.getElementById('cvv');
    if (cvvInput) {
        cvvInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }
    
    
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/[^\d\s\-\+\(\)]/g, '');
        });
    }
}


function handlePaymentMethodChange(e) {
    
    document.querySelectorAll('.payment-method').forEach(method => {
        method.classList.remove('active');
    });
    
    
    e.currentTarget.classList.add('active');
    
    
    const radio = e.currentTarget.querySelector('input[type="radio"]');
    if (radio) {
        radio.checked = true;
    }
}


function nextStep() {
    if (currentStep === 1) {
        if (validateShippingData()) {
            goToStep(2);
        }
    } else if (currentStep === 2) {
        if (validatePaymentData()) {
            updateConfirmationSummary();
            goToStep(3);
        }
    }
}


function prevStep() {
    if (currentStep > 1) {
        goToStep(currentStep - 1);
    }
}


function goToStep(step) {
    currentStep = step;
    
    
    updateStepIndicators();
    
    
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(getSectionId(step));
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


function getSectionId(step) {
    switch (step) {
        case 1: return 'shipping-section';
        case 2: return 'payment-section';
        case 3: return 'confirmation-section';
        default: return 'shipping-section';
    }
}


function updateStepIndicators() {
    document.querySelectorAll('.step').forEach((step, index) => {
        step.classList.remove('active', 'completed');
        
        if (index + 1 < currentStep) {
            step.classList.add('completed');
        } else if (index + 1 === currentStep) {
            step.classList.add('active');
        }
    });
}


function validateShippingData() {
    const fields = ['fullName', 'phone', 'address', 'city', 'postalCode'];
    let isValid = true;
    
    fields.forEach(field => {
        const input = document.getElementById(field);
        if (input && !validateField({ target: input })) {
            isValid = false;
        }
    });
    
    if (isValid) {
        
        fields.forEach(field => {
            const input = document.getElementById(field);
            if (input) {
                formData.shipping[field] = input.value.trim();
            }
        });
        
    }
    
    return isValid;
}


function validatePaymentData() {
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
    
    if (!paymentMethod) {
        showError('Selecciona un método de pago');
        return false;
    }
    
    formData.payment.method = paymentMethod.value;
    
    
    if (paymentMethod.value === 'credit_card' || paymentMethod.value === 'debit_card') {
        const cardFields = ['cardNumber', 'expiryDate', 'cvv', 'cardName'];
        let isValid = true;
        
        cardFields.forEach(field => {
            const input = document.getElementById(field);
            if (input && !validateField({ target: input })) {
                isValid = false;
            }
        });
        
        if (isValid) {
            cardFields.forEach(field => {
                const input = document.getElementById(field);
                if (input) {
                    formData.payment[field] = input.value.trim();
                }
            });
        }
        
        return isValid;
    }
    
    return true;
}


function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    const fieldName = field.name || field.id;
    let isValid = true;
    let errorMessage = '';
    
    
    clearError(e);
    
    switch (fieldName) {
        case 'fullName':
            if (!value) {
                errorMessage = 'El nombre completo es requerido';
                isValid = false;
            } else if (value.length < 2) {
                errorMessage = 'El nombre debe tener al menos 2 caracteres';
                isValid = false;
            }
            break;
            
        case 'phone':
            if (!value) {
                errorMessage = 'El teléfono es requerido';
                isValid = false;
            } else if (!/^[\d\s\-\+\(\)]{10,}$/.test(value)) {
                errorMessage = 'Ingresa un teléfono válido';
                isValid = false;
            }
            break;
            
        case 'address':
            if (!value) {
                errorMessage = 'La dirección es requerida';
                isValid = false;
            } else if (value.length < 5) {
                errorMessage = 'Ingresa una dirección completa';
                isValid = false;
            }
            break;
            
        case 'city':
            if (!value) {
                errorMessage = 'La ciudad es requerida';
                isValid = false;
            }
            break;
            
        case 'postalCode':
            if (!value) {
                errorMessage = 'El código postal es requerido';
                isValid = false;
            }
            break;
            
        case 'cardNumber':
            const cardNumber = value.replace(/\s/g, '');
            if (!cardNumber) {
                errorMessage = 'El número de tarjeta es requerido';
                isValid = false;
            } else if (cardNumber.length < 13 || cardNumber.length > 19) {
                errorMessage = 'Número de tarjeta inválido';
                isValid = false;
            }
            break;
            
        case 'expiryDate':
            if (!value) {
                errorMessage = 'La fecha de vencimiento es requerida';
                isValid = false;
            } else if (!/^\d{2}\/\d{2}$/.test(value)) {
                errorMessage = 'Formato inválido (MM/AA)';
                isValid = false;
            } else {
                const [month, year] = value.split('/').map(num => parseInt(num));
                const currentDate = new Date();
                const currentYear = currentDate.getFullYear() % 100;
                const currentMonth = currentDate.getMonth() + 1;
                
                if (year < currentYear || (year === currentYear && month < currentMonth)) {
                    errorMessage = 'La tarjeta está vencida';
                    isValid = false;
                }
            }
            break;
            
        case 'cvv':
            if (!value) {
                errorMessage = 'El CVV es requerido';
                isValid = false;
            } else if (!/^\d{3,4}$/.test(value)) {
                errorMessage = 'CVV inválido (3-4 dígitos)';
                isValid = false;
            }
            break;
            
        case 'cardName':
            if (!value) {
                errorMessage = 'El nombre en la tarjeta es requerido';
                isValid = false;
            }
            break;
    }
    
    if (!isValid) {
        showFieldError(fieldName, errorMessage);
    }
    
    return isValid;
}


function showFieldError(fieldName, message) {
    const errorElement = document.getElementById(`${fieldName}-error`);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    
    const fieldElement = document.getElementById(fieldName);
    if (fieldElement) {
        fieldElement.classList.add('error');
    }
}


function clearError(e) {
    const field = e.target;
    const fieldName = field.name || field.id;
    
    const errorElement = document.getElementById(`${fieldName}-error`);
    if (errorElement) {
        errorElement.style.display = 'none';
    }
    
    field.classList.remove('error');
}


function updateConfirmationSummary() {
    
    const shippingSummary = document.getElementById('shipping-summary');
    if (shippingSummary) {
        shippingSummary.innerHTML = `
            <p><strong>${formData.shipping.fullName}</strong></p>
            <p>${formData.shipping.address}</p>
            <p>${formData.shipping.city}, ${formData.shipping.postalCode}</p>
            <p>Tel: ${formData.shipping.phone}</p>
        `;
    }
    
    const paymentSummary = document.getElementById('payment-summary');
    if (paymentSummary) {
        let paymentText = '';
        
        switch (formData.payment.method) {
            case 'credit_card':
                const lastFour = formData.payment.cardNumber ? formData.payment.cardNumber.slice(-4) : '';
                paymentText = `💳 Tarjeta de Crédito terminada en ${lastFour}`;
                break;
            case 'debit_card':
                const lastFourDebit = formData.payment.cardNumber ? formData.payment.cardNumber.slice(-4) : '';
                paymentText = `💳 Tarjeta de Débito terminada en ${lastFourDebit}`;
                break;
            case 'bank_transfer':
                paymentText = `🏦 Transferencia Bancaria`;
                break;
            case 'cash_on_delivery':
                paymentText = `💵 Pago Contra Entrega`;
                break;
        }
        
        paymentSummary.innerHTML = `<p>${paymentText}</p>`;
    }
}


async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (currentStep !== 3) {
        return;
    }
    
    
    if (!validateShippingData() || !validatePaymentData()) {
        showError('Por favor revisa los datos ingresados');
        return;
    }
    
    try {
        
        showProcessingModal();
        
        await simulatePaymentProcessing();
        
        const orderData = {
            shippingAddress: formData.shipping,
            paymentMethod: formData.payment.method,
            paymentDetails: formData.payment
        };
        
        const response = await fetch('/api/orders/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify(orderData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al procesar el pedido');
        }
        
        const result = await response.json();
        
        hideProcessingModal();
        
        showSuccessModal(result.order);
        
    } catch (error) {
        hideProcessingModal();
        showError('Error al procesar el pedido: ' + error.message);
    }
}

async function simulatePaymentProcessing() {
    const messages = [
        'Validando información de pago...',
        'Verificando disponibilidad de productos...',
        'Procesando transacción...',
        'Confirmando pedido...'
    ];
    
    const messageElement = document.getElementById('processing-message');
    
    for (let i = 0; i < messages.length; i++) {
        if (messageElement) {
            messageElement.textContent = messages[i];
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

function showProcessingModal() {
    const modal = document.getElementById('processing-modal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    
    const confirmBtn = document.getElementById('confirm-order');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.querySelector('.btn-text').style.display = 'none';
        confirmBtn.querySelector('.btn-loader').style.display = 'flex';
    }
}

/**
 * Oculta el modal de procesamiento
 */
function hideProcessingModal() {
    const modal = document.getElementById('processing-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function showSuccessModal(order) {
    const modal = document.getElementById('success-modal');
    if (modal) {
        const orderNumberElement = document.getElementById('order-number');
        if (orderNumberElement) {
            orderNumberElement.textContent = order.orderNumber || order._id;
        }
        
        const orderTotalElement = document.getElementById('order-total');
        if (orderTotalElement) {
            orderTotalElement.textContent = order.totalAmount || '0';
        }
        
        const deliveryDateElement = document.getElementById('delivery-date');
        if (deliveryDateElement) {
            const deliveryDate = new Date();
            deliveryDate.setDate(deliveryDate.getDate() + 5);
            deliveryDateElement.textContent = deliveryDate.toLocaleDateString('es-AR');
        }
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function showError(message) {
    let errorElement = document.getElementById('global-error');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'global-error';
        errorElement.className = 'global-error';
        document.querySelector('.checkout-container').prepend(errorElement);
    }
    
    errorElement.innerHTML = `
        <div class="error-content">
            <span class="error-icon">⚠️</span>
            <span class="error-message">${message}</span>
            <button class="error-close" onclick="closeError()">×</button>
        </div>
    `;
    errorElement.style.display = 'block';
    
    setTimeout(() => {
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }, 5000);
}

function closeError() {
    const errorElement = document.getElementById('global-error');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

window.nextStep = nextStep;
window.prevStep = prevStep;
window.closeError = closeError;
