# YoNiX Launcher

Launcher Minecraft pour serveur Fabric 1.21.1 avec mods, shaders et textures.

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

## Build

```bash
npm run build:win
```

Le fichier `.exe` sera généré dans le dossier `dist/`.

## Configuration GitHub pour les mises à jour

Le launcher télécharge les mods depuis les GitHub Releases de ce repo.

### Structure des releases

Pour que le launcher reconnaisse les fichiers, nommez-les correctement:

- **Mods** : `mods.zip` (archive contenant tous les .jar)
- **Shaders** : `shaders.zip` ou fichiers individuels avec "shader" dans le nom
- **Resource Packs** : fichiers avec "resource" ou "texture" dans le nom
- **Config** : `config.zip` (configuration des mods)

### Créer une release

1. Allez sur GitHub → Releases → "Draft a new release"
2. Tag: `v1.0.0` (format version)
3. Uploadez vos archives (mods.zip, shaders.zip, etc.)
4. Publiez la release

Le launcher détectera automatiquement les nouvelles versions.

## Configuration Azure (Auth Microsoft)

Pour l'authentification Microsoft, vous devez créer une app Azure:

1. Allez sur [Azure Portal](https://portal.azure.com)
2. Azure Active Directory → App registrations → New registration
3. Nom: "YoNiX Launcher"
4. Type: Personal Microsoft accounts only
5. Redirect URI: `http://localhost` (Mobile and desktop applications)
6. Copiez le "Application (client) ID"
7. Remplacez `YOUR_AZURE_CLIENT_ID` dans `src/main/auth/microsoft.js`

## Structure

```
launcher/
├── src/
│   ├── main/           # Process Electron principal
│   │   ├── main.js
│   │   ├── preload.js
│   │   ├── auth/       # Authentification
│   │   ├── updater/    # Mises à jour GitHub
│   │   └── launcher/   # Lancement Minecraft
│   └── renderer/       # Interface utilisateur
│       ├── index.html
│       ├── styles/
│       └── scripts/
├── assets/             # Icônes et images
└── package.json
```
