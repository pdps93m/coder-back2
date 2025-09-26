import { Router } from "express";
import productos from "../models/productos.model.js";

const router = Router();

// GET todos los productos
router.get('/', async (req, res) => {
    try {
        const listaProductos = await productos.find()
        res.status(200).json(listaProductos)
    } catch (err) {
        res.status(500).json({ error: "Fallo el acceso a la db de productos" })
    }
})

// GET producto por ID
router.get('/:id', async (req, res) => {
    try {
        const producto = await productos.findById(req.params.id)
        if (!producto) {
            return res.status(404).json({ error: "Producto no encontrado" })
        }
        res.status(200).json(producto)
    } catch (err) {
        res.status(500).json({ error: "Fallo el acceso a la db de productos" })
    }
})

// POST crear nuevo producto
router.post('/', async (req, res) => {
    const { nombre, descripcion, precio, categoria, stock, codigo } = req.body

    if (!nombre || !descripcion || !precio || !categoria || stock === undefined || !codigo) {
        return res.status(400).json({ error: "Faltan datos obligatorios" })
    }

    try {
        const nuevoProducto = new productos({ 
            nombre, 
            descripcion, 
            precio, 
            categoria, 
            stock, 
            codigo 
        })
        await nuevoProducto.save()
        res.status(201).json(nuevoProducto)
    } catch (err) {
        if (err.code === 11000) {
            res.status(400).json({ error: "Código de producto ya existe" })
        } else {
            res.status(500).json({ error: "Fallo el acceso a la db de productos" })
        }
    }
})

// PUT actualizar producto
router.put('/:id', async (req, res) => {
    const { nombre, descripcion, precio, categoria, stock, codigo } = req.body

    try {
        const productoActualizado = await productos.findByIdAndUpdate(
            req.params.id,
            { nombre, descripcion, precio, categoria, stock, codigo },
            { new: true, runValidators: true }
        )

        if (!productoActualizado) {
            return res.status(404).json({ error: "Producto no encontrado" })
        }

        res.status(200).json(productoActualizado)
    } catch (err) {
        if (err.code === 11000) {
            res.status(400).json({ error: "Código de producto ya existe" })
        } else {
            res.status(500).json({ error: "Fallo el acceso a la db de productos" })
        }
    }
})

// DELETE eliminar producto
router.delete('/:id', async (req, res) => {
    try {
        const productoEliminado = await productos.findByIdAndDelete(req.params.id)

        if (!productoEliminado) {
            return res.status(404).json({ error: "Producto no encontrado" })
        }

        res.status(200).json({ 
            mensaje: "Producto eliminado correctamente", 
            producto: productoEliminado 
        })
    } catch (err) {
        res.status(500).json({ error: "Fallo el acceso a la db de productos" })
    }
})

export default router;