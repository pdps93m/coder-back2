import { Router } from "express"

import { checkAuth } from "../middlewares/auth.js"
import Productos from "../models/productos.model.js"
import CartRepository from "../repository/CartRepository.js"

const router = Router()

router.get('/', checkAuth({ mustBeLoggedIn: false }), (req, res) => {
    res.render('login')
})

router.get('/register', checkAuth({ mustBeLoggedIn: false }), (req, res) => {
    res.render('register')
})

router.get('/forgot-password', checkAuth({ mustBeLoggedIn: false }), (req, res) => {
    res.render('forgot_password')
})

router.get('/profile', checkAuth({ mustBeLoggedIn: true }), (req, res) => {
    res.render('profile', {
        user: req.session.user
    })
})

router.get('/productos', checkAuth({ mustBeLoggedIn: true }), async (req, res) => {
    try {
        const productos = await Productos.find().lean()
        
        const categorias = [...new Set(productos.map(p => p.categoria))].filter(Boolean)
        
        res.render('productos', {
            user: req.session.user,
            productos,
            categorias,
            pageScript: 'productos',
            title: 'Catálogo de Productos'
        })
    } catch (err) {
        res.status(500).send('Error interno del servidor')
    }
})

router.get('/carrito', checkAuth({ mustBeLoggedIn: true }), async (req, res) => {
    try {
        const cartResult = await CartRepository.getUserCart(req.session.user._id)
        
        const cart = cartResult.success ? cartResult.cart : cartResult;
        
        let totalAmount = 0;
        let totalItems = 0;
        
        if (cart && cart.products && Array.isArray(cart.products)) {
            cart.products.forEach(item => {
                const price = item.product?.precio || 0;
                const quantity = item.quantity || 0;
                totalAmount += price * quantity;
                totalItems += quantity;
            });
        }
        
        cart.totalAmount = totalAmount;
        cart.totalItems = totalItems;
        
        res.render('carrito', {
            user: req.session.user,
            cart: cart,
            pageScript: 'carrito',
            title: 'Mi Carrito de Compras'
        })
    } catch (err) {
        res.status(500).send('Error al cargar el carrito')
    }
})

router.get('/api/cart/session', checkAuth({ mustBeLoggedIn: true }), async (req, res) => {
    try {
        const userId = req.session.user._id;
        const cartResult = await CartRepository.getUserCart(userId);
        
        const cart = cartResult.success ? cartResult.cart : cartResult;
        
        let totalItems = 0;
        let totalPrice = 0;
        
        if (cart && cart.products && Array.isArray(cart.products)) {
            totalItems = cart.products.reduce((sum, item) => sum + (item.quantity || 0), 0);
            totalPrice = cart.products.reduce((sum, item) => {
                const price = item.product?.precio || item.precio || 0;
                const quantity = item.quantity || 0;
                return sum + (price * quantity);
            }, 0);
        }
        
        res.json({
            success: true,
            cart: cart || { products: [] },
            totalItems,
            totalPrice
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
})

router.post('/api/cart/add', checkAuth({ mustBeLoggedIn: true }), async (req, res) => {
    try {
        const userId = req.session.user._id;
        const { productId, quantity } = req.body;
        
        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Usuario no encontrado en sesión' 
            });
        }
        
        const result = await CartRepository.addProductToCart(userId, productId, parseInt(quantity) || 1);
        
        res.json({
            success: true,
            message: 'Producto agregado al carrito',
            cart: result
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: err.message || 'Error interno del servidor' 
        });
    }
})

router.get('/checkout', checkAuth({ mustBeLoggedIn: true }), async (req, res) => {
    try {
        const cartResult = await CartRepository.getUserCart(req.session.user._id)
        
        const cart = cartResult.success ? cartResult.cart : cartResult;
        
        if (!cart || !cart.products || cart.products.length === 0) {
            return res.redirect('/carrito');
        }
        
        let totalAmount = 0;
        let totalItems = 0;
        
        if (cart && cart.products && Array.isArray(cart.products)) {
            cart.products.forEach(item => {
                const price = item.product?.precio || 0;
                const quantity = item.quantity || 0;
                totalAmount += price * quantity;
                totalItems += quantity;
            });
        }
        
        cart.totalAmount = totalAmount;
        cart.totalItems = totalItems;
        
        res.render('checkout', {
            user: req.session.user,
            cart: cart,
            pageScript: 'checkout',
            title: 'Finalizar Compra'
        })
    } catch (err) {
        res.status(500).send('Error al cargar el checkout')
    }
})

export default router;
