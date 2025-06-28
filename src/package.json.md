# Structure des package.json et scripts

## 📦 Package.json principal (racine du plugin)

`.obsidian/plugins/obsidian_eleventy_pagedjs/package.json`

### 🎯 Rôle : Développement du plugin Obsidian

```json
{
  "scripts": {
    "dev": "node esbuild.config.mjs",                    // 🔄 Mode développement (watch)
    "build": "tsc -noEmit -skipLibCheck && node esbuild.config.mjs production", // 🏗️ Build production
    "version": "node version-bump.mjs && git add manifest.json versions.json", // 📦 Bump version
    "test-eleventy": "cd eleventy && npm run build",     // 🧪 Tester Eleventy
    "test-serve": "cd eleventy && npm run serve",        // 🌐 Serveur de test
    "setup-eleventy": "cd eleventy && npm install",      // ⚙️ Setup Eleventy
    "clean": "rm -f main.js && rm -rf eleventy/node_modules" // 🧹 Nettoyer
  }
}
```

### 💻 Utilisation (développement du plugin) :

```bash
npm run dev          # Développement avec watch
npm run build        # Build pour release
npm run test-eleventy # Tester la génération
npm run test-serve   # Prévisualiser le site
```

---

## 📦 Package.json Eleventy (embarqué)

`.obsidian/plugins/obsidian_eleventy_pagedjs/eleventy/package.json`

### 🎯 Rôle : Moteur de génération de site

```json
{
  "scripts": {
    "build": "eleventy",                                 // 🏗️ Générer le site
    "serve": "eleventy --serve --port=8080 --open",     // 🌐 Serveur + ouverture auto
    "debug": "DEBUG=Eleventy* eleventy",                 // 🐛 Mode debug
    "clean": "rm -rf ../../../public/*",                // 🧹 Vider public/
    "dev": "eleventy --serve --watch --port=8080",      // 🔄 Développement continu
    "build-production": "NODE_ENV=production eleventy", // 🚀 Build optimisé
    "analyze": "eleventy --dryrun"                       // 📊 Analyser sans build
  }
}
```

### 🤖 Utilisation (automatique par le plugin) :

Le plugin TypeScript utilise ces scripts via `execAsync()`:

- `npm run build` → Génération du site
- `npm run serve` → Serveur de développement
- `npm run clean` → Nettoyage avant build

---

## 🔄 Workflow complet

### 👨‍💻 Développeur du plugin :

```bash
# 1. Développement du plugin
npm run dev

# 2. Tester Eleventy
npm run test-eleventy

# 3. Build final
npm run build
```

### 👤 Utilisateur final :

- Clique sur l'icône 🌐
- Plugin exécute automatiquement `cd eleventy && npm run build`
- Site généré dans `public/`

---

## 📁 Structure des fichiers

```
.obsidian/plugins/obsidian_eleventy_pagedjs/
├── 📄 package.json              # Scripts plugin principal
├── 📄 main.ts                   # Code TypeScript
├── 📄 main.js                   # Plugin compilé
├── 📁 eleventy/                 # Moteur embarqué
│   ├── 📄 package.json          # Scripts Eleventy
│   ├── 📄 .eleventy.js          # Config markdown-it
│   └── 📁 node_modules/         # Dépendances Eleventy
├── 📁 templates/                # Templates par défaut
├── 📁 static/                   # CSS/JS par défaut
└── 📁 data/                     # Données par défaut
```

---

## ✅ Avantages de cette séparation

### 🎯 **Séparation des responsabilités**

- Plugin principal = Obsidian + TypeScript
- Eleventy embarqué = Génération de site

### 📦 **Versioning indépendant**

- Plugin peut évoluer sans changer Eleventy
- Eleventy peut être mis à jour indépendamment

### 🧪 **Testing facile**

- `npm run test-eleventy` pour tester juste la génération
- `npm run dev` pour développer le plugin

### 🚀 **Distribution simple**

- Un seul plugin à installer
- Eleventy inclus et géré automatiquement

---

## 🎯 En résumé

- **Package.json principal** : Pour vous (développeur du plugin)
- **Package.json Eleventy** : Pour le moteur de génération
- **L'utilisateur final** ne voit que l'interface Obsidian simple ! 🎉