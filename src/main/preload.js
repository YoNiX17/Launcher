const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('launcher', {
    // Window controls
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),

    // Authentication
    loginMicrosoft: () => ipcRenderer.invoke('auth:microsoft'),
    loginOffline: (username) => ipcRenderer.invoke('auth:offline', username),
    getStoredAuth: () => ipcRenderer.invoke('auth:get-stored'),
    logout: () => ipcRenderer.invoke('auth:logout'),

    // Profile Management
    getAllProfiles: () => ipcRenderer.invoke('profiles:get-all'),
    getSelectedProfile: () => ipcRenderer.invoke('profiles:get-selected'),
    selectProfile: (uuid) => ipcRenderer.invoke('profiles:select', uuid),
    deleteProfile: (uuid) => ipcRenderer.invoke('profiles:delete', uuid),

    // Updates (mods/modpack)
    checkUpdates: () => ipcRenderer.invoke('updater:check'),
    downloadUpdates: (assets) => ipcRenderer.invoke('updater:download', assets),
    onUpdateProgress: (callback) => ipcRenderer.on('updater:progress', (_, progress) => callback(progress)),

    // Auto-Updater (launcher updates)
    checkLauncherUpdate: () => ipcRenderer.invoke('update:check'),
    installLauncherUpdate: () => ipcRenderer.invoke('update:install'),
    getLauncherVersion: () => ipcRenderer.invoke('update:get-version'),
    onLauncherUpdateAvailable: (callback) => ipcRenderer.on('update:available', (_, info) => callback(info)),
    onLauncherUpdateProgress: (callback) => ipcRenderer.on('update:progress', (_, progress) => callback(progress)),
    onLauncherUpdateDownloaded: (callback) => ipcRenderer.on('update:downloaded', (_, info) => callback(info)),

    // Minecraft
    launch: (options) => ipcRenderer.invoke('minecraft:launch', options),
    getRam: () => ipcRenderer.invoke('minecraft:get-ram'),
    setRam: (ram) => ipcRenderer.invoke('minecraft:set-ram', ram),
    onLaunchProgress: (callback) => ipcRenderer.on('minecraft:progress', (_, progress) => callback(progress)),

    // Avatar
    selectAvatarFile: () => ipcRenderer.invoke('profile:select-avatar'),

    // Skin
    selectSkinFile: () => ipcRenderer.invoke('profile:select-skin'),

    // Modpack
    syncModpack: (modpackPath) => ipcRenderer.invoke('modpack:sync', modpackPath),
    getInstalledMods: () => ipcRenderer.invoke('modpack:get-mods'),
    onModpackProgress: (callback) => ipcRenderer.on('modpack:progress', (_, progress) => callback(progress)),

    // Logs
    getLogPath: () => ipcRenderer.invoke('logs:get-path'),
    getLogsDir: () => ipcRenderer.invoke('logs:get-dir'),
    openLogsFolder: () => ipcRenderer.invoke('logs:open-folder')
});
