import mongoose from 'mongoose'

const orderProductSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Productos',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false })

const shippingAddressSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    postalCode: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    }
}, { _id: false })

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    products: {
        type: [orderProductSchema],
        required: true,
        validate: {
            validator: function(products) {
                return products && products.length > 0;
            },
            message: 'La orden debe tener al menos un producto'
        }
    },
    shippingAddress: {
        type: shippingAddressSchema,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['credit_card', 'debit_card', 'bank_transfer', 'cash_on_delivery'],
        default: 'credit_card'
    },
    paymentDetails: {
        cardLastFour: {
            type: String,
            default: null
        },
        cardType: {
            type: String,
            enum: ['visa', 'mastercard', 'amex', 'other'],
            default: null
        }
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    shippingCost: {
        type: Number,
        default: 0,
        min: 0
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
        index: true
    },
    trackingNumber: {
        type: String,
        default: null
    },
    estimatedDelivery: {
        type: Date,
        required: true
    },
    actualDelivery: {
        type: Date,
        default: null
    },
    notes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true,
    versionKey: false
})

orderSchema.index({ userId: 1, createdAt: -1 })
orderSchema.index({ status: 1, createdAt: -1 })

orderSchema.statics.generateOrderNumber = async function() {
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    
    const lastOrder = await this.findOne({
        orderNumber: { $regex: `^ORD-${dateStr}-` }
    }).sort({ orderNumber: -1 })
    
    let sequence = 1
    if (lastOrder) {
        const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2])
        sequence = lastSequence + 1
    }
    
    return `ORD-${dateStr}-${sequence.toString().padStart(3, '0')}`
}

orderSchema.methods.calculateTotal = function() {
    const productTotal = this.products.reduce((sum, product) => sum + product.subtotal, 0)
    return productTotal + this.shippingCost
}

orderSchema.methods.getSummary = function() {
    return {
        orderNumber: this.orderNumber,
        totalItems: this.products.reduce((sum, product) => sum + product.quantity, 0),
        totalAmount: this.totalAmount,
        status: this.status,
        createdAt: this.createdAt,
        estimatedDelivery: this.estimatedDelivery
    }
}

orderSchema.pre('save', function(next) {
    this.products.forEach(product => {
        product.subtotal = product.price * product.quantity
    })
    
    this.totalAmount = this.calculateTotal()
    
    next()
})

orderSchema.pre('save', async function(next) {
    if (this.isNew && !this.orderNumber) {
        this.orderNumber = await this.constructor.generateOrderNumber()
    }
    next()
})

export default mongoose.model('Order', orderSchema)
