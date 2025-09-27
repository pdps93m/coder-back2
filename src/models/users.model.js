import mongoose from "mongoose";

const usersCollection = 'users'

const userSchema = new mongoose.Schema({
    first_name: { type: String, required: true },
    last_name: String,
    email: { type: String, required: true, unique: true },
    age: Number,
    password: { type: String, required: true },
    cart: { type: mongoose.Schema.Types.ObjectId, ref: 'Carts' },
    role: { type: String, default: 'user' }
})

const User = mongoose.model(usersCollection, userSchema)

export default User