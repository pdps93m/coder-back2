import mongoose from 'mongoose';

const productosCollections = 'productos'

const productosSchema = new mongoose.Schema({
    nombre: String,
    precio: Number
})

const productos = mongoose.model(productosCollections, productosSchema)

export default productos