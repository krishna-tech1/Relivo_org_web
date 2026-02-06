// Helper to get cookies
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// Global Auth Header Helper
function getAuthHeaders() {
    const token = localStorage.getItem('org_token') || getCookie('org_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Check if logged in
function checkAuth() {
    const token = localStorage.getItem('org_token') || getCookie('org_token');
    const path = window.location.pathname.toLowerCase();
    const guestPages = ['login', 'register', 'index', 'verify', 'forgot-password', 'verified'];
    const isGuestPage = guestPages.some(page => path.includes(page)) || path === '/' || path === '';

    if (!token && !isGuestPage) {
        window.location.href = 'login.html';
    }
}
// checkAuth(); // Removed auto-call to prevent redirect loops on login/register pages.

// Handle Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(loginForm);

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                // Check if it was a redirect (FastAPI might still return 303)
                if (response.redirected) {
                    const url = new URL(response.url);
                    window.location.href = url.pathname.split('/').pop() + '.html';
                } else {
                    const data = await response.json();
                    if (data.access_token) {
                        localStorage.setItem('org_token', data.access_token);
                    }
                    if (data.redirect) {
                        window.location.href = data.redirect + '.html';
                    } else {
                        window.location.href = 'dashboard.html';
                    }
                }
            } else {
                const error = await response.json();
                alert(error.detail || 'Login failed');
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred during login');
        }
    });
}

// Handle Register
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(registerForm);

        const password = formData.get('password');
        const confirmPassword = document.getElementById('regConfirmPassword').value;

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/register`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const email = formData.get('contact_email');
                window.location.href = `verify.html?email=${email}`;
            } else {
                const error = await response.json();
                alert(error.detail || 'Registration failed');
            }
        } catch (err) {
            console.error('Registration Error:', err);
            alert('An error occurred during registration. Check console for details.');
        }
    });
}

// Handle Verify
const verifyForm = document.getElementById('verifyForm');
if (verifyForm) {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    if (email) {
        document.getElementById('verifyEmail').value = email;
    }

    verifyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(verifyForm);

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/verify`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                window.location.href = 'verified.html';
            } else {
                const error = await response.json();
                alert(error.detail || 'Verification failed');
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred during verification');
        }
    });
}

// Handle Resend OTP
const resendForm = document.getElementById('resendForm');
if (resendForm) {
    resendForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const urlParams = new URLSearchParams(window.location.search);
        const email = urlParams.get('email');

        if (!email) {
            alert('Email missing');
            return;
        }

        const formData = new FormData();
        formData.append('email', email);

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/resend-otp`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                alert('OTP resent successfully');
            } else {
                const error = await response.json();
                alert(error.detail || 'Failed to resend OTP');
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred');
        }
    });
}
// Handle Forgot Password Request
const forgotRequestForm = document.getElementById('forgotRequestForm');
if (forgotRequestForm) {
    forgotRequestForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(forgotRequestForm);
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/forgot-password/request`, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                document.getElementById('resetSection').style.display = 'block';
                document.getElementById('resetEmail').value = formData.get('email');
            } else {
                alert(data.detail || 'Request failed');
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred');
        }
    });
}

// Handle Forgot Password Reset
const forgotResetForm = document.getElementById('forgotResetForm');
if (forgotResetForm) {
    forgotResetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(forgotResetForm);
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/forgot-password/reset`, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (response.ok) {
                alert('Password reset successfully! You can now login.');
                window.location.href = 'login.html';
            } else {
                alert(data.detail || 'Reset failed');
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred');
        }
    });
}
