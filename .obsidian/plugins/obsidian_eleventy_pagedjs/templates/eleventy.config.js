const markdownIt = require("markdown-it");
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
	linkify: false,
    typographer: true

  })
  
  // Plugin pour les ancres automatiques dans les titres
  .use(markdownItAnchor, {
    permalink: markdownItAnchor.permalink.linkInsideHeader({
      symbol: '#',
      placement: 'after',
      class: 'header-anchor'
    }),
    level: [2, 3, 4, 5, 6],
    slugify: function(str) {
      return str
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
  })
  
  // Table des matières automatique
  .use(markdownItTOC, {
    includeLevel: [2, 3, 4, 5],
    containerClass: "table-of-contents",
    containerHeaderHtml: '<div class="toc-header">📋 Table des matières</div>',
    listType: 'ul',
    markerPattern: /^\[\[toc\]\]$/im,
    transformLink: function(href, anchor) {
      return href;
    }
  })
  
  // Notes de bas de page
  .use(markdownItFootnote)
  
  // Listes de tâches (checkboxes)
  .use(markdownItTaskLists, {
    enabled: true,
    label: true,
    labelAfter: true,
    lineNumber: true
  })
  
  // Attributs CSS/HTML personnalisés
  .use(markdownItAttrs, {
    leftDelimiter: '{',
    rightDelimiter: '}',
    allowedAttributes: ['id', 'class', 'style', 'data-*', 'aria-*']
  })
  
  // Coloration syntaxique avec Highlight.js
  .use(markdownItHighlightJS, {
    auto: true,
    code: true,
    inline: false,
    hljs: require('highlight.js')
  })
  
  // Toutes les extensions markdown-it
  .use(markdownItAbbr)
  .use(markdownItDeflist)
  .use(markdownItEmoji, {
    defs: {
      obsidian: '🔮',
      eleventy: '🕚',
      note: '📝',
      tip: '💡',
      warning: '⚠️',
      info: 'ℹ️'
    }
  })
  .use(markdownItIns)
  .use(markdownItMark)
  .use(markdownItSub)
  .use(markdownItSup)
  
  // Callouts Obsidian complets
  .use(markdownItContainer, 'note', {
    validate: function(params) {
      return params.trim().match(/^note\s*(.*)$/);
    },
    render: function (tokens, idx) {
      const token = tokens[idx];
      const info = token.info.trim().slice(4).trim();
      const title = info || 'Note';
      
      if (token.nesting === 1) {
        return `<div class="callout callout-note">\n<div class="callout-title">📝 ${title}</div>\n<div class="callout-content">\n`;
      } else {
        return '</div>\n</div>\n';
      }
    }
  })
  
  .use(markdownItContainer, 'warning', {
    validate: function(params) {
      return params.trim().match(/^warning\s*(.*)$/);
    },
    render: function (tokens, idx) {
      const token = tokens[idx];
      const info = token.info.trim().slice(7).trim();
      const title = info || 'Attention';
      
      if (token.nesting === 1) {
        return `<div class="callout callout-warning">\n<div class="callout-title">⚠️ ${title}</div>\n<div class="callout-content">\n`;
      } else {
        return '</div>\n</div>\n';
      }
    }
  })
  
  .use(markdownItContainer, 'tip', {
    validate: function(params) {
      return params.trim().match(/^tip\s*(.*)$/);
    },
    render: function (tokens, idx) {
      const token = tokens[idx];
      const info = token.info.trim().slice(3).trim();
      const title = info || 'Astuce';
      
      if (token.nesting === 1) {
        return `<div class="callout callout-tip">\n<div class="callout-title">💡 ${title}</div>\n<div class="callout-content">\n`;
      } else {
        return '</div>\n</div>\n';
      }
    }
  })
  
  .use(markdownItContainer, 'info', {
    validate: function(params) {
      return params.trim().match(/^info\s*(.*)$/);
    },
    render: function (tokens, idx) {
      const token = tokens[idx];
      const info = token.info.trim().slice(4).trim();
      const title = info || 'Information';
      
      if (token.nesting === 1) {
        return `<div class="callout callout-info">\n<div class="callout-title">ℹ️ ${title}</div>\n<div class="callout-content">\n`;
      } else {
        return '</div>\n</div>\n';
      }
    }
  })
  
  .use(markdownItContainer, 'success', {
    validate: function(params) {
      return params.trim().match(/^success\s*(.*)$/);
    },
    render: function (tokens, idx) {
      const token = tokens[idx];
      const info = token.info.trim().slice(7).trim();
      const title = info || 'Succès';
      
      if (token.nesting === 1) {
        return `<div class="callout callout-success">\n<div class="callout-title">✅ ${title}</div>\n<div class="callout-content">\n`;
      } else {
        return '</div>\n</div>\n';
      }
    }
  })
  
  .use(markdownItContainer, 'danger', {
    validate: function(params) {
      return params.trim().match(/^danger\s*(.*)$/);
    },
    render: function (tokens, idx) {
      const token = tokens[idx];
      const info = token.info.trim().slice(6).trim();
      const title = info || 'Danger';
      
      if (token.nesting === 1) {
        return `<div class="callout callout-danger">\n<div class="callout-title">🚨 ${title}</div>\n<div class="callout-content">\n`;
      } else {
        return '</div>\n</div>\n';
      }
    }
  });

  // Plugin personnalisé pour les liens internes Obsidian [[]]
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
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        const token = state.push('obsidian_link', '', 0);
        token.content = linkText;
        token.attrSet('href', `/${slug}/`);
        token.attrSet('class', 'internal-link');
        token.attrSet('data-note', linkPath);
      }
      
      state.pos = pos + 2;
      return true;
    });
    
    md.renderer.rules.obsidian_link = function(tokens, idx) {
      const token = tokens[idx];
      const href = token.attrGet('href');
      const className = token.attrGet('class');
      const dataNote = token.attrGet('data-note');
      const content = token.content;
      
      return `<a href="${href}" class="${className}" data-note="${dataNote}" title="Lien vers ${dataNote}">${content}</a>`;
    };
  });

  // Plugin personnalisé pour les images Obsidian ![[]]
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
        const width = parts[2] ? parts[2].trim() : null;
        
        const token = state.push('obsidian_image', '', 0);
        token.content = altText;
        token.attrSet('src', `/assets/${imagePath}`);
        token.attrSet('alt', altText);
        token.attrSet('class', 'obsidian-image');
        token.attrSet('loading', 'lazy');
        
        if (width) {
          token.attrSet('width', width);
        }
      }
      
      state.pos = pos + 2;
      return true;
    });
    
    md.renderer.rules.obsidian_image = function(tokens, idx) {
      const token = tokens[idx];
      const src = token.attrGet('src');
      const alt = token.attrGet('alt');
      const className = token.attrGet('class');
      const loading = token.attrGet('loading');
      const width = token.attrGet('width');
      
      let attributes = `src="${src}" alt="${alt}" class="${className}" loading="${loading}"`;
      if (width) {
        attributes += ` width="${width}"`;
      }
      
      return `<img ${attributes}>`;
    };
  });

  // Plugin pour les tags #tag
  markdownLibrary.use(function(md) {
    md.inline.ruler.push('hashtag', function(state, silent) {
      const start = state.pos;
      const max = state.posMax;
      
      if (state.src.charCodeAt(start) !== 0x23/* # */) return false;
      if (start > 0 && state.src.charCodeAt(start - 1) === 0x23) return false;
      
      let pos = start + 1;
      while (pos < max && /[\w\u00C0-\u017F-]/.test(state.src[pos])) {
        pos++;
      }
      
      if (pos === start + 1) return false;
      if (pos < max && /\w/.test(state.src[pos])) return false;
      
      if (!silent) {
        const tag = state.src.slice(start + 1, pos);
        const token = state.push('hashtag', '', 0);
        token.content = tag;
      }
      
      state.pos = pos;
      return true;
    });
    
    md.renderer.rules.hashtag = function(tokens, idx) {
      const tag = tokens[idx].content;
      const slug = tag.toLowerCase().replace(/[^\w-]/g, '');
      return `<a href="/tags/${slug}/" class="tag" data-tag="${tag}">#${tag}</a>`;
    };
  });

  eleventyConfig.setLibrary("md", markdownLibrary);

  // Gestion automatique des chemins
  const vaultPath = path.resolve(__dirname, '../../..');
  const pluginPath = path.resolve(__dirname, '..');
  
  // Copie des assets avec détection automatique
  const attachmentsPaths = [
    path.join(vaultPath, 'attachments'),
    path.join(vaultPath, 'assets'),
    path.join(vaultPath, 'images'),
    path.join(vaultPath, 'img'),
    path.join(vaultPath, 'media')
  ];
  
  attachmentsPaths.forEach(attachPath => {
    if (fs.existsSync(attachPath)) {
      eleventyConfig.addPassthroughCopy({ 
        [attachPath]: "assets" 
      });
    }
  });
  
  eleventyConfig.addPassthroughCopy({ 
    [path.join(pluginPath, "static")]: "static" 
  });
  
  const userStaticPath = path.join(vaultPath, "src", "static");
  if (fs.existsSync(userStaticPath)) {
    eleventyConfig.addPassthroughCopy({ 
      [userStaticPath]: "static" 
    });
  }

  // Filters complets
  eleventyConfig.addFilter("slug", function(str) {
    if (!str) return '';
    return str.toString().toLowerCase().trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  });

  eleventyConfig.addFilter("date", function(date, format) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    
    switch(format) {
      case 'YYYY-MM-DD': return d.toISOString().split('T')[0];
      case 'DD/MM/YYYY': return d.toLocaleDateString('fr-FR');
      case 'iso': return d.toISOString();
      case 'readable': return d.toLocaleDateString('fr-FR', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      });
      default: return d.toLocaleDateString('fr-FR');
    }
  });

  eleventyConfig.addFilter("excerpt", function(content, length = 150) {
    if (!content) return '';
    const text = content.toString().replace(/<[^>]*>/g, '');
    return text.length > length ? text.substring(0, length).trim() + '…' : text;
  });

  eleventyConfig.addFilter("limit", function(array, limit) {
    return Array.isArray(array) ? array.slice(0, limit) : [];
  });

  eleventyConfig.addFilter("reverse", function(array) {
    return Array.isArray(array) ? [...array].reverse() : [];
  });

  eleventyConfig.addFilter("sortByDate", function(array) {
    if (!Array.isArray(array)) return [];
    return [...array].sort((a, b) => {
      const dateA = new Date(a.date || a.data?.date || 0);
      const dateB = new Date(b.date || b.data?.date || 0);
      return dateB - dateA;
    });
  });

  eleventyConfig.addFilter("filterByTag", function(collection, tag) {
    if (!Array.isArray(collection) || !tag) return [];
    return collection.filter(item => {
      const tags = item.data?.tags || item.tags || [];
      return Array.isArray(tags) && tags.includes(tag);
    });
  });

  // Collections optimisées
  eleventyConfig.addCollection("notes", function(collectionApi) {
    return collectionApi.getFilteredByGlob(path.join(vaultPath, "src/**/*.md"))
      .filter(item => !item.data.draft && item.data.title)
      .sort((a, b) => {
        const dateA = new Date(a.date || a.data?.date || 0);
        const dateB = new Date(b.date || b.data?.date || 0);
        return dateB - dateA;
      });
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
      tagMap[tag].sort((a, b) => {
        const dateA = new Date(a.date || a.data?.date || 0);
        const dateB = new Date(b.date || b.data?.date || 0);
        return dateB - dateA;
      });
    });
    
    return tagMap;
  });

  eleventyConfig.addCollection("allTags", function(collectionApi) {
    const notes = collectionApi.getFilteredByGlob(path.join(vaultPath, "src/**/*.md"));
    const tagSet = new Set();
    
    notes.forEach(note => {
      const tags = note.data?.tags || [];
      if (Array.isArray(tags)) {
        tags.forEach(tag => tagSet.add(tag));
      }
    });
    
    return Array.from(tagSet).sort();
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
};