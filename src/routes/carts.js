import { Router } from 'express';
import cartDAO from '../dao/CartDAO.js';
import productDAO from '../dao/ProductDAO.js';
import userDAO from '../dao/UserDAO.js';
import CartDTO from '../dto/CartDTO.js';
import { authToken } from '../utils.js';
import { requireUser } from '../middlewares/auth.js';
import passport from 'passport';

const router = Router();

router.get('/my-cart', passport.authenticate('jwt', { session: false }), requireUser, async (req, res) => {
    try {
        const user = await userDAO.getUserWithCart(req.user.id);
        
        if (!user.cart) {
            const newCart = await cartDAO.createEmptyCart();
            
            await userDAO.update(user._id, { cart: newCart._id });
            
            return res.json(new CartDTO(newCart));
        }

        res.json(new CartDTO(user.cart));
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.post('/add-product', passport.authenticate('jwt', { session: false }), requireUser, async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;

        if (!productId) {
            return res.status(400).json({ error: 'Se requiere el ID del producto' });
        }

        const product = await productDAO.getById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        if (product.stock < quantity) {
            return res.status(400).json({ error: 'Stock insuficiente' });
        }

        const user = await userDAO.getById(req.user.id);
        let cart;

        if (!user.cart) {
            cart = await cartDAO.createEmptyCart();
            await userDAO.update(user._id, { cart: cart._id });
        } else {
            cart = await cartDAO.getById(user.cart);
        }

        const existingProductIndex = cart.products.findIndex(
            item => item.product.toString() === productId
        );

        if (existingProductIndex >= 0) {
            const newQuantity = cart.products[existingProductIndex].quantity + quantity;
            if (newQuantity > product.stock) {
                return res.status(400).json({ error: 'No hay suficiente stock para esta cantidad' });
            }
            cart.products[existingProductIndex].quantity = newQuantity;
        } else {
            cart.products.push({ product: productId, quantity });
        }

        await cartDAO.update(cart._id, { products: cart.products });

        const updatedCart = await cartDAO.getCartWithProducts(cart._id);
        
        res.json(new CartDTO(updatedCart));
    } catch (error) {
        res.status(500).json({ error: 'Error al agregar producto al carrito' });
    }
});

router.put('/update-quantity', passport.authenticate('jwt', { session: false }), requireUser, async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (!productId || !quantity || quantity < 1) {
            return res.status(400).json({ error: 'Se requiere ID del producto y cantidad válida' });
        }

        const user = await userDAO.getById(req.user.id);
        if (!user.cart) {
            return res.status(404).json({ error: 'Carrito no encontrado' });
        }

        const cart = await cartDAO.getById(user.cart);
        const productIndex = cart.products.findIndex(
            item => item.product.toString() === productId
        );

        if (productIndex === -1) {
            return res.status(404).json({ error: 'Producto no encontrado en el carrito' });
        }

        const product = await productDAO.getById(productId);
        if (quantity > product.stock) {
            return res.status(400).json({ error: 'Stock insuficiente' });
        }

        cart.products[productIndex].quantity = quantity;
        await cartDAO.update(cart._id, { products: cart.products });
        
        const updatedCart = await cartDAO.getCartWithProducts(cart._id);
        res.json(new CartDTO(updatedCart));
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar cantidad' });
    }
});

router.delete('/remove-product/:productId', passport.authenticate('jwt', { session: false }), requireUser, async (req, res) => {
    try {
        const { productId } = req.params;

        const user = await userDAO.getById(req.user.id);
        if (!user.cart) {
            return res.status(404).json({ error: 'Carrito no encontrado' });
        }

        const cart = await cartDAO.getById(user.cart);
        cart.products = cart.products.filter(
            item => item.product.toString() !== productId
        );

        await cartDAO.update(cart._id, { products: cart.products });
        
        const updatedCart = await cartDAO.getCartWithProducts(cart._id);
        res.json(new CartDTO(updatedCart));
    } catch (error) {
        res.status(500).json({ error: 'Error al remover producto del carrito' });
    }
});

router.delete('/clear', passport.authenticate('jwt', { session: false }), requireUser, async (req, res) => {
    try {
        const user = await userDAO.getById(req.user.id);
        if (!user.cart) {
            return res.status(404).json({ error: 'Carrito no encontrado' });
        }

        const cart = await cartDAO.getById(user.cart);
        cart.products = [];
        await cartDAO.update(cart._id, { products: [] });

        res.json(new CartDTO(cart));
    } catch (error) {
        res.status(500).json({ error: 'Error al vaciar el carrito' });
    }
});

export default router;
