document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('otpForm');
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    const type = urlParams.get('type');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const otp = document.getElementById('otp').value;
        try {
            const response = await fetch('/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, type })
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