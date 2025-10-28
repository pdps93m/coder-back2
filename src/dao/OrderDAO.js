import Order from '../models/order.model.js'
import BaseDAO from './BaseDAO.js'

class OrderDAO extends BaseDAO {
    constructor() {
        super(Order)
    }

    async createOrder(orderData) {
        try {
            const orderNumber = await this.generateOrderNumber()
            
            const order = new Order({
                ...orderData,
                orderNumber,
                createdAt: new Date(),
                updatedAt: new Date()
            })

            const savedOrder = await order.save()
            
            const populatedOrder = await Order.findById(savedOrder._id)
                .populate('userId', 'first_name email')
                .populate('products.productId', 'nombre precio descripcion categoria')
                .lean()

            return populatedOrder
            
        } catch (error) {
            throw error
        }
    }

    async getOrdersByUser(userId, options = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                status = null,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = options

            const query = { userId }
            if (status) {
                query.status = status
            }

            const skip = (page - 1) * limit
            const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

            const orders = await Order.find(query)
                .populate('userId', 'first_name email')
                .populate('products.productId', 'nombre precio descripcion categoria')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean()

            const total = await Order.countDocuments(query)

            return {
                orders,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPrevPage: page > 1
                }
            }
            
        } catch (error) {
            throw error
        }
    }

    async getOrderByNumber(orderNumber) {
        try {
            const order = await Order.findOne({ orderNumber })
                .populate('userId', 'first_name email')
                .populate('products.productId', 'nombre precio descripcion categoria')
                .lean()

            if (!order) {
                throw new Error(`Orden ${orderNumber} no encontrada`)
            }

            return order
            
        } catch (error) {
            throw error
        }
    }

    async getOrderById(orderId) {
        try {
            const order = await Order.findById(orderId)
                .populate('userId', 'first_name email')
                .populate('products.productId', 'nombre precio descripcion categoria')
                .lean()

            if (!order) {
                throw new Error(`Orden ${orderId} no encontrada`)
            }

            return order
            
        } catch (error) {
            throw error
        }
    }

    async updateOrderStatus(orderId, newStatus, additionalData = {}) {
        try {
            const updateData = {
                status: newStatus,
                updatedAt: new Date(),
                ...additionalData
            }

            if (newStatus === 'processing') {
                updateData.processedAt = new Date()
            } else if (newStatus === 'shipped') {
                updateData.shippedAt = new Date()
            } else if (newStatus === 'delivered') {
                updateData.deliveredAt = new Date()
            } else if (newStatus === 'cancelled') {
                updateData.cancelledAt = new Date()
            }

            const updatedOrder = await Order.findByIdAndUpdate(
                orderId,
                updateData,
                { new: true, runValidators: true }
            ).populate('userId', 'first_name email')
             .populate('products.productId', 'nombre precio descripcion categoria')
             .lean()

            if (!updatedOrder) {
                throw new Error(`Orden ${orderId} no encontrada`)
            }

            return updatedOrder
            
        } catch (error) {
            throw error
        }
    }

    async getOrderStats(userId = null) {
        try {
            const matchStage = userId ? { userId } : {}
            
            const stats = await Order.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalAmount: { $sum: '$totalAmount' },
                        averageAmount: { $avg: '$totalAmount' },
                        statusBreakdown: {
                            $push: '$status'
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalOrders: 1,
                        totalAmount: 1,
                        averageAmount: { $round: ['$averageAmount', 2] }
                    }
                }
            ])

            const statusStats = await Order.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$totalAmount' }
                    }
                }
            ])

            const result = {
                general: stats[0] || { totalOrders: 0, totalAmount: 0, averageAmount: 0 },
                byStatus: statusStats
            }

            return result
            
        } catch (error) {
            throw error
        }
    }

    async generateOrderNumber() {
        try {
            const timestamp = Date.now()
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
            return `ORD-${timestamp}-${random}`
        } catch (error) {
            throw error
        }
    }
}

export default OrderDAO