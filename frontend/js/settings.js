const passwordForm = document.getElementById('passwordForm');
if (passwordForm) {
    // Check if password change is required
    (async () => {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/dashboard_data`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                if (data.must_change_password) {
                    document.getElementById('passwordAlert').style.display = 'block';
                }
            }
        } catch (err) {
            console.error(err);
        }
    })();

    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(passwordForm);

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/change-password`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            if (response.ok) {
                alert('Password updated successfully');
                window.location.href = 'dashboard.html';
            } else {
                const error = await response.json();
                alert(error.detail || 'Failed to update password');
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred');
        }
    });
}
