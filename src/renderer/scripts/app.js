// ============================================
// YoNiX Launcher - Frontend Application
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const app = new LauncherApp();
    app.init();
});

class LauncherApp {
    constructor() {
        // Views
        this.viewLogin = document.getElementById('view-login');
        this.viewMain = document.getElementById('view-main');

        // Auth elements
        this.authToggles = document.querySelectorAll('.auth-toggle-btn');
        this.formMicrosoft = document.getElementById('form-microsoft');
        this.formOffline = document.getElementById('form-offline');
        this.inputUsername = document.getElementById('input-username');
        this.btnLoginMicrosoft = document.getElementById('btn-login-microsoft');
        this.btnLoginOffline = document.getElementById('btn-login-offline');
        this.loginStatus = document.getElementById('login-status');
        this.loginStatusText = document.getElementById('login-status-text');

        // Main view elements
        this.profileName = document.getElementById('profile-name');
        this.profileType = document.getElementById('profile-type');
        this.profileAvatarImg = document.getElementById('profile-avatar-img');
        this.btnLogout = document.getElementById('btn-logout');

        // Navigation
        this.navItems = document.querySelectorAll('.nav-item');
        this.tabContents = document.querySelectorAll('.tab-content');

        // Launch elements
        this.updateStatus = document.getElementById('update-status');
        this.updateDetails = document.getElementById('update-details');
        this.progressContainer = document.getElementById('progress-container');
        this.progressFill = document.getElementById('progress-fill');
        this.progressText = document.getElementById('progress-text');
        this.btnLaunch = document.getElementById('btn-launch');

        // Settings
        this.ramSlider = document.getElementById('ram-slider');
        this.ramValue = document.getElementById('ram-value');

        // State
        this.currentAuth = null;
        this.authMode = 'microsoft';
    }

    async init() {
        this.setupEventListeners();
        await this.checkStoredAuth();
    }

    setupEventListeners() {
        // Window controls
        document.getElementById('btn-minimize').addEventListener('click', () => {
            window.launcher.minimize();
        });
        document.getElementById('btn-maximize').addEventListener('click', () => {
            window.launcher.maximize();
        });
        document.getElementById('btn-close').addEventListener('click', () => {
            window.launcher.close();
        });

        // Auth mode toggle
        this.authToggles.forEach(btn => {
            btn.addEventListener('click', () => this.switchAuthMode(btn.dataset.mode));
        });

        // Username input for offline mode
        this.inputUsername.addEventListener('input', () => {
            const value = this.inputUsername.value.trim();
            const isValid = value.length >= 3 && value.length <= 16 && /^[a-zA-Z0-9_]+$/.test(value);
            this.btnLoginOffline.disabled = !isValid;
        });

        // Login buttons
        this.btnLoginMicrosoft.addEventListener('click', () => this.loginMicrosoft());
        this.btnLoginOffline.addEventListener('click', () => this.loginOffline());

        // Logout
        this.btnLogout.addEventListener('click', () => this.logout());

        // Navigation
        this.navItems.forEach(item => {
            item.addEventListener('click', () => this.switchTab(item.dataset.tab));
        });

        // Launch button
        this.btnLaunch.addEventListener('click', () => this.launchGame());

        // RAM slider
        this.ramSlider.addEventListener('input', () => {
            const value = this.ramSlider.value;
            this.ramValue.textContent = `${value} Go`;
            window.launcher.setRam(parseInt(value));
        });

        // Progress listeners
        window.launcher.onUpdateProgress((progress) => {
            this.updateProgress(progress);
        });

        window.launcher.onLaunchProgress((progress) => {
            this.updateProgress(progress);
        });
    }

    async checkStoredAuth() {
        try {
            const stored = await window.launcher.getStoredAuth();
            if (stored && stored.profile) {
                this.currentAuth = stored;
                this.showMainView();
            }
        } catch (error) {
            console.error('Error checking stored auth:', error);
        }
    }

    switchAuthMode(mode) {
        this.authMode = mode;

        // Update toggle buttons
        this.authToggles.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Show/hide forms
        this.formMicrosoft.classList.toggle('hidden', mode !== 'microsoft');
        this.formOffline.classList.toggle('hidden', mode !== 'offline');
    }

    showLoginStatus(message) {
        this.loginStatus.classList.remove('hidden');
        this.loginStatusText.textContent = message;
    }

    hideLoginStatus() {
        this.loginStatus.classList.add('hidden');
    }

    async loginMicrosoft() {
        this.showLoginStatus('Connexion via Microsoft...');
        this.btnLoginMicrosoft.disabled = true;

        try {
            const result = await window.launcher.loginMicrosoft();

            if (result.success) {
                this.currentAuth = { type: 'microsoft', profile: result.profile };
                this.showMainView();
            } else {
                this.showLoginStatus(`Erreur: ${result.error}`);
                setTimeout(() => this.hideLoginStatus(), 3000);
            }
        } catch (error) {
            this.showLoginStatus(`Erreur: ${error.message}`);
            setTimeout(() => this.hideLoginStatus(), 3000);
        }

        this.btnLoginMicrosoft.disabled = false;
    }

