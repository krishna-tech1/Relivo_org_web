checkAuth();

async function loadDashboard() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/dashboard_data`, {
            headers: {
                ...getAuthHeaders()
            }
        });
        if (response.status === 401) {
            window.location.href = 'login.html';
            return;
        }

        if (!response.ok) {
            throw new Error('Failed to fetch dashboard data');
        }

        const data = await response.json();

        if (data.must_change_password) {
            window.location.href = 'settings.html';
            return;
        }

        document.getElementById('orgName').textContent = data.org.name;
        document.getElementById('orgInfo').textContent = `${data.org.contact_email} - ${data.org.country}`;

        // Handle Status
        const status = data.org.status ? data.org.status.toLowerCase() : 'pending';
        if (status === 'pending') {
            document.body.insertAdjacentHTML('afterbegin', '<div class="alert">Notice: Your account is <b>Pending Approval</b>. You can see your dashboard but cannot post grants yet.</div>');
            document.querySelectorAll('.actions .btn:not(#logoutBtn)').forEach(btn => btn.style.display = 'none');
        } else if (status === 'rejected') {
            document.body.insertAdjacentHTML('afterbegin', '<div class="alert danger">Notice: Your application has been <b>Rejected</b>. Please contact support for details.</div>');
            document.querySelectorAll('.actions .btn:not(#logoutBtn)').forEach(btn => btn.style.display = 'none');
        }

        document.getElementById('totalGrants').textContent = data.total_grants;
        document.getElementById('activeGrants').textContent = data.active_grants;
        document.getElementById('inactiveGrants').textContent = data.inactive_grants;

        const grantsList = document.getElementById('grantsList');
        grantsList.innerHTML = '';

        if (data.grants && data.grants.length > 0) {
            data.grants.forEach(grant => {
                const grantEl = document.createElement('div');
                grantEl.className = 'grant';
                grantEl.innerHTML = `
                    <h3>${grant.title}</h3>
                    <p class="muted">${grant.organizer || ''}</p>
                    <p>${grant.description || 'No description'}</p>
                    <div class="grant-actions">
                        <a class="btn" href="grant_form.html?id=${grant.id}">Edit</a>
                        <button class="btn danger" onclick="deleteGrant(${grant.id})">Delete</button>
                    </div>
                `;
                grantsList.appendChild(grantEl);
            });
        } else {
            grantsList.innerHTML = '<p class="muted">No grants yet. Create your first one.</p>';
        }

    } catch (err) {
        console.error(err);
        alert('Error loading dashboard');
    }
}

async function deleteGrant(id) {
    if (!confirm('Are you sure you want to delete this grant?')) return;

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/org/grants/${id}/delete`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders()
            }
        });

        if (response.ok) {
            loadDashboard();
        } else {
            alert('Failed to delete grant');
        }
    } catch (err) {
        console.error(err);
        alert('Error deleting grant');
    }
}

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await fetch(`${CONFIG.API_BASE_URL}/auth/logout`, {
        headers: getAuthHeaders()
    });
    localStorage.removeItem('org_token');
    window.location.href = 'login.html';
});

loadDashboard();
