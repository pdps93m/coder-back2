class TicketDTO {
    constructor(ticket) {
        this.id = ticket._id;
        this.code = ticket.code;
        this.purchase_datetime = ticket.purchase_datetime;
        this.amount = ticket.amount;
        this.purchaser = ticket.purchaser;
        this.status = ticket.status;
        this.products = ticket.products?.map(item => ({
            product_id: item.product._id || item.product,
            title: item.title,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.subtotal,
            status: item.status
        })) || [];
        this.failed_products = ticket.failed_products?.map(item => ({
            product_id: item.product_id,
            title: item.title,
            requested_quantity: item.requested_quantity,
            available_stock: item.available_stock,
            reason: item.reason
        })) || [];
        this.payment_method = ticket.payment_method;
        this.notes = ticket.notes;
        this.created_at = ticket.created_at;
        this.updated_at = ticket.updated_at;
        
        
        this.is_successful = ticket.isPurchaseSuccessful ? ticket.isPurchaseSuccessful() : false;
        this.is_partial = ticket.isPurchasePartial ? ticket.isPurchasePartial() : false;
        this.total_products = this.products.length;
        this.failed_products_count = this.failed_products.length;
        
        
        this.summary = {
            total_amount: this.amount,
            successful_products: this.total_products,
            failed_products: this.failed_products_count,
            success_rate: this.total_products > 0 ? 
                ((this.total_products / (this.total_products + this.failed_products_count)) * 100).toFixed(2) + '%' : 
                '0%'
        };
    }
}

export default TicketDTO;
