import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/users.model.js';

async function deleteAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Conectado a MongoDB');

        const result = await User.deleteOne({ role: 'admin' });
        
        if (result.deletedCount > 0) {
            console.log('Usuario admin eliminado exitosamente');
        } else {
            console.log('No se encontró ningún usuario admin para eliminar');
        }

        await mongoose.connection.close();
        console.log('Conexión cerrada');
        
    } catch (error) {
        console.error('Error al eliminar admin:', error);
        process.exit(1);
    }
}

deleteAdmin();
