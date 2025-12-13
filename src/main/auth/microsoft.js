const { shell, BrowserWindow } = require('electron');
const got = require('got');
const crypto = require('crypto');

// Microsoft OAuth endpoints
const MS_AUTH_URL = 'https://login.live.com/oauth20_authorize.srf';
const MS_TOKEN_URL = 'https://login.live.com/oauth20_token.srf';

// Client ID for desktop Minecraft launchers (public, no secret needed)
const CLIENT_ID = '00000000402b5328';
const REDIRECT_URI = 'https://login.live.com/oauth20_desktop.srf';

class MicrosoftAuth {
    constructor() {
        this.authWindow = null;
    }

    /**
     * Start Microsoft OAuth login flow
     */
    async login() {
        // Step 1: Get Microsoft authorization code via browser
        const authCode = await this.getAuthCode();

        // Step 2: Exchange code for Microsoft token
        const msToken = await this.getMicrosoftToken(authCode);

        // Step 3: Authenticate with Xbox Live
        const xblToken = await this.getXboxLiveToken(msToken.access_token);

        // Step 4: Get XSTS token
        const xstsToken = await this.getXSTSToken(xblToken);

        // Step 5: Get Minecraft token
        const mcToken = await this.getMinecraftToken(xstsToken);

        // Step 6: Check game ownership
        const hasGame = await this.checkGameOwnership(mcToken.access_token);
        if (!hasGame) {
            throw new Error('Ce compte Microsoft ne possède pas Minecraft Java Edition');
        }

        // Step 7: Get Minecraft profile
        const profile = await this.getMinecraftProfile(mcToken.access_token);

        return {
            uuid: profile.id,
            username: profile.name,
            accessToken: mcToken.access_token,
            type: 'microsoft'
        };
    }

    /**
     * Open browser window for Microsoft login
     */
    getAuthCode() {
        return new Promise((resolve, reject) => {
            // Build auth URL
            const params = new URLSearchParams({
                client_id: CLIENT_ID,
                response_type: 'code',
                redirect_uri: REDIRECT_URI,
                scope: 'XboxLive.signin offline_access',
                prompt: 'select_account'
            });

            const authUrl = `${MS_AUTH_URL}?${params.toString()}`;

            // Create auth window
            this.authWindow = new BrowserWindow({
                width: 500,
                height: 650,
                show: true,
                modal: true,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true
                }
            });

            this.authWindow.loadURL(authUrl);

            // Listen for redirects
            this.authWindow.webContents.on('will-redirect', (event, url) => {
                this.handleCallback(url, resolve, reject);
            });

            this.authWindow.webContents.on('will-navigate', (event, url) => {
                this.handleCallback(url, resolve, reject);
            });

            this.authWindow.on('closed', () => {
                this.authWindow = null;
                reject(new Error('Fenêtre de connexion fermée'));
            });
        });
    }

    handleCallback(url, resolve, reject) {
        if (!url.startsWith(REDIRECT_URI)) return;

        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code');
        const error = urlObj.searchParams.get('error');

        if (this.authWindow) {
            this.authWindow.close();
            this.authWindow = null;
        }

        if (error) {
            reject(new Error(`Erreur d'authentification: ${error}`));
        } else if (code) {
            resolve(code);
        } else {
            reject(new Error('Code d\'autorisation non reçu'));
        }
    }

    async getMicrosoftToken(authCode) {
        const response = await got.post(MS_TOKEN_URL, {
            form: {
                client_id: CLIENT_ID,
                code: authCode,
                grant_type: 'authorization_code',
                redirect_uri: REDIRECT_URI
            },
            responseType: 'json'
        });

        return response.body;
    }

    async getXboxLiveToken(msAccessToken) {
        const response = await got.post('https://user.auth.xboxlive.com/user/authenticate', {
            json: {
                Properties: {
                    AuthMethod: 'RPS',
                    SiteName: 'user.auth.xboxlive.com',
                    RpsTicket: `d=${msAccessToken}`
                },
                RelyingParty: 'http://auth.xboxlive.com',
                TokenType: 'JWT'
            },
            responseType: 'json'
        });

        return {
            token: response.body.Token,
            userHash: response.body.DisplayClaims.xui[0].uhs
        };
    }

    async getXSTSToken(xblToken) {
        const response = await got.post('https://xsts.auth.xboxlive.com/xsts/authorize', {
            json: {
                Properties: {
                    SandboxId: 'RETAIL',
                    UserTokens: [xblToken.token]
                },
                RelyingParty: 'rp://api.minecraftservices.com/',
                TokenType: 'JWT'
            },
            responseType: 'json'
        });

        return {
            token: response.body.Token,
            userHash: response.body.DisplayClaims.xui[0].uhs
        };
    }

    async getMinecraftToken(xstsToken) {
        const response = await got.post('https://api.minecraftservices.com/authentication/login_with_xbox', {
            json: {
                identityToken: `XBL3.0 x=${xstsToken.userHash};${xstsToken.token}`
            },
            responseType: 'json'
        });

        return response.body;
    }

    async checkGameOwnership(mcAccessToken) {
        try {
            const response = await got.get('https://api.minecraftservices.com/entitlements/mcstore', {
                headers: {
                    Authorization: `Bearer ${mcAccessToken}`
                },
                responseType: 'json'
            });

            // Check if user owns Minecraft
            const items = response.body.items || [];
            return items.some(item =>
                item.name === 'game_minecraft' ||
                item.name === 'product_minecraft'
            );
        } catch (error) {
            // If error, assume they own it and let profile check fail
            return true;
        }
    }

    async getMinecraftProfile(mcAccessToken) {
        const response = await got.get('https://api.minecraftservices.com/minecraft/profile', {
            headers: {
                Authorization: `Bearer ${mcAccessToken}`
            },
            responseType: 'json'
        });

        if (!response.body.id) {
            throw new Error('Profil Minecraft non trouvé. Assurez-vous d\'avoir Minecraft Java Edition.');
        }

        return response.body;
    }
}

module.exports = { MicrosoftAuth };
