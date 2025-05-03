document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const passwordInput = document.getElementById("password");
  const togglePassword = document.getElementById("togglePassword");
  const eyeIcon = togglePassword.querySelector("img");

  togglePassword.addEventListener("click", () => {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;
    eyeIcon.src =
      type === "password" ? "/img/eye-open.svg" : "/img/eye-close.svg";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = passwordInput.value;
    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (result.success) {
        window.location.href = result.redirect;
      } else {
        showError(result.error);
      }
    } catch (err) {
      showError("An error occurred. Please try again.");
    }
  });

  function showError(message) {
    showNotification(message, "error");
  }

  function showSuccess(message, redirectUrl) {
    const notification = document.createElement("div");
    notification.className = "alert alert-success";
    notification.innerHTML = `${message} <a href="${redirectUrl}" class="alert-link">Open App</a>`;
    document.getElementById("notification-container").appendChild(notification);
  }

  window.addEventListener("message", (event) => {
    if (event.data.type === "googleAuthSuccess") {
        window.location.href = `Nuera://auth-complete?code=${event.data.code}`;
    } else if (event.data.type === "googleAuthFailure") {
      showError(event.data.message);
    }
  });

  const googleSignInButton = document.getElementById('googleSignInButton');
  if (googleSignInButton) {
    googleSignInButton.addEventListener('click', (e) => {
      e.preventDefault();
      const popup = window.open('/auth/google', 'googleSignIn', 'width=600,height=600');
      if (!popup) {
        showError('Popup blocked. Please allow popups for this site.');
      }
    });
  }
});
