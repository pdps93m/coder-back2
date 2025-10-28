import ticketDAO from '../dao/TicketDAO.js';
import cartDAO from '../dao/CartDAO.js';
import productDAO from '../dao/ProductDAO.js';
import userDAO from '../dao/UserDAO.js';
import EmailService from '../services/EmailService.js';
import TicketDTO from '../dto/TicketDTO.js';

class PurchaseRepository {
    constructor() {
        this.ticketDAO = ticketDAO;
        this.cartDAO = cartDAO;
        this.productDAO = productDAO;
        this.userDAO = userDAO;
        this.emailService = new EmailService();
    }

    async processPurchase(userId, paymentMethod = 'cash', notes = '') {
        try {
            const user = await this.userDAO.getUserWithCart(userId);
            if (!user) {
                return {
                    success: false,
                    message: 'Usuario no encontrado',
                    statusCode: 404
                };
            }

            if (!user.cart || !user.cart.products || user.cart.products.length === 0) {
                return {
                    success: false,
                    message: 'El carrito está vacío',
                    statusCode: 400
                };
            }

            const stockValidation = await this.validateCartStock(user.cart);
            
            if (stockValidation.availableProducts.length === 0) {
                return {
                    success: false,
                    message: 'Ningún producto tiene stock disponible',
                    statusCode: 400,
                    data: {
                        failed_products: stockValidation.unavailableProducts
                    }
                };
            }

            const ticketData = {
                purchaser: user.email,
                purchaser_id: userId,
                status: 'pending',
                products: [],
                failed_products: stockValidation.unavailableProducts,
                payment_method: paymentMethod,
                notes: notes,
                amount: 0
            };

            const ticket = await this.ticketDAO.createTicket(ticketData);

            const processedProducts = [];
            let totalAmount = 0;
            const stockUpdates = [];

            for (const item of stockValidation.availableProducts) {
                const product = item.product;
                const quantity = item.quantity;
                const subtotal = product.precio * quantity;

                processedProducts.push({
                    product: product._id,
                    title: product.nombre,
                    price: product.precio,
                    quantity: quantity,
                    subtotal: subtotal,
                    status: 'available'
                });

                stockUpdates.push({
                    productId: product._id,
                    newStock: product.stock - quantity
                });

                totalAmount += subtotal;
            }

            for (const update of stockUpdates) {
                await this.productDAO.update(update.productId, { stock: update.newStock });
            }

            let finalStatus = 'completed';
            if (stockValidation.unavailableProducts.length > 0) {
                finalStatus = 'partially_completed';
            }

            const finalTicket = await this.ticketDAO.updateTicketStatus(ticket._id, finalStatus, {
                products: processedProducts,
                amount: totalAmount
            });

            await this.cartDAO.clearCart(user.cart._id);

            await this.sendPurchaseConfirmationEmail(user, finalTicket);

            const result = {
                success: true,
                message: finalStatus === 'completed' ? 
                    'Compra realizada exitosamente' : 
                    'Compra parcialmente completada',
                statusCode: 201,
                data: {
                    ticket: new TicketDTO(finalTicket),
                    summary: {
                        total_amount: totalAmount,
                        successful_products: processedProducts.length,
                        failed_products: stockValidation.unavailableProducts.length,
                        is_partial: finalStatus === 'partially_completed'
                    }
                }
            };

            return result;

        } catch (error) {
            console.error('Error en processPurchase:', error);
            return {
                success: false,
                message: 'Error interno al procesar la compra',
                statusCode: 500,
                error: error.message
            };
        }
    }

    async validateCartStock(cart) {
        const availableProducts = [];
        const unavailableProducts = [];

        for (const item of cart.products) {
            const product = await this.productDAO.getById(item.product._id || item.product);
            
            if (!product) {
                unavailableProducts.push({
                    product_id: item.product._id || item.product,
                    title: 'Producto no encontrado',
                    requested_quantity: item.quantity,
                    available_stock: 0,
                    reason: 'product_not_found'
                });
                continue;
            }

            if (product.stock === 0) {
                unavailableProducts.push({
                    product_id: product._id,
                    title: product.nombre,
                    requested_quantity: item.quantity,
                    available_stock: 0,
                    reason: 'out_of_stock'
                });
            } else if (product.stock < item.quantity) {
                unavailableProducts.push({
                    product_id: product._id,
                    title: product.nombre,
                    requested_quantity: item.quantity,
                    available_stock: product.stock,
                    reason: 'insufficient_stock'
                });
            } else {
                availableProducts.push({
                    product: product,
                    quantity: item.quantity
                });
            }
        }

        return {
            availableProducts,
            unavailableProducts
        };
    }

    async getUserTickets(userId) {
        try {
            const tickets = await this.ticketDAO.getTicketsByUser(userId);
            const ticketsDTO = tickets.map(ticket => new TicketDTO(ticket));

            return {
                success: true,
                data: ticketsDTO,
                total: ticketsDTO.length
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error al obtener tickets',
                statusCode: 500,
                error: error.message
            };
        }
    }

