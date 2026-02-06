async function loadGrant() {
    const urlParams = new URLSearchParams(window.location.search);
    const grantId = urlParams.get('id');

    if (grantId) {
        document.getElementById('formTitle').textContent = 'Edit Grant';
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/grants/${grantId}`, {
                credentials: 'include'
            });
            if (response.ok) {
                const grant = await response.json();
                document.getElementById('grantTitle').value = grant.title;
                document.getElementById('grantApplyUrl').value = grant.apply_url;
                if (grant.deadline) {
                    document.getElementById('grantDeadline').value = grant.deadline.split('T')[0];
                }
                document.getElementById('grantAmount').value = grant.amount || '';
                document.getElementById('grantCountry').value = grant.refugee_country || '';
                document.getElementById('grantDescription').value = grant.description || '';
                document.getElementById('grantEligibility').value = grant.eligibility || '';
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
            ? `${CONFIG.API_BASE_URL}/org/grants/${grantId}/edit`
            : `${CONFIG.API_BASE_URL}/org/grants/create`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            if (response.ok) {
                window.location.href = 'dashboard.html';
            } else {
                const error = await response.json();
                alert(error.detail || 'Failed to save grant');
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred');
        }
    });
}

loadGrant();
