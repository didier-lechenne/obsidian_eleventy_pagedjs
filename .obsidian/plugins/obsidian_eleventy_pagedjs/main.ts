import { App, Plugin, PluginSettingTab, Setting, Notice, Modal, ButtonComponent } from 'obsidian';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

interface EleventyPluginSettings {
	siteTitle: string;
	siteDescription: string;
	baseUrl: string;
	author: string;
	autoGenerateOnSave: boolean;
}

const DEFAULT_SETTINGS: EleventyPluginSettings = {
	siteTitle: 'Mon Site Obsidian',
	siteDescription: 'Site généré depuis Obsidian avec Eleventy et markdown-it',
	baseUrl: '',
	author: 'Votre nom',
	autoGenerateOnSave: false
}

export default class EleventyPlugin extends Plugin {
	settings: EleventyPluginSettings;

	async onload() {
		await this.loadSettings();

		// Icône dans le ruban
		const ribbonIconEl = this.addRibbonIcon('globe', 'Générer site Eleventy', () => {
			this.generateSite();
		});

		// Commandes
		this.addCommand({
			id: 'generate-eleventy-site',
			name: 'Générer le site statique',
			callback: () => {
				this.generateSite();
			}
		});

		this.addCommand({
			id: 'serve-eleventy-site',
			name: 'Démarrer le serveur de développement',
			callback: () => {
				this.serveSite();
			}
		});

		this.addCommand({
			id: 'open-public-folder',
			name: 'Ouvrir le dossier public',
			callback: () => {
				this.openPublicFolder();
			}
		});

		this.addCommand({
			id: 'create-src-folder',
			name: 'Créer le dossier src avec note d\'exemple',
			callback: () => {
				this.createSrcFolder();
			}
		});

		// Surveillance automatique (optionnel)
		if (this.settings.autoGenerateOnSave) {
			this.registerEvent(
				this.app.vault.on('modify', (file) => {
					if (file.path.startsWith('src/') && file.path.endsWith('.md')) {
						// Débounce pour éviter la génération trop fréquente
						this.debounceGenerate();
					}
				})
			);
		}

		// Onglet des paramètres
		this.addSettingTab(new EleventySettingTab(this.app, this));

		// Initialiser la structure si nécessaire
		await this.ensurePluginStructure();
	}

	private debounceTimer: NodeJS.Timeout | null = null;

