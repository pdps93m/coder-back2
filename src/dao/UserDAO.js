import BaseDAO from './BaseDAO.js';
import User from '../models/users.model.js';

class UserDAO extends BaseDAO {
    constructor() {
        super(User);
    }

    async findByEmail(email) {
        return await this.findOne({ email });
    }

    async getUserWithCart(userId) {
        try {
            return await this.model.findById(userId).populate({
                path: 'cart',
                populate: {
                    path: 'products.product',
                    model: 'productos'
                }
            });
        } catch (error) {
            throw new Error(`Error al obtener usuario con carrito: ${error.message}`);
        }
    }

    async updatePassword(userId, hashedPassword) {
        try {
            return await this.model.findByIdAndUpdate(
                userId, 
                { password: hashedPassword }, 
                { new: true, runValidators: true }
            );
        } catch (error) {
            throw new Error(`Error al actualizar contraseña: ${error.message}`);
        }
    }

    async getUsersByRole(role) {
        return await this.find({ role });
    }

    async assignCart(userId, cartId) {
        try {
            return await this.model.findByIdAndUpdate(
                userId,
                { cart: cartId },
                { new: true, runValidators: true }
            );
        } catch (error) {
            throw new Error(`Error al asignar carrito: ${error.message}`);
        }
    }
}

export default new UserDAO();
