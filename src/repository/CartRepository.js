import cartDAO from '../dao/CartDAO.js';
import userDAO from '../dao/UserDAO.js';
import productDAO from '../dao/ProductDAO.js';
import CartDTO from '../dto/CartDTO.js';

class CartRepository {
    constructor() {
        this.cartDAO = cartDAO;
        this.userDAO = userDAO;
        this.productDAO = productDAO;
    }

    async getUserCart(userId) {
        try {
            const user = await this.userDAO.getUserWithCart(userId);
            
            if (!user) {
                return {
                    success: false,
                    message: 'Usuario no encontrado',
                    statusCode: 404
                };
            }

            if (!user.cart) {
                const newCart = await this.cartDAO.createEmptyCart();
                await this.userDAO.update(user._id, { cart: newCart._id });
                
                return {
                    success: true,
                    cart: new CartDTO(newCart)
                };
            }

            return {
                success: true,
                cart: new CartDTO(user.cart)
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error al obtener carrito',
                statusCode: 500,
                error: error.message
            };
        }
    }

    async addProductToCart(userId, productId, quantity = 1) {
        try {
            if (!productId) {
                return {
                    success: false,
                    message: 'Se requiere el ID del producto',
                    statusCode: 400
                };
            }

            if (quantity <= 0) {
                return {
                    success: false,
                    message: 'La cantidad debe ser mayor a 0',
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

            if (product.stock < quantity) {
                return {
                    success: false,
                    message: `Stock insuficiente. Disponible: ${product.stock}`,
                    statusCode: 400
                };
            }

            const user = await this.userDAO.getById(userId);
            let cart;

            if (!user.cart) {
                cart = await this.cartDAO.createEmptyCart();
                await this.userDAO.update(user._id, { cart: cart._id });
            } else {
                cart = await this.cartDAO.getById(user.cart);
            }

            const existingProductIndex = cart.products.findIndex(
                item => item.product.toString() === productId
            );

            if (existingProductIndex >= 0) {
                const newQuantity = cart.products[existingProductIndex].quantity + quantity;
                
                if (newQuantity > product.stock) {
                    return {
                        success: false,
                        message: `No hay suficiente stock para ${newQuantity} unidades. Disponible: ${product.stock}`,
                        statusCode: 400
                    };
                }
                
                cart.products[existingProductIndex].quantity = newQuantity;
            } else {
                cart.products.push({ product: productId, quantity });
            }

            await this.cartDAO.update(cart._id, { products: cart.products });
            
            const updatedCart = await this.cartDAO.getCartWithProducts(cart._id);

            return {
                success: true,
                cart: new CartDTO(updatedCart),
                message: 'Producto agregado al carrito exitosamente'
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error al agregar producto al carrito',
                statusCode: 500,
                error: error.message
            };
        }
    }

    async updateProductQuantity(userId, productId, quantity) {
        try {
            if (!productId || !quantity || quantity < 1) {
                return {
                    success: false,
                    message: 'Se requiere ID del producto y cantidad válida',
                    statusCode: 400
                };
            }

            const user = await this.userDAO.getById(userId);
            if (!user.cart) {
                return {
                    success: false,
                    message: 'Carrito no encontrado',
                    statusCode: 404
                };
            }

            const cart = await this.cartDAO.getById(user.cart);
            const productIndex = cart.products.findIndex(
                item => item.product.toString() === productId
            );

            if (productIndex === -1) {
                return {
                    success: false,
                    message: 'Producto no encontrado en el carrito',
                    statusCode: 404
                };
            }

            const product = await this.productDAO.getById(productId);
            if (quantity > product.stock) {
                return {
                    success: false,
                    message: `Stock insuficiente. Disponible: ${product.stock}`,
                    statusCode: 400
                };
            }

            cart.products[productIndex].quantity = quantity;
            await this.cartDAO.update(cart._id, { products: cart.products });
            
            const updatedCart = await this.cartDAO.getCartWithProducts(cart._id);

            return {
                success: true,
                cart: new CartDTO(updatedCart),
                message: 'Cantidad actualizada exitosamente'
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error al actualizar cantidad',
                statusCode: 500,
                error: error.message
            };
        }
    }

    async removeProductFromCart(userId, productId) {
        try {
            const user = await this.userDAO.getById(userId);
            if (!user.cart) {
                return {
                    success: false,
                    message: 'Carrito no encontrado',
                    statusCode: 404
                };
            }

            const cart = await this.cartDAO.getById(user.cart);
            const originalLength = cart.products.length;
            
            cart.products = cart.products.filter(
                item => item.product.toString() !== productId
            );

            if (cart.products.length === originalLength) {
                return {
                    success: false,
                    message: 'Producto no encontrado en el carrito',
                    statusCode: 404
                };
            }

            await this.cartDAO.update(cart._id, { products: cart.products });
            const updatedCart = await this.cartDAO.getCartWithProducts(cart._id);

            return {
                success: true,
                cart: new CartDTO(updatedCart),
                message: 'Producto removido del carrito exitosamente'
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error al remover producto del carrito',
                statusCode: 500,
                error: error.message
            };
        }
    }

    async clearCart(userId) {
        try {
            const user = await this.userDAO.getById(userId);
            if (!user.cart) {
                return {
                    success: false,
                    message: 'Carrito no encontrado',
                    statusCode: 404
                };
            }

            await this.cartDAO.update(user.cart, { products: [] });
            const clearedCart = await this.cartDAO.getById(user.cart);

            return {
                success: true,
                cart: new CartDTO(clearedCart),
                message: 'Carrito vaciado exitosamente'
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error al vaciar el carrito',
                statusCode: 500,
                error: error.message
            };
        }
    }

    async getCartTotal(userId) {
        try {
            const cartResult = await this.getUserCart(userId);
            
            if (!cartResult.success) {
                return cartResult;
            }

            const cart = cartResult.cart;
            let total = 0;
            let itemCount = 0;

            if (cart.products && cart.products.length > 0) {
                for (const item of cart.products) {
                    if (item.product && item.product.precio) {
                        total += item.product.precio * item.quantity;
                        itemCount += item.quantity;
                    }
                }
            }

            return {
                success: true,
                total,
                itemCount,
                formattedTotal: `$${total.toFixed(2)}`
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error al calcular total del carrito',
                statusCode: 500,
                error: error.message
            };
        }
    }

    async validateCartForPurchase(userId) {
        try {
            const cartResult = await this.getUserCart(userId);
            
            if (!cartResult.success) {
                return cartResult;
            }

            const cart = cartResult.cart;
            
            if (!cart.products || cart.products.length === 0) {
                return {
                    success: false,
                    message: 'El carrito está vacío',
                    statusCode: 400
                };
            }

            const validationResults = [];
            let hasErrors = false;

            for (const item of cart.products) {
                const product = await this.productDAO.getById(item.product._id || item.product);
                
                if (!product) {
                    validationResults.push({
                        productId: item.product._id || item.product,
                        error: 'Producto no encontrado',
                        valid: false
                    });
                    hasErrors = true;
                } else if (product.stock < item.quantity) {
                    validationResults.push({
                        productId: product._id,
                        productName: product.nombre,
                        requestedQuantity: item.quantity,
                        availableStock: product.stock,
                        error: 'Stock insuficiente',
                        valid: false
                    });
                    hasErrors = true;
                } else {
                    validationResults.push({
                        productId: product._id,
                        productName: product.nombre,
                        quantity: item.quantity,
                        price: product.precio,
                        subtotal: product.precio * item.quantity,
                        valid: true
                    });
                }
            }

            return {
                success: !hasErrors,
                validationResults,
                message: hasErrors ? 'Algunos productos tienen problemas' : 'Carrito válido para compra'
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error al validar carrito',
                statusCode: 500,
                error: error.message
            };
        }
    }
}

export default new CartRepository();