	debounceGenerate() {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}
		this.debounceTimer = setTimeout(() => {
			this.generateSite();
		}, 2000); // 2 secondes de délai
	}

	async generateSite() {
		const loadingNotice = new Notice('Génération du site en cours...', 0);
		
		try {
			// S'assurer que la structure du plugin est prête
			await this.ensurePluginStructure();
			
			// Créer le dossier src/ s'il n'existe pas
			await this.ensureSrcFolder();
			
			// Générer les données dynamiques
			await this.generateSiteData();
			
			// Générer le site avec Eleventy
			await this.runEleventy();
			
			loadingNotice.hide();
			new Notice('Site généré avec succès !');
			
			new SiteGeneratedModal(this.app, this.getPublicPath()).open();
			
		} catch (error) {
			loadingNotice.hide();
			new Notice(`Erreur lors de la génération : ${error.message}`);
			console.error(error);
		}
	}

	async ensurePluginStructure() {
		const pluginPath = this.getPluginPath();
		
		// Créer la structure dans le plugin
		const directories = [
			'eleventy',
			'templates',
			'static/css',
			'static/js',
			'data'
		];

		for (const dir of directories) {
			const dirPath = path.join(pluginPath, dir);
			if (!fs.existsSync(dirPath)) {
				fs.mkdirSync(dirPath, { recursive: true });
			}
		}

		// Créer les fichiers de base s'ils n'existent pas
		await this.createPluginFiles();
	}

	async createPluginFiles() {
		const pluginPath = this.getPluginPath();
		
		// Package.json pour Eleventy dans le plugin
		const packageJsonPath = path.join(pluginPath, 'eleventy', 'package.json');
		if (!fs.existsSync(packageJsonPath)) {
			const packageJson = {
				"name": "obsidian-eleventy-internal",
				"version": "1.0.0",
				"private": true,
				"dependencies": {
					"@11ty/eleventy": "^2.0.1",
					"markdown-it": "^14.0.0",
					"markdown-it-anchor": "^8.6.7",
					"markdown-it-table-of-contents": "^0.6.0",
					"markdown-it-footnote": "^4.0.0",
					"markdown-it-task-lists": "^2.1.1",
					"markdown-it-attrs": "^4.1.6",
					"markdown-it-highlightjs": "^4.0.1",
					"markdown-it-container": "^4.0.0",
					"highlight.js": "^11.9.0"
				}
			};
			fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
		}

		// Configuration Eleventy dans le plugin
		const configPath = path.join(pluginPath, 'eleventy', 'eleventy.config.js');
		if (!fs.existsSync(configPath)) {
			await this.createEleventyConfig();
		}

		// Templates par défaut
		await this.createDefaultTemplates();
		
		// CSS/JS par défaut
		await this.createDefaultAssets();

		// Installer les dépendances npm si nécessaire
		await this.ensureNodeModules();
	}

	async createEleventyConfig() {
		const pluginPath = this.getPluginPath();
		const vaultPath = this.app.vault.adapter.path;
		
		const configContent = `const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const markdownItTOC = require("markdown-it-table-of-contents");
const markdownItFootnote = require("markdown-it-footnote");
const markdownItTaskLists = require("markdown-it-task-lists");
const markdownItAttrs = require("markdown-it-attrs");
const markdownItHighlightJS = require("markdown-it-highlightjs");
const markdownItContainer = require("markdown-it-container");
const path = require("path");

module.exports = function(eleventyConfig) {
  
  // Configuration de markdown-it
  const markdownLibrary = markdownIt({
    html: true,
    breaks: true,
    linkify: true,
    typographer: true
  })
  .use(markdownItAnchor, {
    permalink: markdownItAnchor.permalink.linkInsideHeader({
      symbol: '#',
      placement: 'after'
    })
  })
  .use(markdownItTOC, {
    includeLevel: [2, 3, 4],
    containerClass: "table-of-contents",
    markerPattern: /^\\[\\[toc\\]\\]$/im
  })
  .use(markdownItFootnote)
  .use(markdownItTaskLists, {
    enabled: true,
    label: true,
    labelAfter: true
  })
  .use(markdownItAttrs)
  .use(markdownItHighlightJS, {
    auto: true,
    code: true
  })
  .use(markdownItContainer, 'note', {
    render: function (tokens, idx) {
      const token = tokens[idx];
      if (token.nesting === 1) {
        return '<div class="callout callout-note">\\n<div class="callout-title">📝 Note</div>\\n<div class="callout-content">\\n';
      } else {
        return '</div>\\n</div>\\n';
      }
    }
  })
  .use(markdownItContainer, 'warning', {
    render: function (tokens, idx) {
      const token = tokens[idx];
      if (token.nesting === 1) {
        return '<div class="callout callout-warning">\\n<div class="callout-title">⚠️ Attention</div>\\n<div class="callout-content">\\n';
      } else {
        return '</div>\\n</div>\\n';
      }
    }
  })
  .use(markdownItContainer, 'tip', {
    render: function (tokens, idx) {
      const token = tokens[idx];
      if (token.nesting === 1) {
        return '<div class="callout callout-tip">\\n<div class="callout-title">💡 Astuce</div>\\n<div class="callout-content">\\n';
      } else {
        return '</div>\\n</div>\\n';
      }
    }
  })
  .use(markdownItContainer, 'info', {
    render: function (tokens, idx) {
      const token = tokens[idx];
      if (token.nesting === 1) {
        return '<div class="callout callout-info">\\n<div class="callout-title">ℹ️ Info</div>\\n<div class="callout-content">\\n';
      } else {
        return '</div>\\n</div>\\n';
      }
    }
  });

  // Plugin personnalisé pour les liens internes Obsidian
  markdownLibrary.use(function(md) {
    md.inline.ruler.before('link', 'obsidian_link', function(state, silent) {
      const start = state.pos;
      const max = state.posMax;
      
      if (start + 4 > max || state.src.slice(start, start + 2) !== '[[') {
        return false;
      }
      
      let pos = start + 2;
      let found = false;
      
      while (pos < max - 1) {
        if (state.src.slice(pos, pos + 2) === ']]') {
          found = true;
          break;
        }
        pos++;
      }
      
      if (!found) return false;
      
      if (!silent) {
        const content = state.src.slice(start + 2, pos);
        const parts = content.split('|');
        const linkPath = parts[0].trim();
        const linkText = parts[1] ? parts[1].trim() : linkPath;
        
        const slug = linkPath
          .toLowerCase()
          .replace(/[^\\w\\s-]/g, '')
          .replace(/\\s+/g, '-');
        
        const token = state.push('obsidian_link', '', 0);
        token.content = linkText;
        token.attrSet('href', \`/\${slug}/\`);
        token.attrSet('class', 'internal-link');
      }
      
      state.pos = pos + 2;
      return true;
    });
    
    md.renderer.rules.obsidian_link = function(tokens, idx) {
      const token = tokens[idx];
      const href = token.attrGet('href');
      const className = token.attrGet('class');
      const content = token.content;
      
      return \`<a href="\${href}" class="\${className}">\${content}</a>\`;
    };
  });

  // Plugin personnalisé pour les images Obsidian
  markdownLibrary.use(function(md) {
    md.inline.ruler.before('image', 'obsidian_image', function(state, silent) {
      const start = state.pos;
      const max = state.posMax;
      
      if (start + 5 > max || state.src.slice(start, start + 3) !== '![[') {
        return false;
      }
      
      let pos = start + 3;
      let found = false;
      
      while (pos < max - 1) {
        if (state.src.slice(pos, pos + 2) === ']]') {
          found = true;
          break;
        }
        pos++;
      }
      
      if (!found) return false;
      
      if (!silent) {
        const content = state.src.slice(start + 3, pos);
        const parts = content.split('|');
        const imagePath = parts[0].trim();
        const altText = parts[1] ? parts[1].trim() : imagePath;
        
        const token = state.push('obsidian_image', '', 0);
        token.content = altText;
        token.attrSet('src', \`/assets/\${imagePath}\`);
        token.attrSet('alt', altText);
        token.attrSet('class', 'obsidian-image');
      }
      
      state.pos = pos + 2;
      return true;
    });
    
    md.renderer.rules.obsidian_image = function(tokens, idx) {
      const token = tokens[idx];
      const src = token.attrGet('src');
      const alt = token.attrGet('alt');
      const className = token.attrGet('class');
      
      return \`<img src="\${src}" alt="\${alt}" class="\${className}" loading="lazy">\`;
    };
  });

  eleventyConfig.setLibrary("md", markdownLibrary);

  // Chemins depuis le dossier config dans le plugin vers le vault
  const vaultPath = "${vaultPath.replace(/\\/g, '/')}";
  const pluginPath = __dirname + "/..";
  
  // Copier les images depuis le vault (attachments ou n'importe où)
  eleventyConfig.addPassthroughCopy({ 
    [vaultPath + "/attachments"]: "assets",
    [vaultPath + "/**/*(*.jpg|*.png|*.gif|*.svg|*.webp)"]: "assets"
  });
  
  // Copier les assets du plugin par défaut
  eleventyConfig.addPassthroughCopy({ 
    [pluginPath + "/static"]: "static" 
  });
  
  // Override avec les assets utilisateur si ils existent
  if (require("fs").existsSync(vaultPath + "/src/static")) {
    eleventyConfig.addPassthroughCopy({ 
      [vaultPath + "/src/static"]: "static" 
    });
  }

  // Filters
  eleventyConfig.addFilter("slug", function(str) {
    return str
      .toLowerCase()
      .replace(/[^\\w\\s-]/g, '')
      .replace(/\\s+/g, '-');
  });

  eleventyConfig.addFilter("date", function(date, format) {
    const d = new Date(date);
    if (format === 'YYYY-MM-DD') {
      return d.toISOString().split('T')[0];
    }
    if (format === 'DD/MM/YYYY') {
      return d.toLocaleDateString('fr-FR');
    }
    return d.toLocaleDateString();
  });

  eleventyConfig.addFilter("excerpt", function(content, length = 150) {
    const text = content.replace(/<[^>]*>/g, '');
    return text.length > length ? text.substring(0, length) + '...' : text;
  });

  // Collections
  eleventyConfig.addCollection("notes", function(collectionApi) {
    return collectionApi.getFilteredByGlob(vaultPath + "/src/**/*.md").filter(item => {
      return !item.data.draft && item.data.title;
    });
  });

  return {
    dir: {
      input: vaultPath + "/src",
      output: vaultPath + "/public",
      includes: require("fs").existsSync(vaultPath + "/src/_includes") ? "_includes" : pluginPath + "/templates",
      data: require("fs").existsSync(vaultPath + "/src/_data") ? "_data" : pluginPath + "/data"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["md", "njk", "html"]
  };
};`;

		fs.writeFileSync(
			path.join(this.getPluginPath(), 'eleventy', 'eleventy.config.js'),
			configContent
		);
	}

	async createDefaultTemplates() {
		const templatesPath = path.join(this.getPluginPath(), 'templates');
		
		// Template de base
		const baseTemplate = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% if title %}{{ title }} | {% endif %}{{ site.title }}</title>
    <meta name="description" content="{{ description or site.description }}">
    
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
    <link rel="stylesheet" href="/static/css/main.css">
