const { app } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const got = require('got');
const AdmZip = require('adm-zip');
const Store = require('electron-store');
const { logger } = require('../utils/logger');

const store = new Store();

// Minecraft/Fabric versions
const MC_VERSION = '1.21.1';
const FABRIC_LOADER_VERSION = '0.18.0';

// URLs
const VERSION_MANIFEST_URL = 'https://launchermeta.mojang.com/mc/game/version_manifest_v2.json';
const FABRIC_META_URL = 'https://meta.fabricmc.net/v2';

class MinecraftLauncher {
    constructor() {
        this.gameDir = path.join(app.getPath('appData'), '.yonix-launcher');
        this.javaPath = null;
        this.progressCallback = null;
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
     * Launch Minecraft with Fabric
     */
    async launch(profile) {
        logger.info('Minecraft', '========== STARTING LAUNCH PROCESS ==========');
        logger.info('Minecraft', `Profile: ${JSON.stringify(profile)}`);
        logger.info('Minecraft', `Game directory: ${this.gameDir}`);
        this.emitProgress('Preparing launch...', 0);

        try {
            // Ensure game directory exists
            logger.info('Minecraft', `Creating game directory: ${this.gameDir}`);
            try {
                fs.mkdirSync(this.gameDir, { recursive: true });
                logger.info('Minecraft', 'Game directory created/verified');
            } catch (e) {
                logger.error('Minecraft', 'Failed to create game directory', e);
                throw new Error(`Cannot create game directory: ${e.message}`);
            }

            // Check/install Java
            logger.info('Minecraft', 'Checking Java installation...');
            this.emitProgress('Checking Java...', 10);
            await this.ensureJava();
            logger.info('Minecraft', `Java path: ${this.javaPath}`);

            // Verify Java exists
            if (!fs.existsSync(this.javaPath)) {
                logger.error('Minecraft', `Java not found at: ${this.javaPath}`);
                throw new Error(`Java not found at: ${this.javaPath}`);
            }
            logger.info('Minecraft', 'Java verified OK');

            // Check/install Minecraft
            logger.info('Minecraft', 'Checking Minecraft installation...');
            this.emitProgress('Checking Minecraft...', 30);
            await this.ensureMinecraft();
            logger.info('Minecraft', 'Minecraft verified OK');

            // Check/install Fabric
            logger.info('Minecraft', 'Checking Fabric installation...');
            this.emitProgress('Checking Fabric...', 50);
            await this.ensureFabric();
            logger.info('Minecraft', 'Fabric verified OK');

            // Build launch arguments
            logger.info('Minecraft', 'Building launch arguments...');
            this.emitProgress('Building launch arguments...', 70);
            const args = await this.buildLaunchArgs(profile);
            logger.info('Minecraft', `Launch command: ${this.javaPath}`);
            logger.info('Minecraft', `Arguments count: ${args.length}`);
            logger.debug('Minecraft', `Full args: ${args.join(' ')}`);

            // Launch the game
            logger.info('Minecraft', 'Spawning Minecraft process...');
            this.emitProgress('Launching Minecraft...', 90);
            await this.spawnMinecraft(args);

            logger.info('Minecraft', 'Game launched successfully!');
            logger.info('Minecraft', '========== LAUNCH COMPLETE ==========');
            this.emitProgress('Game launched!', 100);
        } catch (error) {
            logger.error('Minecraft', 'Error during launch', error);
            logger.info('Minecraft', '========== LAUNCH FAILED ==========');
            throw error;
        }
    }

    /**
     * Ensure Java 21 is available (uses bundled Java from app resources)
     */
    async ensureJava() {
        logger.info('Java', 'Looking for Java...');

        // 1. First check bundled Java in app resources (most reliable)
        const resourcesPath = process.resourcesPath || path.join(__dirname, '..', '..', '..');
        const bundledJava = path.join(resourcesPath, 'java', 'bin', 'java.exe');
        logger.info('Java', `Checking bundled Java at: ${bundledJava}`);

        if (fs.existsSync(bundledJava)) {
            logger.info('Java', 'Using bundled Java from app resources');
            this.javaPath = bundledJava;
            return;
        }

        // 2. Check local Java installation in game directory
        const runtimeDir = path.join(this.gameDir, 'runtime');
        const localJava = path.join(runtimeDir, 'java', 'bin', 'java.exe');
        logger.info('Java', `Checking local Java at: ${localJava}`);

        if (fs.existsSync(localJava)) {
            logger.info('Java', 'Using local Java from game directory');
            this.javaPath = localJava;
            return;
        }

        // 3. Check for jdk-* or jre-* folders (if rename failed in past download)
        if (fs.existsSync(runtimeDir)) {
            const jdkFolder = fs.readdirSync(runtimeDir)
                .find(f => f.startsWith('jdk-') || f.startsWith('jre-'));
            if (jdkFolder) {
                const altJava = path.join(runtimeDir, jdkFolder, 'bin', 'java.exe');
                if (fs.existsSync(altJava)) {
                    logger.info('Java', `Using Java from: ${jdkFolder}`);
                    this.javaPath = altJava;
                    return;
                }
            }
        }

        // 4. Download Java as last resort
        logger.info('Java', 'No Java found, downloading...');
        this.emitProgress('Downloading Java 21...', 15);
        await this.downloadJava();

        // After download, check again for the java path
        if (fs.existsSync(localJava)) {
            this.javaPath = localJava;
            logger.info('Java', `Java downloaded to: ${localJava}`);
        } else if (fs.existsSync(runtimeDir)) {
            const jdkFolder = fs.readdirSync(runtimeDir)
                .find(f => f.startsWith('jdk-') || f.startsWith('jre-'));
            if (jdkFolder) {
                this.javaPath = path.join(runtimeDir, jdkFolder, 'bin', 'java.exe');
                logger.info('Java', `Java downloaded to: ${this.javaPath}`);
            }
        }

        // Final check
        if (!this.javaPath || !fs.existsSync(this.javaPath)) {
            logger.error('Java', 'Java installation failed - no java.exe found');
            throw new Error('Java installation failed. Please install Java 21 manually.');
        }
    }

    async checkJavaVersion() {
        return new Promise((resolve) => {
            const java = spawn('java', ['-version']);
            let output = '';

            java.stderr.on('data', (data) => {
                output += data.toString();
            });

            java.on('close', (code) => {
                if (code === 0 && output.includes('21')) {
                    resolve({ valid: true, version: output });
                } else {
                    resolve({ valid: false });
                }
            });

            java.on('error', () => {
                resolve({ valid: false });
            });
        });
    }

    async downloadJava() {
        const runtimeDir = path.join(this.gameDir, 'runtime');
        const javaDir = path.join(runtimeDir, 'java');

        logger.info('Java', '========== DOWNLOADING JAVA ==========');
        logger.info('Java', `Runtime directory: ${runtimeDir}`);

        // Create runtime directory
        try {
            fs.mkdirSync(runtimeDir, { recursive: true });
            logger.info('Java', 'Runtime directory created');
        } catch (e) {
            logger.error('Java', 'Failed to create runtime directory', e);
            throw new Error(`Cannot create runtime directory: ${e.message}`);
        }

        // Adoptium API for Windows x64 JRE 21
        const apiUrl = 'https://api.adoptium.net/v3/assets/latest/21/hotspot?architecture=x64&image_type=jre&os=windows&vendor=eclipse';
        // Fallback direct download URL (in case API fails)
        const fallbackUrl = 'https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.5%2B11/OpenJDK21U-jre_x64_windows_hotspot_21.0.5_11.zip';
        const fallbackSize = 52000000; // ~50MB

        logger.info('Java', `Fetching Java info from: ${apiUrl}`);

        let downloadUrl;
        let expectedSize;

        try {
            const response = await got.get(apiUrl, { responseType: 'json', timeout: { request: 30000 } });
            if (!response.body || response.body.length === 0) {
                throw new Error('No Java versions found');
            }
            const asset = response.body[0];
            downloadUrl = asset.binary.package.link;
            expectedSize = asset.binary.package.size;
            logger.info('Java', `Found Java version: ${asset.version?.semver || 'unknown'}`);
            logger.info('Java', `Download URL: ${downloadUrl}`);
            logger.info('Java', `File size: ${Math.round(expectedSize / 1024 / 1024)} MB`);
        } catch (e) {
            logger.warn('Java', `API failed: ${e.message}`);
            logger.info('Java', 'Using fallback download URL...');
            downloadUrl = fallbackUrl;
            expectedSize = fallbackSize;
            logger.info('Java', `Fallback URL: ${downloadUrl}`);
        }

        const zipPath = path.join(runtimeDir, 'java.zip');

        // Download zip with progress
        logger.info('Java', `Downloading to: ${zipPath}`);
        try {
            const downloadStream = got.stream(downloadUrl, { timeout: { request: 300000 } });
            const writeStream = fs.createWriteStream(zipPath);

            let downloaded = 0;
            const totalSize = expectedSize;

            downloadStream.on('downloadProgress', (progress) => {
                downloaded = progress.transferred;
                const percent = Math.round((downloaded / totalSize) * 100);
                if (percent % 20 === 0) {
                    logger.info('Java', `Download progress: ${percent}%`);
                }
            });

            await new Promise((resolve, reject) => {
                downloadStream.pipe(writeStream);
                downloadStream.on('error', (e) => {
                    logger.error('Java', 'Download stream error', e);
                    reject(e);
                });
                writeStream.on('error', (e) => {
                    logger.error('Java', 'Write stream error', e);
                    reject(e);
                });
                writeStream.on('finish', () => {
                    logger.info('Java', 'Download complete');
                    resolve();
                });
            });
        } catch (e) {
            logger.error('Java', 'Failed to download Java', e);
            throw new Error(`Java download failed: ${e.message}`);
        }

        // Verify zip file exists and has content
        if (!fs.existsSync(zipPath)) {
            logger.error('Java', 'Zip file does not exist after download');
            throw new Error('Java zip file not found after download');
        }
        const zipStats = fs.statSync(zipPath);
        logger.info('Java', `Zip file size: ${Math.round(zipStats.size / 1024 / 1024)} MB`);
        if (zipStats.size < 1000000) {
            logger.error('Java', 'Zip file too small, download may have failed');
            throw new Error('Java zip file is too small, download may have failed');
        }

        // Extract
        logger.info('Java', 'Extracting Java...');
        try {
            const zip = new AdmZip(zipPath);
            zip.extractAllTo(runtimeDir, true);
            logger.info('Java', 'Extraction complete');
        } catch (e) {
            logger.error('Java', 'Failed to extract Java', e);
            throw new Error(`Java extraction failed: ${e.message}`);
        }

        // Find extracted folder
        const folders = fs.readdirSync(runtimeDir);
        logger.info('Java', `Folders in runtime: ${folders.join(', ')}`);

        const extracted = folders.find(f => f.startsWith('jdk-') || f.startsWith('jre-'));
        logger.info('Java', `Extracted folder: ${extracted || 'NOT FOUND'}`);

        if (extracted) {
            const extractedPath = path.join(runtimeDir, extracted);
            const javaExe = path.join(extractedPath, 'bin', 'java.exe');

            // Verify java.exe exists in extracted folder
            if (fs.existsSync(javaExe)) {
                logger.info('Java', `Java.exe found at: ${javaExe}`);
            } else {
                logger.error('Java', `Java.exe NOT found at: ${javaExe}`);
                // List bin folder contents
                const binPath = path.join(extractedPath, 'bin');
                if (fs.existsSync(binPath)) {
                    const binFiles = fs.readdirSync(binPath);
                    logger.info('Java', `Files in bin: ${binFiles.slice(0, 10).join(', ')}`);
                }
            }

            // Try to rename to java folder
            if (fs.existsSync(javaDir)) {
                try {
                    fs.rmSync(javaDir, { recursive: true, force: true });
                    logger.info('Java', 'Removed existing java folder');
                } catch (e) {
                    logger.warn('Java', `Could not remove java folder: ${e.message}`);
                }
            }

            try {
                fs.renameSync(extractedPath, javaDir);
                logger.info('Java', 'Renamed to java folder successfully');
            } catch (e) {
                logger.warn('Java', `Could not rename to java folder: ${e.message}`);
                logger.info('Java', `Will use original folder: ${extracted}`);
                this.javaExtractedName = extracted;
            }
        } else {
            logger.error('Java', 'No JDK/JRE folder found after extraction');
            throw new Error('Java extraction failed - no JDK folder found');
        }

        // Cleanup zip
        try {
            fs.unlinkSync(zipPath);
            logger.info('Java', 'Cleaned up zip file');
        } catch (e) {
            logger.warn('Java', `Could not delete zip: ${e.message}`);
        }

        logger.info('Java', '========== JAVA DOWNLOAD COMPLETE ==========');
    }

    /**
     * Ensure Minecraft client is installed
     */
    async ensureMinecraft() {
        const versionsDir = path.join(this.gameDir, 'versions', MC_VERSION);
        const jarFile = path.join(versionsDir, `${MC_VERSION}.jar`);
        const jsonFile = path.join(versionsDir, `${MC_VERSION}.json`);

        let versionData;

        if (fs.existsSync(jarFile) && fs.existsSync(jsonFile)) {
            // Load existing version data
            versionData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
        } else {
            fs.mkdirSync(versionsDir, { recursive: true });

            // Get version manifest
            this.emitProgress('Downloading Minecraft client...', 35);
            const manifest = await got.get(VERSION_MANIFEST_URL, { responseType: 'json' });
            const version = manifest.body.versions.find(v => v.id === MC_VERSION);

            if (!version) {
                throw new Error(`Minecraft version ${MC_VERSION} not found`);
            }

            // Get version details
            const response = await got.get(version.url, { responseType: 'json' });
            versionData = response.body;
            fs.writeFileSync(jsonFile, JSON.stringify(versionData, null, 2));

            // Download client jar
            const clientUrl = versionData.downloads.client.url;
            const downloadStream = got.stream(clientUrl);
            const writeStream = fs.createWriteStream(jarFile);

            await new Promise((resolve, reject) => {
                downloadStream.pipe(writeStream);
                downloadStream.on('error', reject);
                writeStream.on('finish', resolve);
            });

            // Download libraries
            this.emitProgress('Downloading libraries...', 45);
            await this.downloadLibraries(versionData.libraries);
        }

        // ALWAYS ensure assets are complete (this was the bug - assets weren't checked if jar existed)
        await this.downloadAssets(versionData.assetIndex);
    }

    async downloadLibraries(libraries) {
        const libDir = path.join(this.gameDir, 'libraries');
        fs.mkdirSync(libDir, { recursive: true });

        // Collect all libraries to download
        const toDownload = [];

        for (const lib of libraries) {
            // Check rules (OS compatibility)
            if (lib.rules && !this.checkRules(lib.rules)) {
                continue;
            }

            // Minecraft-style library (has downloads.artifact)
            if (lib.downloads?.artifact) {
                const artifact = lib.downloads.artifact;
                const libPath = path.join(libDir, artifact.path);

                if (!fs.existsSync(libPath)) {
                    toDownload.push({
                        type: 'minecraft',
                        path: artifact.path,
                        fullPath: libPath,
                        url: artifact.url
                    });
                }
            }
            // Fabric/Maven-style library (has name and url)
            else if (lib.name) {
                const libPath = this.mavenToPath(lib.name);
                const fullPath = path.join(libDir, libPath);

                if (!fs.existsSync(fullPath)) {
                    const baseUrl = lib.url || 'https://libraries.minecraft.net/';
                    toDownload.push({
                        type: 'fabric',
                        path: libPath,
                        fullPath: fullPath,
                        url: baseUrl + libPath
                    });
                }
            }
        }

        if (toDownload.length === 0) {
            logger.info('Libraries', 'All libraries already downloaded');
            return;
        }

        logger.info('Libraries', `Downloading ${toDownload.length} libraries in parallel...`);

        // Download in batches of 10
        const BATCH_SIZE = 10;
        let downloaded = 0;

        for (let i = 0; i < toDownload.length; i += BATCH_SIZE) {
            const batch = toDownload.slice(i, i + BATCH_SIZE);

            const promises = batch.map(async (lib) => {
                fs.mkdirSync(path.dirname(lib.fullPath), { recursive: true });

                try {
                    const response = await got.get(lib.url, {
                        responseType: 'buffer',
                        timeout: { request: 30000 }
                    });
                    fs.writeFileSync(lib.fullPath, response.body);
                    return true;
                } catch (error) {
                    logger.warn('Libraries', `Failed to download: ${lib.path} - ${error.message}`);
                    return false;
                }
            });

            const results = await Promise.all(promises);
            downloaded += results.filter(r => r).length;

            // Update progress
            const percent = Math.floor(35 + (downloaded / toDownload.length) * 12);
            this.emitProgress(`Downloading libraries... (${downloaded}/${toDownload.length})`, percent);
        }

        logger.info('Libraries', `Libraries complete: ${downloaded}/${toDownload.length}`);
    }

    async downloadAssets(assetIndex) {
        this.emitProgress('Downloading assets...', 48);

        const indexDir = path.join(this.gameDir, 'assets', 'indexes');
        const objectsDir = path.join(this.gameDir, 'assets', 'objects');
        fs.mkdirSync(indexDir, { recursive: true });
        fs.mkdirSync(objectsDir, { recursive: true });

        // Download asset index
        const indexPath = path.join(indexDir, `${assetIndex.id}.json`);
        let indexData;

        if (!fs.existsSync(indexPath)) {
            const response = await got.get(assetIndex.url, { responseType: 'json' });
            indexData = response.body;
            fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2));
        } else {
            indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
        }

