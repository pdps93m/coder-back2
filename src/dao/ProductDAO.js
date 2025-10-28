import BaseDAO from './BaseDAO.js';
import Product from '../models/productos.model.js';

class ProductDAO extends BaseDAO {
    constructor() {
        super(Product);
    }

    async findByCode(codigo) {
        return await this.findOne({ codigo });
    }

    async getByCategory(categoria) {
        return await this.find({ categoria });
    }

    async getAvailableProducts() {
        return await this.find({ stock: { $gt: 0 } });
    }

    async updateStock(productId, newStock) {
        try {
            return await this.model.findByIdAndUpdate(
                productId,
                { stock: newStock },
                { new: true, runValidators: true }
            );
        } catch (error) {
            throw new Error(`Error al actualizar stock: ${error.message}`);
        }
    }

    async reduceStock(productId, quantity) {
        try {
            const product = await this.getById(productId);
            if (!product) throw new Error('Producto no encontrado');
            
            if (product.stock < quantity) {
                throw new Error('Stock insuficiente');
            }

            return await this.updateStock(productId, product.stock - quantity);
        } catch (error) {
            throw new Error(`Error al reducir stock: ${error.message}`);
        }
    }

    async getByPriceRange(minPrice, maxPrice) {
        return await this.find({ 
            precio: { 
                $gte: minPrice, 
                $lte: maxPrice 
            } 
        });
    }

    async searchProducts(searchText) {
        return await this.find({
            $or: [
                { nombre: { $regex: searchText, $options: 'i' } },
                { descripcion: { $regex: searchText, $options: 'i' } }
            ]
        });
    }

    async updateStock(productId, stockChange) {
        try {
            const product = await this.model.findByIdAndUpdate(
                productId,
                { $inc: { stock: stockChange } },
                { new: true, runValidators: true }
            )

            if (!product) {
                throw new Error(`Producto con ID ${productId} no encontrado`)
            }

            if (product.stock < 0) {
                throw new Error(`Stock insuficiente para el producto ${product.nombre}`)
            }

            return product

        } catch (error) {
            throw error
        }
    }
}

export default new ProductDAO();
