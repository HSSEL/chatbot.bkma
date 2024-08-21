const sidebar = document.querySelector(".sidebar");
const menuButton = document.querySelector(".menu-button");

// Toggle sidebar visibility
function toggleSidebar(event) {
    if (sidebar.classList.contains("shown")) {
        hideSidebar(event.target);
    } else {
        showSidebar(event.target);
    }
    window.scrollTo(0, 0); // Scroll to top of the page
}

// Show sidebar and rotate menu button
function showSidebar(target) {
    sidebar.classList.add("shown");
    target.classList.add("rotated");
    document.body.style.overflow = "hidden"; // Prevent page scrolling
}

// Hide sidebar and reset menu button rotation
function hideSidebar(target) {
    sidebar.classList.remove("shown");
    target.classList.remove("rotated");
    document.body.style.overflow = "auto"; // Allow page scrolling
}

// Add event listener to menu button
menuButton.addEventListener("click", toggleSidebar);

// Close sidebar when clicking outside of it or the menu button
document.body.addEventListener('click', function(event) { 
    if (!event.target.closest('.sidebar') && !event.target.closest('.menu-button') && !event.target.closest('.conversation-sidebar')) {
        hideSidebar(menuButton);
    }

    // Close sidebar if clicking on the conversation title
    if (event.target.matches('.conversation-title')) {
        const menuButtonStyle = window.getComputedStyle(menuButton);
        if (menuButtonStyle.display !== 'none') {
            hideSidebar(menuButton);
        }
    }
});
