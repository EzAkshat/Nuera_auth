function showNotification(message, type = "info") {
    const container = document.getElementById("notification-container");
    const notification = document.createElement("div");
    notification.classList.add("notification", type);
    notification.textContent = message;
    notification.setAttribute("role", "alert");
    notification.style.position = "fixed";
    notification.style.top = "-100px"; // Start off-screen
    notification.style.left = "50%";
    notification.style.transform = "translateX(-50%)";
    notification.style.opacity = "1"; // Ensure initial opacity
    container.appendChild(notification);

    // Slide in animation
    setTimeout(() => {
        notification.style.top = "20px";
    }, 10);

    // Dragging variables
    let isDragging = false;
    let startY, initialTop;
    const fixedLeft = "50%"; // Fixed horizontal position

    // Start dragging on mousedown
    notification.addEventListener("mousedown", (e) => {
        isDragging = true;
        startY = e.clientY;
        const rect = notification.getBoundingClientRect();
        initialTop = rect.top;
        notification.style.top = initialTop + "px";
        notification.style.left = fixedLeft;
        notification.style.transition = "none"; // Disable transition during drag
    });

    // Update position on mousemove (vertical only)
    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        const dy = e.clientY - startY;
        let newTop = initialTop + dy;

        // Constrain vertically
        const minTop = 20; // Minimum top position
        const maxTop = Math.max(minTop, window.innerHeight * 0.85 - notification.offsetHeight); // Limit to 85% of screen height
        newTop = Math.max(minTop, Math.min(newTop, maxTop));

        notification.style.top = newTop + "px";
        notification.style.left = fixedLeft; // Keep horizontal position fixed
    });

    // Stop dragging on mouseup
    document.addEventListener("mouseup", () => {
        if (isDragging) {
            isDragging = false;
            // Fade out animation
            notification.style.transition = "opacity 0.3s ease, top 0.3s ease";
            notification.style.opacity = "0";
            notification.style.top = "-100px";
            setTimeout(() => {
                notification.remove();
            }, 300); // Match transition duration
        }
    });

    // Auto-dismiss after 4 seconds
    const autoDismissTimeout = setTimeout(() => {
        dismissNotification(notification);
    }, 4000);
}

function dismissNotification(notification) {
    notification.style.transition = "opacity 0.3s ease, top 0.3s ease";
    notification.style.opacity = "0";
    notification.style.top = "-100px";
    setTimeout(() => {
        notification.remove();
    }, 300); // Match transition duration
}