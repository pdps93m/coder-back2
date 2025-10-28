import BaseDAO from './BaseDAO.js';
import PasswordResetToken from '../models/passwordResetToken.model.js';

class PasswordResetTokenDAO extends BaseDAO {
    constructor() {
        super(PasswordResetToken);
    }

    async findValidToken(token) {
        try {
            return await this.model.findOne({
                token,
                used: false,
                expiresAt: { $gt: new Date() }
            }).populate('userId');
        } catch (error) {
            throw new Error(`Error al buscar token válido: ${error.message}`);
        }
    }

    async invalidateUserTokens(userId) {
        try {
            return await this.model.updateMany(
                { userId, used: false },
                { used: true, updatedAt: new Date() }
            );
        } catch (error) {
            throw new Error(`Error al invalidar tokens previos del usuario: ${error.message}`);
        }
    }

    async createResetToken(userId, email, token) {
        try {
            await this.invalidateUserTokens(userId);
            
            return await this.create({
                userId,
                email,
                token,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000)
            });
        } catch (error) {
            throw new Error(`Error al crear token de recuperación: ${error.message}`);
        }
    }

    async markTokenAsUsed(tokenId) {
        try {
            return await this.model.findByIdAndUpdate(
                tokenId,
                { used: true, usedAt: new Date() },
                { new: true }
            );
        } catch (error) {
            throw new Error(`Error al marcar token como usado: ${error.message}`);
        }
    }

    async getUserResetStats(userId) {
        try {
            const stats = await this.model.aggregate([
                { $match: { userId: userId } },
                {
                    $group: {
                        _id: null,
                        totalRequests: { $sum: 1 },
                        usedTokens: { $sum: { $cond: ['$used', 1, 0] } },
                        expiredTokens: { $sum: { $cond: [{ $lt: ['$expiresAt', new Date()] }, 1, 0] } },
                        lastRequest: { $max: '$createdAt' }
                    }
                }
            ]);
            
            return stats[0] || {
                totalRequests: 0,
                usedTokens: 0,
                expiredTokens: 0,
                lastRequest: null
            };
        } catch (error) {
            throw new Error(`Error al obtener estadísticas: ${error.message}`);
        }
    }

    async cleanExpiredTokens() {
        try {
            const result = await this.model.deleteMany({
                expiresAt: { $lt: new Date() }
            });
            return result.deletedCount;
        } catch (error) {
            throw new Error(`Error al limpiar tokens expirados: ${error.message}`);
        }
    }
}

export default new PasswordResetTokenDAO();
