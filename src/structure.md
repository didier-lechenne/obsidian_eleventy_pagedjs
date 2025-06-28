# Structure simplifiée : Plugin vs Coffre

## 📁 Dans le coffre de l'utilisateur (MINIMAL)

`VotreCoffre/`

```
VotreCoffre/
├── 📄 Ma Note.md               # Notes normales Obsidian
├── 📄 Article.md               # Articles normaux
├── 📄 Journal.md               # Journal personnel
├── 📁 src/                     # 📝 Notes avec front matter pour le site
│   ├── 📄 Article Web.md       # Note destinée au site web
│   ├── 📄 Blog Post.md         # Article de blog
│   └── 📄 Guide.md             # Guide ou documentation
└── 📁 public/                  # 🌐 Site généré (output)
    ├── 📄 index.html
    ├── 📄 article-web/index.html
    └── 📁 assets/
```

## 🔧 Dans le plugin (CONFIGURATION)

`.obsidian/plugins/obsidian_eleventy_pagedjs/`

```
📁 .obsidian/plugins/obsidian_eleventy_pagedjs/
├── 📄 main.ts                  # Code du plugin
├── 📄 manifest.json            # Métadonnées plugin
├── 📄 package.json             # Dépendances plugin
├── 📁 eleventy/                # Configuration Eleventy
│   ├── 📄 .eleventy.js         # Config markdown-it
│   ├── 📄 package.json         # Dépendances Eleventy
│   └── 📁 node_modules/        # Modules npm
├── 📁 templates/               # Templates par défaut
│   ├── 📄 base.njk             # Layout de base
│   ├── 📄 note.njk             # Template note
│   ├── 📄 article.njk          # Template article
│   └── 📄 index.njk            # Page d'accueil
├── 📁 static/                  # Assets par défaut
│   ├── 📁 css/
│   │   ├── 📄 main.css         # Styles principaux
│   │   └── 📄 highlight.css    # Coloration code
│   ├── 📁 js/
│   │   └── 📄 main.js          # JavaScript
│   └── 📁 img/
│       └── 📄 logo.png         # Assets du thème
└── 📁 data/                    # Données par défaut
    ├── 📄 site.json            # Config site
    └── 📄 navigation.json      # Menu navigation
```

---

## ✅ Avantages de cette approche

### 🧹 **Coffre ultra-propre**

- Seulement `src/` et `public/` visibles
- Aucune pollution technique
- Focus sur le contenu

### 🚀 **Plugin portable**

- Fonctionne dans n'importe quel coffre
- Pas d'initialisation complexe
- Installation = prêt à utiliser

### 🔄 **Mise à jour simple**

- Mise à jour du plugin = nouveaux templates/styles
- Pas de conflit avec la configuration utilisateur
- Évolution transparente

### 👤 **Expérience utilisateur optimale**

- Pas besoin de comprendre Eleventy
- Pas de configuration technique
- Juste écrire du markdown

---

## 🎛️ Système d'override pour la personnalisation

### Logique de priorité :

1. **Utilisateur** : `src/_includes/` dans le coffre
2. **Plugin** : `templates/` dans le plugin

### Exemples d'override :

```
VotreCoffre/
├── 📁 src/
│   ├── 📁 _includes/           # 🎨 Templates personnalisés (optionnel)
│   │   ├── 📄 base.njk         # Override du template de base
│   │   └── 📄 custom.njk       # Nouveau template personnalisé
│   ├── 📁 _data/               # 📊 Données personnalisées (optionnel)
│   │   └── 📄 site.json        # Override config site
│   ├── 📁 static/              # 🎨 Assets personnalisés (optionnel)
│   │   ├── 📁 css/
│   │   │   └── 📄 custom.css   # CSS personnalisé
│   │   └── 📁 js/
│   │       └── 📄 custom.js    # JS personnalisé
│   └── 📄 Mes Notes Web.md     # Notes pour le site
```

---

## 🔄 Workflow de génération

### 1. **Utilisateur normal**

- Écrit des notes dans `src/`
- Clique sur générer
- → Site dans `public/`

### 2. **Utilisateur avancé**

- Écrit des notes dans `src/`
- Crée des templates dans `src/_includes/`
- Personnalise les styles dans `src/static/`
- Clique sur générer
- → Site personnalisé dans `public/`

---

## 🎯 Ce que ça implique techniquement

### ✅ **Pour l'utilisateur**

- **Plus simple** : Juste `src/` et `public/`
- **Plug & Play** : Aucune configuration requise
- **Évolutif** : Peut personnaliser s'il le souhaite
- **Propre** : Coffre non pollué

### ⚙️ **Pour le développement du plugin**

- **Templates embarqués** : Dans le code du plugin
- **Configuration centralisée** : Pas de dispersion
- **Gestion des overrides** : Logique de priorité
- **Assets intégrés** : CSS/JS fournis par défaut

### 🔧 **Pour la maintenance**

- **Mise à jour facile** : Tout dans le plugin
- **Compatibilité** : Fonctionne partout
- **Debug simple** : Configuration connue
- **Support utilisateur** : Moins de variables

---

## 🚫 Compromis acceptables

### **Moins de flexibilité immédiate**

- Mais système d'override pour les power users

### **Configuration moins accessible**

- Mais 90% des utilisateurs n'en ont pas besoin

### **Dépendance au plugin**

- Mais expérience utilisateur bien meilleure

---

## 🎉 Conclusion

Cette approche est **largement supérieure** pour la majorité des utilisateurs :

- 🎯 **Simple par défaut**
- 🔧 **Puissant si besoin**
- 🧹 **Coffre propre**
- 🚀 **Installation instantanée**

C'est la philosophie "Convention over Configuration" appliquée à Obsidian + Eleventy !