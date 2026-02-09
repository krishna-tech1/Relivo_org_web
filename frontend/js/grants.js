checkAuth();

async function loadGrant() {
    const urlParams = new URLSearchParams(window.location.search);
    const grantId = urlParams.get('id');

    if (grantId) {
        document.getElementById('pageTitle').textContent = 'Edit Publication';
        document.getElementById('submitBtn').innerHTML = '<i data-lucide="save"></i> Update Publication';

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/grants/${grantId}`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const grant = await response.json();
                const form = document.getElementById('grantForm');

                // Set values using the name attribute
                form.querySelector('[name="title"]').value = grant.title || '';
                form.querySelector('[name="organizer"]').value = grant.organizer || '';
                form.querySelector('[name="category"]').value = grant.category || 'General';
                form.querySelector('[name="apply_url"]').value = grant.apply_url || '';
                if (grant.deadline) {
                    form.querySelector('[name="deadline"]').value = grant.deadline.split('T')[0];
                }
                form.querySelector('[name="refugee_country"]').value = grant.refugee_country || '';
                form.querySelector('[name="amount"]').value = grant.amount || '';
                form.querySelector('[name="description"]').value = grant.description || '';
                form.querySelector('[name="eligibility"]').value = grant.eligibility || '';

                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        } catch (err) {
            console.error(err);
        }
    }
}

const grantForm = document.getElementById('grantForm');
if (grantForm) {
    grantForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const urlParams = new URLSearchParams(window.location.search);
        const grantId = urlParams.get('id');

        const formData = new FormData(grantForm);
        const url = grantId
            ? `${CONFIG.API_BASE_URL}/api/org/grants/${grantId}/edit`
            : `${CONFIG.API_BASE_URL}/api/org/grants/create`;

        try {
            const submitBtn = document.getElementById('submitBtn');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i data-lucide="loader" class="spin"></i> Processing...';
            submitBtn.disabled = true;
            if (typeof lucide !== 'undefined') lucide.createIcons();

            const response = await fetch(url, {
                method: 'POST',
                body: formData,
                headers: getAuthHeaders()
            });

            if (response.ok) {
                window.location.href = 'dashboard.html';
            } else {
                const error = await response.json();
                alert(error.detail || 'Failed to save publication. Please verify all fields.');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        } catch (err) {
            console.error(err);
            alert('A network error occurred. Please check your connection.');
        }
    });
}

loadGrant();
