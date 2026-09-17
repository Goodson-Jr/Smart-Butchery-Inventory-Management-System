// Renders the shared sidebar shell. Call renderShell('dashboard') etc.
function renderShell(activePage) {
    const links = [
        { id: 'dashboard', href: 'dashboard.html', label: 'Dashboard' },
        { id: 'sale', href: 'sale.html', label: 'Record Sale' },
        { id: 'add-stock', href: 'add-stock.html', label: 'Add Stock' },
        { id: 'stock', href: 'stock.html', label: 'Available Stock' },
        { id: 'wastage', href: 'wastage.html', label: 'Record Wastage' },
    ];

    const navHtml = links.map((link) =>
        `<a href="${link.href}" class="${link.id === activePage ? 'is-active' : ''}">${link.label}</a>`
    ).join('');

    document.getElementById('sidebar').innerHTML = `
        <div class="side-brand">
            <span class="side-badge">SB</span>
            <span>Smart Butchery IMS</span>
        </div>
        <nav class="side-nav">${navHtml}</nav>
        <div class="side-foot">
            <button id="logoutBtn" type="button">Log out</button>
        </div>
    `;

    document.getElementById('logoutBtn').addEventListener('click', () => {
        Session.clear();
        window.location.href = 'login.html';
    });
}
