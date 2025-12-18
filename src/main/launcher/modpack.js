const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const https = require('https');
const got = require('got');

const MODRINTH_API = 'https://api.modrinth.com/v2';
const USER_AGENT = 'YonixLauncher/1.0.0 (contact@yonix.fr)';

// Shared HTTPS agent with keep-alive for faster downloads
const downloadAgent = new https.Agent({
    keepAlive: true,
    keepAliveMsecs: 30000,
    maxSockets: 50,
    maxFreeSockets: 25,
    timeout: 60000
});

// Pre-configured got instance with optimizations
const downloadClient = got.extend({
    agent: { https: downloadAgent },
    headers: { 'User-Agent': USER_AGENT },
    timeout: { request: 30000 },
    retry: { limit: 2, methods: ['GET'] }
});

class ModpackManager {
    constructor() {
        this.gameDir = path.join(app.getPath('appData'), '.yonix-launcher');
        this.modsDir = path.join(this.gameDir, 'mods');
        this.shaderpacksDir = path.join(this.gameDir, 'shaderpacks');
        this.cacheFile = path.join(this.gameDir, 'modpack-cache.json');
        this.progressCallback = null;
    }

    onProgress(callback) {
        this.progressCallback = callback;
    }

    emitProgress(status, percent, details = '') {
        if (this.progressCallback) {
            this.progressCallback({ status, percent, details });
        }
        console.log(`[ModpackManager] ${status} ${details}`);
    }

    /**
     * Load modpack manifest from file or URL
     */
    async loadModpack(source) {
        let modpack;

        if (source.startsWith('http')) {
            // Load from URL
            const response = await got.get(source, { responseType: 'json' });
            modpack = response.body;
        } else {
            // Load from local file
            const content = fs.readFileSync(source, 'utf8');
            modpack = JSON.parse(content);
        }

        return modpack;
    }

    /**
     * Get mod info from Modrinth API
     * @param {string} projectId - Modrinth project slug or ID
     * @param {string} gameVersion - Minecraft version
     * @param {string} loader - Mod loader (fabric, forge, etc.)
     * @param {string|null} pinnedVersion - Optional specific version number to fetch
     */
    async getModrinthMod(projectId, gameVersion, loader, pinnedVersion = null) {
        try {
            // Get project versions
            const url = `${MODRINTH_API}/project/${projectId}/version`;
            const params = new URLSearchParams({
                loaders: JSON.stringify([loader]),
                game_versions: JSON.stringify([gameVersion])
            });

            const response = await got.get(`${url}?${params}`, {
                headers: { 'User-Agent': USER_AGENT },
                responseType: 'json'
            });

            const versions = response.body;
            if (!versions || versions.length === 0) {
                console.warn(`[ModpackManager] No compatible version found for ${projectId}`);
                return null;
            }

            // Find the right version
            let targetVersion;
            if (pinnedVersion) {
                // Look for specific version
                targetVersion = versions.find(v =>
                    v.version_number === pinnedVersion ||
                    v.version_number.includes(pinnedVersion)
                );
                if (!targetVersion) {
                    console.warn(`[ModpackManager] Pinned version ${pinnedVersion} not found for ${projectId}, using latest`);
                    targetVersion = versions[0];
                } else {
                    console.log(`[ModpackManager] Using pinned version ${pinnedVersion} for ${projectId}`);
                }
            } else {
                // Get the latest compatible version
                targetVersion = versions[0];
            }

            const primaryFile = targetVersion.files.find(f => f.primary) || targetVersion.files[0];

            return {
                projectId,
                versionId: targetVersion.id,
                versionNumber: targetVersion.version_number,
                fileName: primaryFile.filename,
                url: primaryFile.url,
                sha512: primaryFile.hashes.sha512,
                size: primaryFile.size
            };
        } catch (error) {
            console.error(`[ModpackManager] Failed to get mod info for ${projectId}:`, error.message);
            return null;
        }
    }

