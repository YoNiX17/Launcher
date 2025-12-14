// Mods Showcase JavaScript
// Handles rendering, filtering, search, and modal functionality

class ModsShowcase {
    constructor() {
        this.mods = MODS_DATA;
        this.categories = CATEGORIES;
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.iconCache = new Map();

        this.init();
    }

    init() {
        this.cacheElements();
        this.renderCategories();
        this.renderMods();
        this.bindEvents();
        this.fetchModIcons();
    }

    cacheElements() {
        this.elements = {
            modsGrid: document.getElementById('mods-grid'),
            categoryList: document.getElementById('category-list'),
            searchInput: document.getElementById('search-input'),
            searchClear: document.getElementById('search-clear'),
            searchResults: document.getElementById('search-results'),
            resultsCount: document.getElementById('results-count'),
            currentCategory: document.getElementById('current-category'),
            modsCount: document.getElementById('mods-count'),
            emptyState: document.getElementById('empty-state'),
            totalMods: document.getElementById('total-mods'),
            totalCategories: document.getElementById('total-categories'),
            countAll: document.getElementById('count-all'),

            // Modal
            modalOverlay: document.getElementById('modal-overlay'),
            modalClose: document.getElementById('modal-close'),
            modalIcon: document.getElementById('modal-icon'),
            modalName: document.getElementById('modal-name'),
            modalVersion: document.getElementById('modal-version'),
            modalCategory: document.getElementById('modal-category'),
            modalDescription: document.getElementById('modal-description'),
            modalModrinth: document.getElementById('modal-modrinth'),
            modalCurseforge: document.getElementById('modal-curseforge')
        };
    }