    async loginOffline() {
        const username = this.inputUsername.value.trim();

        if (!username) {
            return;
        }

        this.showLoginStatus('Connexion hors-ligne...');
        this.btnLoginOffline.disabled = true;

        try {
            const result = await window.launcher.loginOffline(username);

            if (result.success) {
                this.currentAuth = { type: 'offline', profile: result.profile };
                this.showMainView();
            } else {
                this.showLoginStatus(`Erreur: ${result.error}`);
                setTimeout(() => this.hideLoginStatus(), 3000);
            }
        } catch (error) {
            this.showLoginStatus(`Erreur: ${error.message}`);
            setTimeout(() => this.hideLoginStatus(), 3000);
        }

        this.btnLoginOffline.disabled = false;
    }

    async logout() {
        await window.launcher.logout();
        this.currentAuth = null;
        this.showLoginView();
    }

    showLoginView() {
        this.viewLogin.classList.remove('hidden');
        this.viewMain.classList.add('hidden');
        this.hideLoginStatus();
        this.inputUsername.value = '';
        this.btnLoginOffline.disabled = true;
    }

    showMainView() {
        this.viewLogin.classList.add('hidden');
        this.viewMain.classList.remove('hidden');

        // Update profile display
        if (this.currentAuth && this.currentAuth.profile) {
            const profile = this.currentAuth.profile;
            this.profileName.textContent = profile.username;
            this.profileType.textContent = profile.type === 'microsoft' ? 'Microsoft' : 'Hors-ligne';

            // Set avatar
            if (profile.type === 'microsoft' && profile.uuid) {
                this.profileAvatarImg.src = `https://crafatar.com/avatars/${profile.uuid}?size=80&overlay`;
            } else {
                this.profileAvatarImg.src = '';
            }
        }

        // Check for updates
        this.checkForUpdates();

        // Load RAM setting
        this.loadSettings();
    }

    switchTab(tab) {
        // Update nav items
        this.navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tab);
        });

        // Update tab content
        this.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tab}`);
        });
    }

    async checkForUpdates() {
        this.updateDetails.textContent = 'Connexion au serveur...';
        this.btnLaunch.disabled = true;

        try {
            const result = await window.launcher.checkUpdates();

            if (result.success) {
                if (result.updates.hasUpdates) {
                    const assetsCount = result.updates.assets.mods.length +
                        result.updates.assets.shaders.length +
                        result.updates.assets.resourcepacks.length;
                    this.updateDetails.textContent = `Mise à jour ${result.updates.latestVersion} disponible (${assetsCount} fichiers)`;
                    await this.downloadUpdates(result.updates.assets);
                } else if (result.updates.error) {
                    this.updateDetails.textContent = result.updates.error;
                } else {
                    this.updateDetails.textContent = `Tout est à jour (${result.updates.currentVersion || 'v1.0.0'})`;
                    document.querySelector('.update-icon').classList.add('done');
                }
            } else {
                this.updateDetails.textContent = result.error || 'Impossible de vérifier les mises à jour';
            }
        } catch (error) {
            console.error('Update check error:', error);
            this.updateDetails.textContent = 'Mode hors-ligne - Utilisation des fichiers locaux';
        }

        this.btnLaunch.disabled = false;
    }

    async downloadUpdates(assets) {
        this.progressContainer.classList.remove('hidden');
        this.updateDetails.textContent = 'Téléchargement des mods...';

        try {
            const result = await window.launcher.downloadUpdates(assets);

            if (result.success) {
                this.updateDetails.textContent = `Mods mis à jour vers ${assets.latestVersion}!`;
                document.querySelector('.update-icon').classList.add('done');
            } else {
                this.updateDetails.textContent = `Erreur: ${result.error}`;
            }
        } catch (error) {
            this.updateDetails.textContent = `Erreur: ${error.message}`;
        }

        this.progressContainer.classList.add('hidden');
    }

    updateProgress(progress) {
        this.progressContainer.classList.remove('hidden');
        this.progressFill.style.width = `${progress.percent}%`;
        this.progressText.textContent = `${progress.percent}% - ${progress.status}`;

        if (progress.details) {
            this.updateDetails.textContent = progress.details;
        }

        if (progress.percent >= 100) {
            setTimeout(() => {
                this.progressContainer.classList.add('hidden');
            }, 1000);
        }
    }

    async launchGame() {
        this.btnLaunch.disabled = true;
        this.btnLaunch.innerHTML = `
            <div class="spinner"></div>
            Lancement...
        `;

        try {
            const result = await window.launcher.launch();

            if (result.success) {
                // Minimize launcher after successful launch
                setTimeout(() => {
                    window.launcher.minimize();
                }, 2000);
            } else {
                alert(`Erreur: ${result.error}`);
            }
        } catch (error) {
            alert(`Erreur: ${error.message}`);
        }

        this.btnLaunch.disabled = false;
        this.btnLaunch.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            JOUER
        `;
    }

    async loadSettings() {
        try {
            const ram = await window.launcher.getRam();
            this.ramSlider.value = ram;
            this.ramValue.textContent = `${ram} Go`;
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
}