    /**
     * Get shader info from Modrinth API
     * @param {string} projectId - Modrinth project slug or ID
     * @param {string} gameVersion - Minecraft version
     */
    async getModrinthShader(projectId, gameVersion) {
        try {
            // Get versions for shader
            const versionsUrl = `${MODRINTH_API}/project/${projectId}/version?game_versions=["${gameVersion}"]`;
            const versionsResponse = await got.get(versionsUrl, {
                responseType: 'json',
                headers: { 'User-Agent': USER_AGENT }
            });

            const versions = versionsResponse.body;

            if (versions.length === 0) {
                // Try without version filter
                const allVersionsUrl = `${MODRINTH_API}/project/${projectId}/version`;
                const allVersionsResponse = await got.get(allVersionsUrl, {
                    responseType: 'json',
                    headers: { 'User-Agent': USER_AGENT }
                });

                if (allVersionsResponse.body.length === 0) {
                    console.warn(`[ModpackManager] No version found for shader ${projectId}`);
                    return null;
                }

                // Get latest version
                const latestVersion = allVersionsResponse.body[0];
                const primaryFile = latestVersion.files.find(f => f.primary) || latestVersion.files[0];

                return {
                    projectId,
                    versionId: latestVersion.id,
                    versionNumber: latestVersion.version_number,
                    fileName: primaryFile.filename,
                    url: primaryFile.url,
                    sha512: primaryFile.hashes.sha512,
                    size: primaryFile.size
                };
            }

            const latestVersion = versions[0];
            const primaryFile = latestVersion.files.find(f => f.primary) || latestVersion.files[0];

            return {
                projectId,
                versionId: latestVersion.id,
                versionNumber: latestVersion.version_number,
                fileName: primaryFile.filename,
                url: primaryFile.url,
                sha512: primaryFile.hashes.sha512,
                size: primaryFile.size
            };
        } catch (error) {
            console.error(`[ModpackManager] Failed to get shader info for ${projectId}:`, error.message);
            return null;
        }
    }

    /**
     * Calculate SHA-512 hash of a file
     */
    calculateHash(filePath) {
        const content = fs.readFileSync(filePath);
        return crypto.createHash('sha512').update(content).digest('hex');
    }

    /**
     * Load cached mod info
     */
    loadCache() {
        try {
            if (fs.existsSync(this.cacheFile)) {
                return JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
            }
        } catch (error) {
            console.error('[ModpackManager] Failed to load cache:', error.message);
        }
        return { mods: {}, lastUpdated: null };
    }

    /**
     * Save mod info to cache
     */
    saveCache(cache) {
        cache.lastUpdated = new Date().toISOString();
        fs.writeFileSync(this.cacheFile, JSON.stringify(cache, null, 2));
    }

    /**
     * Sync mods - download missing/outdated, remove extras
     */
    async syncMods(modpackPath, options = {}) {
        this.emitProgress('Loading modpack...', 0);

        // Ensure mods directory exists
        fs.mkdirSync(this.modsDir, { recursive: true });

        // Load modpack
        const modpack = await this.loadModpack(modpackPath);
        const gameVersion = modpack.minecraft;
        const loader = modpack.loader;

        console.log(`[ModpackManager] Syncing modpack: ${modpack.name} v${modpack.version}`);
        console.log(`[ModpackManager] Minecraft: ${gameVersion}, Loader: ${loader}`);

        // Load cache
        const cache = this.loadCache();

        // Get current mods in directory
        const currentMods = fs.readdirSync(this.modsDir)
            .filter(f => f.endsWith('.jar'))
            .map(f => ({
                fileName: f,
                path: path.join(this.modsDir, f)
            }));

        // Resolve all mods from Modrinth
        this.emitProgress('Resolving mods from Modrinth...', 5);
        const modsToDownload = [];
        const validModFiles = new Set();

        for (let i = 0; i < modpack.mods.length; i++) {
            const mod = modpack.mods[i];
            const percent = 5 + Math.floor((i / modpack.mods.length) * 20);

            if (i % 5 === 0) {
                this.emitProgress(`Checking mods... (${i}/${modpack.mods.length})`, percent);
            }

            let modInfo;
            const cacheKey = mod.version ? `${mod.id}@${mod.version}` : mod.id;

            // Check cache first (must match version if pinned)
            if (cache.mods[cacheKey] && cache.mods[cacheKey].gameVersion === gameVersion) {
                modInfo = cache.mods[cacheKey];
            } else {
                // Fetch from Modrinth (pass pinned version if specified)
                modInfo = await this.getModrinthMod(mod.id, gameVersion, loader, mod.version || null);
                if (modInfo) {
                    modInfo.gameVersion = gameVersion;
                    cache.mods[cacheKey] = modInfo;
                }
            }

            if (!modInfo) {
                console.warn(`[ModpackManager] Skipping ${mod.id} - not found on Modrinth`);
                continue;
            }

            validModFiles.add(modInfo.fileName);

            // Check if mod exists and hash matches
            const modPath = path.join(this.modsDir, modInfo.fileName);
            if (fs.existsSync(modPath)) {
                const localHash = this.calculateHash(modPath);
                if (localHash === modInfo.sha512) {
                    // Mod is up to date
                    continue;
                }
                console.log(`[ModpackManager] ${mod.id} hash mismatch, will re-download`);
            }

            modsToDownload.push(modInfo);
        }

        // Save cache
        this.saveCache(cache);

        // Remove old/unknown mods (optional)
        if (options.removeUnknown !== false) {
            for (const mod of currentMods) {
                if (!validModFiles.has(mod.fileName)) {
                    console.log(`[ModpackManager] Removing unknown mod: ${mod.fileName}`);
                    try {
                        fs.unlinkSync(mod.path);
                    } catch (error) {
                        console.error(`[ModpackManager] Failed to remove ${mod.fileName}:`, error.message);
                    }
                }
            }
        }

        // Download missing/outdated mods
        if (modsToDownload.length === 0) {
            this.emitProgress('All mods are up to date!', 90);

            // Still need to sync shaders even if mods are up to date
            await this.syncShaders(modpack, gameVersion);

            this.emitProgress('All synced!', 100);
            return { downloaded: 0, total: modpack.mods.length };
        }

        this.emitProgress(`Downloading ${modsToDownload.length} mods...`, 30);
        let downloaded = 0;

        // Download in batches of 20 (increased from 5 for better speed)
        const BATCH_SIZE = 20;
        for (let i = 0; i < modsToDownload.length; i += BATCH_SIZE) {
            const batch = modsToDownload.slice(i, i + BATCH_SIZE);

            const promises = batch.map(async (modInfo) => {
                const modPath = path.join(this.modsDir, modInfo.fileName);

                try {
                    const response = await downloadClient.get(modInfo.url, {
                        responseType: 'buffer'
                    });

                    fs.writeFileSync(modPath, response.body);
                    console.log(`[ModpackManager] Downloaded: ${modInfo.fileName}`);
                    return true;
                } catch (error) {
                    console.error(`[ModpackManager] Failed to download ${modInfo.fileName}:`, error.message);
                    return false;
                }
            });

            const results = await Promise.all(promises);
            downloaded += results.filter(r => r).length;

            const percent = 30 + Math.floor((downloaded / modsToDownload.length) * 70);
            this.emitProgress(`Downloading mods... (${downloaded}/${modsToDownload.length})`, percent);
        }

        // Sync shaders
        await this.syncShaders(modpack, gameVersion);

        this.emitProgress('All synced!', 100);
        return { downloaded, total: modpack.mods.length };
    }

