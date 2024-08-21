let shiftAmount = 70;
let mainContainer = document.querySelector('.main-container'); 

// Shift content up by a percentage
function shiftContentUp() {
    mainContainer.style.marginTop = `-${shiftAmount}%`;
}

// Reset content margin
function resetContent() {
    mainContainer.style.marginTop = "0";
}

// Toggle fullscreen mode
function toggleFullScreen(enterFullScreen) {
    if (enterFullScreen) {
        // Request fullscreen
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) { // Firefox
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) { // Chrome, Safari and Opera
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) { // Internet Explorer and Edge
            document.documentElement.msRequestFullscreen();
        }
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { // Firefox
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { // Chrome, Safari and Opera
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { // Internet Explorer and Edge
            document.msExitFullscreen();
        }
    }
}

// Adjust content on focus and blur of the message input
document.getElementById('message-input').addEventListener('focus', function() {
    if (document.fullscreenElement) {
        shiftContentUp();
    }
});

document.getElementById('message-input').addEventListener('blur', function() {
    if (document.fullscreenElement) {
        resetContent();
    }
});

// Update the fullscreen toggle checkbox based on fullscreen state
document.addEventListener('fullscreenchange', function() {
    document.getElementById('fullscreen-toggle').checked = !!document.fullscreenElement;
});

// Toggle fullscreen when the checkbox changes
document.getElementById('fullscreen-toggle').addEventListener('change', function() {
    toggleFullScreen(this.checked);
});