        // Find missing assets
        const objects = indexData.objects;
        const missingAssets = [];

        for (const [name, asset] of Object.entries(objects)) {
            const hash = asset.hash;
            const prefix = hash.substring(0, 2);
            const assetPath = path.join(objectsDir, prefix, hash);

            if (!fs.existsSync(assetPath)) {
                missingAssets.push({ name, hash, prefix, assetPath });
            }
        }

        const totalMissing = missingAssets.length;
        if (totalMissing === 0) {
            console.log(`[MinecraftLauncher] All ${Object.keys(objects).length} assets already downloaded`);
            return;
        }

        console.log(`[MinecraftLauncher] Downloading ${totalMissing} missing assets (parallel)...`);

        let downloaded = 0;
        const BATCH_SIZE = 50; // Download 50 assets in parallel

        // Process in batches
        for (let i = 0; i < missingAssets.length; i += BATCH_SIZE) {
            const batch = missingAssets.slice(i, i + BATCH_SIZE);

            const promises = batch.map(async ({ name, hash, prefix, assetPath }) => {
                fs.mkdirSync(path.join(objectsDir, prefix), { recursive: true });
                const url = `https://resources.download.minecraft.net/${prefix}/${hash}`;

                try {
                    const response = await got.get(url, { responseType: 'buffer', timeout: { request: 10000 } });
                    fs.writeFileSync(assetPath, response.body);
                    return true;
                } catch (error) {
                    console.error(`[MinecraftLauncher] Failed: ${name}`, error.message);
                    return false;
                }
            });

            const results = await Promise.all(promises);
            downloaded += results.filter(r => r).length;

            // Update progress
            const percent = Math.floor(48 + (downloaded / totalMissing) * 20);
            this.emitProgress(`Downloading assets... (${downloaded}/${totalMissing})`, percent);
            console.log(`[MinecraftLauncher] Assets: ${downloaded}/${totalMissing}`);
        }

