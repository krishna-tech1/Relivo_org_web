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

        // Update Header Data
        document.getElementById('orgName').textContent = data.org.name;
        document.getElementById('orgInfo').textContent = `${data.org.contact_email} • ${data.org.country}`;

        // Update Avatar
        const avatar = document.getElementById('avatarInitial');
        if (avatar && data.org.name) {
            avatar.textContent = data.org.name.charAt(0).toUpperCase();
        }

        // Handle Status Alerts
        const status = data.org.status ? data.org.status.toLowerCase() : 'pending';
        const existingAlerts = document.querySelectorAll('.custom-alert');
        existingAlerts.forEach(a => a.remove());

        if (status === 'pending') {
            document.querySelector('.dashboard-nav').insertAdjacentHTML('afterend', `
                <div class="custom-alert" style="background: #fef3c7; color: #92400e; border-left: 4px solid #f59e0b;">
                    <i data-lucide="clock"></i>
                    Your account is <b>Pending Approval</b>. You can browse the portal but grant publishing is restricted until verified.
                </div>
            `);
            const createBtn = document.getElementById('createGrantBtn');
            if (createBtn) createBtn.style.display = 'none';
        } else if (status === 'rejected') {
            document.querySelector('.dashboard-nav').insertAdjacentHTML('afterend', `
                <div class="custom-alert" style="background: #fee2e2; color: #991b1b; border-left: 4px solid #ef4444;">
                    <i data-lucide="x-circle"></i>
                    Application <b>Rejected</b>. Please contact institutional support to resolve profile discrepancies.
                </div>
            `);
            const createBtn = document.getElementById('createGrantBtn');
            if (createBtn) createBtn.style.display = 'none';
        }

        // Update Stats
        document.getElementById('totalGrants').textContent = data.total_grants;
        document.getElementById('activeGrants').textContent = data.active_grants;
        document.getElementById('inactiveGrants').textContent = data.inactive_grants;

        const grantsList = document.getElementById('grantsList');
        grantsList.innerHTML = '';

        if (data.grants && data.grants.length > 0) {
            data.grants.forEach(grant => {
                const grantEl = document.createElement('div');
                grantEl.className = 'grant-card';
                grantEl.innerHTML = `
                    <div class="grant-title">${grant.title}</div>
                    <div class="grant-meta">
                        <span style="display: flex; align-items: center; gap: 4px;">
                            <i data-lucide="building-2" style="width: 14px; height: 14px;"></i>
                            ${grant.organizer || 'Internal'}
                        </span>
                        <span style="display: flex; align-items: center; gap: 4px;">
                            <i data-lucide="activity" style="width: 14px; height: 14px;"></i>
                            ${grant.is_active ? 'Active' : 'Draft'}
                        </span>
                    </div>
                    <p class="grant-desc">${grant.description || 'No detailed publication description available.'}</p>
                    <div class="grant-footer">
                        <a class="btn ghost" href="grant_form.html?id=${grant.id}" style="font-size: 0.875rem; padding: 10px 16px;">
                            <i data-lucide="edit-3" style="width: 16px; height: 16px;"></i>
                            Edit
                        </a>
                        <button class="btn danger" onclick="deleteGrant(${grant.id})" style="font-size: 0.875rem; padding: 10px 16px;">
                            <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                            Remove
                        </button>
                    </div>
                `;
                grantsList.appendChild(grantEl);
            });
        } else {
            grantsList.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px; background: white; border-radius: var(--radius-lg); border: 2px dashed #e2e8f0;">
                    <i data-lucide="folder-plus" style="width: 48px; height: 48px; color: #cbd5e1; margin-bottom: 16px;"></i>
                    <p class="muted">No grant publications found. Start your first one today.</p>
                </div>
            `;
        }

        // Refresh icons
        if (typeof lucide !== 'undefined') lucide.createIcons();

    } catch (err) {
        console.error(err);
        // Show silent error in toast or UI instead of intrusive alert if possible
    }
}

async function deleteGrant(id) {
    if (!confirm('Are you certain you want to remove this publication? This action cannot be undone.')) return;

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
            alert('Operation failed. Please verify permissions.');
        }
    } catch (err) {
        console.error(err);
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
