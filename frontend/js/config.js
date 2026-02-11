const CONFIG = {
    API_BASE_URL: 'https://relivo-org-web.onrender.com'
};

const Toast = {
    container: null,
    init() {
        if (!document.getElementById('toast-container')) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('toast-container');
        }
    },
    show(message, type = 'info') {
        if (!this.container) this.init();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        // Icon mapping
        const icons = {
            success: 'check-circle',
            error: 'alert-triangle',
            info: 'info',
            warning: 'alert-circle'
        };

        toast.innerHTML = `
            <i data-lucide="${icons[type] || 'info'}" class="toast-icon"></i>
            <span style="font-weight: 500; font-size: 0.9rem;">${message}</span>
        `;

        this.container.appendChild(toast);

        // Initialize icon
        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Trigger reflow for animation
        void toast.offsetWidth;
        toast.classList.add('show');

        // Remove after 3s
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 3500);
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => Toast.init());
