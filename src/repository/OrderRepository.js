import orderDAO from '../dao/OrderDAO.js'
import cartRepository from './CartRepository.js'
import productDAO from '../dao/ProductDAO.js'
import userDAO from '../dao/UserDAO.js'
import EmailService from '../services/EmailService.js'

class OrderRepository {
    constructor() {
        this.orderDAO = orderDAO
        this.cartRepository = cartRepository
        this.productDAO = productDAO
        this.userDAO = userDAO
        this.emailService = new EmailService()
    }

    async createOrderFromCart(userId, shippingAddress, paymentMethod, paymentDetails = {}) {
        try {
            const cartResult = await this.cartRepository.getUserCart(userId)
            const cart = cartResult.success ? cartResult.cart : cartResult
            
            if (!cart || !cart.products || cart.products.length === 0) {
                throw new Error('El carrito está vacío')
            }

            const orderProducts = []
            let totalAmount = 0

            for (const cartItem of cart.products) {
                const product = await this.productDAO.getById(cartItem.productId || cartItem.product._id)
                
                if (!product) {
                    throw new Error(`Producto ${cartItem.productId} no encontrado`)
                }

                if (product.stock < cartItem.quantity) {
                    throw new Error(`Stock insuficiente para ${product.nombre}. Disponible: ${product.stock}, Solicitado: ${cartItem.quantity}`)
                }

                const subtotal = product.precio * cartItem.quantity
                totalAmount += subtotal

                orderProducts.push({
                    productId: product._id,
                    name: product.nombre,
                    price: product.precio,
                    quantity: cartItem.quantity,
                    subtotal: subtotal
                })
            }

            const orderData = {
                userId,
                products: orderProducts,
                shippingAddress,
                paymentMethod,
                paymentDetails,
                totalAmount,
                shippingCost: 0,
                estimatedDelivery: this.calculateEstimatedDelivery()
            }

            const order = await this.orderDAO.createOrder(orderData)

            await this.updateProductStock(orderProducts)

            await this.cartRepository.clearCart(userId)

            this.sendOrderConfirmationEmail(order).catch(err => {
                console.error('Error enviando email de confirmación:', err)
            })

            return {
                success: true,
                order: order,
                message: 'Orden creada exitosamente'
            }

        } catch (error) {
            console.error('❌ OrderRepository: Error creando orden:', error)
            throw error
        }
    }

    async getUserOrders(userId, options = {}) {
        try {
            const result = await this.orderDAO.getOrdersByUser(userId, options)
            
            return {
                success: true,
                ...result
            }

        } catch (error) {
            console.error('❌ OrderRepository: Error obteniendo órdenes:', error)
            throw error
        }
    }

    async getOrderByNumber(orderNumber) {
        try {
            const order = await this.orderDAO.getOrderByNumber(orderNumber)
            
            return {
                success: true,
                order: order
            }

        } catch (error) {
            console.error('❌ OrderRepository: Error obteniendo orden:', error)
            throw error
        }
    }

    async getOrderById(orderId) {
        try {
            const order = await this.orderDAO.getOrderById(orderId)
            
            return {
                success: true,
                order: order
            }

        } catch (error) {
            console.error('❌ OrderRepository: Error obteniendo orden:', error)
            throw error
        }
    }

    async updateOrderStatus(orderId, newStatus, additionalData = {}) {
        try {
            const order = await this.orderDAO.updateOrderStatus(orderId, newStatus, additionalData)
            
            this.sendStatusUpdateEmail(order).catch(err => {
                console.error('⚠️ Error enviando email de actualización:', err)
            })
            
            return {
                success: true,
                order: order,
                message: `Estado actualizado a ${newStatus}`
            }

        } catch (error) {
            console.error('❌ OrderRepository: Error actualizando estado:', error)
            throw error
        }
    }

    async getOrderStats(userId = null) {
        try {
            const stats = await this.orderDAO.getOrderStats(userId)
            
            return {
                success: true,
                stats: stats
            }

        } catch (error) {
            console.error('❌ OrderRepository: Error obteniendo estadísticas:', error)
            throw error
        }
    }

    async updateProductStock(orderProducts) {
        try {
            for (const item of orderProducts) {
                await this.productDAO.updateStock(item.productId, -item.quantity)
            }
        } catch (error) {
            console.error('❌ OrderRepository: Error actualizando stock:', error)
            throw error
        }
    }

    calculateEstimatedDelivery() {
        const deliveryDate = new Date()
        deliveryDate.setDate(deliveryDate.getDate() + 3)
        return deliveryDate
    }

    async sendOrderConfirmationEmail(order) {
        try {
            const user = await this.userDAO.getById(order.userId)
            
            const emailContent = `
                <h2>¡Gracias por tu compra!</h2>
                <p>Hola ${order.shippingAddress.name},</p>
                <p>Tu orden <strong>${order.orderNumber}</strong> ha sido confirmada.</p>
                
                <h3>Resumen de tu pedido:</h3>
                <ul>
                    ${order.products.map(p => `<li>${p.name} x${p.quantity} - $${p.subtotal}</li>`).join('')}
                </ul>
                
                <p><strong>Total: $${order.totalAmount}</strong></p>
                <p><strong>Entrega estimada:</strong> ${order.estimatedDelivery.toLocaleDateString()}</p>
                
                <p>Recibirás actualizaciones sobre el estado de tu pedido.</p>
                
                <p>¡Gracias por confiar en nosotros!</p>
            `
            
            await this.emailService.sendEmail(
                user.email,
                `Confirmación de pedido ${order.orderNumber}`,
                emailContent
            )
            
        } catch (error) {
            console.error('❌ OrderRepository: Error enviando email:', error)
        }
    }

    async sendStatusUpdateEmail(order) {
        try {
            const statusMessages = {
                'paid': 'Tu pago ha sido confirmado',
                'processing': 'Tu pedido está siendo procesado',
                'shipped': 'Tu pedido ha sido enviado',
                'delivered': 'Tu pedido ha sido entregado',
                'cancelled': 'Tu pedido ha sido cancelado'
            }
            
            const message = statusMessages[order.status] || 'El estado de tu pedido ha sido actualizado'
            
            const emailContent = `
                <h2>Actualización de tu pedido</h2>
                <p>Hola ${order.shippingAddress.name},</p>
                <p>${message}.</p>
                <p><strong>Número de orden:</strong> ${order.orderNumber}</p>
                <p><strong>Estado actual:</strong> ${order.status}</p>
                
                ${order.trackingNumber ? `<p><strong>Número de seguimiento:</strong> ${order.trackingNumber}</p>` : ''}
                
                <p>Gracias por tu preferencia.</p>
            `
            
            const user = await this.userDAO.getById(order.userId)
            
            await this.emailService.sendEmail(
                user.email,
                `Actualización de pedido ${order.orderNumber}`,
                emailContent
            )
            
        } catch (error) {
            console.error('❌ OrderRepository: Error enviando email de actualización:', error)
        }
    }
}

export default new OrderRepository()
