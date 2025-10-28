import 'dotenv/config';
import mongoose from 'mongoose';

async function cleanUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Conectado a MongoDB');

        const result = await mongoose.connection.collection('users').drop();
        console.log('Colección de usuarios eliminada');

        await mongoose.connection.close();
        console.log('Base de datos limpia. Ahora puedes registrar usuarios sin problemas');
        
    } catch (error) {
        if (error.code === 26) {
            console.log('La colección users no existía, todo limpio');
        } else {
            console.error('Error:', error);
        }
        await mongoose.connection.close();
    }
}

cleanUsers();
