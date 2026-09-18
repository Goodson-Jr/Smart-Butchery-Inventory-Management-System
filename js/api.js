// Shared API client for the SBIMS web dashboard.
// Talks to the same backend as the Android app -- Goodson's live Railway
// deployment by default. Swap to the local URL below when developing
// against a backend running on your own machine instead.
const API_BASE = 'https://smart-butchery-inventory-management-system-production.up.railway.app/api';
// const API_BASE = 'http://localhost:3000/api';

const Session = {
    getToken() { return localStorage.getItem('sbims_token'); },
    getRole() { return localStorage.getItem('sbims_role'); },
    getUsername() { return localStorage.getItem('sbims_username'); },
    save(token, role, username) {
        localStorage.setItem('sbims_token', token);
        localStorage.setItem('sbims_role', role);
        localStorage.setItem('sbims_username', username);
    },
    clear() { localStorage.clear(); },
    isLoggedIn() { return !!this.getToken(); },
};

async function apiFetch(path, options = {}) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    const token = Session.getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const response = await fetch(API_BASE + path, Object.assign({}, options, { headers }));

    if (response.status === 401) {
        Session.clear();
        window.location.href = 'login.html';
        throw new Error('Session expired');
    }

    let body = null;
    const text = await response.text();
    if (text) {
        try { body = JSON.parse(text); } catch (e) { body = text; }
    }

    if (!response.ok) {
        const message = (body && body.error) ? body.error : `Request failed (${response.status})`;
        const err = new Error(message);
        err.status = response.status;
        throw err;
    }
    return body;
}

const Api = {
    login: (username, password) => apiFetch('/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
    getProducts: () => apiFetch('/products'),
    getCategories: () => apiFetch('/categories'),
    getLowStock: () => apiFetch('/alerts/low-stock'),
    getTodaySummary: () => apiFetch('/sales/today'),
    recordSale: (product_id, quantity_kg) => apiFetch('/sales', { method: 'POST', body: JSON.stringify({ product_id, quantity_kg }) }),
    addStock: (product_id, quantity_kg) => apiFetch('/stock-batches', { method: 'POST', body: JSON.stringify({ product_id, quantity_kg }) }),
    recordWastage: (product_id, quantity_kg, reason) => apiFetch('/wastage', { method: 'POST', body: JSON.stringify({ product_id, quantity_kg, reason }) }),
};

function requireAuth() {
    if (!Session.isLoggedIn()) window.location.href = 'login.html';
}

function fmt(n, decimals = 2) {
    return Number(n || 0).toFixed(decimals);
}

const CATEGORY_COLORS = {
    beef: 'var(--cat-beef)',
    chicken: 'var(--cat-chicken)',
    pork: 'var(--cat-pork)',
};
function categoryColor(name) {
    if (!name) return 'var(--cat-default)';
    return CATEGORY_COLORS[name.trim().toLowerCase()] || 'var(--cat-default)';
}
