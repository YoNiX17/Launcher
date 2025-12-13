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
        this.viewProfiles = document.getElementById('view-profiles');
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

        // Profile selection elements
        this.profilesList = document.getElementById('profiles-list');
        this.btnAddProfile = document.getElementById('btn-add-profile');

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
        this.profiles = [];
    }

    async init() {
        this.setupEventListeners();
        await this.loadProfiles();
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
            this.updateSliderFill();
            window.launcher.setRam(parseInt(value));
        });

        // Progress listeners
        window.launcher.onUpdateProgress((progress) => {
            this.updateProgress(progress);
        });

        window.launcher.onLaunchProgress((progress) => {
            this.updateProgress(progress);
        });

        // Add profile button
        this.btnAddProfile.addEventListener('click', () => this.showLoginView());
    }

    // ============ Profile Management ============

    async loadProfiles() {
        try {
            this.profiles = await window.launcher.getAllProfiles();

            if (this.profiles.length === 0) {
                // No profiles, show login
                this.showLoginView();
            } else {
                // Show profile selection
                this.showProfilesView();
            }
        } catch (error) {
            console.error('Error loading profiles:', error);
            this.showLoginView();
        }
    }

    showProfilesView() {
        this.viewLogin.classList.add('hidden');
        this.viewProfiles.classList.remove('hidden');
        this.viewMain.classList.add('hidden');

        this.renderProfiles();
    }

    renderProfiles() {
        if (this.profiles.length === 0) {
            this.profilesList.innerHTML = `
                <div class="profiles-empty">
                    <div class="profiles-empty-icon">👤</div>
                    <p>Aucun profil enregistré</p>
                </div>
            `;
            return;
        }

        this.profilesList.innerHTML = this.profiles.map(p => {
            const profile = p.profile;
            const isOffline = p.type === 'offline';
            const avatarContent = isOffline
                ? `<div class="profile-item-avatar" style="background: ${this.generateAvatarColor(profile.username)}">${profile.username.charAt(0).toUpperCase()}</div>`
                : `<div class="profile-item-avatar"><img src="https://crafatar.com/avatars/${profile.uuid}?size=48&overlay" alt=""></div>`;

            return `
                <div class="profile-item" data-uuid="${profile.uuid}">
                    ${avatarContent}
                    <div class="profile-item-info">
                        <span class="profile-item-name">${profile.username}</span>
                        <span class="profile-item-type">${isOffline ? 'Hors-ligne' : 'Microsoft'}</span>
                    </div>
                    <button class="profile-item-delete" data-uuid="${profile.uuid}" title="Supprimer">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            `;
        }).join('');

        // Add click handlers
        this.profilesList.querySelectorAll('.profile-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.profile-item-delete')) {
                    this.selectProfile(item.dataset.uuid);
                }
            });
        });

        // Add delete handlers
        this.profilesList.querySelectorAll('.profile-item-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteProfile(btn.dataset.uuid);
            });
        });
    }

    async selectProfile(uuid) {
        try {
            await window.launcher.selectProfile(uuid);
            const selected = this.profiles.find(p => p.profile.uuid === uuid);
            if (selected) {
                this.currentAuth = selected;
                this.showMainView();
            }
        } catch (error) {
            console.error('Error selecting profile:', error);
        }
    }

    async deleteProfile(uuid) {
        if (!confirm('Supprimer ce profil ?')) return;

        try {
            const result = await window.launcher.deleteProfile(uuid);
            this.profiles = result.profiles;

            if (this.profiles.length === 0) {
                this.showLoginView();
            } else {
                this.renderProfiles();
            }
        } catch (error) {
            console.error('Error deleting profile:', error);
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
                // Reload profiles and go to main view
                this.profiles = await window.launcher.getAllProfiles();
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
                // Reload profiles and go to main view
                this.profiles = await window.launcher.getAllProfiles();
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
        // Return to profile selection instead of login
        if (this.profiles.length > 0) {
            this.showProfilesView();
        } else {
            this.showLoginView();
        }
    }

    showLoginView() {
        this.viewLogin.classList.remove('hidden');
        this.viewProfiles.classList.add('hidden');
        this.viewMain.classList.add('hidden');
        this.hideLoginStatus();
        this.inputUsername.value = '';
        this.btnLoginOffline.disabled = true;
    }

    showMainView() {
        this.viewLogin.classList.add('hidden');
        this.viewProfiles.classList.add('hidden');
        this.viewMain.classList.remove('hidden');

        // Update profile display
        if (this.currentAuth && this.currentAuth.profile) {
            const profile = this.currentAuth.profile;
            this.profileName.textContent = profile.username;
            this.profileType.textContent = profile.type === 'microsoft' ? 'Microsoft' : 'Hors-ligne';

            // Set avatar
            if (profile.type === 'microsoft' && profile.uuid) {
                this.profileAvatarImg.src = `https://crafatar.com/avatars/${profile.uuid}?size=80&overlay`;
                this.profileAvatarImg.style.display = 'block';
            } else {
                // Generate offline avatar with initials
                this.profileAvatarImg.style.display = 'none';
                const placeholder = document.querySelector('.profile-avatar-placeholder');
                if (placeholder) {
                    placeholder.textContent = profile.username.charAt(0).toUpperCase();
                    placeholder.style.background = this.generateAvatarColor(profile.username);
                }
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
            this.updateSliderFill();
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    generateAvatarColor(username) {
        // Generate a consistent color based on username
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash) % 360;
        return `linear-gradient(135deg, hsl(${hue}, 70%, 50%) 0%, hsl(${(hue + 30) % 360}, 60%, 40%) 100%)`;
    }

    updateSliderFill() {
        const min = parseInt(this.ramSlider.min);
        const max = parseInt(this.ramSlider.max);
        const val = parseInt(this.ramSlider.value);
        const percent = ((val - min) / (max - min)) * 100;
        this.ramSlider.style.setProperty('--value', `${percent}%`);
    }
}
