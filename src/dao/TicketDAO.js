import BaseDAO from './BaseDAO.js';
import Ticket from '../models/ticket.model.js';

class TicketDAO extends BaseDAO {
    constructor() {
        super(Ticket);
    }

    async getTicketsByUser(userId) {
        try {
            return await this.model.find({ purchaser_id: userId })
                .populate('products.product')
                .sort({ purchase_datetime: -1 });
        } catch (error) {
            throw new Error(`Error al obtener tickets del usuario: ${error.message}`);
        }
    }

    async getTicketByCode(code) {
        try {
            return await this.model.findOne({ code })
                .populate('products.product')
                .populate('purchaser_id');
        } catch (error) {
            throw new Error(`Error al buscar ticket por código: ${error.message}`);
        }
    }

    
    async createTicket(ticketData) {
        try {
            const ticketCode = this.model.generateTicketCode();
            
            const ticket = await this.create({
                ...ticketData,
                code: ticketCode
            });

            return ticket;
        } catch (error) {
            
            if (error.code === 11000 && error.keyValue?.code) {
                return this.createTicket(ticketData);
            }
            throw new Error(`Error al crear ticket: ${error.message}`);
        }
    }

    
    async updateTicketStatus(ticketId, status, additionalData = {}) {
        try {
            return await this.model.findByIdAndUpdate(
                ticketId,
                { 
                    status, 
                    ...additionalData,
                    updated_at: new Date() 
                },
                { new: true, runValidators: true }
            ).populate('products.product');
        } catch (error) {
            throw new Error(`Error al actualizar estado del ticket: ${error.message}`);
        }
    }

    
    async getTicketStats(userId = null) {
        try {
            const matchStage = userId ? { purchaser_id: userId } : {};
            
            const stats = await this.model.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        total_tickets: { $sum: 1 },
                        total_amount: { $sum: '$amount' },
                        avg_amount: { $avg: '$amount' },
                        completed_tickets: {
                            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                        },
                        partial_tickets: {
                            $sum: { $cond: [{ $eq: ['$status', 'partially_completed'] }, 1, 0] }
                        },
                        failed_tickets: {
                            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
                        },
                        first_purchase: { $min: '$purchase_datetime' },
                        last_purchase: { $max: '$purchase_datetime' }
                    }
                }
            ]);

            return stats[0] || {
                total_tickets: 0,
                total_amount: 0,
                avg_amount: 0,
                completed_tickets: 0,
                partial_tickets: 0,
                failed_tickets: 0,
                first_purchase: null,
                last_purchase: null
            };
        } catch (error) {
            throw new Error(`Error al obtener estadísticas: ${error.message}`);
        }
    }

    
    async getTicketsByDateRange(startDate, endDate, userId = null) {
        try {
            const matchConditions = {
                purchase_datetime: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };

            if (userId) {
                matchConditions.purchaser_id = userId;
            }

            return await this.model.find(matchConditions)
                .populate('products.product')
                .populate('purchaser_id')
                .sort({ purchase_datetime: -1 });
        } catch (error) {
            throw new Error(`Error al obtener tickets por rango de fechas: ${error.message}`);
        }
    }

    
    async getTopSellingProducts(limit = 10) {
        try {
            const topProducts = await this.model.aggregate([
                { $match: { status: { $in: ['completed', 'partially_completed'] } } },
                { $unwind: '$products' },
                {
                    $group: {
                        _id: '$products.product',
                        title: { $first: '$products.title' },
                        total_quantity: { $sum: '$products.quantity' },
                        total_revenue: { $sum: '$products.subtotal' },
                        times_sold: { $sum: 1 }
                    }
                },
                { $sort: { total_quantity: -1 } },
                { $limit: limit },
                {
                    $lookup: {
                        from: 'productos',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'product_details'
                    }
                }
            ]);

            return topProducts;
        } catch (error) {
            throw new Error(`Error al obtener productos más vendidos: ${error.message}`);
        }
    }

   
    async getSalesByMonth(year = new Date().getFullYear()) {
        try {
            const salesByMonth = await this.model.aggregate([
                {
                    $match: {
                        status: { $in: ['completed', 'partially_completed'] },
                        purchase_datetime: {
                            $gte: new Date(`${year}-01-01`),
                            $lte: new Date(`${year}-12-31`)
                        }
                    }
                },
                {
                    $group: {
                        _id: { $month: '$purchase_datetime' },
                        total_sales: { $sum: '$amount' },
                        total_tickets: { $sum: 1 },
                        avg_ticket: { $avg: '$amount' }
                    }
                },
                { $sort: { '_id': 1 } }
            ]);

            
            const monthNames = [
                'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
            ];

            const result = [];
            for (let i = 1; i <= 12; i++) {
                const monthData = salesByMonth.find(item => item._id === i);
                result.push({
                    month: i,
                    month_name: monthNames[i - 1],
                    total_sales: monthData?.total_sales || 0,
                    total_tickets: monthData?.total_tickets || 0,
                    avg_ticket: monthData?.avg_ticket || 0
                });
            }

            return result;
        } catch (error) {
            throw new Error(`Error al obtener ventas por mes: ${error.message}`);
        }
    }
}

export default new TicketDAO();
