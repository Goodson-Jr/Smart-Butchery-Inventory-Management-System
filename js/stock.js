requireAuth();
renderShell('stock');

async function loadStock() {
    const list = document.getElementById('stockList');
    try {
        const products = await Api.getProducts();
        list.innerHTML = products.map((p) => {
            const low = Number(p.stock_kg) <= Number(p.low_stock_threshold_kg);
            return `
                <div class="stock-row">
                    <div class="product-badge" style="background:${categoryColor(p.category_name)}; width:40px; height:40px; margin:0;">
                        ${(p.name || '?').charAt(0)}
                    </div>
                    <div class="info">
                        <div class="name">${p.name}</div>
                        <div class="price">K${fmt(p.price_per_kg)} / kg</div>
                    </div>
                    <div>
                        <div class="qty">${fmt(p.stock_kg, 2)} kg</div>
                        ${low ? '<div class="low-flag">Low stock</div>' : ''}
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        list.innerHTML = `<p class="muted">Could not load stock: ${err.message}</p>`;
    }
}

loadStock();
