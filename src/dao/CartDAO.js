import BaseDAO from './BaseDAO.js';
import Cart from '../models/cart.model.js';

class CartDAO extends BaseDAO {
    constructor() {
        super(Cart);
    }

    async getCartWithProducts(cartId) {
        try {
            return await this.model.findById(cartId).populate('products.product');
        } catch (error) {
            throw new Error(`Error al obtener carrito con productos: ${error.message}`);
        }
    }

    async addProduct(cartId, productId, quantity) {
        try {
            const cart = await this.getById(cartId);
            if (!cart) throw new Error('Carrito no encontrado');

            const existingProductIndex = cart.products.findIndex(
                item => item.product.toString() === productId
            );

            if (existingProductIndex >= 0) {
                cart.products[existingProductIndex].quantity += quantity;
            } else {
                cart.products.push({ product: productId, quantity });
            }

            return await cart.save();
        } catch (error) {
            throw new Error(`Error al agregar producto: ${error.message}`);
        }
    }

    async updateProductQuantity(cartId, productId, quantity) {
        try {
            const cart = await this.getById(cartId);
            if (!cart) throw new Error('Carrito no encontrado');

            const productIndex = cart.products.findIndex(
                item => item.product.toString() === productId
            );

            if (productIndex === -1) {
                throw new Error('Producto no encontrado en el carrito');
            }

            cart.products[productIndex].quantity = quantity;
            return await cart.save();
        } catch (error) {
            throw new Error(`Error al actualizar cantidad: ${error.message}`);
        }
    }

    async removeProduct(cartId, productId) {
        try {
            const cart = await this.getById(cartId);
            if (!cart) throw new Error('Carrito no encontrado');

            cart.products = cart.products.filter(
                item => item.product.toString() !== productId
            );

            return await cart.save();
        } catch (error) {
            throw new Error(`Error al remover producto: ${error.message}`);
        }
    }

    async clearCart(cartId) {
        try {
            return await this.model.findByIdAndUpdate(
                cartId,
                { products: [] },
                { new: true }
            );
        } catch (error) {
            throw new Error(`Error al vaciar carrito: ${error.message}`);
        }
    }

    async createEmptyCart() {
        try {
            return await this.create({ products: [] });
        } catch (error) {
            throw new Error(`Error al crear carrito vacío: ${error.message}`);
        }
    }
}

export default new CartDAO();
