const switchThemeToggler = document.getElementById("theme-toggler");

// Event listener for theme toggle switch
switchThemeToggler.addEventListener("change", toggleTheme);

// Set the specified theme and store it in local storage
function setTheme(themeName) {
    localStorage.setItem("theme", themeName);
    document.documentElement.className = themeName;
}

// Toggle between dark and light themes
function toggleTheme() {
    const currentTheme = localStorage.getItem("theme");
    const newTheme = currentTheme === "theme-dark" ? "theme-light" : "theme-dark";

    setTheme(newTheme);
    switchThemeToggler.checked = newTheme === "theme-dark";
}

// Immediately set the theme based on local storage or default to dark theme
(function initializeTheme() {
    const currentTheme = localStorage.getItem("theme") || "theme-dark";
    setTheme(currentTheme);
    switchThemeToggler.checked = currentTheme === "theme-dark";
})();
