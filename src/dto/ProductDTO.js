class ProductDTO {
    constructor(product) {
        this.id = product._id
        this.nombre = product.nombre
        this.descripcion = product.descripcion
        this.precio = product.precio
        this.categoria = product.categoria
        this.stock = product.stock
        this.codigo = product.codigo
    }
}

export default ProductDTO
