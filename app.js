document.addEventListener('DOMContentLoaded', () => {
    const registerFormContainer = document.getElementById('register-form-container');
    const loginFormContainer = document.getElementById('login-form-container');
    const showLoginLink = document.getElementById('show-login');
    const showRegisterLink = document.getElementById('show-register');

    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');

    const registerError = document.getElementById('register-error');
    const loginError = document.getElementById('login-error');

    // --- Toggle between Login and Register forms ---
    showLoginLink.addEventListener('click', () => {
        registerFormContainer.classList.add('hidden');
        loginFormContainer.classList.remove('hidden');
    });

    showRegisterLink.addEventListener('click', () => {
        loginFormContainer.classList.add('hidden');
        registerFormContainer.classList.remove('hidden');
    });

    // --- Registration Logic ---
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        hideError('register');

        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, role: 'student' }) // Assuming role for this form
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showError('register', data.error);
            } else {
                alert('Registration successful! Please log in.');
                showLoginLink.click();
                registerForm.reset();
            }
        })
        .catch(error => showError('register', 'Registration failed. Please try again.'));
    });

    // --- Login Logic ---
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        hideError('login');

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showError('login', data.error);
            } else {
                sessionStorage.setItem('loggedInUser', JSON.stringify(data.user));
                window.location.href = 'dashboard.html';
            }
        })
        .catch(error => showError('login', 'Login failed. Please check server connection.'));
    });

    function showError(form, message) {
        const errorElement = form === 'register' ? registerError : loginError;
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }

    function hideError(form) {
        const errorElement = form === 'register' ? registerError : loginError;
        if (!errorElement.classList.contains('hidden')) {
            errorElement.classList.add('hidden');
        }
    }
});