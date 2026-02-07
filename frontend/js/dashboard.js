checkAuth();

let allGrants = [];
let currentOrg = {};

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

        if (!response.ok) throw new Error('Failed to fetch dashboard data');

        const data = await response.json();
        allGrants = data.grants || [];
        currentOrg = data.org || {};

        // Update Header Data
        document.getElementById('orgName').textContent = currentOrg.name;
        document.getElementById('orgInfo').textContent = `${currentOrg.contact_email} • ${currentOrg.country}`;

        // Update Stats
        document.getElementById('totalGrants').textContent = data.total_grants;
        document.getElementById('activeGrants').textContent = data.active_grants;
        document.getElementById('inactiveGrants').textContent = data.inactive_grants;

        renderGrants();
        renderPendingGrants();

        // Handle Status Alerts
        handleStatusAlerts(currentOrg.status);

    } catch (err) {
        console.error(err);
    }
}

function handleStatusAlerts(status) {
    const statusLower = status ? status.toLowerCase() : 'pending';
    const container = document.querySelector('.dashboard-nav');
    if (!container) return;

    // Remove old alerts
    document.querySelectorAll('.custom-alert').forEach(a => a.remove());

    if (statusLower === 'pending') {
        container.insertAdjacentHTML('afterend', `
            <div class="custom-alert" style="background: #fef3c7; color: #92400e; border-left: 4px solid #f59e0b;">
                <i data-lucide="clock"></i>
                Notice: Workspace is <b>Under Review</b>. External grant publishing is paused until verified.
            </div>
        `);
    } else if (statusLower === 'rejected') {
        container.insertAdjacentHTML('afterend', `
            <div class="custom-alert" style="background: #fee2e2; color: #991b1b; border-left: 4px solid #ef4444;">
                <i data-lucide="x-circle"></i>
                Application <b>Rejected</b>. Please contact institutional support.
            </div>
        `);
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderGrants() {
    const list = document.getElementById('grantsList');
    list.innerHTML = '';

    const activeGrants = allGrants.filter(g => g.status !== 'DELETION_PENDING');

    if (activeGrants.length === 0) {
        list.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px; background: white; border-radius: var(--radius-lg); border: 2px dashed #e2e8f0;">
                <i data-lucide="folder-plus" style="width: 48px; height: 48px; color: #cbd5e1; margin-bottom: 24px;"></i>
                <p class="muted">Your workspace is empty.</p>
                <a class="btn primary" href="grant_form.html" style="margin-top: 24px; display: inline-flex;">Create Your First Grant</a>
            </div>`;
    } else {
        activeGrants.forEach(grant => {
            const card = createGrantCard(grant, false);
            list.appendChild(card);
        });
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderPendingGrants() {
    const list = document.getElementById('pendingGrantsList');
    list.innerHTML = '';

    const pendingGrants = allGrants.filter(g => g.status === 'DELETION_PENDING');

    if (pendingGrants.length === 0) {
        list.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">No grants in trash.</div>`;
    } else {
        pendingGrants.forEach(grant => {
            const card = createGrantCard(grant, true);
            list.appendChild(card);
        });
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function createGrantCard(grant, isPending) {
    const div = document.createElement('div');
    div.className = 'grant-card';

    let footerHtml = '';
    if (isPending) {
        footerHtml = `
            <div class="grant-footer">
                <button class="btn ghost" onclick="restoreGrant(${grant.id})" style="flex: 1;">
                    <i data-lucide="rotate-ccw"></i> Restore
                </button>
                <button class="btn danger" onclick="permanentDelete(${grant.id})" style="flex: 1;">
                    <i data-lucide="trash-2"></i> Delete Forever
                </button>
            </div>
        `;
    } else {
        footerHtml = `
            <div class="grant-footer">
                <button class="btn primary ghost" onclick="viewGrantDetails(${grant.id})" style="flex: 1;">
                    <i data-lucide="eye"></i> View
                </button>
                <a class="btn ghost" href="grant_form.html?id=${grant.id}" style="flex: 1;">
                    <i data-lucide="edit-3"></i> Edit
                </a>
                <button class="btn danger ghost" onclick="softDelete(${grant.id})" title="Move to Trash">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        `;
    }

    div.innerHTML = `
        <div class="grant-title">${grant.title}</div>
        <div class="grant-meta">
            <span style="display: flex; align-items: center; gap: 4px;">
                <i data-lucide="building-2" style="width: 14px; height: 14px;"></i>
                ${grant.organizer || 'Internal'}
            </span>
        </div>
        <p class="grant-desc">${grant.description ? grant.description.substring(0, 120) + '...' : 'No description available.'}</p>
        ${footerHtml}
    `;
    return div;
}

// Tab Switching
function switchTab(tab) {
    const activeTab = document.getElementById('tab-active');
    const pendingTab = document.getElementById('tab-pending');
    const activeWork = document.getElementById('activeWorkspace');
    const pendingWork = document.getElementById('pendingDeletion');

    if (tab === 'active') {
        activeTab.classList.add('active');
        activeTab.style.borderBottomColor = 'var(--accent)';
        activeTab.style.color = 'var(--primary)';
        activeTab.style.fontWeight = '700';

        pendingTab.classList.remove('active');
        pendingTab.style.borderBottomColor = 'transparent';
        pendingTab.style.color = 'var(--text-muted)';
        pendingTab.style.fontWeight = '600';

        activeWork.style.display = 'block';
        pendingWork.style.display = 'none';
    } else {
        pendingTab.classList.add('active');
        pendingTab.style.borderBottomColor = 'var(--danger)';
        pendingTab.style.color = 'var(--primary)';
        pendingTab.style.fontWeight = '700';

        activeTab.classList.remove('active');
        activeTab.style.borderBottomColor = 'transparent';
        activeTab.style.color = 'var(--text-muted)';
        activeTab.style.fontWeight = '600';

        activeWork.style.display = 'none';
        pendingWork.style.display = 'block';
    }
}

// Grant Actions
async function softDelete(id) {
    if (!confirm('Move this grant to trash? It will be hidden from the public.')) return;
    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/org/grants/${id}/delete`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (res.ok) loadDashboard();
    } catch (err) { console.error(err); }
}

async function restoreGrant(id) {
    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/org/grants/${id}/restore`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (res.ok) loadDashboard();
    } catch (err) { console.error(err); }
}

async function permanentDelete(id) {
    if (!confirm('PERMANENT DELETE: This action cannot be undone. Are you absolutely certain?')) return;
    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/org/grants/${id}/permanent-delete`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (res.ok) loadDashboard();
    } catch (err) { console.error(err); }
}

// Modal Logic
function viewGrantDetails(id) {
    const grant = allGrants.find(g => g.id === id);
    if (!grant) return;

    document.getElementById('modalTitle').textContent = grant.title;
    document.getElementById('modalOrg').textContent = grant.organizer || currentOrg.name;
    document.getElementById('modalDesc').textContent = grant.description || 'No description provided.';
    document.getElementById('modalElig').textContent = grant.eligibility || 'No specific eligibility criteria listed.';

    document.getElementById('grantModal').style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent scroll
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeModal() {
    document.getElementById('grantModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Close modal on click outside
window.onclick = function (event) {
    const modal = document.getElementById('grantModal');
    if (event.target == modal) {
        closeModal();
    }
}

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    localStorage.removeItem('org_token');
    window.location.href = 'login.html';
});

loadDashboard();
