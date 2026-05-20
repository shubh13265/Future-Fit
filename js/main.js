// CareerPath Navigator - Main Logic
// Connects Frontend to Node.js/MongoDB Backend

const API_URL = 'http://localhost:5000/api'; // Make sure your backend runs on port 5000

// DOM Elements
const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const loginBtn = document.querySelector('.btn-login');
const signupBtn = document.querySelector('.btn-signup');
const welcomeScreen = document.getElementById('welcomeScreen');
const loadingScreen = document.getElementById('loadingScreen');
const mainContent = document.getElementById('mainContent');

// --- 1. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Application Initializing...');
    
    // Check if user is already logged in
    checkLoginState();

    // Initialize UI Interactions (Scroll, Modals)
    initializeUI();
});

// --- 2. AUTHENTICATION LOGIC (Real API Calls) ---

// Check if user is logged in (Token exists in LocalStorage)
function checkLoginState() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (token && user) {
        updateNavForLoggedInUser(user);
    }
}

// Update Navbar: Hide Login/Signup, Show Logout/Profile
function updateNavForLoggedInUser(user) {
    const navButtons = document.querySelector('.nav-buttons');
    if (navButtons) {
        navButtons.innerHTML = `
            <span style="margin-right: 15px; font-weight: bold; color: #667eea;">Hello, ${user.name}</span>
            <button onclick="logoutUser()" class="btn btn-outline" style="border-color: #e74c3c; color: #e74c3c;">Logout</button>
        `;
    }
}

// LOGOUT FUNCTION
window.logoutUser = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showNotification('Logged out successfully', 'info');
    setTimeout(() => window.location.reload(), 1000);
};

// SIGNUP LOGIC
document.getElementById('signupForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const role = 'student'; // Default role

    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = 'Signing up...';

    try {
        const res = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role })
        });

        const data = await res.json();

        if (res.ok) {
            showNotification(data.msg || 'Registration successful! Please login.', 'success');
            signupModal.style.display = 'none';
        } else {
            showNotification(data.msg || 'Signup failed', 'error');
        }
    } catch (err) {
        console.error(err);
        showNotification('Server error. Please try again later.', 'error');
    } finally {
        submitBtn.innerText = originalText;
    }
});

// LOGIN LOGIC
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = 'Logging in...';

    try {
        const res = await fetch(`${API_URL}/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            // SAVE TOKEN & USER DATA TO LOCAL STORAGE
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            showNotification('Login successful!', 'success');
            loginModal.style.display = 'none';
            
            // Update UI immediately
            updateNavForLoggedInUser(data.user);
            
            // Redirect to Dashboard/Growth page if needed
            // window.location.href = 'growth.html'; 
        } else {
            showNotification(data.msg || 'Invalid credentials', 'error');
        }
    } catch (err) {
        console.error(err);
        showNotification('Server error. Is the backend running?', 'error');
    } finally {
        submitBtn.innerText = originalText;
    }
});


// --- 3. DATA LOGIC (Saving Assessments/Colleges) ---

// Helper to get Headers with JWT
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'x-auth-token': token
    };
}

// Function to call when user completes an assessment
async function saveAssessmentResult(results) {
    if (!localStorage.getItem('token')) {
        showNotification('Please login to save your results!', 'warning');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/data/save-assessment`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ results })
        });
        const data = await res.json();
        if (res.ok) {
            showNotification('Assessment results saved to your profile!', 'success');
        }
    } catch (err) {
        console.error(err);
    }
}

// Function to call when user bookmarks a college
async function toggleSaveCollege(collegeName, isSaving = true) {
    if (!localStorage.getItem('token')) {
        showNotification('Please login to save colleges!', 'warning');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/data/save-college`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ collegeName, isSaving })
        });
        if (res.ok) {
            showNotification(isSaving ? 'College Saved!' : 'College Removed', 'success');
        }
    } catch (err) {
        console.error(err);
    }
}


// --- 4. UI INTERACTIONS (Preserved from your original file) ---

function initializeUI() {
    // Welcome Screen Logic
    const welcomeBtn = document.getElementById('welcomeBtn');
    if (welcomeBtn) {
        welcomeBtn.addEventListener('click', () => {
            welcomeScreen.style.display = 'none';
            loadingScreen.style.display = 'flex';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                mainContent.style.display = 'block';
                mainContent.style.opacity = '1';
            }, 1500);
        });
    } else {
        // If no welcome screen (internal pages), show content immediately
        if (mainContent) mainContent.style.display = 'block';
    }

    // Modal Opening Logic
    if(loginBtn) loginBtn.addEventListener('click', () => loginModal.style.display = 'block');
    if(signupBtn) signupBtn.addEventListener('click', () => signupModal.style.display = 'block');

    // Close Modals (x buttons)
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    // Close Modal on Outside Click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // Mobile Menu
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    if(mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
}

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    // Simple styling if CSS class missing
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '5px';
    notification.style.color = '#fff';
    notification.style.zIndex = '10000';
    notification.style.fontWeight = 'bold';
    
    if(type === 'success') notification.style.backgroundColor = '#4ecdc4'; // Green
    else if(type === 'error') notification.style.backgroundColor = '#e74c3c'; // Red
    else if(type === 'warning') notification.style.backgroundColor = '#f1c40f'; // Yellow
    else notification.style.backgroundColor = '#667eea'; // Blue

    notification.innerText = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 4000);
}