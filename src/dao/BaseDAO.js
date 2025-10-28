class BaseDAO {
    constructor(model) {
        this.model = model;
    }

    async create(data) {
        try {
            const newDocument = new this.model(data);
            return await newDocument.save();
        } catch (error) {
            throw new Error(`Error al crear: ${error.message}`);
        }
    }

    async getAll() {
        try {
            return await this.model.find();
        } catch (error) {
            throw new Error(`Error al obtener todos los datos: ${error.message}`);
        }
    }

    async getById(id) {
        try {
            return await this.model.findById(id);
        } catch (error) {
            throw new Error(`Error al obtener por ID: ${error.message}`);
        }
    }

    async update(id, data) {
        try {
            return await this.model.findByIdAndUpdate(id, data, { 
                new: true, 
                runValidators: true 
            });
        } catch (error) {
            throw new Error(`Error al actualizar: ${error.message}`);
        }
    }

    async delete(id) {
        try {
            return await this.model.findByIdAndDelete(id);
        } catch (error) {
            throw new Error(`Error al eliminar: ${error.message}`);
        }
    }

    async findOne(conditions) {
        try {
            return await this.model.findOne(conditions);
        } catch (error) {
            throw new Error(`Error al buscar uno: ${error.message}`);
        }
    }

    async find(conditions = {}) {
        try {
            return await this.model.find(conditions);
        } catch (error) {
            throw new Error(`Error al buscar múltiples: ${error.message}`);
        }
    }
}

export default BaseDAO;
