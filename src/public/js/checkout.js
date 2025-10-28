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

/**
 * Inicializa el checkout y configura el estado inicial
 */
function initializeCheckout() {
    setupFormValidation();
    
    // Configurar métodos de pago
    setupPaymentMethods();
    
    // Configurar formateo de inputs
    setupInputFormatting();
    
    // Cargar datos del usuario si están disponibles
    loadUserData();
}

/**
 * Configura todos los event listeners
 */
function setupEventListeners() {
    // Event listener para el formulario principal
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Event listeners para métodos de pago
    const paymentMethods = document.querySelectorAll('.payment-method');
    paymentMethods.forEach(method => {
        method.addEventListener('click', handlePaymentMethodChange);
    });
    
    // Event listeners para validación en tiempo real
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearError);
    });
}

/**
 * Carga los datos del carrito
 */
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

/**
 * Carga datos del usuario si están disponibles
 */
function loadUserData() {
    // Los datos del usuario ya están disponibles desde el template
}

/**
 * Configura la validación de formularios
 */
function setupFormValidation() {
}

/**
 * Configura los métodos de pago
 */
function setupPaymentMethods() {
    const cardForm = document.getElementById('card-form');
    
    // Mostrar/ocultar formulario de tarjeta según el método seleccionado
    function toggleCardForm() {
        const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked');
        if (selectedMethod) {
            const isCard = selectedMethod.value === 'credit_card' || selectedMethod.value === 'debit_card';
            if (cardForm) {
                cardForm.style.display = isCard ? 'block' : 'none';
            }
        }
    }
    
    // Ejecutar al cargar la página
    toggleCardForm();
    
    // Ejecutar cuando cambie el método de pago
    const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', toggleCardForm);
    });
}

/**
 * Configura el formateo de inputs
 */
function setupInputFormatting() {
    // Formatear número de tarjeta
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
            let formattedValue = value.replace(/(.{4})/g, '$1 ').trim();
            e.target.value = formattedValue;
        });
    }
    
    // Formatear fecha de vencimiento
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
    
    // Solo números en CVV
    const cvvInput = document.getElementById('cvv');
    if (cvvInput) {
        cvvInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }
    
    // Solo números en teléfono
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/[^\d\s\-\+\(\)]/g, '');
        });
    }
}

/**
 * Maneja el cambio de método de pago
 */
function handlePaymentMethodChange(e) {
    // Remover clase active de todos los métodos
    document.querySelectorAll('.payment-method').forEach(method => {
        method.classList.remove('active');
    });
    
    // Agregar clase active al método seleccionado
    e.currentTarget.classList.add('active');
    
    // Marcar el radio button correspondiente
    const radio = e.currentTarget.querySelector('input[type="radio"]');
    if (radio) {
        radio.checked = true;
    }
}

/**
 * Avanza al siguiente paso
 */
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

/**
 * Retrocede al paso anterior
 */
function prevStep() {
    if (currentStep > 1) {
        goToStep(currentStep - 1);
    }
}

/**
 * Va a un paso específico
 */
function goToStep(step) {
    currentStep = step;
    
    // Actualizar indicadores de pasos
    updateStepIndicators();
    
    // Mostrar/ocultar secciones
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(getSectionId(step));
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Scroll al inicio de la sección
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Obtiene el ID de la sección para un paso
 */
function getSectionId(step) {
    switch (step) {
        case 1: return 'shipping-section';
        case 2: return 'payment-section';
        case 3: return 'confirmation-section';
        default: return 'shipping-section';
    }
}

/**
 * Actualiza los indicadores de pasos
 */
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

/**
 * Valida los datos de envío
 */
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
        // Guardar datos de envío
        fields.forEach(field => {
            const input = document.getElementById(field);
            if (input) {
                formData.shipping[field] = input.value.trim();
            }
        });
        
    }
    
    return isValid;
}

/**
 * Valida los datos de pago
 */
function validatePaymentData() {
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
    
    if (!paymentMethod) {
        showError('Selecciona un método de pago');
        return false;
    }
    
    formData.payment.method = paymentMethod.value;
    
    // Si es tarjeta, validar datos adicionales
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

/**
 * Valida un campo individual
 */
function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    const fieldName = field.name || field.id;
    let isValid = true;
    let errorMessage = '';
    
    // Limpiar error anterior
    clearError(e);
    
    // Validaciones específicas por campo
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
                // Validar que no esté vencida
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

/**
 * Muestra error en un campo específico
 */
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

/**
 * Limpia el error de un campo
 */
function clearError(e) {
    const field = e.target;
    const fieldName = field.name || field.id;
    
    const errorElement = document.getElementById(`${fieldName}-error`);
    if (errorElement) {
        errorElement.style.display = 'none';
    }
    
    field.classList.remove('error');
}

/**
 * Actualiza el resumen de confirmación
 */
function updateConfirmationSummary() {
    // Resumen de envío
    const shippingSummary = document.getElementById('shipping-summary');
    if (shippingSummary) {
        shippingSummary.innerHTML = `
            <p><strong>${formData.shipping.fullName}</strong></p>
            <p>${formData.shipping.address}</p>
            <p>${formData.shipping.city}, ${formData.shipping.postalCode}</p>
            <p>Tel: ${formData.shipping.phone}</p>
        `;
    }
    
    // Resumen de pago
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

/**
 * Maneja el envío del formulario
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (currentStep !== 3) {
        return;
    }
    
    // Validar todos los datos una vez más
    if (!validateShippingData() || !validatePaymentData()) {
        showError('Por favor revisa los datos ingresados');
        return;
    }
    
    try {
        // Mostrar modal de procesamiento
        showProcessingModal();
        
        // Simular procesamiento de pago
        await simulatePaymentProcessing();
        
        // Crear la orden
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
        
        // Mostrar modal de éxito
        showSuccessModal(result.order);
        
    } catch (error) {
        hideProcessingModal();
        showError('Error al procesar el pedido: ' + error.message);
    }
}

/**
 * Simula el procesamiento de pago
 */
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

/**
 * Muestra el modal de procesamiento
 */
function showProcessingModal() {
    const modal = document.getElementById('processing-modal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    
    // Deshabilitar botón de confirmar
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

/**
 * Muestra el modal de éxito
 */
function showSuccessModal(order) {
    const modal = document.getElementById('success-modal');
    if (modal) {
        // Llenar datos de la orden
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
            deliveryDate.setDate(deliveryDate.getDate() + 5); // 5 días hábiles
            deliveryDateElement.textContent = deliveryDate.toLocaleDateString('es-AR');
        }
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Muestra un mensaje de error
 */
function showError(message) {
    // Crear o actualizar elemento de error global
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
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }, 5000);
}

/**
 * Cierra el mensaje de error global
 */
function closeError() {
    const errorElement = document.getElementById('global-error');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

// Funciones globales para los botones (accesibles desde HTML)
window.nextStep = nextStep;
window.prevStep = prevStep;
window.closeError = closeError;
