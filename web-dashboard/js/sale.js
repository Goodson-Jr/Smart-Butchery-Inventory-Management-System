requireAuth();
renderShell('sale');

let products = [];
let selectedProductId = null;
const cart = []; // { product, quantityKg }

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

document.getElementById('addToCartButton').addEventListener('click', () => {
    const weight = parseFloat(document.getElementById('weightInput').value);
    const product = products.find((p) => p.id === selectedProductId);

    if (!product) { alert('Select a product first'); return; }
    if (!(weight > 0)) { alert('Enter a weight greater than 0'); return; }

    const existing = cart.find((c) => c.product.id === product.id);
    const alreadyInCart = existing ? existing.quantityKg : 0;
    if (alreadyInCart + weight > Number(product.stock_kg)) {
        alert(`Only ${fmt(product.stock_kg, 1)} kg left in stock`);
        return;
    }

    if (existing) existing.quantityKg += weight;
    else cart.push({ product, quantityKg: weight });

    document.getElementById('weightInput').value = '';
    renderCart();
});

function renderCart() {
    const list = document.getElementById('cartList');
    const empty = document.getElementById('emptyCartText');

    if (!cart.length) {
        list.style.display = 'none';
        empty.style.display = 'block';
    } else {
        list.style.display = 'block';
        empty.style.display = 'none';
        list.innerHTML = cart.map((item, index) => `
            <div class="cart-row">
                <div class="info">
                    <div class="name">${item.product.name}</div>
                    <div class="meta">${fmt(item.quantityKg, 2)} kg × K${fmt(item.product.price_per_kg)}/kg</div>
                </div>
                <div class="total">K${fmt(item.quantityKg * item.product.price_per_kg)}</div>
                <div class="remove" onclick="removeFromCart(${index})">&times;</div>
            </div>
        `).join('');
    }

    const total = cart.reduce((sum, item) => sum + item.quantityKg * item.product.price_per_kg, 0);
    document.getElementById('grandTotalText').textContent = 'Grand total: K' + fmt(total);
    document.getElementById('completeSaleButton').disabled = cart.length === 0;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
}

document.getElementById('completeSaleButton').addEventListener('click', async () => {
    const button = document.getElementById('completeSaleButton');
    button.disabled = true;

    // NOTE: the backend doesn't have a batch/atomic checkout endpoint yet
    // (see #24 discussion), so each cart line is submitted as its own
    // POST /api/sales call in sequence. This is not atomic across the whole
    // cart -- if line 3 of 5 fails, lines 1-2 have already gone through.
    const lines = [];
    try {
        for (const item of cart) {
            const result = await Api.recordSale(item.product.id, item.quantityKg);
            lines.push({
                name: item.product.name,
                quantityKg: item.quantityKg,
                unitPrice: item.product.price_per_kg,
                totalPrice: result.total_price,
            });
        }
        showReceipt(lines);
    } catch (err) {
        alert('Sale failed partway through: ' + err.message +
              (lines.length ? `\n\n${lines.length} item(s) already went through before the failure.` : ''));
        button.disabled = false;
        if (lines.length) showReceipt(lines);
    }
});

function showReceipt(lines) {
    document.getElementById('saleView').style.display = 'none';
    document.getElementById('receiptView').style.display = 'block';

    const now = new Date();
    document.getElementById('receiptSubtitle').textContent =
        `${now.toLocaleDateString()} ${now.toLocaleTimeString()} · Served by ${Session.getUsername()}`;

    document.getElementById('receiptLines').innerHTML = lines.map((l) => `
        <div class="cart-row">
            <div class="info">
                <div class="name">${l.name}</div>
                <div class="meta">${fmt(l.quantityKg, 2)} kg × K${fmt(l.unitPrice)}/kg</div>
            </div>
            <div class="total">K${fmt(l.totalPrice)}</div>
        </div>
    `).join('');

    const grandTotal = lines.reduce((sum, l) => sum + Number(l.totalPrice), 0);
    document.getElementById('receiptTotal').textContent = 'Grand Total: K' + fmt(grandTotal);
}

document.getElementById('newSaleButton').addEventListener('click', () => window.location.reload());

document.getElementById('scanButton').addEventListener('click', () => {
    openScanModal((barcode) => {
        const match = products.find((p) => p.barcode === barcode);
        if (!match) { alert('No product matches that barcode'); return; }
        selectProduct(match.id);
    });
});

loadProducts();
renderCart();
