import { Router } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/users.model.js'
import passport from 'passport';
import jwt from 'jsonwebtoken';

const createHash = password => bcrypt.hashSync(password, bcrypt.genSaltSync(10))
const isValidPassword = (user, password) => bcrypt.compareSync(password, user.password)

const router = Router()

router.post('/register', async (req, res) => {
    const { first_name, last_name, email, age, password } = req.body

    if (!first_name || !email || !password) {
        return res.status(400).json('completa todos los campos por favor')
    }

    try {
        const user = await User.findOne({email})
        if (user) {
            return res.status(400).json('el email ya está registrado')
        }

        const hashedPassword = createHash(password)

        await User.create({
            first_name: first_name,
            last_name: last_name,
            email: email,
            age: age,
            password: hashedPassword
        })
        
        req.session.user = {
            first_name: first_name,
            email: email,
            role: 'user'
        }

        res.redirect('/profile')
    } catch (error) {
        res.status(500).json({ error: 'ups, algo falló' })
    }
})

router.post('/login', async (req, res) => {
    const { email, password } = req.body

    if (email && password) {
        const user = await User.findOne({email})
        if (user) {
            if (isValidPassword(user, password)) {
                req.session.user = {
                    first_name: user.first_name,
                    email: user.email,
                    role: user.role
                }
                res.redirect('/profile')
            } else {
                return res.status(401).json('email o password incorrectos')
            }
        } else {
            return res.status(401).json('usuario no encontrado')
        }
    } else {
        return res.status(400).json('necesito email y password')
    }
})

router.post('/login-jwt', async (req, res) => {
    var { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({ error: 'faltan email o contraseña' })
    }

    try {
        const user = await User.findOne({email})
        if (!user) {
            return res.status(401).json({ error: 'credenciales invalidas' })
        }

        if (!isValidPassword(user, password)) {
            return res.status(401).json({ error: 'credenciales invalidas' })
        }

        const token = jwt.sign(
            { 
                id: user._id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '1h' }
        )

        const refreshToken = jwt.sign(
            { 
                id: user._id,
                email: user.email
            },
            process.env.JWT_REFRESH_SECRET || 'refresh_secret_key',
            { expiresIn: '7d' }
        )

        res.json({
            message: 'sesión iniciada correctamente',
            token: token,
            refreshToken: refreshToken,
            user: {
                id: user._id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role
            }
        })
    } catch (error) {
        console.log('Error en login-jwt:', error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
})  

async function registerMid(req,res,next) {
    const { first_name, last_name, email, age, password } = req.body
    if (!first_name || !email || !password) {
        return res.status(400).json("first_name, email y password son requeridos")
    }

    try {
        const user = await User.findOne({email})
        if (user) {
            return res.status(400).json('el email ya está registrado')
        }

        const hashedPassword = createHash(password)

        const newUser = await User.create({
            first_name: first_name,
            last_name: last_name,
            email: email,
            age: age,
            password: hashedPassword
        })
        
        req.user = newUser
        next()
    } catch (error) {
        next(error)
    }
}

router.post('/register-api', registerMid, (req, res) => {
    res.status(201).json({ 
        message: 'Usuario registrado exitosamente',
        user: {
            id: req.user._id,
            first_name: req.user.first_name,
            last_name: req.user.last_name,
            email: req.user.email,
            role: req.user.role
        }
    })
})

router.get('/current', passport.authenticate('jwt', { session: false }), (req, res) => {
    res.json({
        status: 'autenticado',
        user: {
            id: req.user._id,
            first_name: req.user.first_name,
            last_name: req.user.last_name,
            email: req.user.email,
            role: req.user.role
        }
    })
})

router.post('/refresh', (req, res) => {
    const { refreshToken } = req.body
    
    if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token requerido' })
    }
    
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_secret_key')
        
        const token2 = jwt.sign(
            { 
                nombre: decoded.nombre, 
                role: decoded.role,
                id: decoded.id
            },
            process.env.JWT_SECRET || 'secret_key',
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
        const user = await User.findOne({ nombre })
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' })
        }

        user.password = createHash(newPassword)
        await user.save()

        res.redirect('/')
    } catch (err) {
        console.error('Error en forgot-password:', err)
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

export default router;