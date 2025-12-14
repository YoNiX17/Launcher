const { app } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const got = require('got');
const AdmZip = require('adm-zip');
const Store = require('electron-store');

const store = new Store();

// Minecraft/Fabric versions
const MC_VERSION = '1.21.1';
const FABRIC_LOADER_VERSION = '0.17.0';

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
        console.log('[MinecraftLauncher] Starting launch process...');
        console.log('[MinecraftLauncher] Profile:', profile);
        this.emitProgress('Preparing launch...', 0);

        try {
            // Ensure game directory exists
            console.log('[MinecraftLauncher] Creating game directory:', this.gameDir);
            fs.mkdirSync(this.gameDir, { recursive: true });

            // Check/install Java
            console.log('[MinecraftLauncher] Checking Java...');
            this.emitProgress('Checking Java...', 10);
            await this.ensureJava();
            console.log('[MinecraftLauncher] Java path:', this.javaPath);

            // Check/install Minecraft
            console.log('[MinecraftLauncher] Checking Minecraft...');
            this.emitProgress('Checking Minecraft...', 30);
            await this.ensureMinecraft();

            // Check/install Fabric
            console.log('[MinecraftLauncher] Checking Fabric...');
            this.emitProgress('Checking Fabric...', 50);
            await this.ensureFabric();

            // Build launch arguments
            console.log('[MinecraftLauncher] Building launch arguments...');
            this.emitProgress('Building launch arguments...', 70);
            const args = await this.buildLaunchArgs(profile);
            console.log('[MinecraftLauncher] Launch args:', args.join(' '));

            // Launch the game
            console.log('[MinecraftLauncher] Spawning Minecraft process...');
            this.emitProgress('Launching Minecraft...', 90);
            await this.spawnMinecraft(args);

            console.log('[MinecraftLauncher] Game launched successfully!');
            this.emitProgress('Game launched!', 100);
        } catch (error) {
            console.error('[MinecraftLauncher] Error during launch:', error);
            throw error;
        }
    }

    /**
     * Ensure Java 21 is available
     */
    async ensureJava() {
        // Check if Java is in PATH
        const javaCheck = await this.checkJavaVersion();
        if (javaCheck.valid) {
            this.javaPath = 'java';
            return;
        }

        // Check local Java installation
        const runtimeDir = path.join(this.gameDir, 'runtime');
        const localJava = path.join(runtimeDir, 'java', 'bin', 'java.exe');

        if (fs.existsSync(localJava)) {
            this.javaPath = localJava;
            return;
        }

        // Also check for jdk-* or jre-* folders (if rename failed)
        if (fs.existsSync(runtimeDir)) {
            const jdkFolder = fs.readdirSync(runtimeDir)
                .find(f => f.startsWith('jdk-') || f.startsWith('jre-'));
            if (jdkFolder) {
                const altJava = path.join(runtimeDir, jdkFolder, 'bin', 'java.exe');
                if (fs.existsSync(altJava)) {
                    this.javaPath = altJava;
                    return;
                }
            }
        }

        // Download Java (Adoptium/Temurin JRE 21)
        this.emitProgress('Downloading Java 21...', 15);
        await this.downloadJava();

        // After download, check again for the java path
        if (fs.existsSync(localJava)) {
            this.javaPath = localJava;
        } else if (fs.existsSync(runtimeDir)) {
            const jdkFolder = fs.readdirSync(runtimeDir)
                .find(f => f.startsWith('jdk-') || f.startsWith('jre-'));
            if (jdkFolder) {
                this.javaPath = path.join(runtimeDir, jdkFolder, 'bin', 'java.exe');
            }
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

        // Create runtime directory
        fs.mkdirSync(runtimeDir, { recursive: true });

        // Adoptium API for Windows x64 JRE 21
        const apiUrl = 'https://api.adoptium.net/v3/assets/latest/21/hotspot?architecture=x64&image_type=jre&os=windows&vendor=eclipse';

        const response = await got.get(apiUrl, { responseType: 'json' });
        const asset = response.body[0];
        const downloadUrl = asset.binary.package.link;

        // Download zip
        const zipPath = path.join(runtimeDir, 'java.zip');
        const downloadStream = got.stream(downloadUrl);
        const writeStream = fs.createWriteStream(zipPath);

        await new Promise((resolve, reject) => {
            downloadStream.pipe(writeStream);
            downloadStream.on('error', reject);
            writeStream.on('finish', resolve);
        });

        // Extract
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(runtimeDir, true);

        // Find extracted folder
        const extracted = fs.readdirSync(runtimeDir)
            .find(f => f.startsWith('jdk-') || f.startsWith('jre-'));

        if (extracted) {
            const extractedPath = path.join(runtimeDir, extracted);

            // Remove empty java folder if it exists (we created it earlier)
            if (fs.existsSync(javaDir)) {
                try {
                    fs.rmSync(javaDir, { recursive: true, force: true });
                } catch (e) {
                    console.log('[Java] Could not remove java folder:', e.message);
                }
            }

            // Try to rename, if fails just use the extracted folder name
            try {
                fs.renameSync(extractedPath, javaDir);
                console.log('[Java] Renamed to java folder');
            } catch (e) {
                console.log('[Java] Could not rename, using original folder:', extracted);
                // Update javaPath to use the extracted folder name instead
                this.javaExtractedName = extracted;
            }
        }

        // Cleanup zip
        try {
            fs.unlinkSync(zipPath);
        } catch (e) {
            console.log('[Java] Could not delete zip:', e.message);
        }
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
                    fs.mkdirSync(path.dirname(libPath), { recursive: true });
                    console.log('[MinecraftLauncher] Downloading library:', artifact.path);

                    try {
                        const stream = got.stream(artifact.url);
                        const writeStream = fs.createWriteStream(libPath);

                        await new Promise((resolve, reject) => {
                            stream.pipe(writeStream);
                            stream.on('error', reject);
                            writeStream.on('finish', resolve);
                        });
                    } catch (error) {
                        console.error('[MinecraftLauncher] Failed to download:', artifact.path, error.message);
                    }
                }
            }
            // Fabric/Maven-style library (has name and url)
            else if (lib.name) {
                const libPath = this.mavenToPath(lib.name);
                const fullPath = path.join(libDir, libPath);

                if (!fs.existsSync(fullPath)) {
                    fs.mkdirSync(path.dirname(fullPath), { recursive: true });

                    // Construct Maven URL
                    const baseUrl = lib.url || 'https://libraries.minecraft.net/';
                    const downloadUrl = baseUrl + libPath;

                    console.log('[MinecraftLauncher] Downloading Fabric library:', libPath);

                    try {
                        const stream = got.stream(downloadUrl);
                        const writeStream = fs.createWriteStream(fullPath);

                        await new Promise((resolve, reject) => {
                            stream.pipe(writeStream);
                            stream.on('error', reject);
                            writeStream.on('finish', resolve);
                        });
                    } catch (error) {
                        console.error('[MinecraftLauncher] Failed to download:', libPath, error.message);
                    }
                }
            }
        }
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
