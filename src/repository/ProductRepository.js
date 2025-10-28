import productDAO from '../dao/ProductDAO.js';
import ProductDTO from '../dto/ProductDTO.js';

class ProductRepository {
    constructor() {
        this.productDAO = productDAO;
    }

    async getAllProducts() {
        try {
            const products = await this.productDAO.getAll();
            const productsDTO = products.map(product => new ProductDTO(product));
            
            return {
                success: true,
                products: productsDTO,
                total: productsDTO.length
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error al obtener productos',
                statusCode: 500,
                error: error.message
            };
        }
    }

    async getProductById(productId) {
        try {
            if (!productId) {
                return {
                    success: false,
                    message: 'ID de producto requerido',
                    statusCode: 400
                };
            }

            const product = await this.productDAO.getById(productId);
            
            if (!product) {
                return {
                    success: false,
                    message: 'Producto no encontrado',
                    statusCode: 404
                };
            }

            return {
                success: true,
                product: new ProductDTO(product)
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error al obtener producto',
                statusCode: 500,
                error: error.message
            };
        }
    }

    async createProduct(productData) {
        try {
            const { nombre, descripcion, precio, categoria, stock, codigo } = productData;

            if (!nombre || !descripcion || !precio || !categoria || stock === undefined || !codigo) {
                return {
                    success: false,
                    message: 'Faltan datos obligatorios: nombre, descripcion, precio, categoria, stock, codigo',
                    statusCode: 400
                };
            }

            if (precio <= 0) {
                return {
                    success: false,
                    message: 'El precio debe ser mayor a 0',
                    statusCode: 400
                };
            }

            if (stock < 0) {
                return {
                    success: false,
                    message: 'El stock no puede ser negativo',
                    statusCode: 400
                };
            }

            const newProduct = await this.productDAO.create({
                nombre,
                descripcion,
                precio,
                categoria,
                stock,
                codigo
            });

            return {
                success: true,
                product: new ProductDTO(newProduct),
                message: 'Producto creado exitosamente',
                statusCode: 201
            };
        } catch (error) {
            if (error.code === 11000) {
                return {
                    success: false,
                    message: 'El código de producto ya existe',
                    statusCode: 400
                };
            }
            
            return {
                success: false,
                message: 'Error al crear producto',
                statusCode: 500,
                error: error.message
            };
        }
    }

    async updateProduct(productId, updateData) {
        try {
            if (!productId) {
                return {
                    success: false,
                    message: 'ID de producto requerido',
                    statusCode: 400
                };
            }

            if (updateData.precio !== undefined && updateData.precio <= 0) {
                return {
                    success: false,
                    message: 'El precio debe ser mayor a 0',
                    statusCode: 400
                };
            }

            if (updateData.stock !== undefined && updateData.stock < 0) {
                return {
                    success: false,
                    message: 'El stock no puede ser negativo',
                    statusCode: 400
                };
            }

            const updatedProduct = await this.productDAO.update(productId, updateData);
            
            if (!updatedProduct) {
                return {
                    success: false,
                    message: 'Producto no encontrado',
                    statusCode: 404
                };
            }

            return {
                success: true,
                product: new ProductDTO(updatedProduct),
                message: 'Producto actualizado exitosamente'
            };
        } catch (error) {
            if (error.code === 11000) {
                return {
                    success: false,
                    message: 'El código de producto ya existe',
                    statusCode: 400
                };
            }
            
            return {
                success: false,
                message: 'Error al actualizar producto',
                statusCode: 500,
                error: error.message
            };
        }
    }

    async deleteProduct(productId) {
        try {
            if (!productId) {
                return {
                    success: false,
                    message: 'ID de producto requerido',
                    statusCode: 400
                };
            }

            const deletedProduct = await this.productDAO.delete(productId);
            
            if (!deletedProduct) {
                return {
                    success: false,
                    message: 'Producto no encontrado',
                    statusCode: 404
                };
            }

            return {
                success: true,
                message: 'Producto eliminado exitosamente',
                product: new ProductDTO(deletedProduct)
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error al eliminar producto',
                statusCode: 500,
                error: error.message
            };
        }
    }

    async checkStock(productId, requiredQuantity) {
        try {
            const product = await this.productDAO.getById(productId);
            
            if (!product) {
                return {
                    success: false,
                    message: 'Producto no encontrado',
                    available: false
                };
            }

            const isAvailable = product.stock >= requiredQuantity;
            
            return {
                success: true,
                available: isAvailable,
                currentStock: product.stock,
                requiredQuantity,
                product: new ProductDTO(product)
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error al verificar stock',
                error: error.message
            };
        }
    }

    async reduceStock(productId, quantity) {
        try {
            const product = await this.productDAO.getById(productId);
            
            if (!product) {
                return {
                    success: false,
                    message: 'Producto no encontrado'
                };
            }

            if (product.stock < quantity) {
                return {
                    success: false,
                    message: 'Stock insuficiente'
                };
            }

            const newStock = product.stock - quantity;
            const updatedProduct = await this.productDAO.update(productId, { stock: newStock });

            return {
                success: true,
                product: new ProductDTO(updatedProduct),
                previousStock: product.stock,
                newStock: newStock
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error al reducir stock',
                error: error.message
            };
        }
    }
}

export default new ProductRepository();
