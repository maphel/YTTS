// Generates the static product website into website/dist: one page per locale, sitemap, robots,
// headers and a 404 page. Copy lives in website/copy/*.json; see website/README.md.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../website/', import.meta.url));
const output = join(root, 'dist');
const origin = 'https://ytts.christophel.io';
const store = 'https://chromewebstore.google.com/detail/ytts/ipkipmmdaicpfijcddghjpfjpacgdphe';
const github = 'https://github.com/maphel/YTTS';
const published = '2026-11-12'; // date the demo video was published (VideoObject.uploadDate)
// [copy key, BCP 47 tag, endonym, URL slug]
const locales = [
  ['en', 'en', 'English', ''], ['de', 'de', 'Deutsch', 'de'], ['es', 'es', 'Español', 'es'],
  ['fr', 'fr', 'Français', 'fr'], ['it', 'it', 'Italiano', 'it'],
  ['pt', 'pt-BR', 'Português (Brasil)', 'pt-br'], ['pt-PT', 'pt-PT', 'Português (Portugal)', 'pt-pt'],
  ['nl', 'nl', 'Nederlands', 'nl'], ['pl', 'pl', 'Polski', 'pl'], ['tr', 'tr', 'Türkçe', 'tr'],
  ['ru', 'ru', 'Русский', 'ru'], ['uk', 'uk', 'Українська', 'uk'], ['ja', 'ja', '日本語', 'ja'],
  ['ko', 'ko', '한국어', 'ko'], ['zh-CN', 'zh-CN', '简体中文', 'zh-cn'],
  ['zh-TW', 'zh-TW', '繁體中文', 'zh-tw'], ['hi', 'hi', 'हिन्दी', 'hi'],
  ['id', 'id', 'Bahasa Indonesia', 'id'], ['vi', 'vi', 'Tiếng Việt', 'vi'],
  ['ar', 'ar', 'العربية', 'ar'], ['sv', 'sv', 'Svenska', 'sv'],
];
const url = (slug) => (slug ? `/${slug}/` : '/');
const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);
const icons = {
  chrome: '<circle cx="12" cy="12" r="9.3"/><circle cx="12" cy="12" r="3.5"/><path d="M12 8.5h8.6M9 13.8 4.7 6.3M14 14.8l-4.2 7"/>',
  play: '<path d="m9 5 11 7-11 7Z" fill="currentColor" stroke="none"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  theme: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18a9 9 0 0 0 0-18Z" fill="currentColor" stroke="none"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;

// --- copy -----------------------------------------------------------------------------------

const translations = {};
for (const file of (await readdir(join(root, 'copy'))).filter((name) => name.endsWith('.json'))) {
  for (const [key, value] of Object.entries(JSON.parse(await readFile(join(root, 'copy', file), 'utf8')))) {
    assert.ok(!Object.hasOwn(translations, key), `Duplicate locale ${key}`);
    translations[key] = value;
  }
}
const keys = Object.keys(translations.en);
assert.equal(Object.keys(translations).length, locales.length, 'Unexpected locale count');
for (const [code] of locales) {
  assert.ok(translations[code], `Missing locale ${code}`);
  assert.deepEqual(Object.keys(translations[code]).sort(), [...keys].sort(), `${code}: keys differ from en`);
  for (const key of keys) {
    const value = translations[code][key];
    assert.ok(typeof value === 'string' && value.trim() && !value.startsWith('TODO'), `${code}: missing ${key}`);
  }
}

// --- assets ---------------------------------------------------------------------------------

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(join(root, 'assets'), join(output, 'assets'), { recursive: true });
await cp(join(root, 'styles.css'), join(output, 'styles.css'));
await cp(join(root, 'client.js'), join(output, 'client.js'));
// Files are cached for a year (see _headers); the content hash in the query string busts the cache.
const versions = new Map();
const asset = async (path) => {
  if (!versions.has(path)) {
    const hash = createHash('sha256').update(await readFile(join(output, path))).digest('hex').slice(0, 10);
    versions.set(path, `/${path}?v=${hash}`);
  }
  return versions.get(path);
};
const files = {};
for (const path of ['styles.css', 'client.js', 'assets/icon.svg', 'assets/poster.webp', 'assets/poster-portrait.webp',
  'assets/demo.mp4', 'assets/demo-portrait.mp4', 'assets/card-light.webp', 'assets/card-dark.webp']) {
  files[path] = await asset(path);
}

// --- pages ----------------------------------------------------------------------------------

for (const [code, language, , slug] of locales) {
  const t = translations[code];
  const text = (key) => escape(t[key]);
  const canonical = `${origin}${url(slug)}`;
  const install = (className = 'button') => `<a class="${className}" href="${store}" rel="noopener">${className === 'button' ? icon('chrome') : ''}${text(className === 'button' ? 'install' : 'installShort')}</a>`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [{
      '@type': 'SoftwareApplication', name: 'YTTS', description: t.description, url: canonical,
      image: `${origin}/assets/og.jpg`, applicationCategory: 'BrowserApplication', operatingSystem: 'Chrome',
      downloadUrl: store, installUrl: store, license: `${github}/blob/main/LICENSE`, isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      author: { '@type': 'Person', name: 'Marcel Christophel', url: 'https://christophel.io' },
      inLanguage: language,
    }, {
      '@type': 'VideoObject', name: t.pageTitle, description: t.description, inLanguage: 'en',
      thumbnailUrl: `${origin}/assets/og.jpg`, contentUrl: `${origin}/assets/demo.mp4`,
      uploadDate: published, duration: 'PT19S',
    }],
  };
  const html = `<!doctype html>
<html lang="${language}" dir="${code === 'ar' ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>${text('pageTitle')}</title>
  <meta name="description" content="${text('description')}">
  <link rel="canonical" href="${canonical}">
${locales.map(([, lang, , path]) => `  <link rel="alternate" hreflang="${lang}" href="${origin}${url(path)}">`).join('\n')}
  <link rel="alternate" hreflang="x-default" href="${origin}/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="YTTS">
  <meta property="og:title" content="${text('pageTitle')}">
  <meta property="og:description" content="${text('description')}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${origin}/assets/og.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="${files['assets/icon.svg']}" type="image/svg+xml">
  <link rel="stylesheet" href="${files['styles.css']}">
  <script src="${files['client.js']}" defer></script>
  <script type="application/ld+json">${JSON.stringify(structuredData).replace(/</g, '\\u003c')}</script>
</head>
<body>
  <a class="skip" href="#main">${text('skip')}</a>
  <header class="topbar">
    <div class="wrap">
      <a class="brand" href="${url(slug)}"><img src="${files['assets/icon.svg']}" alt="" width="36" height="36">YTTS</a>
      <button class="theme-toggle" type="button" data-toggle-theme aria-label="${text('theme')}">${icon('theme')}</button>
      ${install('button button-small')}
    </div>
  </header>
  <main id="main">
    <section class="hero wrap">
      <h1>${text('title1')} <span>${text('title2')}</span></h1>
      <div class="hero-side">
        <p class="intro">${text('intro')}</p>
        ${install()}
        <p class="trust">${text('trustLine')}</p>
      </div>
      <a class="demo" href="${files['assets/demo.mp4']}" data-demo data-portrait="${files['assets/demo-portrait.mp4']}" aria-label="${text('playDemo')}">
        <picture>
          <source media="(max-width: 720px)" srcset="${files['assets/poster-portrait.webp']}" width="1080" height="1350">
          <img src="${files['assets/poster.webp']}" width="1920" height="1080" alt="" fetchpriority="high">
        </picture>
        <span class="play">${icon('play')}</span>
      </a>
    </section>
    <section class="why wrap">
      <div>
        <h2>${text('whyTitle')}</h2>
        <ul>
          ${[1, 2, 3].map((i) => `<li><h3>${text(`f${i}Title`)}</h3><p>${text(`f${i}Body`)}</p></li>`).join('\n          ')}
        </ul>
        <a class="text-link" href="${github}">${text('sourceLink')}${icon('arrow')}</a>
      </div>
      <div class="card">
        <img class="card-light" src="${files['assets/card-light.webp']}" width="704" height="1022" alt="${text('previewAltLight')}" loading="lazy">
        <img class="card-dark" src="${files['assets/card-dark.webp']}" width="704" height="1022" alt="${text('previewAltDark')}" loading="lazy">
      </div>
    </section>
    <section class="faq wrap" id="faq">
      <h2>${text('faqTitle')}</h2>
      <div>${[1, 2, 3].map((i) => `<details><summary>${text(`q${i}`)}</summary><p>${text(`a${i}`)}</p></details>`).join('')}</div>
    </section>
    <section class="cta wrap">
      <p>${text('trustLine')}</p>
      ${install()}
    </section>
  </main>
  <footer class="wrap">
    <nav>
      <a href="https://christophel.io">${text('by')}</a>
      <a href="${github}">GitHub</a>
      <a href="${github}/blob/main/PRIVACY.md">${text('privacy')} (YTTS)</a>
      <a href="https://christophel.io/datenschutz">${text('privacy')} (christophel.io)</a>
      <a href="https://christophel.io/impressum">${text('legal')}</a>
    </nav>
    <select id="language" aria-label="${text('language')}">
${locales.map(([key, lang, name, path]) => `      <option lang="${lang}" value="${url(path)}"${code === key ? ' selected' : ''}>${escape(name)}</option>`).join('\n')}
    </select>
    <p>${text('affiliation')}</p>
    <noscript><nav>${locales.map(([, lang, name, path]) => `<a href="${url(path)}" lang="${lang}">${escape(name)}</a>`).join(' ')}</nav></noscript>
  </footer>
</body>
</html>
`;
  const directory = slug ? join(output, slug) : output;
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'index.html'), html);
}

// --- site files -----------------------------------------------------------------------------

await writeFile(join(output, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
const alternates = locales.map(([, lang, , path]) => `<xhtml:link rel="alternate" hreflang="${lang}" href="${origin}${url(path)}"/>`).join('');
await writeFile(join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${locales.map(([, , , slug]) => `  <url><loc>${origin}${url(slug)}</loc>${alternates}</url>`).join('\n')}
</urlset>
`);
await writeFile(join(output, '_headers'), `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; media-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'
/assets/*
  Cache-Control: public, max-age=31536000, immutable
/styles.css
  Cache-Control: public, max-age=31536000, immutable
/client.js
  Cache-Control: public, max-age=31536000, immutable
`);
await writeFile(join(output, '404.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>404 — YTTS</title><link rel="stylesheet" href="${files['styles.css']}"><body><main class="wrap cta"><h1>404</h1><a class="button" href="/">YTTS</a></main></body></html>\n`);
console.log(`Built ${locales.length} localized pages, sitemap and static assets in website/dist.`);
