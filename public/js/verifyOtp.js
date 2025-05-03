document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('otpForm');
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    const type = urlParams.get('type');

    let timeLeft = 60;
    let countdownInterval;

    function startCountdown() {
        const countdownEl = document.getElementById('countdown');
        countdownEl.textContent = `Time left: ${timeLeft} seconds`;
        countdownInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft > 0) {
                countdownEl.textContent = `Time left: ${timeLeft} seconds`;
            } else {
                clearInterval(countdownInterval);
                countdownEl.textContent = '';
                document.getElementById('resend').classList.remove('d-none');
            }
        }, 1000);
    }

    startCountdown();

    document.getElementById('resendLink').addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/resend-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, type })
            });
            const result = await response.json();
            if (result.success) {
                showNotification('OTP has been resent', 'success');
                timeLeft = 60;
                document.getElementById('resend').classList.add('d-none');
                startCountdown();
            } else {
                showError(result.error);
            }
        } catch (err) {
            showError('An error occurred. Please try again.');
        }
    });

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
        showNotification(message, 'error');
    }
});