</head>
<body>
    <header class="header">
        <h1><a href="/">{{ site.title }}</a></h1>
        <nav class="nav">
            <a href="/">Accueil</a>
            <a href="/notes/">Notes</a>
        </nav>
    </header>
    
    <main class="content">
        {{ content | safe }}
    </main>
    
    <footer class="footer">
        <p>&copy; {{ "now" | date("YYYY") }} {{ site.author }}</p>
        <p>Généré avec Obsidian + Eleventy</p>
    </footer>
    
    <script src="/static/js/main.js"></script>
</body>
</html>`;

		fs.writeFileSync(path.join(templatesPath, 'base.njk'), baseTemplate);

		// Template note
		const noteTemplate = `---
layout: base.njk
---

<article class="note">
    <header class="note-header">
        <h1>{{ title }}</h1>
        <div class="note-meta">
            {% if date %}
                <time datetime="{{ date | date('YYYY-MM-DD') }}">
                    📅 {{ date | date('DD/MM/YYYY') }}
                </time>
            {% endif %}
            
            {% if tags and tags.length %}
                <div class="tags-list">
                    🏷️ 
                    {% for tag in tags %}
                        <span class="tag">#{{ tag }}</span>
                    {% endfor %}
                </div>
            {% endif %}
            
            {% if description %}
                <p class="note-description">{{ description }}</p>
            {% endif %}
        </div>
    </header>
    
    <div class="note-content">
        {{ content | safe }}
    </div>
