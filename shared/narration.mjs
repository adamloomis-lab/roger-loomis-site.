// The narration script is READ OFF THE PAGE ITSELF, not hand written, so the
// player reads every word a sighted visitor sees and new copy is narrated
// automatically. One extraction core, two entry points:
//
//   collectFromHtml(html)  - Node, for the pre-generator (scripts/narrate.mjs)
//   collectFromDocument()  - browser, for the player
//
// Both must agree exactly, so both run the same pure string functions over the
// same markup. This is a static site, so the .html file on disk IS what the
// browser renders; the chat widget and this player are injected afterwards and
// are never picked up (they are not top level <section> elements).
//
// Opt outs:
//   data-narrate-skip  never read (search boxes, filter chips, empty states)

// The live /api/tts caps a request at 800 characters, so a long section is
// spoken as several parts. Split on sentence ends, well under the cap.
export const CHUNK_CHARS = 700;

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  mdash: '. ', ndash: ', ', hellip: '...', rsquo: '’', lsquo: '‘',
  rdquo: '”', ldquo: '“', middot: ',', copy: 'copyright ', times: 'x',
};

function decodeEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => (name.toLowerCase() in ENTITIES ? ENTITIES[name.toLowerCase()] : m));
}

// Markup that must never be spoken, wherever it appears inside a block.
const DROP = /<(script|style|svg|form|template|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi;
const DROP_SKIPPED = /<([a-z]+)\b[^>]*\sdata-narrate-skip\b[^>]*>[\s\S]*?<\/\1>/gi;
// Button and chip labels ("Books Available", "Start a Conversation") are
// controls, not prose. A listener does not need them read out mid paragraph.
const DROP_CONTROLS = /<(a|button)\b[^>]*class="[^"]*\b(btn|ask-chip|chip)\b[^"]*"[^>]*>[\s\S]*?<\/\1>/gi;

// Turn a block of markup into the words a person would hear. Block level tags
// become sentence breaks so headings never glue onto the paragraph after them.
export function extractText(html) {
  let s = String(html)
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(DROP, ' ')
    .replace(DROP_SKIPPED, ' ')
    .replace(DROP_CONTROLS, ' ')
    .replace(/<\/(h[1-6]|p|li|div|section|blockquote|td|tr|figcaption)>/gi, '. ')
    .replace(/<br\s*\/?>/gi, '. ')
    .replace(/<[^>]*>/g, ' ');
  s = decodeEntities(s)
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/(?:\.\s*){2,}/g, '. ')
    .replace(/\.\s*([,;:])/g, '$1')
    .trim();
  // Em and en dashes are pauses to the ear, not words.
  return s.replace(/\s*[—–]\s*/g, ', ').replace(/,\s*,/g, ',').replace(/^[\s.,;:]+/, '').trim();
}

function firstHeading(html) {
  const m = String(html).match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i);
  return m ? extractText(m[1]).replace(/\.$/, '') : '';
}

// Split a long section into speakable parts, preferring sentence boundaries.
export function chunk(text, max = CHUNK_CHARS) {
  if (text.length <= max) return [text];
  const parts = [];
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) || [text];
  let buf = '';
  for (const s of sentences) {
    if (buf && (buf + s).length > max) {
      parts.push(buf.trim());
      buf = '';
    }
    if (s.length > max) {
      // A single monster sentence: break it on the nearest space.
      let rest = s;
      while (rest.length > max) {
        let cut = rest.lastIndexOf(' ', max);
        if (cut < max * 0.5) cut = max;
        parts.push((buf + rest.slice(0, cut)).trim());
        buf = '';
        rest = rest.slice(cut);
      }
      buf = rest;
    } else {
      buf += s;
    }
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts.filter(Boolean);
}

// A block is worth narrating only if it carries real prose.
const MIN_CHARS = 60;

function toSections(blocks) {
  const out = [];
  blocks.forEach((block, bi) => {
    const text = extractText(block.html);
    if (text.length < MIN_CHARS) return;
    const heading = firstHeading(block.html) || 'Part ' + (bi + 1);
    const parts = chunk(text);
    parts.forEach((part, pi) => {
      out.push({
        title: parts.length > 1 ? `${heading} (${pi + 1} of ${parts.length})` : heading,
        text: part,
        anchor: block.anchor || null,
        index: bi,
      });
    });
  });
  return out;
}

// ---- Node entry point: scan the raw .html file for top level blocks ----

const BLOCK_OPEN = /<(section|div)\b([^>]*)>/gi;

// Furniture this player and its neighbours inject at runtime: never page copy.
const CHROME_ATTR = /\b(np-root|ar-root|ar-nudge|rl-cookie|mobile-action-bar)\b/;

export function collectFromHtml(html) {
  // Chrome and friends: nav, header and footer are not page content, and the
  // browser side never sees them either (it walks body's own children).
  const src = String(html)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(nav|footer|header)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  const blocks = [];
  let cursor = 0;
  BLOCK_OPEN.lastIndex = 0;
  let m;
  while ((m = BLOCK_OPEN.exec(src))) {
    if (m.index < cursor) continue;                       // nested inside a block we already took
    const tag = m[1].toLowerCase();
    const attrs = m[2] || '';
    // Only page level blocks: every <section>, plus the hero <div>s.
    if (/data-narrate-skip/.test(attrs)) continue;
    if (tag === 'div' && CHROME_ATTR.test(attrs)) continue;
    const end = matchingClose(src, tag, BLOCK_OPEN.lastIndex);
    if (end < 0) continue;
    const anchorMatch = attrs.match(/data-narrate="([^"]+)"/);
    blocks.push({
      html: src.slice(BLOCK_OPEN.lastIndex, end),
      anchor: anchorMatch ? anchorMatch[1] : null,
    });
    cursor = end;
    BLOCK_OPEN.lastIndex = end;
  }
  return toSections(blocks);
}

function matchingClose(src, tag, from) {
  const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
  re.lastIndex = from;
  let depth = 1;
  let m;
  while ((m = re.exec(src))) {
    depth += m[1] ? -1 : 1;
    if (depth === 0) return m.index;
  }
  return -1;
}

// ---- Browser entry point: the same blocks, straight off the document ----

export function collectFromDocument(doc) {
  const d = doc || document;
  const blocks = [];
  for (const el of Array.from(d.body.children)) {
    const tag = el.tagName.toLowerCase();
    if (tag !== 'section' && tag !== 'div') continue;
    if (el.hasAttribute('data-narrate-skip')) continue;
    if (CHROME_ATTR.test(el.id + ' ' + el.className)) continue;
    blocks.push({ html: el.innerHTML, anchor: el.getAttribute('data-narrate'), el });
  }
  const sections = toSections(blocks);
  return sections.map((s) => ({ ...s, el: blocks[s.index] ? blocks[s.index].el : null }));
}

export function pageSlug(pathname) {
  let p = String(pathname).replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  if (p === '' || p === '/') return 'home';
  return p.replace(/^\//, '').replace(/\//g, '-');
}
