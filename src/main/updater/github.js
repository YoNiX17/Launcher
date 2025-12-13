const got = require('got');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');

class GitHubUpdater {
    constructor(repo) {
        this.repo = repo;
        this.apiUrl = `https://api.github.com/repos/${repo}`;
        this.progressCallback = null;
        this.minecraftDir = this.getMinecraftDir();
    }

    getMinecraftDir() {
        // Custom .minecraft folder in user's AppData
        return path.join(app.getPath('appData'), '.yonix-launcher');
    }

    onProgress(callback) {
        this.progressCallback = callback;
    }

    emitProgress(status, percent, details = '') {
        if (this.progressCallback) {
            this.progressCallback({ status, percent, details });
        }
    }

    /**
     * Check for updates from GitHub releases
     * @returns {Object} Update information
     */
    async checkForUpdates() {
        this.emitProgress('Checking for updates...', 0);

        try {
            // Get latest release
            const response = await got.get(`${this.apiUrl}/releases/latest`, {
                headers: {
                    'User-Agent': 'YoNiX-Launcher',
                    'Accept': 'application/vnd.github.v3+json'
                },
                responseType: 'json'
            });

            const release = response.body;
            const localVersion = this.getLocalVersion();

            this.emitProgress('Checking versions...', 50);

            // Compare versions
            const needsUpdate = this.compareVersions(release.tag_name, localVersion);

            // Get assets to download
            const assets = this.categorizeAssets(release.assets);

            this.emitProgress('Check complete', 100);

            return {
                hasUpdates: needsUpdate,
                currentVersion: localVersion,
                latestVersion: release.tag_name,
                releaseNotes: release.body,
                assets: { ...assets, latestVersion: release.tag_name }
            };
        } catch (error) {
            if (error.response?.statusCode === 404) {
                return {
                    hasUpdates: false,
                    error: 'No releases found in repository'
                };
            }
            throw error;
        }
    }

    /**
     * Get locally stored version
     */
    getLocalVersion() {
        const versionFile = path.join(this.minecraftDir, 'version.json');
        try {
            if (fs.existsSync(versionFile)) {
                const data = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
                return data.version;
            }
        } catch (e) {
            // Ignore errors, return null
        }
        return null;
    }

    /**
     * Compare version strings
     */
    compareVersions(remote, local) {
        if (!local) return true;

        // Remove 'v' prefix if present
        const remoteClean = remote.replace(/^v/, '');
        const localClean = local.replace(/^v/, '');

        return remoteClean !== localClean;
    }

    /**
     * Categorize assets by type (mods, shaders, resourcepacks)
     */
    categorizeAssets(assets) {
        const categories = {
            mods: [],
            shaders: [],
            resourcepacks: [],
            config: [],
            other: []
        };

        for (const asset of assets) {
            const name = asset.name.toLowerCase();

            if (name.includes('mods') || name.endsWith('.jar')) {
                // Check if it's a mods archive or single mod
                if (name.endsWith('.zip') && name.includes('mods')) {
                    categories.mods.push({ ...asset, type: 'archive', folder: 'mods' });
                } else if (name.endsWith('.jar')) {
                    categories.mods.push({ ...asset, type: 'file', folder: 'mods' });
                }
            } else if (name.includes('shader')) {
                categories.shaders.push({ ...asset, type: name.endsWith('.zip') ? 'archive' : 'file', folder: 'shaderpacks' });
            } else if (name.includes('resource') || name.includes('texture')) {
                categories.resourcepacks.push({ ...asset, type: 'file', folder: 'resourcepacks' });
            } else if (name.includes('config')) {
                categories.config.push({ ...asset, type: 'archive', folder: 'config' });
            } else {
                categories.other.push(asset);
            }
        }

        return categories;
    }

    /**
     * Download and install all assets
     */
    async downloadAssets(assets) {
        const allAssets = [
            ...assets.mods,
            ...assets.shaders,
            ...assets.resourcepacks,
            ...assets.config
        ];

        let completed = 0;
        const total = allAssets.length;

        for (const asset of allAssets) {
            this.emitProgress(`Downloading ${asset.name}...`, Math.round((completed / total) * 100), asset.name);

            await this.downloadAsset(asset);
            completed++;
        }

        // Save version info
        const versionFile = path.join(this.minecraftDir, 'version.json');
        fs.writeFileSync(versionFile, JSON.stringify({
            version: assets.latestVersion || 'unknown',
            updatedAt: new Date().toISOString()
        }));

        this.emitProgress('Downloads complete!', 100);
    }

    /**
     * Download a single asset
     */
    async downloadAsset(asset) {
        const targetDir = path.join(this.minecraftDir, asset.folder);

        // Ensure directory exists
        fs.mkdirSync(targetDir, { recursive: true });

        const tempFile = path.join(targetDir, `${asset.name}.tmp`);
        const finalFile = path.join(targetDir, asset.name);

        // Download file
        const downloadStream = got.stream(asset.browser_download_url, {
            headers: {
                'User-Agent': 'YoNiX-Launcher'
            }
        });

        const writeStream = fs.createWriteStream(tempFile);

        await new Promise((resolve, reject) => {
            downloadStream.pipe(writeStream);
            downloadStream.on('error', reject);
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });

        // Handle archives (extract zip files)
        if (asset.type === 'archive' && asset.name.endsWith('.zip')) {
            const AdmZip = require('adm-zip');
            const zip = new AdmZip(tempFile);

            // Extract zip contents (replace existing files)
            console.log(`[GitHubUpdater] Extracting ${asset.name} to ${targetDir}`);
            zip.extractAllTo(targetDir, true);
            fs.unlinkSync(tempFile);
            console.log(`[GitHubUpdater] Extracted ${asset.name} successfully`);
        } else {
            // Move temp file to final location
            if (fs.existsSync(finalFile)) {
                fs.unlinkSync(finalFile);
            }
            fs.renameSync(tempFile, finalFile);
        }
    }
}

module.exports = { GitHubUpdater };
