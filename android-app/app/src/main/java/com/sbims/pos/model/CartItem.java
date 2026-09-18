package com.sbims.pos.model;

public class CartItem {
    public final Product product;
    public double quantityKg;

    public CartItem(Product product, double quantityKg) {
        this.product = product;
        this.quantityKg = quantityKg;
    }

    public double lineTotal() {
        return product.pricePerKg * quantityKg;
    }
}
