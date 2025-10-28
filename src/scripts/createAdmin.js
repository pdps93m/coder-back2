import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/users.model.js';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (question) => {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
};

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Conectado a MongoDB');

        const existingAdmin = await User.findOne({ role: 'admin' });
        
        if (existingAdmin) {
            console.log('Ya existe un usuario administrador:', existingAdmin.email);
            const overwrite = await askQuestion('¿Deseas crear otro admin? (y/n): ');
            if (overwrite.toLowerCase() !== 'y') {
                console.log('Operación cancelada.');
                rl.close();
                process.exit(0);
            }
        }

        console.log('\nCREAR NUEVO USUARIO ADMINISTRADOR');
        console.log('=====================================');
        
        const firstName = await askQuestion('Nombre: ');
        const lastName = await askQuestion('Apellido: ');
        const email = await askQuestion('Email: ');
        const age = await askQuestion('Edad: ');
        const password = await askQuestion('Contraseña: ');
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('Error: Ya existe un usuario con ese email');
            rl.close();
            process.exit(1);
        }

        const hashedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
        
        const newAdmin = new User({
            first_name: firstName,
            last_name: lastName,
            email: email,
            age: parseInt(age),
            password: hashedPassword,
            role: 'admin'
        });

        await newAdmin.save();
        
        console.log('\nUsuario administrador creado exitosamente:');
        console.log('=====================================');
        console.log(`Nombre: ${firstName} ${lastName}`);
        console.log(`Email: ${email}`);
        console.log(`Edad: ${age}`);
        console.log(`Rol: admin`);
        console.log('=====================================');
        
        rl.close();
        process.exit(0);
        
    } catch (error) {
        console.error('Error al crear usuario admin:', error.message);
        rl.close();
        process.exit(1);
    }
};

createAdmin();
