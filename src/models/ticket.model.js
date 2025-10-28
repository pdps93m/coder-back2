import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    purchase_datetime: {
        type: Date,
        default: Date.now,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    purchaser: {
        type: String,
        required: true,
        validate: {
            validator: function(email) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            },
            message: 'Email inválido'
        }
    },
    purchaser_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'partially_completed', 'failed', 'cancelled'],
        default: 'pending'
    },
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'productos',
            required: true
        },
        title: {
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
        },
        status: {
            type: String,
            enum: ['available', 'out_of_stock', 'insufficient_stock'],
            default: 'available'
        }
    }],
    failed_products: [{
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'productos'
        },
        title: String,
        requested_quantity: Number,
        available_stock: Number,
        reason: {
            type: String,
            enum: ['out_of_stock', 'insufficient_stock', 'product_not_found']
        }
    }],
    payment_method: {
        type: String,
        enum: ['cash', 'credit_card', 'debit_card', 'paypal', 'bank_transfer'],
        default: 'cash'
    },
    notes: {
        type: String,
        maxlength: 500
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

ticketSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

ticketSchema.index({ purchaser: 1 });
ticketSchema.index({ purchaser_id: 1 });
ticketSchema.index({ purchase_datetime: -1 });
ticketSchema.index({ status: 1 });

ticketSchema.statics.generateTicketCode = function() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `TICKET-${timestamp}-${randomStr}`.toUpperCase();
};

ticketSchema.methods.calculateTotal = function() {
    return this.products.reduce((total, item) => total + item.subtotal, 0);
};

ticketSchema.methods.isPurchaseSuccessful = function() {
    return this.status === 'completed' && this.failed_products.length === 0;
};

ticketSchema.methods.isPurchasePartial = function() {
    return this.status === 'partially_completed' && this.failed_products.length > 0;
};

export default mongoose.model('Ticket', ticketSchema);
