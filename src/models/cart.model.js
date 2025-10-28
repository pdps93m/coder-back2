import mongoose from 'mongoose';

const cartsCollection = 'carts'

const cartSchema = new mongoose.Schema({
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'productos',
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1,
                default: 1
            }
        }
    ]
}, {
    timestamps: true
})

cartSchema.methods.calculateTotal = async function() {
    await this.populate('products.product')
    return this.products.reduce((total, item) => {
        return total + (item.product.precio * item.quantity)
    }, 0)
}

cartSchema.methods.getTotalItems = function() {
    return this.products.reduce((total, item) => total + item.quantity, 0)
}

const Cart = mongoose.model(cartsCollection, cartSchema)

export default Cart
