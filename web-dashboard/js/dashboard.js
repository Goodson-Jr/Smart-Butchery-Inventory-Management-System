requireAuth();
renderShell('dashboard');

async function loadSummary() {
    try {
        const summary = await Api.getTodaySummary();
        document.getElementById('kgSoldText').textContent = fmt(summary.total_kg_sold, 1);
        document.getElementById('revenueText').textContent = 'K' + fmt(summary.total_revenue);
    } catch (err) {
        document.getElementById('kgSoldText').textContent = '—';
        document.getElementById('revenueText').textContent = '—';
    }
}

async function checkLowStock() {
    try {
        const items = await Api.getLowStock();
        if (!items.length) return;

        const names = items.map((p) => p.name).join(', ');
        const note = document.getElementById('lowStockNote');
        note.textContent = (items.length === 1 ? '1 cut is low on stock: ' : `${items.length} cuts are low on stock: `) + names;
        note.hidden = false;

        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification('Low stock alert', { body: names });
            } else if (Notification.permission !== 'denied') {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') new Notification('Low stock alert', { body: names });
            }
        }
    } catch (err) {
        // silent -- background check
    }
}

loadSummary();
checkLowStock();
