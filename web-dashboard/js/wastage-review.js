requireAuth();
renderShell('wastage-review');

if (Session.getRole() !== 'admin') {
    alert('Only admin accounts can approve wastage');
    window.location.href = 'dashboard.html';
}

function showNote(message, ok) {
    const note = document.getElementById('pageNote');
    note.textContent = message;
    note.className = 'note ' + (ok ? 'ok' : 'err');
    note.hidden = false;
}

function reportDetailsHtml(w) {
    return `
        <div class="name">${escapeHtml(w.product_name)} · ${fmt(w.quantity_kg, 2)} kg</div>
        <div class="meta">${WASTAGE_REASONS[w.reason] || escapeHtml(w.reason)}${w.note ? ' — ' + escapeHtml(w.note) : ''}</div>
        <div class="meta">Reported by <strong>${escapeHtml(w.recorded_by_username)}</strong> · ${fmtDateTime(w.recorded_at)}</div>
    `;
}

async function loadPending() {
    const container = document.getElementById('pendingList');
    const badge = document.getElementById('pendingCount');
    try {
        const pending = await Api.getWastage('PENDING');
        badge.textContent = pending.length;
        badge.hidden = pending.length === 0;
        if (!pending.length) {
            container.innerHTML = '<p class="muted">Nothing to review.</p>';
            return;
        }
        container.innerHTML = pending.map((w) => `
            <div class="report-row">
                <div class="info">
                    ${reportDetailsHtml(w)}
                    <div class="meta">In stock now: ${fmt(w.stock_kg, 2)} kg</div>
                </div>
                <div class="actions">
                    <button type="button" class="btn auto dark" onclick="approve(${w.id})">Approve</button>
                    <button type="button" class="btn auto danger" onclick="reject(${w.id})">Reject</button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = `<p class="muted">Could not load reports: ${escapeHtml(err.message)}</p>`;
    }
}

async function loadHistory() {
    const container = document.getElementById('historyList');
    try {
        const decided = (await Api.getWastage()).filter((w) => w.status !== 'PENDING').slice(0, 30);
        if (!decided.length) {
            container.innerHTML = '<p class="muted">No approved or rejected reports yet.</p>';
            return;
        }
        container.innerHTML = decided.map((w) => `
            <div class="report-row">
                <div class="info">
                    ${reportDetailsHtml(w)}
                    <div class="meta">${w.status === 'APPROVED' ? 'Approved' : 'Rejected'} by ${escapeHtml(w.reviewed_by_username)} · ${fmtDateTime(w.reviewed_at)}${w.rejection_reason ? ' — ' + escapeHtml(w.rejection_reason) : ''}</div>
                </div>
                <span class="status-pill ${w.status.toLowerCase()}">${w.status}</span>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = `<p class="muted">Could not load history: ${escapeHtml(err.message)}</p>`;
    }
}

async function approve(id) {
    if (!confirm('Approve this write-off? The weight will be taken off stock.')) return;
    try {
        await Api.approveWastage(id);
        showNote('Approved, and the stock was updated.', true);
    } catch (err) {
        showNote('Could not approve: ' + err.message, false);
    }
    refresh();
}

async function reject(id) {
    const reason = prompt('Why are you rejecting this? (optional, the cashier will see it)');
    if (reason === null) return;
    try {
        await Api.rejectWastage(id, reason.trim());
        showNote('Rejected. Stock was not changed.', true);
    } catch (err) {
        showNote('Could not reject: ' + err.message, false);
    }
    refresh();
}

function refresh() {
    loadPending();
    loadHistory();
}

refresh();