</article>`;

		fs.writeFileSync(path.join(templatesPath, 'note.njk'), noteTemplate);
		
		// Copier le fichier eleventy.config.js complet dans les templates
		await this.createEleventyConfigTemplate();
	}

	async createEleventyConfigTemplate() {
		const templatesPath = path.join(this.getPluginPath(), 'templates');
		
		// Ici on met le contenu COMPLET de eleventy.config.js
		// Le même que dans l'artifact eleventy_config_modern
		const fullConfigContent = `const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const markdownItTOC = require("markdown-it-table-of-contents");
const markdownItFootnote = require("markdown-it-footnote");
const markdownItTaskLists = require("markdown-it-task-lists");
const markdownItAttrs = require("markdown-it-attrs");
const markdownItHighlightJS = require("markdown-it-highlightjs");
const markdownItContainer = require("markdown-it-container");
const markdownItAbbr = require("markdown-it-abbr");
const markdownItDeflist = require("markdown-it-deflist");
const markdownItEmoji = require("markdown-it-emoji");
const markdownItIns = require("markdown-it-ins");
const markdownItMark = require("markdown-it-mark");
const markdownItSub = require("markdown-it-sub");
const markdownItSup = require("markdown-it-sup");
const path = require("path");
const fs = require("fs");

module.exports = function(eleventyConfig) {
  
  // Configuration de markdown-it avec toutes les options
  const markdownLibrary = markdownIt({
    html: true,
    breaks: true,
    linkify: true,
    typographer: true,
    quotes: '""''',
    langPrefix: 'language-'
  })
  
  // Plugins markdown-it complets
  .use(markdownItAnchor, {
    permalink: markdownItAnchor.permalink.linkInsideHeader({
      symbol: '#',
      placement: 'after',
      class: 'header-anchor'
    }),
    level: [2, 3, 4, 5, 6],
    slugify: function(str) {
      return str.toLowerCase().trim()
        .replace(/[\\s\\W-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
  })
  
  .use(markdownItTOC, {
    includeLevel: [2, 3, 4, 5],
    containerClass: "table-of-contents",
    containerHeaderHtml: '<div class="toc-header">📋 Table des matières</div>',
    listType: 'ul',
    markerPattern: /^\\[\\[toc\\]\\]$/im
  })
  
  .use(markdownItFootnote)
  .use(markdownItTaskLists, { enabled: true, label: true, labelAfter: true, lineNumber: true })
  .use(markdownItAttrs, { leftDelimiter: '{', rightDelimiter: '}', allowedAttributes: ['id', 'class', 'style', 'data-*', 'aria-*'] })
  .use(markdownItHighlightJS, { auto: true, code: true, inline: false, hljs: require('highlight.js') })
  .use(markdownItAbbr)
  .use(markdownItDeflist)
  .use(markdownItEmoji, { defs: { obsidian: '🔮', eleventy: '🕚', note: '📝', tip: '💡', warning: '⚠️', info: 'ℹ️' } })
  .use(markdownItIns)
  .use(markdownItMark)
  .use(markdownItSub)
  .use(markdownItSup)
  
  // Callouts complets
  .use(markdownItContainer, 'note', {
    validate: function(params) { return params.trim().match(/^note\\s*(.*)$/); },
    render: function (tokens, idx) {
      const token = tokens[idx];
      const info = token.info.trim().slice(4).trim();
      const title = info || 'Note';
      return token.nesting === 1 
        ? \`<div class="callout callout-note">\\n<div class="callout-title">📝 \${title}</div>\\n<div class="callout-content">\\n\`
        : '</div>\\n</div>\\n';
    }
  })
  
  .use(markdownItContainer, 'warning', {
    validate: function(params) { return params.trim().match(/^warning\\s*(.*)$/); },
    render: function (tokens, idx) {
      const token = tokens[idx];
      const info = token.info.trim().slice(7).trim();
      const title = info || 'Attention';
      return token.nesting === 1 
        ? \`<div class="callout callout-warning">\\n<div class="callout-title">⚠️ \${title}</div>\\n<div class="callout-content">\\n\`
        : '</div>\\n</div>\\n';
    }
  })
  
  .use(markdownItContainer, 'tip', {
    validate: function(params) { return params.trim().match(/^tip\\s*(.*)$/); },
    render: function (tokens, idx) {
      const token = tokens[idx];
      const info = token.info.trim().slice(3).trim();
      const title = info || 'Astuce';
      return token.nesting === 1 
        ? \`<div class="callout callout-tip">\\n<div class="callout-title">💡 \${title}</div>\\n<div class="callout-content">\\n\`
        : '</div>\\n</div>\\n';
    }
  })
  
  .use(markdownItContainer, 'info', {
    validate: function(params) { return params.trim().match(/^info\\s*(.*)$/); },
    render: function (tokens, idx) {
      const token = tokens[idx];
      const info = token.info.trim().slice(4).trim();
      const title = info || 'Information';
      return token.nesting === 1 
        ? \`<div class="callout callout-info">\\n<div class="callout-title">ℹ️ \${title}</div>\\n<div class="callout-content">\\n\`
        : '</div>\\n</div>\\n';
    }
  });

  // Plugins Obsidian personnalisés (liens et images)
  markdownLibrary.use(function(md) {
    // Plugin liens [[]]
    md.inline.ruler.before('link', 'obsidian_link', function(state, silent) {
      const start = state.pos;
      const max = state.posMax;
      
      if (start + 4 > max || state.src.slice(start, start + 2) !== '[[') return false;
      
      let pos = start + 2;
      let found = false;
      while (pos < max - 1) {
        if (state.src.slice(pos, pos + 2) === ']]') { found = true; break; }
        pos++;
      }
      if (!found) return false;
      
      if (!silent) {
        const content = state.src.slice(start + 2, pos);
        const parts = content.split('|');
        const linkPath = parts[0].trim();
        const linkText = parts[1] ? parts[1].trim() : linkPath;
        const slug = linkPath.toLowerCase().replace(/[^\\w\\s-]/g, '').replace(/\\s+/g, '-').replace(/^-+|-+$/g, '');
        
        const token = state.push('obsidian_link', '', 0);
        token.content = linkText;
        token.attrSet('href', \`/\${slug}/\`);
        token.attrSet('class', 'internal-link');
        token.attrSet('data-note', linkPath);
      }
      
      state.pos = pos + 2;
      return true;
    });
    
    md.renderer.rules.obsidian_link = function(tokens, idx) {
      const token = tokens[idx];
      return \`<a href="\${token.attrGet('href')}" class="\${token.attrGet('class')}" data-note="\${token.attrGet('data-note')}" title="Lien vers \${token.attrGet('data-note')}">\${token.content}</a>\`;
    };
    
    // Plugin images ![[]]
    md.inline.ruler.before('image', 'obsidian_image', function(state, silent) {
      const start = state.pos;
      const max = state.posMax;
      
      if (start + 5 > max || state.src.slice(start, start + 3) !== '![[') return false;
      
      let pos = start + 3;
      let found = false;
      while (pos < max - 1) {
        if (state.src.slice(pos, pos + 2) === ']]') { found = true; break; }
        pos++;
      }
      if (!found) return false;
      
      if (!silent) {
        const content = state.src.slice(start + 3, pos);
        const parts = content.split('|');
        const imagePath = parts[0].trim();
        const altText = parts[1] ? parts[1].trim() : imagePath;
        const width = parts[2] ? parts[2].trim() : null;
        
        const token = state.push('obsidian_image', '', 0);
        token.content = altText;
        token.attrSet('src', \`/assets/\${imagePath}\`);
        token.attrSet('alt', altText);
        token.attrSet('class', 'obsidian-image');
        token.attrSet('loading', 'lazy');
        if (width) token.attrSet('width', width);
      }
      
      state.pos = pos + 2;
      return true;
    });
    
    md.renderer.rules.obsidian_image = function(tokens, idx) {
      const token = tokens[idx];
      let attributes = \`src="\${token.attrGet('src')}" alt="\${token.attrGet('alt')}" class="\${token.attrGet('class')}" loading="\${token.attrGet('loading')}"\`;
      if (token.attrGet('width')) attributes += \` width="\${token.attrGet('width')}"\`;
      return \`<img \${attributes}>\`;
    };
  });

  eleventyConfig.setLibrary("md", markdownLibrary);

  // Gestion des chemins et assets
  const vaultPath = path.resolve(__dirname, '../../..');
  const pluginPath = path.resolve(__dirname, '..');
  
  // Copie automatique des dossiers d'images
  ['attachments', 'assets', 'images', 'img', 'media'].forEach(folder => {
    const attachPath = path.join(vaultPath, folder);
    if (fs.existsSync(attachPath)) {
      eleventyConfig.addPassthroughCopy({ [attachPath]: "assets" });
    }
  });
  
  eleventyConfig.addPassthroughCopy({ [path.join(pluginPath, "static")]: "static" });
  
  const userStaticPath = path.join(vaultPath, "src", "static");
  if (fs.existsSync(userStaticPath)) {
    eleventyConfig.addPassthroughCopy({ [userStaticPath]: "static" });
  }

  // Filters
  eleventyConfig.addFilter("slug", str => str ? str.toString().toLowerCase().trim().replace(/[\\s\\W-]+/g, '-').replace(/^-+|-+$/g, '') : '');
  eleventyConfig.addFilter("date", (date, format) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    
    switch(format) {
      case 'YYYY-MM-DD': return d.toISOString().split('T')[0];
      case 'DD/MM/YYYY': return d.toLocaleDateString('fr-FR');
      case 'iso': return d.toISOString();
      case 'readable': return d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
      default: return d.toLocaleDateString('fr-FR');
    }
  });
  eleventyConfig.addFilter("excerpt", (content, length = 150) => {
    if (!content) return '';
    const text = content.toString().replace(/<[^>]*>/g, '');
    return text.length > length ? text.substring(0, length).trim() + '…' : text;
  });
  eleventyConfig.addFilter("limit", (array, limit) => Array.isArray(array) ? array.slice(0, limit) : []);
  eleventyConfig.addFilter("reverse", array => Array.isArray(array) ? [...array].reverse() : []);

  // Collections
  eleventyConfig.addCollection("notes", function(collectionApi) {
    return collectionApi.getFilteredByGlob(path.join(vaultPath, "src/**/*.md"))
      .filter(item => !item.data.draft && item.data.title)
      .sort((a, b) => new Date(b.date || b.data?.date || 0) - new Date(a.date || a.data?.date || 0));
  });

  eleventyConfig.addCollection("notesByTag", function(collectionApi) {
    const notes = collectionApi.getFilteredByGlob(path.join(vaultPath, "src/**/*.md"));
    const tagMap = {};
    notes.forEach(note => {
      const tags = note.data?.tags || [];
      if (Array.isArray(tags)) {
        tags.forEach(tag => {
          if (!tagMap[tag]) tagMap[tag] = [];
          tagMap[tag].push(note);
        });
      }
    });
    Object.keys(tagMap).forEach(tag => {
      tagMap[tag].sort((a, b) => new Date(b.date || b.data?.date || 0) - new Date(a.date || a.data?.date || 0));
    });
    return tagMap;
  });

  return {
    dir: {
      input: path.join(vaultPath, "src"),
      output: path.join(vaultPath, "public"),
      includes: fs.existsSync(path.join(vaultPath, "src/_includes")) 
        ? "_includes" 
        : path.relative(path.join(vaultPath, "src"), path.join(pluginPath, "templates")),
      data: fs.existsSync(path.join(vaultPath, "src/_data")) 
        ? "_data" 
        : path.relative(path.join(vaultPath, "src"), path.join(pluginPath, "data"))
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["md", "njk", "html"],
    pathPrefix: "/",
    htmlOutputSuffix: ".html"
  };
};`;

		fs.writeFileSync(path.join(templatesPath, 'eleventy.config.js'), fullConfigContent);
	}

	async createDefaultAssets() {
		const staticPath = path.join(this.getPluginPath(), 'static');
		
		// CSS principal (version condensée pour le plugin)
		const mainCSS = `/* Obsidian Eleventy Plugin - Styles par défaut */
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f8f9fa; }
.header { background: white; border-bottom: 2px solid #e9ecef; padding: 1rem 0; position: sticky; top: 0; z-index: 100; }
.header h1 a { color: #495057; text-decoration: none; }
.nav { margin-top: 1rem; }
.nav a { color: #6c757d; text-decoration: none; margin-right: 2rem; padding: 0.5rem 0; border-bottom: 2px solid transparent; transition: border-color 0.2s; }
.nav a:hover { border-bottom-color: #007bff; }
.content { max-width: 900px; margin: 2rem auto; padding: 0 2rem; }
.footer { background: white; border-top: 1px solid #e9ecef; text-align: center; padding: 2rem; margin-top: 4rem; color: #6c757d; font-size: 0.875rem; }
.note { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.note-header h1 { color: #495057; margin-bottom: 1rem; }
.note-meta { color: #6c757d; font-size: 0.875rem; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #e9ecef; }
.note-description { font-style: italic; margin-top: 1rem; color: #6c757d; }
.tags-list { margin-top: 0.5rem; }
.tag { display: inline-block; background: #e9ecef; color: #495057; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.875rem; margin-right: 0.5rem; margin-bottom: 0.5rem; }
.internal-link { color: #7c3aed; text-decoration: none; border-bottom: 1px dotted #7c3aed; }
.internal-link:hover { background-color: #f3f4f6; }
.obsidian-image { max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.callout { border-radius: 8px; margin: 1.5rem 0; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.callout-title { font-weight: 600; padding: 0.75rem 1rem; margin: 0; font-size: 0.95rem; }
.callout-content { padding: 1rem; }
.callout-note { border-left: 4px solid #3b82f6; }
.callout-note .callout-title { background: #dbeafe; color: #1e40af; }
.callout-note .callout-content { background: #f0f9ff; }
.callout-warning { border-left: 4px solid #f59e0b; }
.callout-warning .callout-title { background: #fef3c7; color: #92400e; }
.callout-warning .callout-content { background: #fffbeb; }
.callout-tip { border-left: 4px solid #10b981; }
.callout-tip .callout-title { background: #d1fae5; color: #065f46; }
.callout-tip .callout-content { background: #ecfdf5; }
.callout-info { border-left: 4px solid #6366f1; }
.callout-info .callout-title { background: #e0e7ff; color: #3730a3; }
.callout-info .callout-content { background: #f0f4ff; }
@media (max-width: 768px) { .content { padding: 0 1rem; } .note { padding: 1rem; } }`;

		fs.writeFileSync(path.join(staticPath, 'css', 'main.css'), mainCSS);

		// JavaScript minimal
		const mainJS = `// Obsidian Eleventy Plugin - JavaScript par défaut
document.addEventListener('DOMContentLoaded', function() {
    console.log('Site Obsidian + Eleventy chargé !');
});`;

		fs.writeFileSync(path.join(staticPath, 'js', 'main.js'), mainJS);
	}

	async ensureNodeModules() {
		const eleventyPath = path.join(this.getPluginPath(), 'eleventy');
		const nodeModulesPath = path.join(eleventyPath, 'node_modules');
		
		if (!fs.existsSync(nodeModulesPath)) {
			const installNotice = new Notice('Installation des dépendances (première fois)...', 0);
			try {
				const command = `cd "${eleventyPath}" && npm install`;
				await execAsync(command);
				installNotice.hide();
			} catch (error) {
				installNotice.hide();
				throw new Error(`Erreur d'installation npm : ${error.message}`);
			}
		}
	}

	async ensureSrcFolder() {
		const vaultPath = this.app.vault.adapter.path;
		const srcPath = path.join(vaultPath, 'src');
		
		if (!fs.existsSync(srcPath)) {
			fs.mkdirSync(srcPath, { recursive: true });
		}
	}

	async createSrcFolder() {
		const vaultPath = this.app.vault.adapter.path;
		const srcPath = path.join(vaultPath, 'src');
		
		// Créer le dossier src
		if (!fs.existsSync(srcPath)) {
			fs.mkdirSync(srcPath, { recursive: true });
		}

		// Créer une note d'exemple
		const exampleNote = `---
title: "Bienvenue sur votre site"
description: "Page d'accueil de votre site généré depuis Obsidian"
date: ${new Date().toISOString().split('T')[0]}
layout: note.njk
tags: 
  - accueil
  - bienvenue
permalink: /index.html
---

# Bienvenue sur votre site !

[[toc]]

## 🎉 Félicitations !

Votre site Obsidian + Eleventy est configuré et prêt !

## 📝 Comment ça marche

1. **Écrivez vos notes** dans le dossier \`src/\`
2. **Ajoutez du front matter** pour contrôler l'apparence
3. **Cliquez sur l'icône globe** pour générer le site
4. **Votre site** apparaît dans le dossier \`public/\`

## ✨ Fonctionnalités

### Callouts Obsidian

::: note
Vos callouts Obsidian fonctionnent parfaitement !
:::

::: tip
💡 Vous pouvez personnaliser les templates en créant \`src/_includes/\`
:::

### Liens internes

Créez des liens vers d'autres notes : [[Ma note]] ou [[Ma note|Texte personnalisé]]

### Images

Intégrez vos images : ![[mon-image.png|Description]]

### Listes de tâches

- [x] ✅ Plugin installé
- [x] ✅ Site généré
- [ ] 📝 Créer mes propres notes
- [ ] 🎨 Personnaliser l'apparence

## 🚀 Prochaines étapes

1. Créez d'autres notes dans \`src/\`
2. Générez régulièrement votre site
3. Déployez le contenu de \`public/\` sur votre hébergeur

---

*Site généré avec Obsidian + Eleventy + markdown-it* 🌟`;

		const examplePath = path.join(srcPath, 'index.md');
		if (!fs.existsSync(examplePath)) {
			fs.writeFileSync(examplePath, exampleNote);
			new Notice('Dossier src/ créé avec une note d\'exemple !');
		} else {
			new Notice('Le dossier src/ existe déjà.');
		}
	}

	async generateSiteData() {
		const dataPath = path.join(this.getPluginPath(), 'data');
		
		const siteData = {
			title: this.settings.siteTitle,
			description: this.settings.siteDescription,
			url: this.settings.baseUrl,
			author: this.settings.author,
			language: "fr",
			buildTime: new Date().toISOString()
		};

		fs.writeFileSync(
			path.join(dataPath, 'site.json'),
			JSON.stringify(siteData, null, 2)
		);
	}

	async serveSite() {
		try {
			await this.ensurePluginStructure();
			await this.ensureSrcFolder();
			await this.generateSiteData();
			
			const eleventyPath = path.join(this.getPluginPath(), 'eleventy');
			const command = `cd "${eleventyPath}" && npx @11ty/eleventy --serve --port=8080`;
			new Notice('Serveur de développement sur http://localhost:8080');
			
			exec(command, (error) => {
				if (error) {
					new Notice(`Erreur serveur : ${error.message}`);
				}
			});
			
		} catch (error) {
			new Notice(`Erreur : ${error.message}`);
		}
	}

	async runEleventy() {
		const eleventyPath = path.join(this.getPluginPath(), 'eleventy');
		const command = `cd "${eleventyPath}" && npx @11ty/eleventy`;
		
		const { stdout, stderr } = await execAsync(command);
		
		if (stderr && !stderr.includes('Warning')) {
			throw new Error(stderr);
		}
		
		console.log('Eleventy output:', stdout);
	}

	getPluginPath(): string {
		return path.join(this.app.vault.configDir, 'plugins', 'obsidian_eleventy_pagedjs');
	}

	getPublicPath(): string {
		return path.join(this.app.vault.adapter.path, 'public');
	}

	openPublicFolder() {
		const publicPath = this.getPublicPath();
		
		if (!fs.existsSync(publicPath)) {
			new Notice('Le site n\'a pas encore été généré.');
			return;
		}
		
		require('electron').shell.openPath(publicPath);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SiteGeneratedModal extends Modal {
	sitePath: string;

	constructor(app: App, sitePath: string) {
		super(app);
		this.sitePath = sitePath;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.empty();
		
		contentEl.createEl('h2', {text: '🎉 Site généré avec succès !'});
		contentEl.createEl('p', {text: `Votre site est prêt dans le dossier public/`});
		
		const infoEl = contentEl.createEl('div', {cls: 'modal-info'});
		infoEl.createEl('p', {text: '✨ Vous pouvez maintenant :'});
		const listEl = infoEl.createEl('ul');
		listEl.createEl('li', {text: '🌐 Déployer le contenu de public/ sur votre hébergeur'});
		listEl.createEl('li', {text: '👀 Prévisualiser avec le serveur de développement'});
		listEl.createEl('li', {text: '📝 Ajouter plus de notes dans src/'});
		
		const buttonContainer = contentEl.createDiv('modal-button-container');
		
		new ButtonComponent(buttonContainer)
			.setButtonText('📁 Ouvrir public/')
			.onClick(() => {
				require('electron').shell.openPath(this.sitePath);
				this.close();
			});
			
		new ButtonComponent(buttonContainer)
			.setButtonText('🌐 Serveur dev')
			.onClick(() => {
				// @ts-ignore
				this.app.plugins.plugins['obsidian_eleventy_pagedjs'].serveSite();
				this.close();
			});
			
		new ButtonComponent(buttonContainer)
			.setButtonText('Fermer')
			.onClick(() => this.close());
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class EleventySettingTab extends PluginSettingTab {
	plugin: EleventyPlugin;

	constructor(app: App, plugin: EleventyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		containerEl.createEl('h2', {text: '⚙️ Paramètres Obsidian → Eleventy'});

		new Setting(containerEl)
			.setName('Titre du site')
			.setDesc('Le titre principal de votre site web')
			.addText(text => text
				.setPlaceholder('Mon Site Obsidian')
				.setValue(this.plugin.settings.siteTitle)
				.onChange(async (value) => {
					this.plugin.settings.siteTitle = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Description du site')
			.setDesc('Description qui apparaîtra dans les métadonnées')
			.addTextArea(text => text
				.setPlaceholder('Site généré depuis Obsidian avec Eleventy')
				.setValue(this.plugin.settings.siteDescription)
				.onChange(async (value) => {
					this.plugin.settings.siteDescription = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Auteur')
			.setDesc('Votre nom en tant qu\'auteur du site')
			.addText(text => text
				.setPlaceholder('Votre nom')
				.setValue(this.plugin.settings.author)
				.onChange(async (value) => {
					this.plugin.settings.author = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('URL de base')
			.setDesc('URL complète de votre site (ex: https://monsite.com)')
			.addText(text => text
				.setPlaceholder('https://monsite.com')
				.setValue(this.plugin.settings.baseUrl)
				.onChange(async (value) => {
					this.plugin.settings.baseUrl = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Titre du site')
			.setDesc('Le titre principal de votre site web')
			.addText(text => text
				.setPlaceholder('Mon Site Obsidian')
				.setValue(this.plugin.settings.siteTitle)
				.onChange(async (value) => {
					this.plugin.settings.siteTitle = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Description du site')
			.setDesc('Description qui apparaîtra dans les métadonnées')
			.addTextArea(text => text
				.setPlaceholder('Site généré depuis Obsidian avec Eleventy')
				.setValue(this.plugin.settings.siteDescription)
				.onChange(async (value) => {
					this.plugin.settings.siteDescription = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Auteur')
			.setDesc('Votre nom en tant qu\'auteur du site')
			.addText(text => text
				.setPlaceholder('Votre nom')
				.setValue(this.plugin.settings.author)
				.onChange(async (value) => {
					this.plugin.settings.author = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('URL de base')
			.setDesc('URL complète de votre site (ex: https://monsite.com)')
			.addText(text => text
				.setPlaceholder('https://monsite.com')
				.setValue(this.plugin.settings.baseUrl)
				.onChange(async (value) => {
					this.plugin.settings.baseUrl = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Génération automatique')
			.setDesc('Régénérer le site automatiquement quand vous modifiez une note dans src/')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoGenerateOnSave)
				.onChange(async (value) => {
					this.plugin.settings.autoGenerateOnSave = value;
					await this.plugin.saveSettings();
					if (value) {
						new Notice('Génération automatique activée !');
					}
				}));

		// Section structure
		containerEl.createEl('h3', {text: '📁 Structure simplifiée'});
		
		const structureEl = containerEl.createEl('div', {cls: 'setting-structure'});
		structureEl.createEl('p', {text: '✨ Dans votre coffre, vous avez seulement :'});
		const structureList = structureEl.createEl('ul');
		structureList.createEl('li', {text: '📝 src/ - Vos notes destinées au site web'});
		structureList.createEl('li', {text: '🌐 public/ - Site généré (prêt à déployer)'});
		
		structureEl.createEl('p', {text: '🔧 Le plugin contient tout le reste (configuration, templates, CSS, etc.)'});

		// Section actions
		containerEl.createEl('h3', {text: '🚀 Actions rapides'});

		new Setting(containerEl)
			.setName('Créer le dossier src/')
			.setDesc('Initialiser src/ avec une note d\'exemple')
			.addButton(button => button
				.setButtonText('📝 Créer src/')
				.onClick(async () => {
					await this.plugin.createSrcFolder();
				}));

		new Setting(containerEl)
			.setName('Ouvrir le dossier public/')
			.setDesc('Voir le site généré')
			.addButton(button => button
				.setButtonText('📁 Ouvrir public/')
				.onClick(() => {
					this.plugin.openPublicFolder();
				}));
	}
}