import mongoose from 'mongoose';

const productosCollections = 'productos'

const productosSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    descripcion: { type: String, required: true },
    precio: { type: Number, required: true },
    categoria: { type: String, required: true },
    stock: { type: Number, required: true },
    codigo: { type: String, required: true, unique: true }
})

const productos = mongoose.model(productosCollections, productosSchema)

export default productos
