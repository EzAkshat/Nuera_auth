document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const eyeIconPassword = togglePassword.querySelector('img');
    const eyeIconConfirmPassword = toggleConfirmPassword.querySelector('img');

    togglePassword.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        eyeIconPassword.src = type === 'password' ? '/img/eye-open.svg' : '/img/eye-close.svg';
    });

    toggleConfirmPassword.addEventListener('click', () => {
        const type = confirmPasswordInput.type === 'password' ? 'text' : 'password';
        confirmPasswordInput.type = type;
        eyeIconConfirmPassword.src = type === 'password' ? '/img/eye-open.svg' : '/img/eye-close.svg';
    });

    confirmPasswordInput.addEventListener('input', () => {
        if (passwordInput.value !== confirmPasswordInput.value) {
            confirmPasswordInput.classList.add('is-invalid');
        } else {
            confirmPasswordInput.classList.remove('is-invalid');
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (passwordInput.value !== confirmPasswordInput.value) {
            showError('Passwords do not match');
            return;
        }
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = passwordInput.value;
        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const result = await response.json();
            if (result.success) {
                window.location.href = result.redirect;
            } else {
                showError(result.error);
            }
        } catch (err) {
            showError('An error occurred. Please try again.');
        }
    });

    function showError(message) {
        const errorDiv = document.getElementById('error');
        errorDiv.textContent = message;
        errorDiv.classList.remove('d-none');
        setTimeout(() => errorDiv.classList.add('show'), 10); // Small delay for transition
      }
});