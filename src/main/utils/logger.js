const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class Logger {
    constructor() {
        this.logDir = path.join(app.getPath('appData'), '.yonix-launcher', 'logs');
        this.logFile = null;
        this.sessionId = new Date().toISOString().replace(/[:.]/g, '-');
    }

    init() {
        try {
            // Create logs directory
            fs.mkdirSync(this.logDir, { recursive: true });

            // Create log file for this session
            this.logFile = path.join(this.logDir, `launcher-${this.sessionId}.log`);

            // Clean old logs (keep last 5)
            this.cleanOldLogs();

            // Write header
            this.write('='.repeat(60));
            this.write('PiErOW Launcher - Session Log');
            this.write(`Date: ${new Date().toLocaleString()}`);
            this.write(`App Version: ${app.getVersion()}`);
            this.write(`Platform: ${process.platform} ${process.arch}`);
            this.write(`User: ${process.env.USERNAME || 'unknown'}`);
            this.write(`AppData: ${app.getPath('appData')}`);
            this.write('='.repeat(60));
            this.write('');

            return true;
        } catch (error) {
            console.error('[Logger] Failed to initialize:', error.message);
            return false;
        }
    }

    cleanOldLogs() {
        try {
            const files = fs.readdirSync(this.logDir)
                .filter(f => f.startsWith('launcher-') && f.endsWith('.log'))
                .sort()
                .reverse();

            // Keep only last 5 logs
            if (files.length > 5) {
                files.slice(5).forEach(file => {
                    try {
                        fs.unlinkSync(path.join(this.logDir, file));
                    } catch (e) { }
                });
            }
        } catch (e) { }
    }

    write(message) {
        const timestamp = new Date().toISOString();
        const line = `[${timestamp}] ${message}\n`;

        // Console output
        console.log(message);

        // File output
        if (this.logFile) {
            try {
                fs.appendFileSync(this.logFile, line);
            } catch (e) {
                // Silently fail if can't write
            }
        }
    }

    info(category, message) {
        this.write(`[INFO] [${category}] ${message}`);
    }

    error(category, message, error = null) {
        this.write(`[ERROR] [${category}] ${message}`);
        if (error) {
            this.write(`[ERROR] [${category}] Stack: ${error.stack || error.message || error}`);
        }
    }

    warn(category, message) {
        this.write(`[WARN] [${category}] ${message}`);
    }

    debug(category, message) {
        this.write(`[DEBUG] [${category}] ${message}`);
    }

    getLogPath() {
        return this.logFile;
    }

    getLogsDir() {
        return this.logDir;
    }
}

// Singleton instance
const logger = new Logger();

module.exports = { Logger, logger };
