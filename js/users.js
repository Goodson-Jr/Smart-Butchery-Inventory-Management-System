requireAuth();
renderShell('users');

if (Session.getRole() !== 'admin') {
    alert('Only admin accounts can manage users');
    window.location.href = 'dashboard.html';
}

const ROLE_LABELS = { admin: 'Admin (manager)', cashier: 'Cashier' };
let users = [];

function showNote(message, ok) {
    const note = document.getElementById('pageNote');
    note.textContent = message;
    note.className = 'note ' + (ok ? 'ok' : 'err');
    note.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function loadUsers() {
    const container = document.getElementById('userList');
    try {
        users = await Api.getUsers();
        renderUsers();
    } catch (err) {
        container.innerHTML = `<p class="muted">Could not load users: ${escapeHtml(err.message)}</p>`;
    }
}

function renderUsers() {
    const me = Session.getUsername();
    document.getElementById('userList').innerHTML = users.map((u) => {
        const isMe = u.username === me;
        const otherRole = u.role === 'admin' ? 'cashier' : 'admin';
        return `
            <div class="report-row ${u.is_active ? '' : 'inactive-row'}">
                <div class="info">
                    <div class="name">${escapeHtml(u.username)}${isMe ? ' <span class="muted">(you)</span>' : ''}</div>
                    <div class="meta">${ROLE_LABELS[u.role]} · added ${fmtDateTime(u.created_at)}</div>
                </div>
                <span class="status-pill ${u.is_active ? 'approved' : 'rejected'}">${u.is_active ? 'ACTIVE' : 'DEACTIVATED'}</span>
                <div class="actions">
                    <button type="button" class="btn auto soft" onclick="resetPassword(${u.id})">Reset password</button>
                    ${isMe ? '' : `
                        <button type="button" class="btn auto soft" onclick="changeRole(${u.id}, '${otherRole}')">Make ${ROLE_LABELS[otherRole]}</button>
                        <button type="button" class="btn auto ${u.is_active ? 'danger' : 'dark'}" onclick="setActive(${u.id}, ${!u.is_active})">
                            ${u.is_active ? 'Deactivate' : 'Reactivate'}
                        </button>`}
                </div>
            </div>
        `;
    }).join('');
}

function usernameOf(id) {
    const user = users.find((u) => u.id === id);
    return user ? user.username : 'this user';
}

document.getElementById('addUserButton').addEventListener('click', async () => {
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('newRole').value;
    const button = document.getElementById('addUserButton');

    if (!username) { showNote('Enter a username', false); return; }
    if (password.length < 6) { showNote('Password must be at least 6 characters', false); return; }

    button.disabled = true;
    try {
        await Api.createUser(username, password, role);
        showNote(`Added ${username} as ${ROLE_LABELS[role]}.`, true);
        document.getElementById('newUsername').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('newRole').value = 'cashier';
        await loadUsers();
    } catch (err) {
        showNote('Could not add user: ' + err.message, false);
    } finally {
        button.disabled = false;
    }
});

async function changeRole(id, role) {
    if (!confirm(`Make ${usernameOf(id)} ${ROLE_LABELS[role]}?`)) return;
    try {
        await Api.updateUser(id, { role });
        showNote(`${usernameOf(id)} is now ${ROLE_LABELS[role]}.`, true);
    } catch (err) {
        showNote('Could not change role: ' + err.message, false);
    }
    loadUsers();
}

async function setActive(id, isActive) {
    const name = usernameOf(id);
    if (!isActive && !confirm(`Deactivate ${name}? They'll be logged out and won't be able to log in. Their sales history is kept.`)) return;
    try {
        await Api.updateUser(id, { is_active: isActive });
        showNote(isActive ? `${name} can log in again.` : `${name} has been deactivated.`, true);
    } catch (err) {
        showNote('Could not update user: ' + err.message, false);
    }
    loadUsers();
}

async function resetPassword(id) {
    const password = prompt(`New password for ${usernameOf(id)} (at least 6 characters):`);
    if (password === null) return;
    if (password.length < 6) { showNote('Password must be at least 6 characters', false); return; }
    try {
        await Api.resetPassword(id, password);
        showNote(`Password changed for ${usernameOf(id)}.`, true);
    } catch (err) {
        showNote('Could not reset password: ' + err.message, false);
    }
}

loadUsers();
