const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Modules
const { MicrosoftAuth } = require('./auth/microsoft');
const { OfflineAuth } = require('./auth/offline');
const { GitHubUpdater } = require('./updater/github');
const { MinecraftLauncher } = require('./launcher/minecraft');

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

app.whenReady().then(createWindow);

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

// Authentication
ipcMain.handle('auth:microsoft', async () => {
    try {
        const auth = new MicrosoftAuth();
        const profile = await auth.login();
        store.set('auth', { type: 'microsoft', profile });
        return { success: true, profile };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('auth:offline', async (event, username) => {
    try {
        const auth = new OfflineAuth();
        const profile = auth.login(username);
        store.set('auth', { type: 'offline', profile });
        return { success: true, profile };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('auth:get-stored', () => {
    return store.get('auth', null);
});

ipcMain.handle('auth:logout', () => {
    store.delete('auth');
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
ipcMain.handle('minecraft:launch', async () => {
    try {
        const authData = store.get('auth');
        if (!authData) {
            throw new Error('Not authenticated');
        }
        
        const launcher = new MinecraftLauncher();
        
        // Progress callback
        launcher.onProgress((progress) => {
            mainWindow.webContents.send('minecraft:progress', progress);
        });
        
        await launcher.launch(authData.profile);
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
