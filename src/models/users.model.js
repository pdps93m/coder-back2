import mongoose from "mongoose";

const usersCollection = 'users'

const userSchema = new mongoose.Schema({
    nombre: String,
    apellido: String,
    email: String,
    edad: Number,
    password: String
})

const User = mongoose.model(usersCollection, userSchema)

export default User