        console.log(`[MinecraftLauncher] Assets complete: ${downloaded} downloaded`);
    }

    checkRules(rules) {
        for (const rule of rules) {
            const action = rule.action === 'allow';

            if (rule.os) {
                const osMatch = rule.os.name === 'windows';
                if (action !== osMatch) return false;
            }
        }
        return true;
    }

    /**
     * Ensure Fabric loader is installed
     */
    async ensureFabric() {
        const fabricVersionId = `fabric-loader-${FABRIC_LOADER_VERSION}-${MC_VERSION}`;
        const fabricDir = path.join(this.gameDir, 'versions', fabricVersionId);
        const fabricJson = path.join(fabricDir, `${fabricVersionId}.json`);

        if (fs.existsSync(fabricJson)) {
            return;
        }

        fs.mkdirSync(fabricDir, { recursive: true });

        // Get Fabric profile
        this.emitProgress('Installing Fabric...', 55);
        const url = `${FABRIC_META_URL}/versions/loader/${MC_VERSION}/${FABRIC_LOADER_VERSION}/profile/json`;
        const fabricData = await got.get(url, { responseType: 'json' });

        fs.writeFileSync(fabricJson, JSON.stringify(fabricData.body, null, 2));

        // Download Fabric libraries
        this.emitProgress('Downloading Fabric libraries...', 60);
        await this.downloadLibraries(fabricData.body.libraries);
    }

    /**
     * Build launch arguments
     */
    async buildLaunchArgs(profile) {
        const fabricVersionId = `fabric-loader-${FABRIC_LOADER_VERSION}-${MC_VERSION}`;
        const fabricJson = path.join(this.gameDir, 'versions', fabricVersionId, `${fabricVersionId}.json`);
        const mcJson = path.join(this.gameDir, 'versions', MC_VERSION, `${MC_VERSION}.json`);

        const fabricData = JSON.parse(fs.readFileSync(fabricJson, 'utf8'));
        const mcData = JSON.parse(fs.readFileSync(mcJson, 'utf8'));

        // Build classpath
        const classpath = await this.buildClasspath(fabricData, mcData);

        // RAM settings
        const ram = store.get('settings.ram', 4);
        const maxRam = `${ram}G`;
        const minRam = `${Math.max(1, Math.floor(ram / 2))}G`;

        // Build arguments
        const args = [
            `-Xmx${maxRam}`,
            `-Xms${minRam}`,
            '-XX:+UseG1GC',
            '-XX:+ParallelRefProcEnabled',
            '-XX:MaxGCPauseMillis=200',
            '-XX:+UnlockExperimentalVMOptions',
            '-XX:+DisableExplicitGC',
            '-XX:G1NewSizePercent=30',
            '-XX:G1MaxNewSizePercent=40',
            '-XX:G1HeapRegionSize=8M',
            '-XX:G1ReservePercent=20',
            '-XX:G1HeapWastePercent=5',
            '-XX:G1MixedGCCountTarget=4',
            '-XX:InitiatingHeapOccupancyPercent=15',
            '-XX:G1MixedGCLiveThresholdPercent=90',
            '-XX:G1RSetUpdatingPauseTimePercent=5',
            '-XX:SurvivorRatio=32',
            '-XX:+PerfDisableSharedMem',
            `-Djava.library.path=${path.join(this.gameDir, 'natives')}`,
            '-cp', classpath,
            fabricData.mainClass,
            '--username', profile.username,
            '--version', fabricVersionId,
            '--gameDir', this.gameDir,
            '--assetsDir', path.join(this.gameDir, 'assets'),
            '--assetIndex', mcData.assetIndex.id,
            '--uuid', profile.uuid.replace(/-/g, ''),
            '--accessToken', profile.accessToken || '0',
            '--userType', profile.type === 'microsoft' ? 'msa' : 'legacy',
            '--versionType', 'release'
        ];

        return args;
    }

    async buildClasspath(fabricData, mcData) {
        const separator = process.platform === 'win32' ? ';' : ':';
        const libs = [];

        // Add Fabric libraries
        for (const lib of fabricData.libraries) {
            const libPath = this.mavenToPath(lib.name);
            libs.push(path.join(this.gameDir, 'libraries', libPath));
        }

        // Add Minecraft libraries
        for (const lib of mcData.libraries) {
            if (lib.rules && !this.checkRules(lib.rules)) continue;
            if (lib.downloads?.artifact) {
                libs.push(path.join(this.gameDir, 'libraries', lib.downloads.artifact.path));
            }
        }

        // Add Minecraft client
        libs.push(path.join(this.gameDir, 'versions', MC_VERSION, `${MC_VERSION}.jar`));

        return libs.join(separator);
    }

    mavenToPath(maven) {
        const parts = maven.split(':');
        const [group, artifact, version] = parts;
        const groupPath = group.replace(/\./g, '/');
        return `${groupPath}/${artifact}/${version}/${artifact}-${version}.jar`;
    }

    /**
     * Spawn Minecraft process
     */
    async spawnMinecraft(args) {
        const java = this.javaPath || 'java';

        console.log('[MinecraftLauncher] Java executable:', java);
        console.log('[MinecraftLauncher] Working directory:', this.gameDir);

        const minecraft = spawn(java, args, {
            cwd: this.gameDir,
            stdio: ['ignore', 'pipe', 'pipe']
        });

        // Log stdout
        minecraft.stdout.on('data', (data) => {
            console.log('[Minecraft]', data.toString());
        });

        // Log stderr
        minecraft.stderr.on('data', (data) => {
            console.error('[Minecraft ERROR]', data.toString());
        });

        minecraft.on('error', (error) => {
            console.error('[MinecraftLauncher] Failed to start:', error);
        });

        minecraft.on('close', (code) => {
            console.log('[MinecraftLauncher] Process exited with code:', code);
        });

        // Wait a bit to see if it crashes immediately
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
}

module.exports = { MinecraftLauncher };