    /**
     * Sync shaders from modpack
     */
    async syncShaders(modpack, gameVersion) {
        if (!modpack.shaders || modpack.shaders.length === 0) {
            console.log('[ModpackManager] No shaders defined in modpack');
            return;
        }

        console.log(`[ModpackManager] Syncing ${modpack.shaders.length} shader(s)...`);
        this.emitProgress('Checking shaders...', 95);

        // Create shaderpacks directory
        fs.mkdirSync(this.shaderpacksDir, { recursive: true });

        for (const shader of modpack.shaders) {
            if (shader.source !== 'modrinth') continue;

            const shaderInfo = await this.getModrinthShader(shader.id, gameVersion);
            if (!shaderInfo) {
                console.warn(`[ModpackManager] Skipping shader ${shader.id} - not found`);
                continue;
            }

            const shaderPath = path.join(this.shaderpacksDir, shaderInfo.fileName);

            // Remove old versions of the same shader (different version number)
            const existingFiles = fs.existsSync(this.shaderpacksDir) ? fs.readdirSync(this.shaderpacksDir) : [];
            for (const file of existingFiles) {
                // If file starts with similar name but different version, remove it
                const baseNamePattern = shaderInfo.fileName.split('_v')[0];
                if (file.startsWith(baseNamePattern) && file !== shaderInfo.fileName) {
                    console.log(`[ModpackManager] Removing old shader version: ${file}`);
                    try {
                        fs.unlinkSync(path.join(this.shaderpacksDir, file));
                    } catch (e) {
                        console.warn(`[ModpackManager] Could not remove ${file}: ${e.message}`);
                    }
                }
            }

            // Check if already installed
            if (fs.existsSync(shaderPath)) {
                console.log(`[ModpackManager] Shader already installed: ${shaderInfo.fileName}`);
                continue;
            }

            // Download shader
            try {
                this.emitProgress(`Downloading shader: ${shaderInfo.fileName}`, 97);
                const response = await got.get(shaderInfo.url, {
                    responseType: 'buffer',
                    headers: { 'User-Agent': USER_AGENT }
                });

                fs.writeFileSync(shaderPath, response.body);
                console.log(`[ModpackManager] Downloaded shader: ${shaderInfo.fileName}`);
            } catch (error) {
                console.error(`[ModpackManager] Failed to download shader ${shaderInfo.fileName}:`, error.message);
            }
        }
    }

    /**
     * Get list of installed mods
     */
    getInstalledMods() {
        if (!fs.existsSync(this.modsDir)) {
            return [];
        }

        return fs.readdirSync(this.modsDir)
            .filter(f => f.endsWith('.jar'))
            .map(f => ({
                fileName: f,
                path: path.join(this.modsDir, f),
                size: fs.statSync(path.join(this.modsDir, f)).size
            }));
    }
}

module.exports = { ModpackManager };
