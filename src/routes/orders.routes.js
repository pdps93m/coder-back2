import { Router } from 'express'
import { checkAuth } from '../middlewares/auth.js'
import OrderRepository from '../repository/OrderRepository.js'

const router = Router()

router.get('/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Servidor funcionando correctamente',
        timestamp: new Date()
    })
})

router.post('/create', checkAuth({ mustBeLoggedIn: true }), async (req, res) => {
    try {
        const { shippingAddress, paymentMethod, paymentDetails } = req.body
        
        const userId = req.session.user._id
        
        if (!shippingAddress || !paymentMethod) {
            return res.status(400).json({
                success: false,
                message: 'Dirección de envío y método de pago son requeridos'
            })
        }
        
        const result = await OrderRepository.createOrderFromCart(
            userId,
            shippingAddress,
            paymentMethod,
            paymentDetails
        )
        
        res.status(201).json(result)
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor'
        })
    }
})

router.get('/my-orders', checkAuth({ mustBeLoggedIn: true }), async (req, res) => {
    try {
        const userId = req.session.user._id
        const { page = 1, limit = 10, status } = req.query
        
        const result = await OrderRepository.getUserOrders(userId, {
            page: parseInt(page),
            limit: parseInt(limit),
            status
        })
        
        res.json(result)
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor'
        })
    }
})

router.get('/order/:orderNumber', checkAuth({ mustBeLoggedIn: true }), async (req, res) => {
    try {
        const { orderNumber } = req.params
        const userId = req.session.user._id
        
        const result = await OrderRepository.getOrderByNumber(orderNumber)
        
        if (result.order.userId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver esta orden'
            })
        }
        
        res.json(result)
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor'
        })
    }
})

export default router
