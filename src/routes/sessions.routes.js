import { Router } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/users.model.js'

// Funciones de hash
const createHash = (password) => bcrypt.hashSync(password, bcrypt.genSaltSync(10))
const isValidPassword = (user, password) => bcrypt.compareSync(password, user.password)

const router = Router()

router.post('/register', async (req, res) => {
    const { first_name, last_name, email, age, password } = req.body

    if (!first_name || !last_name || !email || !age || !password) {
        return res.status(400).json('todos los campos son requeridos')
    }

    const user = await User.findOne({email})
    if (user) {
        return res.status(400).json('el email ya esta registrado')
    }

    await User.create({
        nombre: first_name,
        apellido: last_name,
        email,
        edad: age,
        password: createHash(password)  // Hash de la contraseña
    })
    
    req.session.user = {
        first_name,
        last_name,
        email,
        age
    }

    res.redirect('/profile')
})

router.post('/login', async (req, res) => {
    const { email, password } = req.body

     if (!email || !password) {
        return res.status(400).json('todos los campos son requeridos')
    }

    const user = await User.findOne({email})
    if (!user) {
        return res.status(401).json('credenciales invalidas')
    }

    if (!isValidPassword(user, password)) {
        return res.status(401).json('credenciales invalidas')
    }

    req.session.user = {
        first_name: user.nombre,
        last_name: user.apellido,
        email,
        age: user.edad
    }

    res.redirect('/profile')
})  

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body

    if (!email) {
        return res.status(400).json({ error: 'El email es requerido' })
    }

    try {
        const user = await User.findOne({ email })
        if (!user) {
            // Por seguridad, no revelamos si el email existe o no
            return res.status(200).json({ 
                message: 'Si el email existe, recibirás un enlace de recuperación' 
            })
        }

        // Aquí iría la lógica para enviar el email con el token
        // Por ahora simulamos que se envió
        console.log(`Email de recuperación enviado a: ${email}`)
        
        res.status(200).json({ 
            message: 'Si el email existe, recibirás un enlace de recuperación' 
        })
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