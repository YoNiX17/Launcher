/**
 * Script de vérification des slugs Modrinth
 * Vérifie que tous les mods dans modpack.json existent sur Modrinth
 * 
 * Usage: node scripts/verify-modrinth-slugs.js
 */

const fs = require('fs');
const path = require('path');

// Charger le modpack.json
const modpackPath = path.join(__dirname, '..', 'modpack.json');
const modpack = JSON.parse(fs.readFileSync(modpackPath, 'utf8'));

// Couleurs pour la console
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

async function checkMod(modId) {
    try {
        const response = await fetch(`https://api.modrinth.com/v2/project/${modId}`);

        if (response.ok) {
            const data = await response.json();
            return {
                valid: true,
                slug: data.slug,
                title: data.title,
                hasVersion: data.game_versions?.includes('1.21.1')
            };
        } else if (response.status === 404) {
            return { valid: false, error: 'NOT_FOUND' };
        } else {
            return { valid: false, error: `HTTP_${response.status}` };
        }
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

async function main() {
    console.log(`${colors.cyan}========================================${colors.reset}`);
    console.log(`${colors.cyan}  Vérification des slugs Modrinth${colors.reset}`);
    console.log(`${colors.cyan}========================================${colors.reset}\n`);

    const mods = modpack.mods || [];
    console.log(`📦 ${mods.length} mods à vérifier...\n`);

    const results = {
        valid: [],
        invalid: [],
        noVersion: []
    };

    // Vérifier par batch de 5 pour éviter le rate limiting
    const BATCH_SIZE = 5;
    const DELAY_MS = 200;

    for (let i = 0; i < mods.length; i += BATCH_SIZE) {
        const batch = mods.slice(i, i + BATCH_SIZE);

        const promises = batch.map(async (mod) => {
            const result = await checkMod(mod.id);
            return { mod, result };
        });

        const batchResults = await Promise.all(promises);

        for (const { mod, result } of batchResults) {
            if (result.valid) {
                if (result.hasVersion) {
                    console.log(`${colors.green}✅ ${mod.id}${colors.reset} → ${result.title}`);
                    results.valid.push(mod.id);
                } else {
                    console.log(`${colors.yellow}⚠️  ${mod.id}${colors.reset} → ${result.title} (pas de version 1.21.1)`);
                    results.noVersion.push({ id: mod.id, title: result.title });
                }
            } else {
                console.log(`${colors.red}❌ ${mod.id}${colors.reset} → ${result.error}`);
                results.invalid.push(mod.id);
            }
        }

        // Petit délai entre les batches
        if (i + BATCH_SIZE < mods.length) {
            await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        }

        // Afficher la progression
        const progress = Math.min(i + BATCH_SIZE, mods.length);
        process.stdout.write(`\r📊 Progression: ${progress}/${mods.length}`);
    }

    console.log('\n');

    // Résumé
    console.log(`${colors.cyan}========================================${colors.reset}`);
    console.log(`${colors.cyan}  RÉSUMÉ${colors.reset}`);
    console.log(`${colors.cyan}========================================${colors.reset}\n`);

    console.log(`${colors.green}✅ Valides: ${results.valid.length}${colors.reset}`);
    console.log(`${colors.yellow}⚠️  Sans version 1.21.1: ${results.noVersion.length}${colors.reset}`);
    console.log(`${colors.red}❌ Invalides: ${results.invalid.length}${colors.reset}\n`);

    if (results.invalid.length > 0) {
        console.log(`${colors.red}Mods invalides à corriger:${colors.reset}`);
        results.invalid.forEach(id => console.log(`  - ${id}`));
        console.log('');

        // Sauvegarder les résultats
        const outputPath = path.join(__dirname, '..', 'invalid-mods.json');
        fs.writeFileSync(outputPath, JSON.stringify({
            invalid: results.invalid,
            noVersion: results.noVersion,
            timestamp: new Date().toISOString()
        }, null, 2));
        console.log(`📁 Résultats sauvegardés dans: ${outputPath}`);
    }

    if (results.noVersion.length > 0) {
        console.log(`\n${colors.yellow}Mods sans version 1.21.1:${colors.reset}`);
        results.noVersion.forEach(m => console.log(`  - ${m.id} (${m.title})`));
    }

    console.log(`\n${colors.cyan}Terminé !${colors.reset}`);
}

main().catch(console.error);
