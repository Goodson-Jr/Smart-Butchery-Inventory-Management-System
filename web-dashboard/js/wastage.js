requireAuth();
renderShell('wastage');

const isAdmin = Session.getRole() === 'admin';
let products = [];
let selectedProductId = null;

if (isAdmin) {
    document.getElementById('pageSubtitle').textContent =
        'Tap a cut, then log the spoiled weight. As a manager, your own reports come off stock straight away.';
}

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
                ${escapeHtml((p.name || '?').charAt(0))}
            </div>
            <div class="product-name">${escapeHtml(p.name)}</div>
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

async function loadMyReports() {
    const container = document.getElementById('myReports');
    try {
        // Cashiers only get their own reports back from the API; admins get
        // everyone's, so filter to theirs here.
        const username = Session.getUsername();
        const reports = (await Api.getWastage()).filter((w) => w.recorded_by_username === username).slice(0, 10);
        if (!reports.length) {
            container.innerHTML = '<p class="muted">You haven\'t reported any wastage yet.</p>';
            return;
        }
        container.innerHTML = reports.map((w) => `
            <div class="report-row">
                <div class="info">
                    <div class="name">${escapeHtml(w.product_name)} · ${fmt(w.quantity_kg, 2)} kg</div>
                    <div class="meta">${WASTAGE_REASONS[w.reason] || escapeHtml(w.reason)}${w.note ? ' — ' + escapeHtml(w.note) : ''} · ${fmtDateTime(w.recorded_at)}</div>
                    ${w.status === 'REJECTED' && w.rejection_reason ? `<div class="meta">Rejected: ${escapeHtml(w.rejection_reason)}</div>` : ''}
                </div>
                <span class="status-pill ${w.status.toLowerCase()}">${w.status}</span>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = `<p class="muted">Could not load your reports: ${escapeHtml(err.message)}</p>`;
    }
}

document.getElementById('saveWastageButton').addEventListener('click', async () => {
    const product = products.find((p) => p.id === selectedProductId);
    const quantity = parseFloat(document.getElementById('quantityInput').value);
    const reason = document.getElementById('reasonSelect').value;
    const note = document.getElementById('noteInput').value.trim();
    const button = document.getElementById('saveWastageButton');

    if (!product) { alert('Select a product first'); return; }
    if (!(quantity > 0)) { alert('Enter a quantity greater than 0'); return; }
    if (quantity > Number(product.stock_kg)) { alert(`Only ${fmt(product.stock_kg, 1)} kg in stock`); return; }
    if (!reason) { alert('Choose a reason'); return; }

    button.disabled = true;
    try {
        const result = await Api.recordWastage(product.id, quantity, reason, note);
        alert(result.status === 'APPROVED'
            ? 'Wastage recorded and taken off stock'
            : 'Wastage reported. A manager needs to approve it before it comes off stock.');
        document.getElementById('quantityInput').value = '';
        document.getElementById('reasonSelect').value = '';
        document.getElementById('noteInput').value = '';
        selectedProductId = null;
        await Promise.all([loadProducts(), loadMyReports()]);
    } catch (err) {
        alert('Failed: ' + err.message);
    } finally {
        button.disabled = false;
    }
});

loadProducts();
loadMyReports();
