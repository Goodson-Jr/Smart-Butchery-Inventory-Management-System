requireAuth();
renderShell('products');

if (Session.getRole() !== 'admin') {
    alert('Only admin accounts can manage products');
    window.location.href = 'dashboard.html';
}

let categories = [];
let products = [];

async function loadCategories() {
    categories = await Api.getCategories();
    const select = document.getElementById('newCategory');
    select.innerHTML = categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
}

async function loadProducts() {
    products = await Api.getAllProducts();
    renderProducts();
}

function categoryOptionsHtml(selectedId) {
    return categories.map((c) => `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${c.name}</option>`).join('');
}

function renderProducts() {
    const list = document.getElementById('productList');
    list.innerHTML = products.map((p) => `
        <div>
            <div class="product-table-row ${p.is_active ? '' : 'inactive-row'}">
                <div class="product-badge" style="background:${categoryColor(p.category_name)}; width:32px; height:32px; margin:0; font-size:12px;">
                    ${(p.name || '?').charAt(0)}
                </div>
                <div>
                    <div style="font-weight:700;">${p.name}</div>
                    <div class="muted" style="font-size:11px;">${p.category_name}${p.barcode ? ' · ' + p.barcode : ''}</div>
                </div>
                <div>K${fmt(p.price_per_kg)}/kg</div>
                <div>${p.cost_per_kg != null ? 'K' + fmt(p.cost_per_kg) + '/kg' : '—'}</div>
                <div>${fmt(p.stock_kg, 1)} kg</div>
                <div>${p.is_active ? 'Active' : '<span style="color:var(--danger); font-weight:700;">Inactive</span>'}</div>
                <div style="display:flex; gap:6px;">
                    <button type="button" class="btn auto soft" onclick="toggleEdit(${p.id})">Edit</button>
                    <button type="button" class="btn auto ${p.is_active ? 'danger' : ''}" onclick="toggleActive(${p.id}, ${!p.is_active})">
                        ${p.is_active ? 'Deactivate' : 'Reactivate'}
                    </button>
                </div>
            </div>
            <div class="edit-form" id="edit-${p.id}">
                <div class="edit-grid">
                    <div class="field" style="margin-bottom:0;">
                        <label>Name</label>
                        <input id="edit-name-${p.id}" type="text" value="${p.name}">
                    </div>
                    <div class="field" style="margin-bottom:0;">
                        <label>Category</label>
                        <select id="edit-category-${p.id}">${categoryOptionsHtml(p.category_id)}</select>
                    </div>
                    <div class="field" style="margin-bottom:0;">
                        <label>Sell price (K/kg)</label>
                        <input id="edit-price-${p.id}" type="number" step="0.01" min="0" value="${p.price_per_kg}">
                    </div>
                    <div class="field" style="margin-bottom:0;">
                        <label>Cost price (K/kg)</label>
                        <input id="edit-cost-${p.id}" type="number" step="0.01" min="0" value="${p.cost_per_kg != null ? p.cost_per_kg : ''}">
                    </div>
                    <div class="field" style="margin-bottom:0;">
                        <label>Low-stock threshold (kg)</label>
                        <input id="edit-threshold-${p.id}" type="number" step="0.1" min="0" value="${p.low_stock_threshold_kg}">
                    </div>
                    <div class="field" style="margin-bottom:0;">
                        <label>Barcode</label>
                        <input id="edit-barcode-${p.id}" type="text" value="${p.barcode || ''}">
                    </div>
                </div>
                <div style="display:flex; gap:8px; margin-top:12px;">
                    <button type="button" class="btn auto dark" onclick="saveEdit(${p.id})">Save</button>
                    <button type="button" class="btn auto soft" onclick="toggleEdit(${p.id})">Cancel</button>
                </div>
            </div>
        </div>
    `).join('');
}

function toggleEdit(id) {
    document.getElementById(`edit-${id}`).classList.toggle('open');
}

async function saveEdit(id) {
    const name = document.getElementById(`edit-name-${id}`).value.trim();
    const category_id = Number(document.getElementById(`edit-category-${id}`).value);
    const price_per_kg = parseFloat(document.getElementById(`edit-price-${id}`).value);
    const costRaw = document.getElementById(`edit-cost-${id}`).value;
    const cost_per_kg = costRaw === '' ? null : parseFloat(costRaw);
    const low_stock_threshold_kg = parseFloat(document.getElementById(`edit-threshold-${id}`).value);
    const barcode = document.getElementById(`edit-barcode-${id}`).value.trim() || null;

    try {
        await Api.updateProduct(id, { name, category_id, price_per_kg, cost_per_kg, low_stock_threshold_kg, barcode });
        await loadProducts();
    } catch (err) {
        alert('Could not save: ' + err.message);
    }
}

async function toggleActive(id, makeActive) {
    try {
        await Api.updateProduct(id, { is_active: makeActive });
        await loadProducts();
    } catch (err) {
        alert('Could not update: ' + err.message);
    }
}

document.getElementById('addProductButton').addEventListener('click', async () => {
    const note = document.getElementById('formNote');
    note.hidden = true;

    const name = document.getElementById('newName').value.trim();
    const category_id = Number(document.getElementById('newCategory').value);
    const price_per_kg = parseFloat(document.getElementById('newPrice').value);
    const costRaw = document.getElementById('newCost').value;
    const cost_per_kg = costRaw === '' ? null : parseFloat(costRaw);
    const low_stock_threshold_kg = parseFloat(document.getElementById('newThreshold').value) || 5;
    const barcode = document.getElementById('newBarcode').value.trim() || null;

    if (!name || !(price_per_kg > 0) || !category_id) {
        note.textContent = 'Name, category, and a positive sell price are required';
        note.hidden = false;
        return;
    }

    try {
        await Api.createProduct({ name, category_id, price_per_kg, cost_per_kg, low_stock_threshold_kg, barcode });
        document.getElementById('newName').value = '';
        document.getElementById('newPrice').value = '';
        document.getElementById('newCost').value = '';
        document.getElementById('newBarcode').value = '';
        document.getElementById('newThreshold').value = '5';
        await loadProducts();
    } catch (err) {
        note.textContent = err.message;
        note.hidden = false;
    }
});

document.getElementById('addCategoryButton').addEventListener('click', async () => {
    const input = document.getElementById('newCategoryName');
    const name = input.value.trim();
    if (!name) return;

    try {
        await Api.createCategory(name);
        input.value = '';
        await loadCategories();
    } catch (err) {
        alert('Could not add category: ' + err.message);
    }
});

loadCategories().then(loadProducts);
