import UserDAO from '../dao/UserDAO.js';
import CartDAO from '../dao/CartDAO.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import UserDTO from '../dto/UserDTO.js';

class UserRepository {
    constructor() {
        this.userDAO = UserDAO;
        this.cartDAO = CartDAO;
    }

    async authenticateUser(email, password) {
        try {
            const user = await this.userDAO.findByEmail(email);
            
            if (!user) {
                return {
                    success: false,
                    message: 'Credenciales inválidas',
                    statusCode: 401
                };
            }

            const isValidPassword = bcrypt.compareSync(password, user.password);
            if (!isValidPassword) {
                return {
                    success: false,
                    message: 'Credenciales inválidas',
                    statusCode: 401
                };
            }

            return {
                success: true,
                user: user,
                userDTO: new UserDTO(user),
                message: 'Autenticación exitosa'
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error interno del servidor',
                statusCode: 500,
                error: error.message
            };
        }
    }

    async registerUser(userData) {
        try {
            const { first_name, last_name, email, age, password } = userData;

            if (!first_name || !email || !password) {
                return {
                    success: false,
                    message: 'first_name, email y password son requeridos',
                    statusCode: 400
                };
            }

            const existingUser = await this.userDAO.findByEmail(email);
            if (existingUser) {
                return {
                    success: false,
                    message: 'El email ya está registrado',
                    statusCode: 400
                };
            }

            const newCart = await this.cartDAO.createEmptyCart();

            const hashedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10));

            const newUser = await this.userDAO.create({
                first_name,
                last_name,
                email,
                age,
                password: hashedPassword,
                cart: newCart._id
            });

            return {
                success: true,
                user: new UserDTO(newUser),
                message: 'Usuario registrado exitosamente',
                statusCode: 201
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error interno del servidor',
                statusCode: 500,
                error: error.message
            };
        }
    }

    async generateTokens(user) {
        try {
            const tokenPayload = {
                id: user._id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role
            };
            
            const accessToken = jwt.sign(
                tokenPayload,
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );
            
            const refreshToken = jwt.sign(
                {
                    id: user._id,
                    email: user.email
                },
                process.env.JWT_REFRESH_SECRET,
                { expiresIn: '7d' }
            );

            return {
                success: true,
                accessToken,
                refreshToken
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error al generar tokens',
                error: error.message
            };
        }
    }

    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await this.userDAO.getById(userId);
            
            if (!user) {
                return {
                    success: false,
                    message: 'Usuario no encontrado',
                    statusCode: 404
                };
            }

            const isValidPassword = bcrypt.compareSync(currentPassword, user.password);
            if (!isValidPassword) {
                return {
                    success: false,
                    message: 'Contraseña actual incorrecta',
                    statusCode: 401
                };
            }

            const hashedNewPassword = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10));
            await this.userDAO.updatePassword(userId, hashedNewPassword);

            return {
                success: true,
                message: 'Contraseña actualizada exitosamente'
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error interno del servidor',
                statusCode: 500,
                error: error.message
            };
        }
    }

    async getUserProfile(userId) {
        try {
            const user = await this.userDAO.getById(userId);
            
            if (!user) {
                return {
                    success: false,
                    message: 'Usuario no encontrado',
                    statusCode: 404
                };
            }

            return {
                success: true,
                user: new UserDTO(user)
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error interno del servidor',
                statusCode: 500,
                error: error.message
            };
        }
    }
}

export default new UserRepository();