    async getTicketByCode(code, userId = null) {
        try {
            const ticket = await this.ticketDAO.getTicketByCode(code);
            
            if (!ticket) {
                return {
                    success: false,
                    message: 'Ticket no encontrado',
                    statusCode: 404
                };
            }

            if (userId && ticket.purchaser_id.toString() !== userId.toString()) {
                return {
                    success: false,
                    message: 'No tienes permisos para ver este ticket',
                    statusCode: 403
                };
            }

            return {
                success: true,
                data: new TicketDTO(ticket)
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error al obtener ticket',
                statusCode: 500,
                error: error.message
            };
        }
    }

    async getPurchaseStats(userId = null) {
        try {
            const stats = await this.ticketDAO.getTicketStats(userId);

            return {
                success: true,
                data: {
                    ...stats,
                    success_rate: stats.total_tickets > 0 ? 
                        ((stats.completed_tickets / stats.total_tickets) * 100).toFixed(2) + '%' : 
                        '0%'
                }
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error al obtener estadísticas',
                statusCode: 500,
                error: error.message
            };
        }
    }

    async cancelTicket(ticketId, userId, reason = '') {
        try {
            const ticket = await this.ticketDAO.getById(ticketId);
            
            if (!ticket) {
                return {
                    success: false,
                    message: 'Ticket no encontrado',
                    statusCode: 404
                };
            }

            if (ticket.purchaser_id.toString() !== userId.toString()) {
                return {
                    success: false,
                    message: 'No tienes permisos para cancelar este ticket',
                    statusCode: 403
                };
            }

            if (ticket.status !== 'pending') {
                return {
                    success: false,
                    message: 'Solo se pueden cancelar tickets pendientes',
                    statusCode: 400
                };
            }

            for (const item of ticket.products) {
                const product = await this.productDAO.getById(item.product);
                if (product) {
                    await this.productDAO.update(item.product, { 
                        stock: product.stock + item.quantity 
                    });
                }
            }

            const cancelledTicket = await this.ticketDAO.updateTicketStatus(ticketId, 'cancelled', {
                notes: ticket.notes ? `${ticket.notes}\nCancelado: ${reason}` : `Cancelado: ${reason}`
            });

            return {
                success: true,
                message: 'Ticket cancelado exitosamente',
                data: new TicketDTO(cancelledTicket)
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error al cancelar ticket',
                statusCode: 500,
                error: error.message
            };
        }
    }

    async sendPurchaseConfirmationEmail(user, ticket) {
        try {
            const emailContent = this.generatePurchaseEmailTemplate(user, ticket);
            
            await this.emailService.transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: `Confirmación de Compra - Ticket ${ticket.code}`,
                html: emailContent
            });

        } catch (error) {
            console.error('Error al enviar email de confirmación:', error);
        }
    }

    generatePurchaseEmailTemplate(user, ticket) {
        const isPartial = ticket.status === 'partially_completed';
        
        const productsHtml = ticket.products.map(item => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.subtotal.toFixed(2)}</td>
            </tr>
        `).join('');

        const failedProductsHtml = ticket.failed_products?.length > 0 ? `
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #856404; margin-bottom: 10px;">⚠️ Productos no disponibles:</h3>
                ${ticket.failed_products.map(item => `
                    <p style="color: #856404; margin: 5px 0;">
                        • ${item.title} (Solicitado: ${item.requested_quantity}, Disponible: ${item.available_stock})
                    </p>
                `).join('')}
            </div>
        ` : '';

        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: ${isPartial ? '#fff3cd' : '#d4edda'}; padding: 30px; border-radius: 10px; text-align: center;">
                    <h1 style="color: ${isPartial ? '#856404' : '#155724'}; margin-bottom: 20px;">
                        ${isPartial ? '⚠️ Compra Parcialmente Completada' : '✅ Compra Exitosa'}
                    </h1>
                    <p style="color: #333; font-size: 18px; margin-bottom: 10px;">
                        ¡Hola <strong>${user.first_name}</strong>!
                    </p>
                    <p style="color: #666; font-size: 16px;">
                        Ticket: <strong>${ticket.code}</strong>
                    </p>
                    <p style="color: #666; font-size: 14px;">
                        Fecha: ${new Date(ticket.purchase_datetime).toLocaleString('es-ES')}
                    </p>
                </div>

                ${failedProductsHtml}

                <div style="background-color: white; padding: 25px; border-radius: 8px; margin: 20px 0; border: 1px solid #ddd;">
                    <h2 style="color: #333; margin-bottom: 20px;">Productos Comprados:</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background-color: #f8f9fa;">
                                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Producto</th>
                                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Cant.</th>
                                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Precio</th>
                                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${productsHtml}
                        </tbody>
                        <tfoot>
                            <tr style="background-color: #f8f9fa; font-weight: bold;">
                                <td colspan="3" style="padding: 15px; text-align: right; border-top: 2px solid #dee2e6;">TOTAL:</td>
                                <td style="padding: 15px; text-align: right; border-top: 2px solid #dee2e6;">$${ticket.amount.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; text-align: center;">
                    <p style="color: #666; font-size: 14px; margin: 0;">
                        Gracias por tu compra. Guarda este email como comprobante.
                    </p>
                </div>
            </div>
        `;
    }
}

export default new PurchaseRepository();
