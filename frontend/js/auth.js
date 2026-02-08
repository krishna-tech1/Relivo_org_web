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
    const guestPages = ['login', 'register', 'index', 'verify', 'forgot-password', 'verified', 'pending', 'suspended', 'rejected'];
    const isGuestPage = guestPages.some(page => path.includes(page)) || path === '/' || path.endsWith('index.html');

    if (!token && !isGuestPage) {
        window.location.href = 'login.html';
    }
}

// UI Feedback Helper
function setBtnLoading(btn, isLoading, originalHtml) {
    if (isLoading) {
        btn.disabled = true;
        btn.dataset.original = btn.innerHTML;
        btn.innerHTML = '<i data-lucide="loader" class="spin"></i> Processing...';
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } else {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.original || originalHtml;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// Toggle Password Visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const btn = input.nextElementSibling;
    const icon = btn.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
    } else {
        input.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Handle Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = loginForm.querySelector('button[type="submit"]');
        setBtnLoading(btn, true);

        const formData = new FormData(loginForm);

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                if (data.access_token) {
                    localStorage.setItem('org_token', data.access_token);
                }
                if (data.redirect) {
                    window.location.href = data.redirect + '.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            } else {
                const error = await response.json();
                alert(error.detail || 'Login failed. Please check your credentials.');
                setBtnLoading(btn, false);
            }
        } catch (err) {
            console.error(err);
            alert('A network error occurred. Please try again.');
            setBtnLoading(btn, false);
        }
    });
}

// Handle Register
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = registerForm.querySelector('button[type="submit"]');

        const formData = new FormData(registerForm);
        const password = formData.get('password');
        const confirmPassword = document.getElementById('reg-confirm-password').value;

        if (password !== confirmPassword) {
            alert('Security Error: New passwords do not match.');
            return;
        }

        setBtnLoading(btn, true);

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const email = formData.get('contact_email');
                window.location.href = `verify.html?email=${email}`;
            } else {
                const error = await response.json();
                alert(error.detail || 'Registration failed. Email might already be registered.');
                setBtnLoading(btn, false);
            }
        } catch (err) {
            console.error('Registration Error:', err);
            alert('A network error occurred during registration.');
            setBtnLoading(btn, false);
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
        const btn = verifyForm.querySelector('button[type="submit"]');
        setBtnLoading(btn, true);
        const formData = new FormData(verifyForm);

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/auth/verify`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                window.location.href = 'verified.html';
            } else {
                const error = await response.json();
                alert(error.detail || 'Verification failed. Code may be incorrect or expired.');
                setBtnLoading(btn, false);
            }
        } catch (err) {
            console.error(err);
            setBtnLoading(btn, false);
        }
    });
}

// Handle Resend OTP
const resendForm = document.getElementById('resendForm');
if (resendForm) {
    resendForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = resendForm.querySelector('button');
        const urlParams = new URLSearchParams(window.location.search);
        const email = urlParams.get('email');

        if (!email) return;
        setBtnLoading(btn, true);

        const formData = new FormData();
        formData.append('email', email);

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/auth/resend-otp`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                alert('Success: A new verification code has been dispatched.');
            }
            setBtnLoading(btn, false);
        } catch (err) {
            setBtnLoading(btn, false);
        }
    });
}

// Handle Forgot Password Request
const forgotRequestForm = document.getElementById('forgotRequestForm');
if (forgotRequestForm) {
    forgotRequestForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = forgotRequestForm.querySelector('button');
        setBtnLoading(btn, true);
        const formData = new FormData(forgotRequestForm);
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/auth/forgot-password/request`, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (response.ok) {
                document.getElementById('resetSection').style.display = 'block';
                document.getElementById('resetEmail').value = formData.get('email');
                if (typeof lucide !== 'undefined') lucide.createIcons();
            } else {
                alert(data.detail || 'Service unavailable.');
            }
            setBtnLoading(btn, false);
        } catch (err) {
            setBtnLoading(btn, false);
        }
    });
}

// Handle Forgot Password Reset
const forgotResetForm = document.getElementById('forgotResetForm');
if (forgotResetForm) {
    forgotResetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = forgotResetForm.querySelector('button');
        setBtnLoading(btn, true);
        const formData = new FormData(forgotResetForm);
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/auth/forgot-password/reset`, {
                method: 'POST',
                body: formData
            });
            if (response.ok) {
                window.location.href = 'login.html?reset=success';
            } else {
                const data = await response.json();
                alert(data.detail || 'Reset failed.');
                setBtnLoading(btn, false);
            }
        } catch (err) {
            setBtnLoading(btn, false);
        }
    });
}
