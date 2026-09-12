/**
 * Reads the boot/collapse duration from CSS so the timing lives in exactly
 * one place. Falls back to 800ms if the custom property is missing.
 */
function bootDurationMs() {
    const raw = getComputedStyle(document.documentElement)
        .getPropertyValue('--boot-duration').trim();
    const ms = raw.endsWith('ms') ? parseFloat(raw) : parseFloat(raw) * 1000;
    return Number.isFinite(ms) ? ms : 800;
}

/**
 * =========================================
 * LANDING PAGE TO IOS TRANSITION
 * =========================================
 */
function bootPhone() {
    const device = document.getElementById('device');
    const landingText = document.getElementById('landing-text');
    const glare = document.getElementById('glare');

    // Lock background scrolling
    document.body.classList.add('locked');

    // 1. Smoothly fade out the landing text
    if (landingText) {
        landingText.classList.add('fade-out');
    }
    
    // Fade out the quick links (the scroll arrow fades with its parent wrapper)
    const quickLinks = document.getElementById('quick-links');
    if (quickLinks) quickLinks.classList.add('fade-out');
    
    // 2. Expand the physical device constraints natively
    if (device) {
        device.classList.add('booted');
    }
    
    // 3. Remove the interactive glare blocking the container
    if (glare) {
        glare.style.opacity = '0';
    }
}

/**
 * =========================================
 * IOS TO LANDING PAGE TRANSITION
 * =========================================
 */
function shutdownPhone(event) {
    // Stop the click bubbling to the device listener, which would re-boot instantly
    if (event) event.stopPropagation();

    const device = document.getElementById('device');
    const landingText = document.getElementById('landing-text');
    const glare = document.getElementById('glare');

    // 1. Close any open apps in the background
    const activeApps = document.querySelectorAll('.app-window.active');
    activeApps.forEach(app => app.classList.remove('active'));

    // 2. Unlock background scrolling
    document.body.classList.remove('locked');

    // 3. Smoothly fade the landing text back in
    if (landingText) {
        landingText.classList.remove('fade-out');
    }
    
    const quickLinks = document.getElementById('quick-links');
    if (quickLinks) quickLinks.classList.remove('fade-out');

    // 4. Collapse the physical device constraints natively
    if (device) {
        device.classList.remove('booted');
    }
    
    // 5. Restore the interactive glare
    if (glare) {
        glare.style.opacity = '1';
    }
}

/**
 * =========================================
 * IOS INTERNAL LOGIC
 * =========================================
 */
function updateTime() {
    const clockElement = document.getElementById('clock');
    const widgetHours = document.getElementById('widget-hours');
    const widgetMinutes = document.getElementById('widget-minutes');
    const widgetDate = document.getElementById('widget-date');
    const dynamicGreeting = document.getElementById('dynamic-greeting');
    
    const now = new Date();
    
    let hours = now.getHours();
    let minutes = now.getMinutes();
    
    if (dynamicGreeting) {
        if (hours < 12) {
            dynamicGreeting.textContent = "Good Morning";
        } else if (hours < 18) {
            dynamicGreeting.textContent = "Good Afternoon";
        } else {
            dynamicGreeting.textContent = "Good Evening";
        }
    }

    hours = hours % 12 || 12;
    minutes = minutes.toString().padStart(2, '0');
    
    if (clockElement) {
        clockElement.textContent = `${hours}:${minutes}`;
    }

    // Write only the text nodes; rewriting innerHTML here would rebuild the
    // .blink span every tick and restart its CSS animation from frame 0.
    if (widgetHours) {
        widgetHours.textContent = hours;
    }

    if (widgetMinutes) {
        widgetMinutes.textContent = minutes;
    }

    if (widgetDate) {
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        widgetDate.textContent = now.toLocaleDateString('en-US', options);
    }
}

// Initialize clock immediately
updateTime();
setInterval(updateTime, 1000);

/**
 * App Navigation Mechanics
 */
function openApp(appId) {
    const appWindow = document.getElementById(appId);
    if (appWindow) appWindow.classList.add('active');
}

function closeApp(appId) {
    const appWindow = document.getElementById(appId);
    if (appWindow) appWindow.classList.remove('active');
}

/**
 * App Store "Today" Card Interactive Logic
 */
function expandCard(cardElement) {
    if (!cardElement.classList.contains('expanded')) {
        cardElement.classList.add('expanded');
        const grid = cardElement.closest('.bento-grid');
        if (grid) grid.classList.add('card-open');
    }
}

function closeExpandedCard(event, buttonElement) {
    event.stopPropagation();
    const cardElement = buttonElement.closest('.today-card');
    if (cardElement) {
        cardElement.classList.remove('expanded');
        const grid = cardElement.closest('.bento-grid');
        if (grid) grid.classList.remove('card-open');
    }
}

/**
 * Direct App Launch Macro
 * Boots the phone and smoothly opens a specific app after a delay.
 */
function launchDirectToApp(event, appId) {
    // Prevent event bubbling if necessary
    if (event) event.stopPropagation();

    // 1. Trigger the main boot sequence
    bootPhone();

    // 2. Wait for the expansion to finish, then open the requested app
    setTimeout(() => {
        openApp(appId);
    }, bootDurationMs());
}

/**
 * Tapping the device boots it. Guarding on .booted means clicks bubbling up
 * from the home screen are ignored while it is open, so the old
 * removeAttribute/setAttribute('onclick') dance is no longer needed.
 */
const deviceEl = document.getElementById('device');
if (deviceEl) {
    deviceEl.addEventListener('click', () => {
        if (!deviceEl.classList.contains('booted')) bootPhone();
    });
}
