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

    // Updates
    checkUpdates: () => ipcRenderer.invoke('updater:check'),
    downloadUpdates: (assets) => ipcRenderer.invoke('updater:download', assets),
    onUpdateProgress: (callback) => ipcRenderer.on('updater:progress', (_, progress) => callback(progress)),

    // Minecraft
    launch: () => ipcRenderer.invoke('minecraft:launch'),
    getRam: () => ipcRenderer.invoke('minecraft:get-ram'),
    setRam: (ram) => ipcRenderer.invoke('minecraft:set-ram', ram),
    onLaunchProgress: (callback) => ipcRenderer.on('minecraft:progress', (_, progress) => callback(progress))
});
