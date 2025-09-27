import { Router } from "express";
import User from "../models/users.model.js";

const router = Router();

router.get('/', async (req, res) => {
   try {
        const users = await User.find()
        const users2 = users.map(user => ({
            id: user._id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            age: user.age,
            role: user.role
        }))
        res.status(200).json(users2)
   } catch (err) {
       res.status(500).json({ error: "Falló el acceso a la base de datos" })
   } 
})

router.get('/:id', async (req, res) => {
    try {
        const userFound = await User.findById(req.params.id)
        if (!userFound) {
            return res.status(404).json({ error: "Usuario no encontrado" })
        }
        
        const userData = {
            id: userFound._id,
            first_name: userFound.first_name,
            last_name: userFound.last_name,
            email: userFound.email,
            age: userFound.age,
            role: userFound.role
        }
        res.status(200).json(userData)
    } catch (err) {
        res.status(500).json({ error: "Error al acceder a la base de datos" })
    }
})

router.post('/', async (req, res) => {
    const { first_name, last_name, email, age, password } = req.body

    if (!first_name || !last_name || !email || !age || !password) {
        return res.status(400).json({ error: "Faltan datos requeridos" })
    }

    try {
        const newUser = new User({ 
            first_name: first_name,
            last_name: last_name,
            email,
            age: age,
            password 
        })
        await newUser.save()
        
        const responseUser = {
            id: newUser._id,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            email: newUser.email,
            age: newUser.age,
            role: newUser.role
        }
        res.status(201).json(responseUser)
    } catch (err) {
        if (err.code === 11000) {
            res.status(400).json({ error: "El email ya existe" })
        } else {
            res.status(500).json({ error: "Error al acceder a la base de datos" })
        }
    }
})

router.put('/:id', async (req, res) => {
    const { first_name, last_name, email, age, password } = req.body

    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id, 
            { 
                first_name: first_name,
                last_name: last_name,
                email, 
                age: age,
                password 
            }, 
            { new: true, runValidators: true }
        )
        
        if (!updatedUser) {
            return res.status(404).json({ error: "Usuario no encontrado" })
        }
        
        const responseUser = {
            id: updatedUser._id,
            first_name: updatedUser.first_name,
            last_name: updatedUser.last_name,
            email: updatedUser.email,
            age: updatedUser.age,
            role: updatedUser.role
        }
        res.status(200).json(responseUser)
    } catch (err) {
        if (err.code === 11000) {
            res.status(400).json({ error: "El email ya existe" })
        } else {
            res.status(500).json({ error: "Error al acceder a la base de datos" })
        }
    }
})

router.delete('/:id', async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id)
        
        if (!deletedUser) {
            return res.status(404).json({ error: "Usuario no encontrado" })
        }
        
                res.status(200).json({ message: "Usuario eliminado exitosamente", user: deletedUser })
    } catch (err) {
        res.status(500).json({ error: "Error al acceder a la base de datos" })
    }
})

export default router;