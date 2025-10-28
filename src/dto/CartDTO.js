import ProductDTO from './ProductDTO.js';

class CartDTO {
    constructor(cart) {
        this.id = cart._id
        this.products = cart.products.map(item => ({
            product: item.product._id ? new ProductDTO(item.product) : item.product,
            quantity: item.quantity,
            subtotal: item.product.precio ? item.product.precio * item.quantity : 0
        }))
        this.totalItems = cart.getTotalItems ? cart.getTotalItems() : cart.products.reduce((total, item) => total + item.quantity, 0)
        this.createdAt = cart.createdAt
        this.updatedAt = cart.updatedAt
    }

    calculateTotal() {
        return this.products.reduce((total, item) => total + item.subtotal, 0)
    }
}

export default CartDTO
