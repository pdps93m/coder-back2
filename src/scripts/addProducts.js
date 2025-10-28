import 'dotenv/config';
import mongoose from 'mongoose';
import ProductDAO from '../dao/ProductDAO.js';

await mongoose.connect(process.env.MONGODB_URL, {});
console.log('Conectado a MongoDB para agregar productos');

const newProducts = [
    {
        nombre: "Smartphone Galaxy Pro",
        descripcion: "Smartphone de última generación con cámara de 108MP, pantalla AMOLED de 6.7 pulgadas y 256GB de almacenamiento. Incluye cargador inalámbrico.",
        precio: 899.99,
        categoria: "electrónicos",
        stock: 25,
        codigo: "PHONE-GALAXY-001"
    },
    {
        nombre: "Zapatillas Running Elite",
        descripcion: "Zapatillas deportivas de alto rendimiento con tecnología de amortiguación avanzada. Ideales para running y entrenamiento. Disponibles en varios colores.",
        precio: 129.99,
        categoria: "deportes",
        stock: 40,
        codigo: "SHOES-RUNNING-002"
    },
    {
        nombre: "Cafetera Espresso Premium",
        descripcion: "Cafetera de espresso automática con molinillo integrado, sistema de espuma de leche y pantalla táctil. Prepara café de calidad profesional en casa.",
        precio: 549.99,
        categoria: "hogar",
        stock: 15,
        codigo: "COFFEE-PREMIUM-003"
    },
    {
        nombre: "Mochila Táctica Outdoor",
        descripcion: "Mochila resistente de 40L con múltiples compartimentos, material impermeable y sistema MOLLE. Perfecta para camping, hiking y aventuras al aire libre.",
        precio: 89.99,
        categoria: "deportes",
        stock: 30,
        codigo: "BACKPACK-TACTICAL-004"
    }
];

async function addProducts() {
    try {
        console.log('Iniciando agregado de productos...\n');

        for (let i = 0; i < newProducts.length; i++) {
            const product = newProducts[i];
            
            try {
                const existingProduct = await ProductDAO.findByCode(product.codigo);
                
                if (existingProduct) {
                    console.log(`Producto ${product.nombre} ya existe (código: ${product.codigo})`);
                    continue;
                }

                const newProduct = await ProductDAO.create(product);
                console.log(`Producto agregado: ${newProduct.nombre}`);
                console.log(`   Precio: $${newProduct.precio}`);
                console.log(`   Stock: ${newProduct.stock} unidades`);
                console.log(`   Categoría: ${newProduct.categoria}`);
                console.log('   ─────────────────────────────────────');

            } catch (error) {
                if (error.code === 11000) {
                    console.log(`Producto ${product.nombre} ya existe (código duplicado)`);
                } else {
                    console.error(`Error al crear producto ${product.nombre}:`, error.message);
                }
            }
        }

        console.log('\nProceso completado!');
        
        const allProducts = await ProductDAO.getAll();
        console.log(`Total de productos en catálogo: ${allProducts.length}`);
        
        const categories = {};
        allProducts.forEach(product => {
            categories[product.categoria] = (categories[product.categoria] || 0) + 1;
        });
        
        console.log('\nProductos por categoría:');
        Object.entries(categories).forEach(([categoria, cantidad]) => {
            console.log(`   ${categoria}: ${cantidad} productos`);
        });

    } catch (error) {
        console.error('Error general:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDesconectado de MongoDB');
    }
}

addProducts();