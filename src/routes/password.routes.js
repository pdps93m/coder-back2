import { Router } from 'express';
import passwordRecoveryRepository from '../repository/PasswordRecoveryRepository.js';
import EmailService from '../services/EmailService.js';
import { requireAuth } from '../middlewares/auth.js';
import passport from 'passport';

const router = Router();
const emailService = new EmailService();

router.post('/request-reset', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email es requerido' 
            });
        }

        const result = await passwordRecoveryRepository.requestPasswordReset(email);
        
        if (result.success && result.data && result.data.user) {
            const emailResult = await emailService.sendPasswordResetEmail(
                result.data.user.email,
                result.data.user.first_name,
                result.data.resetLink
            );

            if (!emailResult.success) {
            }
        }

        res.status(result.statusCode).json({
            success: result.success,
            message: result.message
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

router.get('/validate-token/:token', async (req, res) => {
    try {
        const { token } = req.params;
        
        const result = await passwordRecoveryRepository.validateResetToken(token);
        
        res.status(result.statusCode || 200).json({
            success: result.success,
            message: result.message,
            data: result.data ? {
                email: result.data.email,
                expiresAt: result.data.expiresAt
            } : null
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

router.post('/reset', async (req, res) => {
    try {
        const { token, newPassword, confirmPassword } = req.body;
        
        const result = await passwordRecoveryRepository.resetPassword(
            token, 
            newPassword, 
            confirmPassword
        );
        
        if (result.success) {
            const tokenValidation = await passwordRecoveryRepository.validateResetToken(token);
            if (tokenValidation.success && tokenValidation.data) {
                await emailService.sendPasswordChangedEmail(
                    tokenValidation.data.email,
                    'Usuario'
                );
            }
        }
        
        res.status(result.statusCode).json({
            success: result.success,
            message: result.message
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

router.post('/change', passport.authenticate('jwt', { session: false }), requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const userId = req.user.id;
        
        const result = await passwordRecoveryRepository.changePassword(
            userId,
            currentPassword,
            newPassword,
            confirmPassword
        );
        
        if (result.success) {
            await emailService.sendPasswordChangedEmail(
                req.user.email,
                req.user.first_name || 'Usuario'
            );
        }
        
        res.status(result.statusCode).json({
            success: result.success,
            message: result.message
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

router.get('/stats/:userId', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const isAdmin = req.user.role === 'admin';
        const isOwnStats = req.user.id === req.params.userId;
        
        if (!isAdmin && !isOwnStats) {
            return res.status(403).json({ 
                success: false, 
                message: 'No tienes permisos para ver estas estadísticas' 
            });
        }

        const result = await passwordRecoveryRepository.getPasswordResetStats(req.params.userId);
        
        res.json(result);

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

export default router;
