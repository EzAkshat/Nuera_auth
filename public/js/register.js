document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const togglePassword = document.getElementById("togglePassword");
  const toggleConfirmPassword = document.getElementById(
    "toggleConfirmPassword"
  );
  const eyeIconPassword = togglePassword.querySelector("img");
  const eyeIconConfirmPassword = toggleConfirmPassword.querySelector("img");
  const googleSignInButton = document.getElementById("googleSignInButton");
  if (googleSignInButton) {
    googleSignInButton.addEventListener("click", (e) => {
      e.preventDefault();
      const popup = window.open(
        "/auth/google",
        "googleSignIn",
        "width=600,height=600"
      );
      if (!popup) {
        showError("Popup blocked. Please allow popups for this site.");
      }
    });
  }
  togglePassword.addEventListener("click", () => {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;
    eyeIconPassword.src =
      type === "password" ? "/img/eye-open.svg" : "/img/eye-close.svg";
  });

  toggleConfirmPassword.addEventListener("click", () => {
    const type = confirmPasswordInput.type === "password" ? "text" : "password";
    confirmPasswordInput.type = type;
    eyeIconConfirmPassword.src =
      type === "password" ? "/img/eye-open.svg" : "/img/eye-close.svg";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (password !== confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    const unmetRules = validatePassword(password);
    if (unmetRules.length > 0) {
      const errorMessage = "Password must include: " + unmetRules.join(", ");
      showError(errorMessage);
      return;
    }

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    await handleAnimatedSubmit(
      form,
      async () => {
        const response = await fetch("/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        });
        return response.json();
      },
      showError
    );
  });

  function validatePassword(password) {
    const rules = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    const unmetRules = [];
    if (!rules.length) unmetRules.push("Minimum 8 characters");
    if (!rules.uppercase) unmetRules.push("At least 1 uppercase letter");
    if (!rules.lowercase) unmetRules.push("At least 1 lowercase letter");
    if (!rules.number) unmetRules.push("At least 1 number");
    if (!rules.special) unmetRules.push("At least 1 special character");
    return unmetRules;
  }

  function showError(message) {
    showNotification(message, "error");
  }

  function showSuccess(message, redirectUrl) {
    const notification = document.createElement("div");
    notification.className = "alert alert-success";
    notification.innerHTML = `${message} <a href="${redirectUrl}" class="alert-link">Open App</a>`;
    document.getElementById("notification-container").appendChild(notification);
  }

  async function handleAnimatedSubmit(
    form,
    apiCall,
    showError,
    animationDuration = 3000,
    successDelay = 2000
  ) {
    const button = form.querySelector(".animated-button");
    const buttonText = button.querySelector(".button-text");
    if (button.disabled) return;
    button.disabled = true;
    button.classList.add("sending");
    const originalText = buttonText.textContent;
    buttonText.textContent = "Sending OTP...";

    const animationPromise = new Promise((resolve) =>
      setTimeout(resolve, animationDuration)
    );
    try {
      const apiResult = await apiCall();
      await animationPromise;
      if (apiResult.success) {
        button.classList.remove("sending");
        button.classList.add("success");
        buttonText.textContent = "OTP Sent!";
        setTimeout(() => {
          button.classList.remove("success");
          buttonText.textContent = originalText;
          button.disabled = false;
          if (apiResult.redirect) {
            window.location.href = apiResult.redirect;
          }
        }, successDelay);
      } else {
        showError(apiResult.error);
        resetButton();
      }
    } catch (err) {
      showError("An error occurred. Please try again.");
      resetButton();
    }

    function resetButton() {
      button.classList.remove("sending", "success");
      buttonText.textContent = originalText;
      button.disabled = false;
    }
  }

  window.addEventListener("message", (event) => {
    if (event.data.type === "googleAuthSuccess") {
      window.location.href = `Nuera://auth-complete?code=${event.data.code}`;
    } else if (event.data.type === "googleAuthFailure") {
      showError(event.data.message);
    }
  });
});
