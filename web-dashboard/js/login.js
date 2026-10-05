document.getElementById('appVersion').textContent = 'Version ' + APP_VERSION;

if (Session.isLoggedIn()) window.location.href = 'dashboard.html';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorNote = document.getElementById('errorNote');
    const loginButton = document.getElementById('loginButton');

    errorNote.hidden = true;
    loginButton.disabled = true;

    try {
        const result = await Api.login(username, password);
        Session.save(result.token, result.role, username);
        window.location.href = 'dashboard.html';
    } catch (err) {
        if (err.status === 401) errorNote.textContent = 'Invalid username or password';
        else if (err.status === 403) errorNote.textContent = err.message;
        else errorNote.textContent = 'Could not reach server: ' + err.message;
        errorNote.hidden = false;
    } finally {
        loginButton.disabled = false;
    }
});
