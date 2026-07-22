// Pre-generates the "Listen to this page" narration audio in Roger's
// ElevenLabs voice. No build step: it imports js/narration.js directly, the
// same module the browser player uses, so words and audio cannot drift.
//
//   NARRATE_ENDPOINT="https://rogerloomis.us/api/tts" node scripts/narrate.mjs
//   ELEVENLABS_API_KEY="..." node scripts/narrate.mjs      (direct, if you hold a key)
//
// Cost control: each section's text is hashed into manifest.json; only new or
// edited sections ever call the API. Unchanged audio is never re-billed.
// Output: audio/narration/<page>/<section>.mp3 (commit these).

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'audio', 'narration');
const MANIFEST = join(OUT, 'manifest.json');

// Same voice + model as the live /api/tts function.
const VOICE_ID = 'XAc0FruUymIjvICmNYkM';
const MODEL_ID = 'eleven_turbo_v2_5';

// Two ways to authenticate the synthesis:
//  - NARRATE_ENDPOINT: post each section to a deployed /api/tts (which holds
//    the key server-side), so no key ever needs to exist on this machine, or
//  - ELEVENLABS_API_KEY: call the ElevenLabs API directly.
const key = process.env.ELEVENLABS_API_KEY;
const endpoint = process.env.NARRATE_ENDPOINT;
if (!key && !endpoint) {
  console.error('Set NARRATE_ENDPOINT or ELEVENLABS_API_KEY. Example:\n  NARRATE_ENDPOINT="https://rogerloomis.us/api/tts" node scripts/narrate.mjs');
  process.exit(1);
}

const { narration } = await import(join(ROOT, 'js', 'narration.js'));

const slugFor = (path) => (path === '/' ? 'home' : path.replace(/^\//, '').replace(/\//g, '-'));

// The same expansion the live /api/tts applies, so the hash reflects exactly
// what gets spoken.
const expandForSpeech = (t) =>
  t
    .replace(/\bBlvd\.?\b/g, 'Boulevard')
    .replace(/\bAve\.?\b/g, 'Avenue')
    .replace(/\bRd\.?\b/g, 'Road')
    .replace(/\bSt\.\s/g, 'Saint ')
    .replace(/\bOH\b/g, 'Ohio')
    .replace(/\bRev\.\s/g, 'Reverend ')
    .replace(/\bDr\.\s/g, 'Doctor ')
    .replace(/\bPh\.?D\.?\b/g, 'P H D')
    .replace(/&/g, ' and ')
    .replace(/\(?(\d{3})\)?[ .-]?(\d{3})[-.](\d{4})\b/g, (_, a, b, c) =>
      [a, b, c].map((g) => g.split('').join(' ')).join(', '))
    .replace(/\b(\d{5})\b/g, (_, z) => z.split('').join(' '));

const hash = (text) => createHash('sha1').update(expandForSpeech(text)).digest('hex').slice(0, 12);

mkdirSync(OUT, { recursive: true });
let manifest = {};
if (existsSync(MANIFEST)) {
  try {
    manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  } catch {
    manifest = {};
  }
}

let generated = 0;
let skipped = 0;
let chars = 0;

for (const [path, page] of Object.entries(narration)) {
  const slug = slugFor(path);
  const dir = join(OUT, slug);
  mkdirSync(dir, { recursive: true });

  for (const section of page.sections) {
    const file = join(dir, `${section.id}.mp3`);
    const id = `${slug}/${section.id}`;
    const h = hash(section.text);
    if (manifest[id] === h && existsSync(file)) {
      skipped += 1;
      continue;
    }
    if (section.text.length > 800) {
      console.error(`FAILED: ${id} is ${section.text.length} chars, over the 800 char /api/tts cap.`);
      process.exit(1);
    }

    process.stdout.write(`generating ${id} (${section.text.length} chars)... `);
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
              text: expandForSpeech(section.text),
              model_id: MODEL_ID,
              voice_settings: { stability: 0.5, similarity_boost: 0.75 },
            }),
          },
        );
    if (!res.ok) {
      console.error(`FAILED (${res.status}): ${await res.text().catch(() => '')}`);
      process.exit(1);
    }
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    manifest[id] = h;
    // Save the manifest as we go, so a crash never re-bills finished work.
    writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
    generated += 1;
    chars += section.text.length;
    console.log('done');
  }
}

console.log(
  `\nNarration audio complete: ${generated} generated (${chars.toLocaleString()} chars billed), ${skipped} unchanged.`,
);
