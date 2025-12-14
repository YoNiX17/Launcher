// Mods Database for YoNiX Modpack - Fabric 1.21.1
// This file contains all 93 mods with metadata, categories, and links
// IMPORTANT: modrinth field uses SLUGS (not project IDs) for both links and API calls

const MODS_DATA = [
    // ===== 🚀 PERFORMANCE =====
    {
        id: "sodium",
        name: "Sodium",
        version: "0.6.9",
        category: "performance",
        description: "Optimisation massive du rendu graphique. Remplace OptiFine avec de meilleures performances.",
        modrinth: "sodium",
        curseforge: "sodium"
    },
    {
        id: "lithium",
        name: "Lithium",
        version: "0.15.1",
        category: "performance",
        description: "Optimise la physique du jeu, l'IA des mobs et les systèmes internes sans changer le gameplay.",
        modrinth: "lithium",
        curseforge: "lithium"
    },
    {
        id: "iris",
        name: "Iris Shaders",
        version: "1.8.8",
        category: "performance",
        description: "Support des shaders compatible avec Sodium. Utilise vos packs de shaders préférés.",
        modrinth: "iris",
        curseforge: "irisshaders"
    },
    {
        id: "distant-horizons",
        name: "Distant Horizons",
        version: "2.3.6-b",
        category: "performance",
        description: "LOD de qualité pour voir des terrains très éloignés avec des performances optimales.",
        modrinth: "distanthorizons",
        curseforge: "distant-horizons"
    },

    // ===== 🌍 WORLD GENERATION =====
    {
        id: "terralith",
        name: "Terralith",
        version: "2.5.8",
        category: "worldgen",
        description: "Ajoute plus de 95 nouveaux biomes terrestres magnifiques avec des terrains uniques.",
        modrinth: "terralith",
        curseforge: "terralith"
    },
    {
        id: "tectonic",
        name: "Tectonic",
        version: "3.0.18",
        category: "worldgen",
        description: "Montagnes dramatiques, falaises spectaculaires et terrains épiques.",
        modrinth: "tectonic",
        curseforge: "tectonic"
    },
    {
        id: "nullscape",
        name: "Nullscape",
        version: "1.2.14",
        category: "worldgen",
        description: "Refonte complète de l'End avec de nouveaux biomes et terrains.",
        modrinth: "nullscape",
        curseforge: "nullscape"
    },
    {
        id: "amplified-nether",
        name: "Amplified Nether",
        version: "1.2.11",
        category: "worldgen",
        description: "Génération du Nether amplifiée avec des terrains plus grands et impressionnants.",
        modrinth: "amplified-nether",
        curseforge: "amplified-nether"
    },
    {
        id: "better-end",
        name: "Better End",
        version: "21.0.11",
        category: "worldgen",
        description: "Refonte majeure de l'End avec 20+ biomes, nouvelles créatures et ressources.",
        modrinth: "betterend",
        curseforge: "betterend"
    },
    {
        id: "better-nether",
        name: "Better Nether",
        version: "21.0.11",
        category: "worldgen",
        description: "Améliore le Nether avec de nouveaux biomes, plantes, matériaux et mobs.",
        modrinth: "betternether",
        curseforge: "betternether"
    },
    {
        id: "natures-spirit",
        name: "Nature's Spirit",
        version: "2.2.5",
        category: "worldgen",
        description: "Ajoute de nouveaux biomes naturels avec des arbres et plantes uniques.",
        modrinth: "natures-spirit",
        curseforge: "natures-spirit"
    },
    {
        id: "terrablender",
        name: "TerraBlender",
        version: "4.1.0.8",
        category: "worldgen",
        description: "API permettant aux mods d'ajouter leurs biomes à la génération du monde.",
        modrinth: "terrablender",
        curseforge: "terrablender-fabric"
    },
    {
        id: "bclib",
        name: "BCLib",
        version: "21.0.13",
        category: "library",
        description: "Bibliothèque commune pour Better End, Better Nether et autres mods.",
        modrinth: "bclib",
        curseforge: "bclib"
    },

    // ===== 🏰 STRUCTURES =====
    {
        id: "dungeons-arise",
        name: "When Dungeons Arise",
        version: "2.1.68",
        category: "structures",
        description: "Structures massives et magnifiques: châteaux, villages abandonnés, tours mystiques.",
        modrinth: "when-dungeons-arise",
        curseforge: "when-dungeons-arise-fabric"
    },
    {
        id: "dungeons-arise-seas",
        name: "Dungeons Arise - Seven Seas",
        version: "1.0.4",
        category: "structures",
        description: "Extension de Dungeons Arise avec des structures océaniques.",
        modrinth: "when-dungeons-arise-seven-seas",
        curseforge: "when-dungeons-arise-seven-seas"
    },
    {
        id: "ctov",
        name: "ChoiceTheorem's Overhauled Village",
        version: "3.6.0b",
        category: "structures",
        description: "Villages magnifiquement redessinés adaptés à chaque biome.",
        modrinth: "ct-overhaul-village",
        curseforge: "choicetheorems-overhauled-village"
    },
    {
        id: "structory",
        name: "Structory",
        version: "1.3.12",
        category: "structures",
        description: "Petites structures atmosphériques: campements, ruines, points d'intérêt.",
        modrinth: "structory",
        curseforge: "structory"
    },
    {
        id: "structory-towers",
        name: "Structory: Towers",
        version: "1.0.14",
        category: "structures",
        description: "Extensions de Structory avec des tours variées.",
        modrinth: "structory-towers",
        curseforge: "structory-towers"
    },
    {
        id: "dungeons-taverns",
        name: "Dungeons and Taverns",
        version: "4.4.4",
        category: "structures",
        description: "Donjons et tavernes à découvrir dans le monde.",
        modrinth: "dungeons-and-taverns",
        curseforge: "dungeons-and-taverns-structure-overhaul"
    },
    {
        id: "tidal-towns",
        name: "Tidal Towns",
        version: "1.3.4",
        category: "structures",
        description: "Villages côtiers et structures marines uniques.",
        modrinth: "tidal-towns",
        curseforge: "tidal-towns"
    },
    {
        id: "moogs-structures",
        name: "Moog's End Structures",
        version: "1.1.0",
        category: "structures",
        description: "Collection de structures pour l'End.",
        modrinth: "moogs-end-structures",
        curseforge: "moogs-end-structures"
    },
    {
        id: "moogs-soaring",
        name: "Moog's Soaring Structures",
        version: "2.0.0",
        category: "structures",
        description: "Structures flottantes et aériennes majestueuses.",
        modrinth: "moogs-soaring-structures",
        curseforge: "moogs-soaring-structures"
    },
    {
        id: "moogs-voyager",
        name: "Moog's Voyager Structures",
        version: "5.0.3",
        category: "structures",
        description: "Structures d'exploration et de voyage.",
        modrinth: "moogs-voyager-structures",
        curseforge: "moogs-voyager-structures"
    },
    {
        id: "philips-ruins",
        name: "Philip's Ruins",
        version: "1.9",
        category: "structures",
        description: "Ruines atmosphériques dispersées dans le monde.",
        modrinth: "philips-ruins",
        curseforge: "philips-ruins"
    },
    {
        id: "ati-structures",
        name: "ATi Structures",
        version: "1.4.2",
        category: "structures",
        description: "Pack de structures default pour exploration.",
        modrinth: "default",
        curseforge: "default"
    },

    // ===== YUNG'S MODS =====
    {
        id: "yungs-api",
        name: "YUNG's API",
        version: "5.1.6",
        category: "library",
        description: "API requise pour tous les mods YUNG.",
        modrinth: "yungs-api",
        curseforge: "yungs-api"
    },
    {
        id: "yungs-better-dungeons",
        name: "YUNG's Better Dungeons",
        version: "5.1.4",
        category: "structures",
        description: "Donjons souterrains redessinés avec variations et loot.",
        modrinth: "yungs-better-dungeons",
        curseforge: "yungs-better-dungeons"
    },
    {
        id: "yungs-better-mineshafts",
        name: "YUNG's Better Mineshafts",
        version: "5.1.1",
        category: "structures",
        description: "Mines abandonnées variées avec branchements complexes.",
        modrinth: "yungs-better-mineshafts",
        curseforge: "yungs-better-mineshafts-fabric"
    },
    {
        id: "yungs-better-strongholds",
        name: "YUNG's Better Strongholds",
        version: "5.1.3",
        category: "structures",
        description: "Les forteresses de l'End sont maintenant des donjons épiques.",
        modrinth: "yungs-better-strongholds",
        curseforge: "yungs-better-strongholds-fabric"
    },
    {
        id: "yungs-better-ocean-monuments",
        name: "YUNG's Better Ocean Monuments",
        version: "4.1.2",
        category: "structures",
        description: "Monuments océaniques redessinés avec plus de variété.",
        modrinth: "yungs-better-ocean-monuments",
        curseforge: "yungs-better-ocean-monuments"
    },
    {
        id: "yungs-better-nether-fortresses",
        name: "YUNG's Better Nether Fortresses",
        version: "3.1.5",
        category: "structures",
        description: "Forteresses du Nether massives et complexes.",
        modrinth: "yungs-better-nether-fortresses",
        curseforge: "yungs-better-nether-fortresses"
    },
    {
        id: "yungs-better-desert-temples",
        name: "YUNG's Better Desert Temples",
        version: "4.1.5",
        category: "structures",
        description: "Temples du désert avec des pièges et salles cachées.",
        modrinth: "yungs-better-desert-temples",
        curseforge: "yungs-better-desert-temples"
    },
    {
        id: "yungs-better-jungle-temples",
        name: "YUNG's Better Jungle Temples",
        version: "3.1.2",
        category: "structures",
        description: "Temples de la jungle plus grands avec puzzles.",
        modrinth: "yungs-better-jungle-temples",
        curseforge: "yungs-better-jungle-temples"
    },
    {
        id: "yungs-better-witch-huts",
        name: "YUNG's Better Witch Huts",
        version: "4.1.1",
        category: "structures",
        description: "Huttes de sorcières plus élaborées et mystérieuses.",
        modrinth: "yungs-better-witch-huts",
        curseforge: "yungs-better-witch-huts"
    },
    {
        id: "yungs-better-end-island",
        name: "YUNG's Better End Island",
        version: "3.1.2",
        category: "structures",
        description: "L'île centrale de l'End redessinée.",
        modrinth: "yungs-better-end-island",
        curseforge: "yungs-better-end-island"
    },
    {
        id: "yungs-bridges",
        name: "YUNG's Bridges",
        version: "5.1.1",
        category: "structures",
        description: "Ponts naturels générés à travers le monde.",
        modrinth: "yungs-bridges",
        curseforge: "yungs-bridges"
    },
    {
        id: "yungs-extras",
        name: "YUNG's Extras",
        version: "5.1.1",
        category: "structures",
        description: "Petites structures supplémentaires: puits, tours, etc.",
        modrinth: "yungs-extras",
        curseforge: "yungs-extras"
    },

    // ===== ⚔️ COMBAT & ITEMS =====
    {
        id: "simply-swords",
        name: "Simply Swords",
        version: "1.62.0",
        category: "combat",
        description: "Armes uniques avec des effets spéciaux et des styles variés.",
        modrinth: "simply-swords",
        curseforge: "simply-swords"
    },
    {
        id: "advanced-netherite",
        name: "Advanced Netherite",
        version: "2.3.1",
        category: "combat",
        description: "Armures et outils en Netherite améliorés avec des variantes.",
        modrinth: "advanced-netherite",
        curseforge: "advanced-netherite-fabric"
    },
    {
        id: "immersive-armors",
        name: "Immersive Armors",
        version: "1.7.5",
        category: "combat",
        description: "Nouvelles armures craftables avec des designs uniques.",
        modrinth: "immersive-armors",
        curseforge: "immersive-armors"
    },
    {
        id: "trinkets",
        name: "Trinkets",
        version: "3.10.0",
        category: "combat",
        description: "Système d'équipement d'accessoires (anneaux, amulettes, etc.).",
        modrinth: "trinkets",
        curseforge: "trinkets"
    },

    // ===== 🍳 FOOD & FARMING =====
    {
        id: "farmers-delight",
        name: "Farmer's Delight",
        version: "3.2.2",
        category: "food",
        description: "Extension agricole majeure avec nouvelles cultures et recettes.",
        modrinth: "farmers-delight-fabric",
        curseforge: "farmers-delight-fabric"
    },
    {
        id: "chefs-delight",
        name: "Chef's Delight",
        version: "1.0.5",
        category: "food",
        description: "Add-on pour Farmer's Delight avec plus de plats gastronomiques.",
        modrinth: "chefs-delight",
        curseforge: "chefs-delight"
    },
    {
        id: "harvest-with-ease",
        name: "Harvest With Ease",
        version: "9.4.0",
        category: "food",
        description: "Récoltez d'un clic droit sans détruire les cultures.",
        modrinth: "harvest-with-ease",
        curseforge: "harvest-with-ease"
    },

    // ===== 🪑 DECORATION =====
    {
        id: "another-furniture",
        name: "Another Furniture",
        version: "4.0.0",
        category: "decoration",
        description: "Meubles fonctionnels: chaises, tables, lampes, rideaux.",
        modrinth: "another-furniture",
        curseforge: "another-furniture"
    },
    {
        id: "ecologics",
        name: "Ecologics",
        version: "2.3.1",
        category: "decoration",
        description: "Améliorations écologiques avec noix de coco, crabes, etc.",
        modrinth: "ecologics",
        curseforge: "ecologics"
    },
    {
        id: "friends-and-foes",
        name: "Friends & Foes",
        version: "4.0.17",
        category: "decoration",
        description: "Ajoute les mobs perdus des votes Minecraft (Copper Golem, etc.).",
        modrinth: "friends-and-foes",
        curseforge: "friends-and-foes"
    },
    {
        id: "deeper-darker",
        name: "Deeper and Darker",
        version: "1.3.3-plus-b",
        category: "decoration",
        description: "Nouvelle dimension sombre avec biomes et boss uniques.",
        modrinth: "deeperdarker",
        curseforge: "deeperdarker"
    },
    {
        id: "wilder-nature",
        name: "Let's Do: Wilder Nature",
        version: "1.1.4",
        category: "decoration",
        description: "De l'équipe Let's Do - Ajoute de nouveaux animaux, plantes et améliorations naturelles.",
        modrinth: "lets-do-wildernature",
        curseforge: "lets-do-wildernature"
    },

    // ===== 🔧 QUALITY OF LIFE =====
    {
        id: "waystones",
        name: "Waystones",
        version: "21.1.24",
        category: "qol",
        description: "Téléportation via des pierres de voyage découvertes.",
        modrinth: "waystones",
        curseforge: "waystones"
    },
    {
        id: "xaeros-worldmap",
        name: "Xaero's World Map",
        version: "1.39.12",
        category: "qol",
        description: "Carte du monde complète avec waypoints.",
        modrinth: "xaeros-world-map",
        curseforge: "xaeros-world-map"
    },
    {
        id: "xaeros-minimap",
        name: "Xaero's Minimap",
        version: "25.2.10",
        category: "qol",
        description: "Minimap avec radar d'entités et waypoints.",
        modrinth: "xaeros-minimap",
        curseforge: "xaeros-minimap"
    },
    {
        id: "betterf3",
        name: "BetterF3",
        version: "11.0.3",
        category: "qol",
        description: "Écran de debug F3 personnalisable et coloré.",
        modrinth: "betterf3",
        curseforge: "betterf3"
    },
    {
        id: "veinminer",
        name: "Veinminer",
        version: "2.4.2",
        category: "qol",
        description: "Minez des veines entières d'un seul coup.",
        modrinth: "vein-mining",
        curseforge: "vein-mining"
    },
    {
        id: "veinminer-enchant",
        name: "Veinminer Enchantment",
        version: "2.3.0",
        category: "qol",
        description: "Enchantement veinminer pour les outils.",
        modrinth: "vein-mining-enchantment",
        curseforge: "vein-mining-enchantment"
    },
    {
        id: "graves",
        name: "Graves",
        version: "3.4.4",
        category: "qol",
        description: "À votre mort, vos items sont stockés dans une tombe.",
        modrinth: "universal-graves",
        curseforge: "universal-graves"
    },
    {
        id: "comforts",
        name: "Comforts",
        version: "9.0.4",
        category: "qol",
        description: "Sacs de couchage et hamacs pour dormir n'importe où.",
        modrinth: "comforts",
        curseforge: "comforts-fabric"
    },
    {
        id: "void-totem",
        name: "Void Totem",
        version: "4.0.0",
        category: "qol",
        description: "Totem qui vous sauve de la chute dans le Void.",
        modrinth: "voidtotem",
        curseforge: "voidtotem-fabric"
    },
    {
        id: "horse-expert",
        name: "Horse Expert",
        version: "21.1.0",
        category: "qol",
        description: "Voir les statistiques des chevaux avant de les apprivoiser.",
        modrinth: "horse-expert",
        curseforge: "horse-expert"
    },
    {
        id: "mod-menu",
        name: "Mod Menu",
        version: "11.0.3",
        category: "qol",
        description: "Menu de gestion des mods installés.",
        modrinth: "modmenu",
        curseforge: "modmenu"
    },
    {
        id: "universal-shops",
        name: "Universal Shops",
        version: "1.7.1",
        category: "qol",
        description: "Créez des magasins pour acheter/vendre des items.",
        modrinth: "universal-shops",
        curseforge: "universal-shops"
    },
    {
        id: "chunky",
        name: "Chunky",
        version: "1.4.23",
        category: "qol",
        description: "Pré-génère les chunks pour éviter les lags.",
        modrinth: "chunky",
        curseforge: "chunky-pregenerator"
    },
    {
        id: "abridged",
        name: "Abridged",
        version: "2.0.0",
        category: "qol",
        description: "Améliorations diverses pour le confort de jeu.",
        modrinth: "abridged",
        curseforge: "abridged"
    },
    {
        id: "villages-pillages",
        name: "Villages & Pillages",
        version: "1.0.3",
        category: "qol",
        description: "Améliorations des mécaniques de villages et pillards.",
        modrinth: "villages-and-pillages",
        curseforge: "villages-and-pillages"
    },
    {
        id: "t-and-t",
        name: "T and T - Trees and Stuff",
        version: "1.13.7",
        category: "qol",
        description: "Améliorations pour les arbres et la foresterie.",
        modrinth: "t-and-t",
        curseforge: "t-and-t"
    },
    {
        id: "nether-map",
        name: "Nether Map",
        version: "4.0.0",
        category: "qol",
        description: "Carte fonctionnelle dans le Nether.",
        modrinth: "nethermap",
        curseforge: "nethermap"
    },
    {
        id: "better-end-cities",
        name: "Better End Cities",
        version: "1.21.1",
        category: "structures",
        description: "Villes de l'End améliorées avec plus de variété.",
        modrinth: "better-end-cities",
        curseforge: "better-end-cities"
    },

    // ===== 🎨 GRAPHICS & VISUAL =====
    {
        id: "skin-layers-3d",
        name: "3D Skin Layers",
        version: "1.10.1",
        category: "visual",
        description: "Rend les couches de skin en vrai 3D.",
        modrinth: "3dskinlayers",
        curseforge: "skin-layers-3d"
    },
    {
        id: "not-enough-animations",
        name: "Not Enough Animations",
        version: "1.11.0",
        category: "visual",
        description: "Animations en première personne: escalade, nage, bouclier.",
        modrinth: "not-enough-animations",
        curseforge: "not-enough-animations"
    },
    {
        id: "legendary-tooltips",
        name: "Legendary Tooltips",
        version: "1.5.5",
        category: "visual",
        description: "Tooltips magnifiques avec bordures animées par rareté.",
        modrinth: "legendary-tooltips",
        curseforge: "legendary-tooltips-fabric"
    },
    {
        id: "prism",
        name: "Prism",
        version: "1.0.11",
        category: "visual",
        description: "Bibliothèque pour les effets visuels personnalisés.",
        modrinth: "prism-lib",
        curseforge: "prism-lib"
    },
    {
        id: "iceberg",
        name: "Iceberg",
        version: "1.3.2",
        category: "library",
        description: "Bibliothèque pour les mods de Grend.",
        modrinth: "iceberg",
        curseforge: "iceberg-fabric"
    },

    // ===== 📚 LIBRARIES & APIs =====
    {
        id: "fabric-api",
        name: "Fabric API",
        version: "0.116.7",
        category: "library",
        description: "API essentielle pour tous les mods Fabric.",
        modrinth: "fabric-api",
        curseforge: "fabric-api"
    },
    {
        id: "fabric-kotlin",
        name: "Fabric Language Kotlin",
        version: "1.13.7",
        category: "library",
        description: "Support du langage Kotlin pour les mods Fabric.",
        modrinth: "fabric-language-kotlin",
        curseforge: "fabric-language-kotlin"
    },
    {
        id: "architectury",
        name: "Architectury API",
        version: "13.0.8",
        category: "library",
        description: "API pour le développement multi-loader.",
        modrinth: "architectury-api",
        curseforge: "architectury-api"
    },
    {
        id: "cloth-config",
        name: "Cloth Config",
        version: "15.0.140",
        category: "library",
        description: "API pour les écrans de configuration de mods.",
        modrinth: "cloth-config",
        curseforge: "cloth-config"
    },
    {
        id: "owo-lib",
        name: "Owo Lib",
        version: "0.12.15.4",
        category: "library",
        description: "Bibliothèque utilitaire pour le développement de mods.",
        modrinth: "owo-lib",
        curseforge: "owo-lib"
    },
    {
        id: "geckolib",
        name: "GeckoLib",
        version: "4.8.2",
        category: "library",
        description: "Bibliothèque d'animation pour les modèles 3D.",
        modrinth: "geckolib",
        curseforge: "geckolib"
    },
    {
        id: "puzzles-lib",
        name: "Puzzles Lib",
        version: "21.1.39",
        category: "library",
        description: "Bibliothèque commune pour les mods Fuzs.",
        modrinth: "puzzles-lib",
        curseforge: "puzzles-lib-fabric"
    },
    {
        id: "forge-config-api",
        name: "Forge Config API Port",
        version: "21.1.6",
        category: "library",
        description: "Port de l'API de configuration Forge pour Fabric.",
        modrinth: "forge-config-api-port",
        curseforge: "forge-config-api-port-fabric"
    },
    {
        id: "balm",
        name: "Balm",
        version: "21.0.55",
        category: "library",
        description: "Bibliothèque pour les mods BlayTheNinth.",
        modrinth: "balm",
        curseforge: "balm-fabric"
    },
    {
        id: "resourceful-lib",
        name: "Resourceful Lib",
        version: "3.0.12",
        category: "library",
        description: "Bibliothèque pour les mods Team Resourceful.",
        modrinth: "resourceful-lib",
        curseforge: "resourceful-lib"
    },
    {
        id: "cobweb",
        name: "Cobweb",
        version: "1.4.0",
        category: "library",
        description: "Bibliothèque légère pour le développement de mods.",
        modrinth: "cobweb",
        curseforge: "cobweb"
    },
    {
        id: "cristellib",
        name: "Cristel Lib",
        version: "3.0.2",
        category: "library",
        description: "Bibliothèque pour les mods cristelknight.",
        modrinth: "cristel-lib",
        curseforge: "cristel-lib"
    },
    {
        id: "fzzy-config",
        name: "Fzzy Config",
        version: "0.7.3",
        category: "library",
        description: "Configuration pour les mods fzzyhmstrs.",
        modrinth: "fzzy-config",
        curseforge: "fzzy-config"
    },
    {
        id: "silk",
        name: "Silk",
        version: "1.10.7",
        category: "library",
        description: "Bibliothèque pour les mods SilkMC.",
        modrinth: "silk",
        curseforge: "silk"
    },
    {
        id: "patchouli",
        name: "Patchouli",
        version: "92",
        category: "library",
        description: "Système de livres de documentation in-game.",
        modrinth: "patchouli",
        curseforge: "patchouli-fabric"
    },
    {
        id: "yacl",
        name: "YACL",
        version: "3.8.1",
        category: "library",
        description: "Yet Another Config Lib - Bibliothèque de configuration.",
        modrinth: "yacl",
        curseforge: "yacl"
    },
    {
        id: "lithostitched",
        name: "Lithostitched",
        version: "1.5.2",
        category: "library",
        description: "API pour la génération de monde modulaire.",
        modrinth: "lithostitched",
        curseforge: "lithostitched"
    },
    {
        id: "worldweaver",
        name: "WorldWeaver",
        version: "21.0.13",
        category: "library",
        description: "Bibliothèque pour la génération de structures.",
        modrinth: "worldweaver",
        curseforge: "worldweaver"
    },
    {
        id: "wunderlib",
        name: "WunderLib",
        version: "21.0.8",
        category: "library",
        description: "Bibliothèque utilitaire pour BCLib.",
        modrinth: "wunderlib",
        curseforge: "wunderlib"
    },
    {
        id: "glitchcore",
        name: "GlitchCore",
        version: "2.1.0.0",
        category: "library",
        description: "Bibliothèque pour les mods Glitch Studios.",
        modrinth: "glitchcore",
        curseforge: "glitchcore"
    },
    {
        id: "trek",
        name: "Trek",
        version: "0.5.1.1",
        category: "library",
        description: "Bibliothèque pour les fonctionnalités de voyage.",
        modrinth: "trek",
        curseforge: "trek"
    },
    {
        id: "serene-seasons",
        name: "Serene Seasons",
        version: "10.1.0.1",
        category: "worldgen",
        description: "Système de saisons affectant la météo et les cultures.",
        modrinth: "serene-seasons",
        curseforge: "serene-seasons"
    }
];

