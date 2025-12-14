// Skin3D Viewer Integration
// Uses skin3d library for 3D Minecraft skin rendering

class SkinViewer3D {
    constructor() {
        this.viewer = null;
        this.container = null;
        this.isRotating = true;
        this.isWalking = false;
    }

    async init(containerId, skinUrl, username = 'Player') {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Skin viewer container not found:', containerId);
            return false;
        }

        try {
            // Dynamic import of skin3d
            const skin3d = await import('skin3d');

            // Clear container
            this.container.innerHTML = '';

            // Get container dimensions
            const rect = this.container.getBoundingClientRect();
            const width = rect.width || 200;
            const height = rect.height || 300;

            // Create the viewer
            this.viewer = new skin3d.View({
                canvas: this.container,
                width: width,
                height: height,
                skin: skinUrl
            });

            // Configure viewer
            this.viewer.autoRotate = this.isRotating;
            this.viewer.animation = new skin3d.WalkingAnimation();
            this.viewer.animation.paused = !this.isWalking;

            // Set name tag
            if (username) {
                this.viewer.nameTag = username;
            }

            // Set background to transparent
            this.viewer.background = 'transparent';

            // Configure controls
            this.viewer.controls.enableRotate = true;
            this.viewer.controls.enableZoom = true;

            console.log('Skin3D viewer initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize skin3d:', error);
            // Fallback to crafatar image
            this.showFallback(skinUrl, username);
            return false;
        }
    }

    showFallback(skinUrl, username) {
        // Use crafatar as fallback
        const uuid = skinUrl.includes('crafatar') ? skinUrl.split('/').pop().split('?')[0] : 'ec561538-f3fd-461d-aff5-086b22154bce';
        const renderUrl = `https://crafatar.com/renders/body/${uuid}?size=256&overlay=true`;

        this.container.innerHTML = `
            <div class="skin-render-wrapper">
                <img src="${renderUrl}" alt="Skin 3D" class="skin-render-img" id="skin-render-img">
                <div class="skin-fallback-text">Mode image (3D non disponible)</div>
            </div>
        `;
    }

    toggleRotation() {
        this.isRotating = !this.isRotating;
        if (this.viewer) {
            this.viewer.autoRotate = this.isRotating;
        }
        return this.isRotating;
    }

    toggleWalking() {
        this.isWalking = !this.isWalking;
        if (this.viewer && this.viewer.animation) {
            this.viewer.animation.paused = !this.isWalking;
        }
        return this.isWalking;
    }

    loadSkin(skinUrl) {
        if (this.viewer) {
            this.viewer.loadSkin(skinUrl);
        }
    }

    setNameTag(name) {
        if (this.viewer) {
            this.viewer.nameTag = name;
        }
    }

    resize(width, height) {
        if (this.viewer) {
            this.viewer.width = width;
            this.viewer.height = height;
        }
    }

    destroy() {
        if (this.viewer) {
            // skin3d doesn't have a destroy method, just clear container
            this.container.innerHTML = '';
            this.viewer = null;
        }
    }
}

// Global instance
window.skinViewer3D = new SkinViewer3D();
