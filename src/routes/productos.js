import { Router } from "express";
import productDAO from "../dao/ProductDAO.js";
import ProductDTO from "../dto/ProductDTO.js";
import { requireAdmin, requireUserOrAdmin } from "../middlewares/auth.js";
import passport from "passport";

const router = Router();

router.get('/', passport.authenticate('jwt', { session: false }), requireUserOrAdmin, async (req, res) => {
    try {
        const listaProductos = await productDAO.getAll();
        const productosDTO = listaProductos.map(producto => new ProductDTO(producto));
        res.status(200).json(productosDTO);
    } catch (err) {
        res.status(500).json({ error: "no pude acceder a los productos" });
    }
});

router.get('/:id', passport.authenticate('jwt', { session: false }), requireUserOrAdmin, async (req, res) => {
    try {
        const producto = await productDAO.getById(req.params.id);
        if (!producto) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }
        res.status(200).json(new ProductDTO(producto));
    } catch (err) {
        res.status(500).json({ error: "Fallo el acceso a la db de productos" });
    }
});
router.post('/', passport.authenticate('jwt', { session: false }), requireAdmin, async (req, res) => {
    const { nombre, descripcion, precio, categoria, stock, codigo } = req.body;

    if (!nombre || !descripcion || !precio || !categoria || stock === undefined || !codigo) {
        return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    try {
        const nuevoProducto = await productDAO.create({ 
            nombre, 
            descripcion, 
            precio, 
            categoria, 
            stock, 
            codigo 
        });
        res.status(201).json(new ProductDTO(nuevoProducto));
    } catch (err) {
        if (err.code === 11000) {
            res.status(400).json({ error: "Código de producto ya existe" });
        } else {
            res.status(500).json({ error: "Fallo el acceso a la db de productos" });
        }
    }
});

router.put('/:id', passport.authenticate('jwt', { session: false }), requireAdmin, async (req, res) => {
    const { nombre, descripcion, precio, categoria, stock, codigo } = req.body;

    try {
        const productoActualizado = await productDAO.update(
            req.params.id,
            { nombre, descripcion, precio, categoria, stock, codigo }
        );

        if (!productoActualizado) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        res.status(200).json(new ProductDTO(productoActualizado));
    } catch (err) {
        if (err.code === 11000) {
            res.status(400).json({ error: "Código de producto ya existe" });
        } else {
            res.status(500).json({ error: "Fallo el acceso a la db de productos" });
        }
    }
});

router.delete('/:id', passport.authenticate('jwt', { session: false }), requireAdmin, async (req, res) => {
    try {
        const productoEliminado = await productDAO.delete(req.params.id);

        if (!productoEliminado) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        res.status(200).json({ 
            mensaje: "Producto eliminado correctamente", 
            producto: productoEliminado 
        });
    } catch (err) {
        res.status(500).json({ error: "Fallo el acceso a la db de productos" });
    }
});

export default router;
