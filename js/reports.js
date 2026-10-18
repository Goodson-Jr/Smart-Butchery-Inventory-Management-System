requireAuth();
renderShell('reports');

if (Session.getRole() !== 'admin') {
    alert('Only admin accounts can view reports');
    window.location.href = 'dashboard.html';
}

function todayStr() {
    return daysAgoStr(0);
}
function daysAgoStr(n) {
    // Local calendar date, not UTC -- toISOString() would still say
    // yesterday between midnight and 2am in Zambia (#45).
    const d = new Date();
    d.setDate(d.getDate() - n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function shortDate(isoDate) {
    // "2026-10-05" as a local date -- new Date("2026-10-05") would be UTC
    // midnight and can land on the previous day (#45).
    const [y, m, d] = String(isoDate).slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

document.getElementById('fromDate').value = daysAgoStr(6);
document.getElementById('toDate').value = todayStr();

async function loadReports() {
    const from = document.getElementById('fromDate').value;
    const to = document.getElementById('toDate').value;

    await Promise.all([loadSales(from, to), loadProfit(from, to), loadStockUsage(from, to)]);
}

async function loadSales(from, to) {
    try {
        const report = await Api.getSalesReport(from, to);
        const rows = document.getElementById('salesRows');
        rows.innerHTML = report.days.map((d) => `
            <tr><td>${shortDate(d.date)}</td><td class="num">${fmt(d.kg_sold, 1)}</td><td class="num">K${fmt(d.revenue)}</td></tr>
        `).join('') || '<tr><td colspan="3" class="muted">No sales in this range.</td></tr>';

        const totalKg = report.days.reduce((sum, d) => sum + Number(d.kg_sold), 0);
        const totalRevenue = report.days.reduce((sum, d) => sum + Number(d.revenue), 0);
        document.getElementById('salesTotalKg').textContent = fmt(totalKg, 1);
        document.getElementById('salesTotalRevenue').textContent = 'K' + fmt(totalRevenue);
    } catch (err) {
        document.getElementById('salesRows').innerHTML = `<tr><td colspan="3" class="muted">Could not load: ${err.message}</td></tr>`;
    }
}

async function loadProfit(from, to) {
    try {
        const report = await Api.getProfitReport(from, to);
        const rows = document.getElementById('profitRows');
        rows.innerHTML = report.days.map((d) => `
            <tr>
                <td>${shortDate(d.date)}</td>
                <td class="num">K${fmt(d.revenue)}</td>
                <td class="num">K${fmt(d.estimated_cost)}</td>
                <td class="num">K${fmt(d.estimated_profit)}</td>
            </tr>
        `).join('') || '<tr><td colspan="4" class="muted">No sales in this range.</td></tr>';

        const totalRevenue = report.days.reduce((sum, d) => sum + Number(d.revenue), 0);
        const totalCost = report.days.reduce((sum, d) => sum + Number(d.estimated_cost), 0);
        const totalProfit = report.days.reduce((sum, d) => sum + Number(d.estimated_profit), 0);
        document.getElementById('profitTotalRevenue').textContent = 'K' + fmt(totalRevenue);
        document.getElementById('profitTotalCost').textContent = 'K' + fmt(totalCost);
        document.getElementById('profitTotalProfit').textContent = 'K' + fmt(totalProfit);

        const note = document.getElementById('profitNote');
        if (report.missing_cost_products > 0) {
            note.textContent = `${report.missing_cost_products} active product(s) have no cost price set -- profit is underestimated until you add cost prices in Manage Products.`;
            note.hidden = false;
        } else {
            note.hidden = true;
        }
    } catch (err) {
        document.getElementById('profitRows').innerHTML = `<tr><td colspan="4" class="muted">Could not load: ${err.message}</td></tr>`;
    }
}

async function loadStockUsage(from, to) {
    try {
        const report = await Api.getStockUsageReport(from, to);
        const rows = document.getElementById('usageRows');
        rows.innerHTML = report.products.map((p) => `
            <tr>
                <td>${p.name}</td>
                <td class="num">${fmt(p.total_received_kg, 1)} kg</td>
                <td class="num">${fmt(p.total_sold_kg, 1)} kg</td>
                <td class="num">${fmt(p.total_wasted_kg, 1)} kg</td>
            </tr>
        `).join('') || '<tr><td colspan="4" class="muted">No products.</td></tr>';
    } catch (err) {
        document.getElementById('usageRows').innerHTML = `<tr><td colspan="4" class="muted">Could not load: ${err.message}</td></tr>`;
    }
}

document.getElementById('applyRangeButton').addEventListener('click', loadReports);

loadReports();
