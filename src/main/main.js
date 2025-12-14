const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

// Modules
const { MicrosoftAuth } = require('./auth/microsoft');
const { OfflineAuth } = require('./auth/offline');
const { GitHubUpdater } = require('./updater/github');
const { MinecraftLauncher } = require('./launcher/minecraft');
const { ModpackManager } = require('./launcher/modpack');
const { autoUpdater } = require('electron-updater');

// Config store
const store = new Store();

// GitHub repo for mods
const GITHUB_REPO = 'YoNiX17/launcher';

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 650,
        minWidth: 800,
        minHeight: 550,
        frame: false,
        transparent: true,
        backgroundColor: '#00000000',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, '../../assets/icon.png')
    });

    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    // Dev tools in dev mode
    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }
}

app.whenReady().then(() => {
    createWindow();

    // Auto-updater setup (only in production)
    if (!process.argv.includes('--dev')) {
        // Configure auto-updater
        autoUpdater.autoDownload = true;
        autoUpdater.autoInstallOnAppQuit = true;

        // Check for updates
        autoUpdater.checkForUpdatesAndNotify();

        // Update events
        autoUpdater.on('checking-for-update', () => {
            console.log('[AutoUpdater] Checking for updates...');
        });

        autoUpdater.on('update-available', (info) => {
            console.log('[AutoUpdater] Update available:', info.version);
            if (mainWindow) {
                mainWindow.webContents.send('update:available', info);
            }
        });

        autoUpdater.on('update-not-available', () => {
            console.log('[AutoUpdater] No updates available');
        });

        autoUpdater.on('download-progress', (progress) => {
            console.log(`[AutoUpdater] Download: ${Math.round(progress.percent)}%`);
            if (mainWindow) {
                mainWindow.webContents.send('update:progress', progress);
            }
        });

        autoUpdater.on('update-downloaded', (info) => {
            console.log('[AutoUpdater] Update downloaded:', info.version);
            if (mainWindow) {
                mainWindow.webContents.send('update:downloaded', info);
            }
        });

        autoUpdater.on('error', (error) => {
            console.error('[AutoUpdater] Error:', error.message);
        });
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// ============ IPC Handlers ============

// Window controls
ipcMain.handle('window:minimize', () => mainWindow.minimize());
ipcMain.handle('window:maximize', () => {
    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow.maximize();
    }
});
ipcMain.handle('window:close', () => mainWindow.close());

// Auto-updater controls
ipcMain.handle('update:check', async () => {
    try {
        const result = await autoUpdater.checkForUpdates();
        return { success: true, updateInfo: result?.updateInfo };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('update:install', () => {
    autoUpdater.quitAndInstall(false, true);
});

ipcMain.handle('update:get-version', () => {
    return app.getVersion();
});

// Authentication - Multi-profile support
ipcMain.handle('auth:microsoft', async () => {
    try {
        const auth = new MicrosoftAuth();
        const profile = await auth.login();

        // Add to profiles list
        const profiles = store.get('profiles', []);
        const existingIndex = profiles.findIndex(p => p.profile.uuid === profile.uuid);

        const profileData = { type: 'microsoft', profile, addedAt: Date.now() };

        if (existingIndex >= 0) {
            profiles[existingIndex] = profileData;
        } else {
            profiles.push(profileData);
        }

        store.set('profiles', profiles);
        store.set('selectedProfile', profile.uuid);

        return { success: true, profile };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('auth:offline', async (event, username) => {
    try {
        const auth = new OfflineAuth();
        const profile = auth.login(username);

        // Add to profiles list
        const profiles = store.get('profiles', []);
        const existingIndex = profiles.findIndex(p => p.profile.uuid === profile.uuid);

        const profileData = { type: 'offline', profile, addedAt: Date.now() };

        if (existingIndex >= 0) {
            profiles[existingIndex] = profileData;
        } else {
            profiles.push(profileData);
        }

        store.set('profiles', profiles);
        store.set('selectedProfile', profile.uuid);

        return { success: true, profile };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Get all profiles
ipcMain.handle('profiles:get-all', () => {
    return store.get('profiles', []);
});

// Get selected profile
ipcMain.handle('profiles:get-selected', () => {
    const profiles = store.get('profiles', []);
    const selectedUuid = store.get('selectedProfile', null);

    if (!selectedUuid || profiles.length === 0) {
        return null;
    }

    return profiles.find(p => p.profile.uuid === selectedUuid) || null;
});

// Select a profile
ipcMain.handle('profiles:select', (event, uuid) => {
    store.set('selectedProfile', uuid);
    return { success: true };
});

// Delete a profile
ipcMain.handle('profiles:delete', (event, uuid) => {
    const profiles = store.get('profiles', []);
    const filtered = profiles.filter(p => p.profile.uuid !== uuid);
    store.set('profiles', filtered);

    // If deleted profile was selected, clear selection
    if (store.get('selectedProfile') === uuid) {
        store.delete('selectedProfile');
    }

    return { success: true, profiles: filtered };
});

// Legacy support - get stored auth (returns selected profile)
ipcMain.handle('auth:get-stored', () => {
    const profiles = store.get('profiles', []);
    const selectedUuid = store.get('selectedProfile', null);

    if (!selectedUuid || profiles.length === 0) {
        return null;
    }

    return profiles.find(p => p.profile.uuid === selectedUuid) || null;
});

ipcMain.handle('auth:logout', () => {
    store.delete('selectedProfile');
    return { success: true };
});

// Updates
ipcMain.handle('updater:check', async () => {
    try {
        const updater = new GitHubUpdater(GITHUB_REPO);
        const updates = await updater.checkForUpdates();
        return { success: true, updates };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('updater:download', async (event, assets) => {
    try {
        const updater = new GitHubUpdater(GITHUB_REPO);

        // Progress callback
        updater.onProgress((progress) => {
            mainWindow.webContents.send('updater:progress', progress);
        });

        await updater.downloadAssets(assets);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Minecraft launcher
ipcMain.handle('minecraft:launch', async (event, options = {}) => {
    try {
        let profile;

        // Check for offline mode
        if (options.offlineMode && options.offlineUsername) {
            // Generate offline UUID from username (same algorithm as Minecraft)
            const crypto = require('crypto');
            const offlineUuidBytes = crypto.createHash('md5').update('OfflinePlayer:' + options.offlineUsername).digest();
            // Set version 3 (name-based)
            offlineUuidBytes[6] = (offlineUuidBytes[6] & 0x0f) | 0x30;
            offlineUuidBytes[8] = (offlineUuidBytes[8] & 0x3f) | 0x80;
            const offlineUuid = offlineUuidBytes.toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');

            // Create offline profile
            profile = {
                uuid: offlineUuid,
                username: options.offlineUsername,
                accessToken: 'offline',
                isOffline: true
            };
            console.log('[Launcher] Starting in offline mode as:', options.offlineUsername, 'UUID:', offlineUuid);
        } else {
            // Online mode - get selected profile
            const profiles = store.get('profiles', []);
            const selectedUuid = store.get('selectedProfile');

            if (!profiles.length || !selectedUuid) {
                throw new Error('Non connecté - Veuillez vous connecter');
            }

            // Profiles are stored as { type, profile, addedAt }
            const profileEntry = profiles.find(p => p.profile && p.profile.uuid === selectedUuid);
            if (!profileEntry || !profileEntry.profile) {
                throw new Error('Profil non trouvé');
            }

            profile = profileEntry.profile;

            console.log('[Launcher] Launching as:', profile.username);
        }

        // Sync mods before launch
        const modpackManager = new ModpackManager();
        const modpackPath = path.join(__dirname, '../../modpack.json');

        if (require('fs').existsSync(modpackPath)) {
            modpackManager.onProgress((progress) => {
                mainWindow.webContents.send('modpack:progress', progress);
            });

            console.log('[Launcher] Syncing mods...');
            await modpackManager.syncMods(modpackPath, { removeUnknown: false });
        }

        // Copy skin for CustomSkinLoader mod (LocalSkin feature)
        const gameDir = path.join(app.getPath('appData'), '.yonix-launcher');

        // Check if user has a saved skin
        const savedSkinPath = store.get(`skins.${profile.uuid}`);
        if (savedSkinPath && fs.existsSync(savedSkinPath)) {
            // CustomSkinLoader loads local skins from: CustomSkinLoader/LocalSkin/skins/{USERNAME}.png
            const localSkinDir = path.join(gameDir, 'CustomSkinLoader', 'LocalSkin', 'skins');
            fs.mkdirSync(localSkinDir, { recursive: true });

            // Copy skin with username as filename
            const destPath = path.join(localSkinDir, `${profile.username}.png`);
            fs.copyFileSync(savedSkinPath, destPath);
            console.log('[Launcher] Copied skin for CustomSkinLoader:', destPath);
        }

        const launcher = new MinecraftLauncher();

        // Progress callback
        launcher.onProgress((progress) => {
            mainWindow.webContents.send('minecraft:progress', progress);
        });

        await launcher.launch(profile);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('minecraft:get-ram', () => {
    return store.get('settings.ram', 4);
});

ipcMain.handle('minecraft:set-ram', (event, ram) => {
    store.set('settings.ram', ram);
    return { success: true };
});

// Modpack management
ipcMain.handle('modpack:sync', async (event, modpackPath) => {
    try {
        const modpackManager = new ModpackManager();

        modpackManager.onProgress((progress) => {
            mainWindow.webContents.send('modpack:progress', progress);
        });

        const defaultPath = modpackPath || path.join(__dirname, '../../modpack.json');
        const result = await modpackManager.syncMods(defaultPath);
        return { success: true, ...result };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('modpack:get-mods', () => {
    const modpackManager = new ModpackManager();
    return modpackManager.getInstalledMods();
});

// Avatar selection
ipcMain.handle('profile:select-avatar', async () => {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Choisir une photo de profil',
        properties: ['openFile'],
        filters: [
            { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }
        ]
    });

    if (result.canceled || result.filePaths.length === 0) {
        return { success: false };
    }

    const filePath = result.filePaths[0];

    // Store custom avatar path
    const selectedUuid = store.get('selectedProfile');
    if (selectedUuid) {
        store.set(`avatars.${selectedUuid}`, filePath);
    }

    return { success: true, path: filePath };
});

// Skin selection
ipcMain.handle('profile:select-skin', async () => {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Choisir un skin Minecraft',
        properties: ['openFile'],
        filters: [
            { name: 'Skin Minecraft', extensions: ['png'] }
        ]
    });

    if (result.canceled || result.filePaths.length === 0) {
        return { success: false };
    }

    const filePath = result.filePaths[0];

    // Store custom skin path
    const selectedUuid = store.get('selectedProfile');
    if (selectedUuid) {
        store.set(`skins.${selectedUuid}`, filePath);
    }

    return { success: true, path: filePath };
});
