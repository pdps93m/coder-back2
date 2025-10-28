import { Router } from 'express';
import userRepository from '../repository/UserRepository.js';
import passport from 'passport';
import EmailService from '../services/EmailService.js';

const router = Router();
const emailService = new EmailService();

router.post('/register', async (req, res) => {
    try {
        const result = await userRepository.registerUser(req.body);
        
        if (!result.success) {
            return res.status(result.statusCode).json({ error: result.message });
        }

        const { first_name, email } = req.body;
        
        try {
            await emailService.transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Cuenta creada exitosamente',
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #333;">¡Hola ${first_name}!</h1>
                    <p>Tu cuenta ha sido creada correctamente en nuestra plataforma.</p>
                    <p>Ya puedes iniciar sesión cuando gustes.</p>
                    <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
                        <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                    </div>
                </div>
                `
            });
        } catch (emailError) {
        }
        
        req.session.user = {
            _id: result.user._id,
            first_name: result.user.first_name,
            email: result.user.email,
            role: result.user.role
        };

        res.redirect('/profile');
    } catch (error) {
        res.status(500).json({ 
            error: 'Error interno del servidor',
            details: error.message 
        });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Se requiere email y password' });
        }

        const result = await userRepository.authenticateUser(email, password);
        
        if (!result.success) {
            return res.status(result.statusCode).json({ error: result.message });
        }

        req.session.user = {
            _id: result.user._id,
            first_name: result.user.first_name,
            email: result.user.email,
            role: result.user.role
        };

        res.redirect('/profile');
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.post('/login-jwt', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Se requiere email y password' });
        }

        const authResult = await userRepository.authenticateUser(email, password);
        
        if (!authResult.success) {
            return res.status(authResult.statusCode).json({ error: authResult.message });
        }

        const tokenResult = await userRepository.generateTokens(authResult.user);
        
        if (!tokenResult.success) {
            return res.status(500).json({ error: tokenResult.message });
        }

        res.json({
            message: 'Sesión iniciada correctamente',
            token: tokenResult.accessToken,
            refreshToken: tokenResult.refreshToken,
            user: authResult.userDTO
        });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});  

async function registerMid(req,res,next) {
    const { first_name, last_name, email, age, password } = req.body
    if (!first_name || !email || !password) {
        return res.status(400).json("first_name, email y password son requeridos")
    }

    try {
        const user = await userDAO.findByEmail(email);
        if (user) {
            return res.status(400).json('el email ya está registrado');
        }

        const hashedPassword = createHash(password);
        const newCart = await cartDAO.createEmptyCart();

        const newUser = await userDAO.create({
            first_name: first_name,
            last_name: last_name,
            email: email,
            age: age,
            password: hashedPassword,
            cart: newCart._id
        });
        
        req.user = newUser
        next()
    } catch (error) {
        next(error)
    }
}

router.post('/register-api', registerMid, (req, res) => {
    res.status(201).json({ 
        message: 'Usuario registrado exitosamente',
        user: new UserDTO(req.user)
    })
})

router.get('/current', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const result = await userRepository.getUserProfile(req.user.id);
        
        if (!result.success) {
            return res.status(result.statusCode).json({ error: result.message });
        }

        res.json({
            status: 'autenticado',
            user: result.user
        });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.post('/refresh', (req, res) => {
    const { refreshToken } = req.body
    
    if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token requerido' })
    }
    
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
        
        const token2 = jwt.sign(
            { 
                nombre: decoded.nombre, 
                role: decoded.role,
                id: decoded.id
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        )
        
        res.json({
            accessToken: token2,
            message: 'Token refrescado exitosamente'
        })
    } catch (error) {
        res.status(401).json({ error: 'Refresh token inválido o expirado' })
    }
})

router.post('/forgot-password', async (req, res) => {
    const { nombre, newPassword } = req.body

    if (!nombre || !newPassword) {
        return res.status(400).json({ error: 'nombre y nueva contraseña son requeridos' })
    }

    try {
        const user = await userDAO.findByField('first_name', nombre);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const updatedUser = await userDAO.updatePassword(user._id, createHash(newPassword));

        res.redirect('/')
    } catch (err) {
        res.status(500).json({ error: 'Error interno del servidor' })
    }
})

router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return
        }

        res.redirect('/')
    })
})

router.post('/send-welcome-email', async (req, res) => {
    const { email, name } = req.body;
    
    try {
        await emailService.sendEmail(
            email,
            'Bienvenido a nuestra plataforma',
            `¡Hola ${name}! Gracias por registrarte en nuestra plataforma.`,
            `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">¡Hola ${name}!</h1>
                <p>Gracias por registrarte en nuestra plataforma.</p>
                <p>Tu cuenta ha sido creada exitosamente.</p>
                <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
                    <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                </div>
            </div>
            `
        );
        
        return res.status(200).json({ message: 'Email enviado correctamente' });
    } catch (error) {
        return res.status(500).json({ error: 'No se pudo enviar el email' });
    }
});

export default router;
