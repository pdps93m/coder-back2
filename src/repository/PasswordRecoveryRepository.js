import userDAO from '../dao/UserDAO.js';
import passwordResetTokenDAO from '../dao/PasswordResetTokenDAO.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

class PasswordRecoveryRepository {
    constructor() {
        this.userDAO = userDAO;
        this.tokenDAO = passwordResetTokenDAO;
    }

    // Lógica de negocio: Solicitar recuperación de contraseña
    async requestPasswordReset(email) {
        try {
            // Validar email
            if (!email || !this.isValidEmail(email)) {
                return {
                    success: false,
                    message: 'Email inválido',
                    statusCode: 400
                };
            }

            // Buscar usuario por email
            const user = await this.userDAO.findByEmail(email);
            if (!user) {
                // Por seguridad, no revelar si el email existe o no
                return {
                    success: true,
                    message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña',
                    statusCode: 200
                };
            }

            // Verificar rate limiting (máximo 3 solicitudes por hora)
            const recentRequests = await this.checkRateLimit(user._id);
            if (recentRequests >= 3) {
                return {
                    success: false,
                    message: 'Demasiadas solicitudes. Intenta nuevamente en 1 hora',
                    statusCode: 429
                };
            }

            // Generar token seguro
            const resetToken = this.generateSecureToken();
            
            // Crear token en base de datos
            await this.tokenDAO.createResetToken(user._id, email, resetToken);

            // Generar enlace de recuperación
            const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

            return {
                success: true,
                message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña',
                statusCode: 200,
                data: {
                    resetToken, // Para testing, en producción no se retorna
                    resetLink,
                    user: {
                        email: user.email,
                        first_name: user.first_name
                    }
                }
            };
        } catch (error) {
            console.error('Error en requestPasswordReset:', error);
            return {
                success: false,
                message: 'Error interno del servidor',
                statusCode: 500,
                error: error.message
            };
        }
    }

    // Lógica de negocio: Validar token de recuperación
    async validateResetToken(token) {
        try {
            if (!token) {
                return {
                    success: false,
                    message: 'Token requerido',
                    statusCode: 400
                };
            }

            // Buscar token válido
            const resetTokenRecord = await this.tokenDAO.findValidToken(token);
            
            if (!resetTokenRecord) {
                return {
                    success: false,
                    message: 'Token inválido, expirado o ya utilizado',
                    statusCode: 400
                };
            }

            return {
                success: true,
                message: 'Token válido',
                data: {
                    tokenId: resetTokenRecord._id,
                    userId: resetTokenRecord.userId._id,
                    email: resetTokenRecord.email,
                    expiresAt: resetTokenRecord.expiresAt
                }
            };
        } catch (error) {
            console.error('Error en validateResetToken:', error);
            return {
                success: false,
                message: 'Error interno del servidor',
                statusCode: 500,
                error: error.message
            };
        }
    }

    // Lógica de negocio: Resetear contraseña con token
    async resetPassword(token, newPassword, confirmPassword) {
        try {
            // Validaciones básicas
            if (!token || !newPassword || !confirmPassword) {
                return {
                    success: false,
                    message: 'Token, nueva contraseña y confirmación son requeridos',
                    statusCode: 400
                };
            }

            if (newPassword !== confirmPassword) {
                return {
                    success: false,
                    message: 'Las contraseñas no coinciden',
                    statusCode: 400
                };
            }

            if (!this.isValidPassword(newPassword)) {
                return {
                    success: false,
                    message: 'La contraseña debe tener al menos 6 caracteres',
                    statusCode: 400
                };
            }

            // Validar token
            const tokenValidation = await this.validateResetToken(token);
            if (!tokenValidation.success) {
                return tokenValidation;
            }

            const { tokenId, userId } = tokenValidation.data;

            // Hash de la nueva contraseña
            const hashedPassword = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10));

            // Actualizar contraseña del usuario
            await this.userDAO.updatePassword(userId, hashedPassword);

            // Marcar token como usado
            await this.tokenDAO.markTokenAsUsed(tokenId);

            return {
                success: true,
                message: 'Contraseña actualizada exitosamente',
                statusCode: 200
            };
        } catch (error) {
            console.error('Error en resetPassword:', error);
            return {
                success: false,
                message: 'Error interno del servidor',
                statusCode: 500,
                error: error.message
            };
        }
    }

    // Lógica de negocio: Cambiar contraseña (usuario autenticado)
    async changePassword(userId, currentPassword, newPassword, confirmPassword) {
        try {
            // Validaciones
            if (!currentPassword || !newPassword || !confirmPassword) {
                return {
                    success: false,
                    message: 'Contraseña actual, nueva contraseña y confirmación son requeridos',
                    statusCode: 400
                };
            }

            if (newPassword !== confirmPassword) {
                return {
                    success: false,
                    message: 'Las contraseñas no coinciden',
                    statusCode: 400
                };
            }

            if (!this.isValidPassword(newPassword)) {
                return {
                    success: false,
                    message: 'La contraseña debe tener al menos 6 caracteres',
                    statusCode: 400
                };
            }

            // Obtener usuario y verificar contraseña actual
            const user = await this.userDAO.getById(userId);
            if (!user) {
                return {
                    success: false,
                    message: 'Usuario no encontrado',
                    statusCode: 404
                };
            }

            const isValidCurrentPassword = bcrypt.compareSync(currentPassword, user.password);
            if (!isValidCurrentPassword) {
                return {
                    success: false,
                    message: 'Contraseña actual incorrecta',
                    statusCode: 401
                };
            }

            // Verificar que la nueva contraseña sea diferente
            const isSamePassword = bcrypt.compareSync(newPassword, user.password);
            if (isSamePassword) {
                return {
                    success: false,
                    message: 'La nueva contraseña debe ser diferente a la actual',
                    statusCode: 400
                };
            }

            // Hash y actualizar contraseña
            const hashedPassword = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10));
            await this.userDAO.updatePassword(userId, hashedPassword);

            return {
                success: true,
                message: 'Contraseña actualizada exitosamente',
                statusCode: 200
            };
        } catch (error) {
            console.error('Error en changePassword:', error);
            return {
                success: false,
                message: 'Error interno del servidor',
                statusCode: 500,
                error: error.message
            };
        }
    }

    // Utilidades privadas
    generateSecureToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPassword(password) {
        return password && password.length >= 6;
    }

    async checkRateLimit(userId) {
        try {
            // Contar solicitudes en la última hora
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const recentTokens = await this.tokenDAO.find({
                userId,
                createdAt: { $gte: oneHourAgo }
            });
            return recentTokens.length;
        } catch (error) {
            console.error('Error en checkRateLimit:', error);
            return 0;
        }
    }

    // Método para obtener estadísticas (admin)
    async getPasswordResetStats(userId) {
        try {
            const stats = await this.tokenDAO.getUserResetStats(userId);
            return {
                success: true,
                data: stats
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error al obtener estadísticas',
                error: error.message
            };
        }
    }
}

export default new PasswordRecoveryRepository();
