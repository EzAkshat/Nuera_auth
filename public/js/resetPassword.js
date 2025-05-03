document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('resetPasswordForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const eyeIconPassword = togglePassword.querySelector('img');
    const eyeIconConfirmPassword = toggleConfirmPassword.querySelector('img');
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code'); // Renamed from token to code for consistency

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
        const password = passwordInput.value;
        try {
            const response = await fetch('/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, password }) // Fixed to use code instead of undefined variable
            });
            const result = await response.json();
            if (result.success) {
                window.location.href = '/login';
            } else {
                showError(result.error);
            }
        } catch (err) {
            showError('An error occurred. Please try again.');
        }
    });

    function showError(message) {
        showNotification(message, 'error');
    }
});