    bindEvents() {
        // Search
        this.elements.searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase().trim();
            this.handleSearch();
        });

        this.elements.searchClear.addEventListener('click', () => {
            this.elements.searchInput.value = '';
            this.searchQuery = '';
            this.handleSearch();
        });

        // Category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectCategory(btn.dataset.category));
        });

        // Modal
        this.elements.modalClose.addEventListener('click', () => this.closeModal());
        this.elements.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.elements.modalOverlay) this.closeModal();
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
            if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
                e.preventDefault();
                this.elements.searchInput.focus();
            }
        });
    }

    renderCategories() {
        const categoryCounts = this.getCategoryCounts();

        let html = '';
        for (const [key, category] of Object.entries(this.categories)) {
            const count = categoryCounts[key] || 0;
            html += `
                <button class="category-btn" data-category="${key}">
                    <span class="category-icon">${category.icon}</span>
                    <span class="category-name">${category.name}</span>
                    <span class="category-count">${count}</span>
                </button>
            `;
        }

        this.elements.categoryList.innerHTML = html;

        // Update total count
        this.elements.countAll.textContent = this.mods.length;
        this.elements.totalMods.textContent = this.mods.length;
        this.elements.totalCategories.textContent = Object.keys(this.categories).length;

        // Bind events to new buttons
        this.elements.categoryList.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectCategory(btn.dataset.category));
        });
    }

    getCategoryCounts() {
        const counts = {};
        this.mods.forEach(mod => {
            counts[mod.category] = (counts[mod.category] || 0) + 1;
        });
        return counts;
    }

    selectCategory(category) {
        this.currentCategory = category;

        // Update active state
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });

        // Update header
        if (category === 'all') {
            this.elements.currentCategory.textContent = 'Tous les mods';
        } else {
            this.elements.currentCategory.textContent = this.categories[category]?.name || category;
        }

        this.renderMods();
    }

    getFilteredMods() {
        return this.mods.filter(mod => {
            // Category filter
            const categoryMatch = this.currentCategory === 'all' || mod.category === this.currentCategory;

            // Search filter
            const searchMatch = !this.searchQuery ||
                mod.name.toLowerCase().includes(this.searchQuery) ||
                mod.description.toLowerCase().includes(this.searchQuery) ||
                mod.id.toLowerCase().includes(this.searchQuery);

            return categoryMatch && searchMatch;
        });
    }

    renderMods() {
        const filteredMods = this.getFilteredMods();

        // Update count
        this.elements.modsCount.textContent = `${filteredMods.length} mod${filteredMods.length !== 1 ? 's' : ''}`;

        // Show/hide empty state
        if (filteredMods.length === 0) {
            this.elements.modsGrid.innerHTML = '';
            this.elements.emptyState.classList.remove('hidden');
            return;
        }

        this.elements.emptyState.classList.add('hidden');

        // Render mod cards
        this.elements.modsGrid.innerHTML = filteredMods.map((mod, index) => this.renderModCard(mod, index)).join('');

        // Bind click events
        this.elements.modsGrid.querySelectorAll('.mod-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.mod-link')) {
                    this.openModal(card.dataset.modId);
                }
            });
        });

        // Apply cached icons
        this.applyCachedIcons();
    }

    renderModCard(mod, index) {
        const category = this.categories[mod.category] || { icon: '📦', name: mod.category };
        const iconContent = this.iconCache.has(mod.id)
            ? `<img src="${this.iconCache.get(mod.id)}" alt="${mod.name}" loading="lazy">`
            : category.icon;

        return `
            <div class="mod-card" data-category="${mod.category}" data-mod-id="${mod.id}" style="--card-index: ${index}">
                <div class="mod-card-header">
                    <div class="mod-icon ${!this.iconCache.has(mod.id) ? 'loading' : ''}" data-mod-id="${mod.id}">
                        ${iconContent}
                    </div>
                    <div class="mod-info">
                        <h3 class="mod-name">${mod.name}</h3>
                        <span class="mod-version">v${mod.version}</span>
                    </div>
                </div>
                <p class="mod-description">${mod.description}</p>
                <div class="mod-footer">
                    <span class="mod-category-tag">
                        <span class="tag-icon">${category.icon}</span>
                        ${category.name}
                    </span>
                    <div class="mod-links">
                        ${mod.modrinth && mod.modrinth !== 'default' ? `
                            <a href="https://modrinth.com/mod/${mod.modrinth}" class="mod-link" target="_blank" title="Modrinth" onclick="event.stopPropagation()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12.252.004a11.78 11.768 0 0 0-8.92 4.628 11.78 11.768 0 0 0-1.667 10.09 12 12 0 0 0 2.166 4.058l-.003.002.041.046c.065.065.13.13.198.193.016.016.032.033.05.049.011.01.023.023.035.032.106.104.213.206.321.306.01.011.022.02.033.031.022.02.044.041.067.062l.012.011a11.19 11.182 0 0 0 .671.548c.016.013.033.025.05.037.203.152.41.298.622.438l.007.004.002.002a11.3 11.293 0 0 0 .744.463l.075.04c.217.118.437.228.662.333.09.042.18.082.272.12.111.048.224.093.338.137.118.046.236.09.356.13.183.065.37.124.559.177.018.004.036.01.054.014.104.03.209.057.314.083l.262.06.069.015c.09.018.18.037.272.053a12 12 0 0 0 1.133.147l.07.005c.055.004.11.008.166.01a11.698 11.691 0 0 0 .8.027h.082c.194 0 .387-.006.58-.018a11.8 11.8 0 0 0 9.521-6.63 11.79 11.79 0 0 0-3.368-14.12 11.82 11.82 0 0 0-5.33-2.405 11.7 11.7 0 0 0-1.795-.146l-.124-.001Z"/>
                                </svg>
                            </a>
                        ` : ''}
                        ${mod.curseforge && mod.curseforge !== 'default' ? `
                            <a href="https://www.curseforge.com/minecraft/mc-mods/${mod.curseforge}" class="mod-link" target="_blank" title="CurseForge" onclick="event.stopPropagation()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.326 9.2h3.39l.003-.003h.302a1.2 1.2 0 0 1 1.2 1.2v.001a1.2 1.2 0 0 1-1.2 1.2h-.302l-.003-.003H18.75l-.001.003h-6.227l3.089 3.089a1.2 1.2 0 0 1 0 1.697v.001a1.2 1.2 0 0 1-1.697 0l-5.137-5.137-.001.001-.849-.849.001-.001-.213-.213.849-.849 5.35-5.35a1.2 1.2 0 0 1 1.697 0h.001a1.2 1.2 0 0 1 0 1.697L12.522 8.78l5.803-.001.001.421Z"/>
                                </svg>
                            </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    handleSearch() {
        const hasQuery = this.searchQuery.length > 0;
        this.elements.searchClear.classList.toggle('hidden', !hasQuery);

        if (hasQuery) {
            const count = this.getFilteredMods().length;
            this.elements.resultsCount.textContent = `${count} résultat${count !== 1 ? 's' : ''}`;
            this.elements.searchResults.classList.remove('hidden');
        } else {
            this.elements.searchResults.classList.add('hidden');
        }

        this.renderMods();
    }

    openModal(modId) {
        const mod = this.mods.find(m => m.id === modId);
        if (!mod) return;

        const category = this.categories[mod.category] || { icon: '📦', name: mod.category };

        // Set icon
        if (this.iconCache.has(mod.id)) {
            this.elements.modalIcon.src = this.iconCache.get(mod.id);
            this.elements.modalIcon.style.display = 'block';
        } else {
            this.elements.modalIcon.style.display = 'none';
        }

        // Set content
        this.elements.modalName.textContent = mod.name;
        this.elements.modalVersion.textContent = `v${mod.version}`;
        this.elements.modalCategory.textContent = `${category.icon} ${category.name}`;
        this.elements.modalDescription.textContent = mod.description;

        // Set links
        if (mod.modrinth && mod.modrinth !== 'default') {
            this.elements.modalModrinth.href = `https://modrinth.com/mod/${mod.modrinth}`;
            this.elements.modalModrinth.classList.remove('hidden');
        } else {
            this.elements.modalModrinth.classList.add('hidden');
        }

        if (mod.curseforge && mod.curseforge !== 'default') {
            this.elements.modalCurseforge.href = `https://www.curseforge.com/minecraft/mc-mods/${mod.curseforge}`;
            this.elements.modalCurseforge.classList.remove('hidden');
        } else {
            this.elements.modalCurseforge.classList.add('hidden');
        }

        // Show modal
        this.elements.modalOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.elements.modalOverlay.classList.add('hidden');
        document.body.style.overflow = '';
    }

    async fetchModIcons() {
        // Fetch icons from Modrinth API in batches
        const modsWithModrinth = this.mods.filter(mod => mod.modrinth && mod.modrinth !== 'default');
        const batchSize = 10;

        for (let i = 0; i < modsWithModrinth.length; i += batchSize) {
            const batch = modsWithModrinth.slice(i, i + batchSize);
            await Promise.all(batch.map(mod => this.fetchModIcon(mod)));
            // Small delay between batches to avoid rate limiting
            if (i + batchSize < modsWithModrinth.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
    }

    async fetchModIcon(mod) {
        try {
            const response = await fetch(`https://api.modrinth.com/v2/project/${mod.modrinth}`, {
                headers: {
                    'User-Agent': 'YoNiX-Launcher/1.0.0 (https://github.com/yonix)'
                }
            });

            if (!response.ok) return;

            const data = await response.json();
            if (data.icon_url) {
                this.iconCache.set(mod.id, data.icon_url);
                this.updateModIcon(mod.id, data.icon_url);
            }
        } catch (error) {
            // Silently fail - we'll use the fallback emoji
            console.debug(`Failed to fetch icon for ${mod.name}:`, error.message);
        }
    }

    updateModIcon(modId, iconUrl) {
        const iconElements = document.querySelectorAll(`.mod-icon[data-mod-id="${modId}"]`);
        iconElements.forEach(el => {
            el.innerHTML = `<img src="${iconUrl}" alt="" loading="lazy">`;
            el.classList.remove('loading');
        });
    }

    applyCachedIcons() {
        this.iconCache.forEach((iconUrl, modId) => {
            this.updateModIcon(modId, iconUrl);
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ModsShowcase();
});
