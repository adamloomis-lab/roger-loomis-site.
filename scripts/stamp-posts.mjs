// Stamp every blog post with its upload date and keep the blog index sorted newest first.
//
// Run after adding a post:   node scripts/stamp-posts.mjs
//
// What it does, and it is safe to run again:
//   1. Dates each blog/<slug>.html from the day the file was first committed
//      (git). A file that is not committed yet gets today's date. A date already
//      written into the post wins, so you can hand-edit a date and it will stick.
//   2. Writes the date into the post page (visible <time> in the meta line) and
//      into the BlogPosting JSON-LD (datePublished / dateModified).
//   3. Removes the scroll-reveal class from the article body so the post text is
//      never hidden behind an animation that may not fire on phones.
//   4. Adds data-date + a visible date to each card in blog.html and reorders the
//      cards newest first.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, basename } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const BLOG_DIR = resolve(ROOT, 'blog');
const INDEX = resolve(ROOT, 'blog.html');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const pretty = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
};
const today = () => new Date().toISOString().slice(0, 10);

function gitAddedDate(relPath) {
  try {
    const out = execSync(`git log --diff-filter=A --format=%ad --date=short -- "${relPath}"`, { cwd: ROOT, encoding: 'utf8' }).trim();
    const lines = out.split('\n').filter(Boolean);
    return lines.length ? lines[lines.length - 1] : null;
  } catch {
    return null;
  }
}

const dates = {}; // slug -> ISO date

// 1 + 2 + 3: post pages
for (const file of readdirSync(BLOG_DIR).filter((f) => f.endsWith('.html')).sort()) {
  const slug = basename(file, '.html');
  const path = resolve(BLOG_DIR, file);
  let html = readFileSync(path, 'utf8');
  const before = html;

  // Existing date in the page wins.
  const existing = html.match(/"datePublished":\s*"(\d{4}-\d{2}-\d{2})"/);
  const iso = existing ? existing[1] : gitAddedDate(`blog/${file}`) || today();
  dates[slug] = iso;

  // Never gate the article body or sidebar behind the reveal animation.
  html = html
    .replace('<article class="post-article reveal">', '<article class="post-article">')
    .replace('<aside class="post-sidebar reveal"', '<aside class="post-sidebar"');

  // Visible date in the meta line.
  html = html.replace(
    /<div class="post-meta">([^<]*?)(?:\s*<span class="post-meta__sep"[^>]*>[^<]*<\/span>\s*<time[^>]*>[^<]*<\/time>)?<\/div>/,
    (_m, cat) => `<div class="post-meta">${cat.trim()} <span class="post-meta__sep" aria-hidden="true">&middot;</span> <time datetime="${iso}">${pretty(iso)}</time></div>`
  );

  // Structured data.
  if (existing) {
    html = html.replace(/"dateModified":\s*"\d{4}-\d{2}-\d{2}"/, `"dateModified": "${iso}"`);
  } else {
    html = html.replace(
      /("@type": "BlogPosting",[\s\S]*?"headline": "[^"\n]*",\n)/,
      `$1      "datePublished": "${iso}",\n      "dateModified": "${iso}",\n`
    );
  }

  if (html !== before) writeFileSync(path, html);
  console.log(`${iso}  ${slug}${html !== before ? '' : '  (unchanged)'}`);
}

// 4: blog index cards
const index = readFileSync(INDEX, 'utf8');
const OPEN = '<div class="blog-grid" id="blog-grid">';
const gridStart = index.indexOf(OPEN);
const gridEnd = index.indexOf('<p class="blog-empty"', gridStart);
if (gridStart === -1 || gridEnd === -1) throw new Error('blog-grid not found in blog.html');

const gridHead = index.slice(0, gridStart + OPEN.length);
const gridBody = index.slice(gridStart, gridEnd);
const gridTail = index.slice(gridEnd);

const cards = gridBody.match(/<article class="blog-card"[\s\S]*?<\/article>/g) || [];
const stamped = cards.map((card) => {
  const slug = (card.match(/href="blog\/([^"]+)\.html"/) || [])[1];
  const iso = dates[slug];
  if (!iso) {
    console.warn(`No post file for card "${slug}", left as is`);
    return { iso: '0000-00-00', card };
  }
  let c = card.replace(/ data-date="[^"]*"/, '');
  c = c.replace('<article class="blog-card"', `<article class="blog-card" data-date="${iso}"`);
  c = c.replace(
    /<div class="blog-card__meta">([^<]*?)(?:\s*<span class="blog-card__sep"[^>]*>[^<]*<\/span>\s*<time[^>]*>[^<]*<\/time>)?<\/div>/,
    (_m, cat) => `<div class="blog-card__meta">${cat.trim()} <span class="blog-card__sep" aria-hidden="true">&middot;</span> <time datetime="${iso}">${pretty(iso)}</time></div>`
  );
  return { iso, card: c };
});

// Newest first. Cards that share a date keep their current relative order.
const sorted = stamped
  .map((s, i) => ({ ...s, i }))
  .sort((a, b) => (a.iso < b.iso ? 1 : a.iso > b.iso ? -1 : a.i - b.i));

const next = gridHead + '\n' + sorted.map((s) => '      ' + s.card).join('\n') + '\n    </div>\n    ' + gridTail;
if (next !== index) {
  writeFileSync(INDEX, next);
  console.log(`blog.html: ${sorted.length} cards dated and sorted newest first`);
} else {
  console.log('blog.html: unchanged');
}
