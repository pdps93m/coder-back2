import { Router } from "express";
import userDAO from "../dao/UserDAO.js";
import UserDTO from "../dto/UserDTO.js";
import { requireAdmin, requireUserOrAdmin, requireOwnership } from "../middlewares/auth.js";
import passport from "passport";

const router = Router();

router.get('/', passport.authenticate('jwt', { session: false }), requireAdmin, async (req, res) => {
   try {
        const users = await userDAO.getAll();
        const usersDTO = users.map(user => new UserDTO(user));
        res.status(200).json(usersDTO);
   } catch (err) {
       res.status(500).json({ error: "Falló el acceso a la base de datos" });
   } 
});

router.get('/:id', 
    passport.authenticate('jwt', { session: false }), 
    requireOwnership(async (req) => req.params.id), 
    async (req, res) => {
        try {
            const userFound = await userDAO.getById(req.params.id);
            if (!userFound) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }
            
            res.status(200).json(new UserDTO(userFound));
        } catch (err) {
            res.status(500).json({ error: "Error al acceder a la base de datos" });
        }
    }
);

router.post('/', passport.authenticate('jwt', { session: false }), requireAdmin, async (req, res) => {
    const { first_name, last_name, email, age, password, role = 'user' } = req.body;

    if (!first_name || !last_name || !email || !age || !password) {
        return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    try {
        const newUser = await userDAO.create({
            first_name,
            last_name,
            email,
            age,
            password,
            role 
        });
        
        res.status(201).json(new UserDTO(newUser));
    } catch (err) {
        if (err.message.includes('E11000')) {
            res.status(400).json({ error: "El email ya existe" });
        } else {
            res.status(500).json({ error: "Error al acceder a la base de datos" });
        }
    }
});

router.put('/:id', async (req, res) => {
    const { first_name, last_name, email, age, password } = req.body;

    try {
        const updatedUser = await userDAO.update(req.params.id, {
            first_name,
            last_name,
            email,
            age,
            password 
        });
        
        if (!updatedUser) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        
        res.status(200).json(new UserDTO(updatedUser));
    } catch (err) {
        if (err.message.includes('E11000')) {
            res.status(400).json({ error: "El email ya existe" });
        } else {
            res.status(500).json({ error: "Error al acceder a la base de datos" });
        }
    }
})

router.delete('/:id', async (req, res) => {
    try {
        const deletedUser = await userDAO.delete(req.params.id);
        
        if (!deletedUser) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        
        res.status(200).json({ 
            message: "Usuario eliminado exitosamente", 
            user: new UserDTO(deletedUser) 
        });
    } catch (err) {
        res.status(500).json({ error: "Error al acceder a la base de datos" });
    }
})

export default router;
