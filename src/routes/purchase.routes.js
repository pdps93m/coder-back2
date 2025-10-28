import { Router } from 'express';
import purchaseRepository from '../repository/PurchaseRepository.js';
import ticketDAO from '../dao/TicketDAO.js';
import { requireUser, requireAdmin, requireUserOrAdmin } from '../middlewares/auth.js';
import passport from 'passport';

const router = Router();

router.post('/process', passport.authenticate('jwt', { session: false }), requireUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { payment_method = 'cash', notes = '' } = req.body || {};

        const validPaymentMethods = ['cash', 'credit_card', 'debit_card', 'paypal', 'bank_transfer'];
        if (!validPaymentMethods.includes(payment_method)) {
            return res.status(400).json({
                success: false,
                message: 'Método de pago inválido',
                valid_methods: validPaymentMethods
            });
        }

        const result = await purchaseRepository.processPurchase(userId, payment_method, notes);
        
        res.status(result.statusCode || 200).json({
            success: result.success,
            message: result.message,
            data: result.data
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

router.get('/my-tickets', passport.authenticate('jwt', { session: false }), requireUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await purchaseRepository.getUserTickets(userId);
        
        if (!result.success) {
            return res.status(result.statusCode || 500).json({
                success: result.success,
                message: result.message
            });
        }

        res.json({
            success: true,
            data: result.data,
            total: result.total
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

router.get('/ticket/:code', passport.authenticate('jwt', { session: false }), requireUserOrAdmin, async (req, res) => {
    try {
        const { code } = req.params;
        const userId = req.user.role === 'admin' ? null : req.user.id;
        
        const result = await purchaseRepository.getTicketByCode(code, userId);
        
        if (!result.success) {
            return res.status(result.statusCode || 500).json({
                success: result.success,
                message: result.message
            });
        }

        res.json({
            success: true,
            data: result.data
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

router.post('/cancel/:ticketId', passport.authenticate('jwt', { session: false }), requireUser, async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { reason = 'Cancelado por el usuario' } = req.body;
        const userId = req.user.id;
        
        const result = await purchaseRepository.cancelTicket(ticketId, userId, reason);
        
        res.status(result.statusCode || 200).json({
            success: result.success,
            message: result.message,
            data: result.data
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

router.get('/stats', passport.authenticate('jwt', { session: false }), requireUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await purchaseRepository.getPurchaseStats(userId);
        
        if (!result.success) {
            return res.status(result.statusCode || 500).json({
                success: result.success,
                message: result.message
            });
        }

        res.json({
            success: true,
            data: result.data
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

router.get('/admin/all-tickets', passport.authenticate('jwt', { session: false }), requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, status, start_date, end_date } = req.query;
        
        let tickets;
        
        if (start_date && end_date) {
            tickets = await ticketDAO.getTicketsByDateRange(start_date, end_date);
        } else {
            const options = {
                skip: (page - 1) * limit,
                limit: parseInt(limit),
                sort: { purchase_datetime: -1 }
            };
            
            const filter = status ? { status } : {};
            tickets = await ticketDAO.find(filter, options);
        }

        res.json({
            success: true,
            data: tickets,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: tickets.length
            }
        });

    } catch (error) {
        console.error('Error en all-tickets:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

router.get('/admin/stats', passport.authenticate('jwt', { session: false }), requireAdmin, async (req, res) => {
    try {
        const result = await purchaseRepository.getPurchaseStats();
        
        if (!result.success) {
            return res.status(result.statusCode || 500).json({
                success: result.success,
                message: result.message
            });
        }

        res.json({
            success: true,
            data: result.data
        });

    } catch (error) {
        console.error('Error en admin stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

router.get('/admin/top-products', passport.authenticate('jwt', { session: false }), requireAdmin, async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const topProducts = await ticketDAO.getTopSellingProducts(parseInt(limit));
        
        res.json({
            success: true,
            data: topProducts,
            total: topProducts.length
        });

    } catch (error) {
        console.error('Error en top-products:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

router.get('/admin/sales-by-month', passport.authenticate('jwt', { session: false }), requireAdmin, async (req, res) => {
    try {
        const { year = new Date().getFullYear() } = req.query;
        const salesByMonth = await ticketDAO.getSalesByMonth(parseInt(year));
        
        res.json({
            success: true,
            data: salesByMonth,
            year: parseInt(year)
        });

    } catch (error) {
        console.error('Error en sales-by-month:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

export default router;
