import { Router } from "express";
import User from "../models/users.model.js";

const router = Router();

// GET all users
router.get('/', async (req, res) => {
   try {
        const users = await User.find()
        res.status(200).json(users)
   } catch (err) {
       res.status(500).json({ error: "Database access failed" })
   } 
})

// GET user by ID
router.get('/:id', async (req, res) => {
    try {
        const userFound = await User.findById(req.params.id)
        if (!userFound) {
            return res.status(404).json({ error: "User not found" })
        }
        res.status(200).json(userFound)
    } catch (err) {
        res.status(500).json({ error: "Database access failed" })
    }
})

// POST create new user
router.post('/', async (req, res) => {
    const { nombre, edad, ci } = req.body

    if (!nombre || !edad || !ci) {
        return res.status(400).json({ error: "Missing required data" })
    }

    try {
        const newUser = new User({ nombre, edad, ci })
        await newUser.save()
        res.status(201).json(newUser)
    } catch (err) {
        if (err.code === 11000) {
            res.status(400).json({ error: "CI already exists" })
        } else {
            res.status(500).json({ error: "Database access failed" })
        }
    }
})

// PUT update user
router.put('/:id', async (req, res) => {
    const { nombre, edad, ci } = req.body

    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id, 
            { nombre, edad, ci }, 
            { new: true, runValidators: true }
        )
        
        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" })
        }
        
        res.status(200).json(updatedUser)
    } catch (err) {
        if (err.code === 11000) {
            res.status(400).json({ error: "CI already exists" })
        } else {
            res.status(500).json({ error: "Database access failed" })
        }
    }
})

// DELETE user
router.delete('/:id', async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id)
        
        if (!deletedUser) {
            return res.status(404).json({ error: "User not found" })
        }
        
        res.status(200).json({ message: "User deleted successfully", user: deletedUser })
    } catch (err) {
        res.status(500).json({ error: "Database access failed" })
    }
})

export default router;