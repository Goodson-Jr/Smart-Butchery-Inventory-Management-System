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
        errorNote.textContent = err.status === 401 ? 'Invalid username or password' : ('Could not reach server: ' + err.message);
        errorNote.hidden = false;
    } finally {
        loginButton.disabled = false;
    }
});