// Category metadata
const CATEGORIES = {
    performance: {
        name: "Performance",
        icon: "🚀",
        color: "#00d4aa",
        description: "Optimisation des performances"
    },
    worldgen: {
        name: "World Generation",
        icon: "🌍",
        color: "#4ade80",
        description: "Génération du monde"
    },
    structures: {
        name: "Structures",
        icon: "🏰",
        color: "#f59e0b",
        description: "Nouvelles constructions"
    },
    combat: {
        name: "Combat & Items",
        icon: "⚔️",
        color: "#ef4444",
        description: "Armes et équipements"
    },
    food: {
        name: "Food & Farming",
        icon: "🍳",
        color: "#84cc16",
        description: "Agriculture et cuisine"
    },
    decoration: {
        name: "Decoration",
        icon: "🪑",
        color: "#a855f7",
        description: "Meubles et décoration"
    },
    qol: {
        name: "Quality of Life",
        icon: "🔧",
        color: "#3b82f6",
        description: "Confort de jeu"
    },
    library: {
        name: "Libraries & APIs",
        icon: "📚",
        color: "#6b7280",
        description: "Dépendances techniques"
    },
    visual: {
        name: "Visual & Graphics",
        icon: "🎨",
        color: "#ec4899",
        description: "Améliorations visuelles"
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MODS_DATA, CATEGORIES };
}
