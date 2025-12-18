// ============================================
// PiErOW Launcher - Frontend Application
// Red Empire Modpack - Fabric 1.21.1
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
        this.btnChangeAvatar = document.getElementById('btn-change-avatar');
        this.btnLogout = document.getElementById('btn-logout');

        // Navigation - Updated for new top bar
        this.navItems = document.querySelectorAll('.top-nav-btn');
        this.tabContents = document.querySelectorAll('.tab-content');

        // Launch elements - Console style
        this.consoleLog = document.getElementById('console-log');
        this.consoleProgress = document.getElementById('console-progress');
        this.consoleProgressFill = document.getElementById('console-progress-fill');
        this.consoleProgressText = document.getElementById('console-progress-text');
        this.downloadStats = document.getElementById('download-stats');
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

        // Offline mode toggle
        const offlineToggle = document.getElementById('offline-mode-toggle');
        const offlineUsername = document.getElementById('offline-username');

        if (offlineToggle && offlineUsername) {
            // Restore saved state
            const savedOfflineMode = localStorage.getItem('offlineMode') === 'true';
            const savedUsername = localStorage.getItem('offlineUsername') || '';
            offlineToggle.checked = savedOfflineMode;
            offlineUsername.value = savedUsername;
            offlineUsername.disabled = !savedOfflineMode;

            // Toggle handler
            offlineToggle.addEventListener('change', () => {
                const isOffline = offlineToggle.checked;
                localStorage.setItem('offlineMode', isOffline);
                offlineUsername.disabled = !isOffline;
                if (isOffline) {
                    offlineUsername.focus();
                }
            });

            // Username handler
            offlineUsername.addEventListener('input', () => {
                localStorage.setItem('offlineUsername', offlineUsername.value);
            });
        }

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

        // Launcher auto-update listeners
        window.launcher.onLauncherUpdateAvailable((info) => {
            this.addConsoleLog(`Mise à jour launcher ${info.version} disponible...`, 'downloading');
        });

        window.launcher.onLauncherUpdateProgress((progress) => {
            const percent = Math.round(progress.percent);
            this.addConsoleLog(`Téléchargement launcher: ${percent}%`, 'downloading');
        });

        window.launcher.onLauncherUpdateDownloaded((info) => {
            this.addConsoleLog(`Launcher ${info.version} prêt à installer!`, 'ready');
            this.showUpdateBanner(info.version);
        });

        // Add profile button
        this.btnAddProfile.addEventListener('click', () => this.showLoginView());

        // Change avatar button
        if (this.btnChangeAvatar) {
            this.btnChangeAvatar.addEventListener('click', () => this.changeAvatar());
        }

        // Change skin button
        const btnChangeSkin = document.getElementById('btn-change-skin');
        if (btnChangeSkin) {
            btnChangeSkin.addEventListener('click', () => this.changeSkin());
        }
    }

    // ============ Update Banner ============

    showUpdateBanner(version) {
        // Remove existing banner if any
        const existingBanner = document.getElementById('update-banner');
        if (existingBanner) existingBanner.remove();

        // Create update banner
        const banner = document.createElement('div');
        banner.id = 'update-banner';
        banner.className = 'update-banner';
        banner.innerHTML = `
            <div class="update-banner-content">
                <span class="update-banner-icon">🚀</span>
                <span class="update-banner-text">Nouvelle version ${version} prête !</span>
                <button class="update-banner-btn" id="btn-install-update">Installer maintenant</button>
                <button class="update-banner-close" id="btn-close-banner">×</button>
            </div>
        `;

        // Insert at top of main view
        const mainView = document.getElementById('view-main');
        if (mainView) {
            mainView.insertBefore(banner, mainView.firstChild);
        }

        // Add click handlers
        document.getElementById('btn-install-update').addEventListener('click', () => {
            window.launcher.installLauncherUpdate();
        });

        document.getElementById('btn-close-banner').addEventListener('click', () => {
            banner.remove();
        });
    }

    // ============ Avatar Change ============

    async changeAvatar() {
        try {
            const result = await window.launcher.selectAvatarFile();
            if (result && result.success && result.path) {
                this.profileAvatarImg.src = result.path;
                this.profileAvatarImg.style.display = 'block';
            }
        } catch (error) {
            console.error('Error changing avatar:', error);
        }
    }

    // ============ Skin Change ============

    async changeSkin() {
        try {
            const result = await window.launcher.selectSkinFile();
            if (result && result.success && result.path) {
                // Convert Windows path to file:// URL for loading
                const skinFileUrl = 'file:///' + result.path.replace(/\\/g, '/');

                // Update 3D viewer with local skin
                if (this.skinViewer) {
                    console.log('[SkinViewer] Loading local skin:', skinFileUrl);
                    const fileName = result.path.split('\\').pop().replace('.png', '');
                    this.currentSkinUrl = skinFileUrl;  // Store for skin library
                    this.skinViewer.loadSkin(skinFileUrl).then(() => {
                        this.addConsoleLog('Skin chargé: ' + fileName, 'ready');
                        // Auto-save to library
                        this.autoSaveSkin(skinFileUrl, fileName);
                    }).catch(err => {
                        console.error('Failed to load local skin:', err);
                        this.addConsoleLog('Erreur chargement skin', 'error');
                    });
                }

                // Update preview image if exists
                const skinPreviewImg = document.getElementById('skin-preview-img');
                if (skinPreviewImg) {
                    skinPreviewImg.src = skinFileUrl;
                }
            }
        } catch (error) {
            console.error('Error changing skin:', error);
        }
    }

    // ============ 3D Skin Viewer ============

    init3DSkinViewer() {
        const skinViewerContainer = document.getElementById('skin-viewer-3d');
        const skinUsername = document.getElementById('skin-username');
        const btnRotate = document.getElementById('btn-rotate-skin');
        const btnWalk = document.getElementById('btn-walk-anim');
        const btnChangeSkinViewer = document.getElementById('btn-change-skin-viewer');

        if (!skinViewerContainer) return;

        // Get profile info - handle both online and offline
        let uuid = null;
        let username = 'Player';

        if (this.currentAuth && this.currentAuth.profile) {
            uuid = this.currentAuth.profile.uuid;
            username = this.currentAuth.profile.username || this.currentAuth.profile.name || 'Player';
        }

        console.log('[SkinViewer] Profile info:', { uuid, username });

        // Update username display
        if (skinUsername) {
            skinUsername.textContent = username;
        }

        // Clear container
        skinViewerContainer.innerHTML = '';
        console.log('[SkinViewer] Container cleared, checking skinview3d...');

        // Check if skinview3d is available
        console.log('[SkinViewer] typeof skinview3d:', typeof skinview3d);
        console.log('[SkinViewer] skinview3d object:', window.skinview3d);

        if (typeof skinview3d === 'undefined') {
            console.error('[SkinViewer] skinview3d library not loaded - showing fallback');
            this.showFallbackSkin(skinViewerContainer, uuid);
            return;
        }

        try {
            // Get container dimensions and use higher resolution for crisp rendering
            const rect = skinViewerContainer.getBoundingClientRect();
            const pixelRatio = window.devicePixelRatio || 1;
            const width = Math.max(rect.width, 200);
            const height = Math.max(rect.height, 300);

            // Use higher resolution for HD rendering
            const canvasWidth = width * pixelRatio;
            const canvasHeight = height * pixelRatio;
            console.log('[SkinViewer] Container dimensions:', { width, height, pixelRatio, canvasWidth, canvasHeight });

            // Create canvas element with HD resolution
            const canvas = document.createElement('canvas');
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
            skinViewerContainer.appendChild(canvas);

            // Create skinview3d viewer with HD canvas
            console.log('[SkinViewer] Creating SkinViewer...');
            this.skinViewer = new skinview3d.SkinViewer({
                canvas: canvas,
                width: canvasWidth,
                height: canvasHeight
            });
            console.log('[SkinViewer] SkinViewer created:', this.skinViewer);

            // Load skin using username (more reliable than UUID)
            const skinUrl = username && username !== 'Player'
                ? `https://mc-heads.net/skin/${username}`
                : 'https://mc-heads.net/skin/MHF_Steve';

            console.log('[SkinViewer] Loading skin for:', username, 'URL:', skinUrl);
            this.currentSkinUrl = skinUrl;  // Store for skin library

            // Load skin with error handling
            this.skinViewer.loadSkin(skinUrl).catch(err => {
                console.warn('[SkinViewer] Failed to load skin, using default:', err);
                this.currentSkinUrl = 'https://mc-heads.net/skin/MHF_Steve';
                this.skinViewer.loadSkin(this.currentSkinUrl).catch(() => { });
            });

            // Configure viewer for premium display (like skin3d.vercel.app)
            this.skinViewer.autoRotate = true;
            this.skinViewer.autoRotateSpeed = 1.0;

            // Better camera settings for full body view
            this.skinViewer.zoom = 0.9;
            this.skinViewer.fov = 50;

            // Position camera to show full character
            if (this.skinViewer.playerObject) {
                this.skinViewer.playerObject.position.y = 0;
            }

            // Load Minecraft panorama background (equirectangular image)
            this.skinViewer.loadPanorama('assets/panoramas/stadium.jpg').then(() => {
                console.log('[SkinViewer] Panorama loaded successfully!');
            }).catch(err => {
                console.log('[SkinViewer] Panorama not loaded:', err);
                this.skinViewer.background = 0x1a1a2e;
            });

            // Configure lighting for BRIGHT appearance (no dark character!)
            if (this.skinViewer.globalLight) {
                this.skinViewer.globalLight.intensity = 3.0;  // Very bright global light
            }
            if (this.skinViewer.cameraLight) {
                this.skinViewer.cameraLight.intensity = 1.5;  // Strong camera light
            }

            // Enable controls
            this.skinViewer.controls.enableRotate = true;
            this.skinViewer.controls.enableZoom = true;
            this.skinViewer.controls.enablePan = false;

            // Set idle animation (smoother than walking for display)
            this.skinViewer.animation = new skinview3d.IdleAnimation();
            this.skinViewer.animation.speed = 1.0;

            console.log('3D Skin viewer initialized with skinview3d');

            // Button event listeners
            if (btnRotate) {
                btnRotate.addEventListener('click', () => {
                    btnRotate.classList.toggle('active');
                    if (this.skinViewer) {
                        this.skinViewer.autoRotate = !this.skinViewer.autoRotate;
                    }
                });
                // Set initial state
                btnRotate.classList.add('active');
            }

            if (btnWalk) {
                btnWalk.addEventListener('click', () => {
                    btnWalk.classList.toggle('active');
                    if (this.skinViewer) {
                        // Toggle between idle and walking
                        const isWalking = btnWalk.classList.contains('active');
                        if (isWalking) {
                            this.skinViewer.animation = new skinview3d.WalkingAnimation();
                            this.skinViewer.animation.speed = 1.0;
                        } else {
                            this.skinViewer.animation = new skinview3d.IdleAnimation();
                            this.skinViewer.animation.speed = 1.0;
                        }
                    }
                });
            }

            if (btnChangeSkinViewer) {
                btnChangeSkinViewer.addEventListener('click', () => this.changeSkin());
            }

            // Setup settings panel controls
            this.setupSkinViewerControls();

        } catch (error) {
            console.error('Failed to initialize skinview3d:', error);
            this.showFallbackSkin(skinViewerContainer, uuid);
        }
    }

    setupSkinViewerControls() {
        // Zoom slider
        const zoomSlider = document.getElementById('skin-zoom');
        const zoomValue = document.getElementById('skin-zoom-value');
        if (zoomSlider) {
            zoomSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                if (this.skinViewer) {
                    this.skinViewer.zoom = value;
                }
                if (zoomValue) zoomValue.textContent = value.toFixed(1);
            });
        }

        // FOV slider
        const fovSlider = document.getElementById('skin-fov');
        const fovValue = document.getElementById('skin-fov-value');
        if (fovSlider) {
            fovSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                if (this.skinViewer) {
                    this.skinViewer.fov = value;
                }
                if (fovValue) fovValue.textContent = value + '°';
            });
        }

        // Rotation speed slider
        const speedSlider = document.getElementById('skin-speed');
        const speedValue = document.getElementById('skin-speed-value');
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                if (this.skinViewer) {
                    this.skinViewer.autoRotateSpeed = value;
                }
                if (speedValue) speedValue.textContent = value.toFixed(1) + 'x';
            });
        }

        // Animation selector
        const animationSelect = document.getElementById('skin-animation');
        if (animationSelect) {
            animationSelect.addEventListener('change', (e) => {
                const value = e.target.value;
                if (this.skinViewer) {
                    switch (value) {
                        case 'idle':
                            this.skinViewer.animation = new skinview3d.IdleAnimation();
                            break;
                        case 'walk':
                            this.skinViewer.animation = new skinview3d.WalkingAnimation();
                            break;
                        case 'run':
                            this.skinViewer.animation = new skinview3d.RunningAnimation();
                            break;
                        case 'none':
                            this.skinViewer.animation = null;
                            break;
                    }
                    if (this.skinViewer.animation) {
                        this.skinViewer.animation.speed = parseFloat(speedSlider?.value || 1);
                    }
                }
            });
        }

        // Setup skin library
        this.setupSkinLibrary();
    }

    // ============ Skin Library ============

    setupSkinLibrary() {
        // Load saved skins from localStorage
        this.savedSkins = JSON.parse(localStorage.getItem('savedSkins') || '[]');
        this.currentSkinUrl = null;

        // Render saved skins
        this.renderSkinLibrary();

        // Save current skin button
        const btnSaveSkin = document.getElementById('btn-save-current-skin');
        if (btnSaveSkin) {
            btnSaveSkin.addEventListener('click', () => this.saveCurrentSkin());
        }
    }

    renderSkinLibrary() {
        const listContainer = document.getElementById('skin-library-list');
        if (!listContainer) return;

        if (this.savedSkins.length === 0) {
            listContainer.innerHTML = '<div class="skin-library-empty">Aucun skin sauvegardé</div>';
            return;
        }

        listContainer.innerHTML = this.savedSkins.map((skin, index) => `
            <div class="skin-library-item ${skin.url === this.currentSkinUrl ? 'active' : ''}" data-index="${index}">
                <img src="${skin.thumbnail || skin.url}" alt="${skin.name}" onerror="this.style.background='#333'">
                <button class="delete-btn" data-index="${index}" title="Supprimer">×</button>
            </div>
        `).join('');

        // Add click handlers
        listContainer.querySelectorAll('.skin-library-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-btn')) {
                    const index = parseInt(item.dataset.index);
                    this.loadSkinFromLibrary(index);
                }
            });
        });

        // Add delete handlers
        listContainer.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                this.deleteSkinFromLibrary(index);
            });
        });
    }

    async saveCurrentSkin() {
        if (!this.currentSkinUrl) {
            this.addConsoleLog('Aucun skin à sauvegarder', 'warning');
            return;
        }

        // Check if skin already exists in library
        const exists = this.savedSkins.some(s => s.url === this.currentSkinUrl);
        if (exists) {
            this.addConsoleLog('Ce skin est déjà sauvegardé', 'warning');
            return;
        }

        // Auto-generate name from date
        const name = 'Skin ' + new Date().toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).replace(',', '');

        const newSkin = {
            name: name,
            url: this.currentSkinUrl,
            thumbnail: this.currentSkinUrl,
            savedAt: Date.now()
        };

        this.savedSkins.push(newSkin);
        localStorage.setItem('savedSkins', JSON.stringify(this.savedSkins));

        this.renderSkinLibrary();
        this.addConsoleLog(`Skin sauvegardé!`, 'ready');
    }

    // Auto-save skin when loaded from file
    autoSaveSkin(skinUrl, fileName) {
        // Check if already saved
        if (this.savedSkins.some(s => s.url === skinUrl)) return;

        // Generate face thumbnail
        this.generateSkinThumbnail(skinUrl).then(thumbnail => {
            const newSkin = {
                name: fileName || 'Skin ' + (this.savedSkins.length + 1),
                url: skinUrl,
                thumbnail: thumbnail || skinUrl,
                savedAt: Date.now()
            };

            this.savedSkins.push(newSkin);
            localStorage.setItem('savedSkins', JSON.stringify(this.savedSkins));
            this.renderSkinLibrary();
        });
    }

    // Generate a face thumbnail from a Minecraft skin texture
    generateSkinThumbnail(skinUrl) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                try {
                    // Create canvas to extract face (8x8 pixels at position 8,8)
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Size of thumbnail (scaled up)
                    canvas.width = 64;
                    canvas.height = 64;

                    // Disable smoothing for pixel art
                    ctx.imageSmoothingEnabled = false;

                    // Draw face (front of head: 8x8 at position 8,8 in skin texture)
                    ctx.drawImage(img, 8, 8, 8, 8, 0, 0, 64, 64);

                    // Draw hat overlay (8x8 at position 40,8)
                    ctx.drawImage(img, 40, 8, 8, 8, 0, 0, 64, 64);

                    resolve(canvas.toDataURL('image/png'));
                } catch (e) {
                    console.warn('Could not generate thumbnail:', e);
                    resolve(null);
                }
            };
            img.onerror = () => resolve(null);
            img.src = skinUrl;
        });
    }

    loadSkinFromLibrary(index) {
        const skin = this.savedSkins[index];
        if (!skin || !this.skinViewer) return;

        this.currentSkinUrl = skin.url;
        this.skinViewer.loadSkin(skin.url).then(() => {
            this.addConsoleLog(`Skin "${skin.name}" chargé`, 'ready');
            this.renderSkinLibrary();
        }).catch(err => {
            console.error('Failed to load skin:', err);
            this.addConsoleLog('Erreur chargement skin', 'error');
        });
    }

    deleteSkinFromLibrary(index) {
        const skin = this.savedSkins[index];
        if (confirm(`Supprimer "${skin.name}" ?`)) {
            this.savedSkins.splice(index, 1);
            localStorage.setItem('savedSkins', JSON.stringify(this.savedSkins));
            this.renderSkinLibrary();
            this.addConsoleLog(`Skin supprimé`, 'ready');
        }
    }

    showFallbackSkin(container, uuid) {
        // Use visage.surgeplay.com as it's more reliable than crafatar
        const renderUrl = uuid
            ? `https://visage.surgeplay.com/full/256/${uuid}`
            : 'https://visage.surgeplay.com/full/256/ec561538-f3fd-461d-aff5-086b22154bce';

        container.innerHTML = `
            <div class="skin-render-wrapper">
                <img src="${renderUrl}" alt="Skin" class="skin-render-img" onerror="this.style.display='none'">
            </div>
        `;
    }

    updateSkinViewer() {
        this.init3DSkinViewer();
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

        // Initialize 3D skin viewer
        this.init3DSkinViewer();
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
        this.addConsoleLog('Connexion au serveur...', 'downloading');
        this.btnLaunch.disabled = true;

        try {
            const result = await window.launcher.checkUpdates();

            if (result.success) {
                if (result.updates.hasUpdates) {
                    const assetsCount = result.updates.assets.mods.length +
                        result.updates.assets.shaders.length +
                        result.updates.assets.resourcepacks.length;
                    this.addConsoleLog(`Mise à jour ${result.updates.latestVersion} disponible (${assetsCount} fichiers)`, 'downloading');
                    await this.downloadUpdates(result.updates.assets);
                } else if (result.updates.error) {
                    this.addConsoleLog(result.updates.error, 'error');
                } else {
                    this.addConsoleLog(`Tout est à jour (${result.updates.currentVersion || 'v1.0.0'})`, 'ready');
                }
            } else {
                this.addConsoleLog(result.error || 'Impossible de vérifier les mises à jour', 'error');
            }
        } catch (error) {
            console.error('Update check error:', error);
            this.addConsoleLog('Mode hors-ligne - Utilisation des fichiers locaux', 'ready');
        }

        this.btnLaunch.disabled = false;
    }

    async downloadUpdates(assets) {
        this.addConsoleLog('Téléchargement des mods...', 'downloading');

        try {
            const result = await window.launcher.downloadUpdates(assets);

            if (result.success) {
                this.addConsoleLog(`Mods mis à jour vers ${assets.latestVersion}!`, 'ready');
            } else {
                this.addConsoleLog(`Erreur: ${result.error}`, 'error');
            }
        } catch (error) {
            this.addConsoleLog(`Erreur: ${error.message}`, 'error');
        }
    }

    updateProgress(progress) {
        // Show console progress bar
        if (this.consoleProgress) {
            this.consoleProgress.classList.remove('hidden');
            this.consoleProgressFill.style.width = `${progress.percent}%`;
            this.consoleProgressText.textContent = `${progress.percent}%`;
        }

        // Update download stats
        if (this.downloadStats && progress.current && progress.total) {
            this.downloadStats.textContent = `${progress.current}/${progress.total} fichiers`;
        }

        // Add log line for current file
        if (progress.details || progress.status) {
            this.addConsoleLog(progress.details || progress.status, 'downloading');
        }

        // Hide progress when complete
        if (progress.percent >= 100) {
            this.addConsoleLog('Téléchargement terminé!', 'ready');
            setTimeout(() => {
                if (this.consoleProgress) {
                    this.consoleProgress.classList.add('hidden');
                }
            }, 1000);
        }
    }

    addConsoleLog(text, type = 'default') {
        if (!this.consoleLog) return;

        const time = new Date().toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).slice(0, 5);

        const line = document.createElement('div');
        line.className = `console-line ${type}`;
        line.innerHTML = `
            <span class="log-time">[${time}]</span>
            <span class="log-text">${text}</span>
        `;

        this.consoleLog.appendChild(line);
        this.consoleLog.scrollTop = this.consoleLog.scrollHeight;

        // Limit to 50 lines
        while (this.consoleLog.children.length > 50) {
            this.consoleLog.removeChild(this.consoleLog.firstChild);
        }
    }

    async launchGame() {
        this.btnLaunch.disabled = true;
        this.btnLaunch.innerHTML = `
            <div class="btn-play-bg"></div>
            <div class="spinner"></div>
            <span class="play-text">Lancement...</span>
        `;

        this.addConsoleLog('Démarrage du jeu...', 'downloading');

        try {
            // Check if offline mode is enabled
            const offlineModeEnabled = localStorage.getItem('offlineMode') === 'true';
            const offlineUsername = localStorage.getItem('offlineUsername') || 'Player';

            let launchOptions = {};
            if (offlineModeEnabled) {
                launchOptions = {
                    offlineMode: true,
                    offlineUsername: offlineUsername
                };
                this.addConsoleLog(`Mode hors-ligne: ${offlineUsername}`, 'ready');
            }

            const result = await window.launcher.launch(launchOptions);

            if (result.success) {
                this.addConsoleLog('Minecraft lancé avec succès!', 'ready');
                // Minimize launcher after successful launch
                setTimeout(() => {
                    window.launcher.minimize();
                }, 2000);
            } else {
                this.addConsoleLog(`Erreur: ${result.error}`, 'error');
                alert(`Erreur: ${result.error}`);
            }
        } catch (error) {
            this.addConsoleLog(`Erreur: ${error.message}`, 'error');
            alert(`Erreur: ${error.message}`);
        }

        this.btnLaunch.disabled = false;
        this.btnLaunch.innerHTML = `
            <div class="btn-play-bg"></div>
            <svg class="play-icon" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            <span class="play-text">JOUER</span>
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
