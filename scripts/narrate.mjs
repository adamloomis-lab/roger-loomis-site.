// Pre-generates the "Listen to this page" audio in Roger's ElevenLabs voice.
//
//   NARRATE_ENDPOINT="https://rogerloomis.us/api/tts" node scripts/narrate.mjs
//   ELEVENLABS_API_KEY="..." node scripts/narrate.mjs      (direct, if you hold a key)
//
// The script is read off the pages themselves through shared/narration.mjs, the
// same module the browser player uses, so the words spoken and the words
// generated cannot drift. Each file is NAMED after a hash of its own spoken
// text, so edited copy simply has no file and the player falls back to the
// browser voice reading the current words. Unchanged parts are never re-billed.
//
// Output: audio/narration/<page>/<hash>.mp3 (commit these). Orphans are pruned.

import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectFromHtml, pageSlug } from '../shared/narration.mjs';
import { expandForSpeech } from '../shared/speech.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'audio', 'narration');

// Every page that carries the player.
const PAGES = ['index.html', 'about.html', 'books.html', 'blog.html', 'contact.html'];

const VOICE_ID = 'XAc0FruUymIjvICmNYkM';
const MODEL_ID = 'eleven_turbo_v2_5';
const MAX_CHARS = 800; // the live /api/tts cap; it truncates silently past this

const key = process.env.ELEVENLABS_API_KEY;
const endpoint = process.env.NARRATE_ENDPOINT;
if (!key && !endpoint) {
  console.error('Set NARRATE_ENDPOINT or ELEVENLABS_API_KEY. Example:\n  NARRATE_ENDPOINT="https://rogerloomis.us/api/tts" node scripts/narrate.mjs');
  process.exit(1);
}

const hashOf = (text) =>
  createHash('sha1').update(expandForSpeech(text)).digest('hex').slice(0, 16);

let generated = 0;
let skipped = 0;
let pruned = 0;
let chars = 0;

for (const file of PAGES) {
  const path = join(ROOT, file);
  if (!existsSync(path)) {
    console.error(`missing page: ${file}`);
    process.exit(1);
  }
  const slug = pageSlug('/' + file);
  const sections = collectFromHtml(readFileSync(path, 'utf8'));
  const dir = join(OUT, slug);
  mkdirSync(dir, { recursive: true });

  const wanted = new Set();
  console.log(`\n${file} -> ${slug}: ${sections.length} parts`);

  for (const section of sections) {
    const spoken = expandForSpeech(section.text);
    if (spoken.length > MAX_CHARS) {
      console.error(`FAILED: a part of ${slug} expands to ${spoken.length} chars, over the ${MAX_CHARS} cap. Lower CHUNK_CHARS.`);
      process.exit(1);
    }
    const h = hashOf(section.text);
    wanted.add(`${h}.mp3`);
    const out = join(dir, `${h}.mp3`);
    if (existsSync(out)) {
      skipped += 1;
      continue;
    }

    process.stdout.write(`  generating ${h} (${section.text.length} chars) ${JSON.stringify(section.title.slice(0, 40))}... `);
    const res = endpoint
      ? await fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ text: section.text }),
        })
      : await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
          {
            method: 'POST',
            headers: { 'xi-api-key': key, 'content-type': 'application/json' },
            body: JSON.stringify({
              text: spoken,
              model_id: MODEL_ID,
              voice_settings: { stability: 0.5, similarity_boost: 0.75 },
            }),
          },
        );
    if (!res.ok) {
      console.error(`FAILED (${res.status}): ${await res.text().catch(() => '')}`);
      process.exit(1);
    }
    writeFileSync(out, Buffer.from(await res.arrayBuffer()));
    generated += 1;
    chars += section.text.length;
    console.log('done');
  }

  // Copy changed: drop audio no page asks for any more.
  for (const existing of readdirSync(dir)) {
    if (existing.endsWith('.mp3') && !wanted.has(existing)) {
      unlinkSync(join(dir, existing));
      pruned += 1;
    }
  }
}

console.log(
  `\nNarration audio complete: ${generated} generated (${chars.toLocaleString()} chars billed), ${skipped} unchanged, ${pruned} orphans pruned.`,
);
