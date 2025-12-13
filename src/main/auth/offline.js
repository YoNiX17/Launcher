const crypto = require('crypto');

class OfflineAuth {
    /**
     * Generate an offline auth profile
     * @param {string} username - The username/pseudo to use
     * @returns {Object} Auth profile object
     */
    login(username) {
        if (!username || username.trim().length === 0) {
            throw new Error('Username is required for offline mode');
        }

        // Validate username (Minecraft rules: 3-16 chars, alphanumeric + underscore)
        const cleanUsername = username.trim();
        if (cleanUsername.length < 3 || cleanUsername.length > 16) {
            throw new Error('Username must be between 3 and 16 characters');
        }

        if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
            throw new Error('Username can only contain letters, numbers, and underscores');
        }

        // Generate offline UUID (Version 3 UUID based on "OfflinePlayer:" + username)
        const uuid = this.generateOfflineUUID(cleanUsername);

        return {
            uuid: uuid,
            username: cleanUsername,
            accessToken: null,
            type: 'offline'
        };
    }

    /**
     * Generate an offline UUID consistent with Minecraft's offline mode
     * This matches the algorithm used by Minecraft servers in offline mode
     * @param {string} username 
     * @returns {string} UUID string
     */
    generateOfflineUUID(username) {
        // Minecraft uses "OfflinePlayer:" + username to generate offline UUIDs
        const data = `OfflinePlayer:${username}`;
        const hash = crypto.createHash('md5').update(data).digest();

        // Set version to 3 (name-based MD5)
        hash[6] = (hash[6] & 0x0f) | 0x30;
        // Set variant to RFC 4122
        hash[8] = (hash[8] & 0x3f) | 0x80;

        // Format as UUID string
        const hex = hash.toString('hex');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
    }
}

module.exports = { OfflineAuth };
