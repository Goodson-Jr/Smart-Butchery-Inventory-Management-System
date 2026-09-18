requireAuth();
renderShell('wastage');

let products = [];
let selectedProductId = null;

async function loadProducts() {
    try {
        products = await Api.getProducts();
        renderProductGrid();
    } catch (err) {
        alert('Could not load products: ' + err.message);
    }
}

function renderProductGrid() {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = products.map((p) => `
        <div class="product-card" data-id="${p.id}" onclick="selectProduct(${p.id})">
            <div class="product-badge" style="background:${categoryColor(p.category_name)}">
                ${(p.name || '?').charAt(0)}
            </div>
            <div class="product-name">${p.name}</div>
            <div class="product-price">K${fmt(p.price_per_kg)} / kg</div>
            <div class="product-stock">${fmt(p.stock_kg, 1)} kg</div>
        </div>
    `).join('');
    highlightSelected();
}

function selectProduct(id) {
    selectedProductId = id;
    highlightSelected();
}

function highlightSelected() {
    document.querySelectorAll('#productGrid .product-card').forEach((el) => {
        el.style.outline = Number(el.dataset.id) === selectedProductId ? '2px solid var(--brand)' : 'none';
        el.style.borderRadius = 'var(--radius)';
    });
}

document.getElementById('saveWastageButton').addEventListener('click', async () => {
    const product = products.find((p) => p.id === selectedProductId);
    const quantity = parseFloat(document.getElementById('quantityInput').value);
    const reason = document.getElementById('reasonInput').value.trim();
    const button = document.getElementById('saveWastageButton');

    if (!product) { alert('Select a product first'); return; }
    if (!(quantity > 0)) { alert('Enter a quantity greater than 0'); return; }
    if (quantity > Number(product.stock_kg)) { alert(`Only ${fmt(product.stock_kg, 1)} kg in stock`); return; }

    button.disabled = true;
    try {
        await Api.recordWastage(product.id, quantity, reason);
        alert('Wastage logged');
        window.location.href = 'dashboard.html';
    } catch (err) {
        alert('Failed: ' + err.message);
    } finally {
        button.disabled = false;
    }
});

loadProducts();
