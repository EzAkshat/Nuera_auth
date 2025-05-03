document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("forgotPasswordForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    await handleAnimatedSubmit(
      form,
      async () => {
        const response = await fetch("/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        return response.json();
      },
      showError
    );
  });

  function showError(message) {
    showNotification(message, "error");
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
});
