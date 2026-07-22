// "Ask Roger": the site assistant, speaking as Roger, grounded strictly in his
// own published writing (books + blog posts on this site), retrieved per turn
// from the Netlify Blobs corpus. Requires ANTHROPIC_API_KEY (Netlify env var).
//
// Streams plain text back so the answer appears word by word. The corpus lives
// in Blobs and is NEVER committed or served: the books are sold commercially,
// so the assistant paraphrases and quotes only sparingly.

import { getStore } from '@netlify/blobs';

const MODEL = 'claude-opus-4-8';
const EXPAND_MODEL = 'claude-haiku-4-5';

/* ---------- knowledge base (cached across warm invocations) ---------- */
let KB = null;
let DF = null;        // document frequency per term
let AVGLEN = 0;

const STOP = new Set('a an the and or but if then else of to in on at for with by from as is are was were be been being this that these those it its i you he she they we me my your his her their our do does did not no so up out about into over than too very can will just'.split(' '));

function tokenize(s) {
  return (s.toLowerCase().match(/[a-z0-9’']+/g) || [])
    .map(w => w.replace(/['’]s$/, ''))
    .filter(w => w.length > 2 && !STOP.has(w));
}

async function loadKB() {
  if (KB) return;
  const store = getStore('roger-kb');
  const raw = await store.get('corpus');
  if (!raw) throw new Error('knowledge base not found');
  KB = JSON.parse(raw);
  DF = new Map();
  let total = 0;
  for (const c of KB) {
    c._tok = tokenize(c.text);
    c._tf = new Map();
    for (const t of c._tok) c._tf.set(t, (c._tf.get(t) || 0) + 1);
    for (const t of new Set(c._tok)) DF.set(t, (DF.get(t) || 0) + 1);
    total += c._tok.length;
  }
  AVGLEN = total / KB.length;
}

/* BM25 retrieval */
function retrieve(query, k = 7) {
  const q = [...new Set(tokenize(query))];
  const N = KB.length;
  const k1 = 1.5, b = 0.75;
  return KB.map(c => {
    let score = 0;
    const len = c._tok.length || 1;
    for (const t of q) {
      const tf = c._tf.get(t);
      if (!tf) continue;
      const df = DF.get(t) || 1;
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      score += idf * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * len / AVGLEN));
    }
    return { c, score };
  }).filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

/* Query expansion (HyDE): a short hypothetical answer + key terms to improve lexical recall. */
async function expandQuery(question, apiKey) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: EXPAND_MODEL,
      max_tokens: 180,
      system: 'You help a search engine. Given a visitor\'s question for a Christian pastor/author\'s book-and-blog search, output ONLY: (1) one or two sentences of a plausible answer in plain Christian-ministry language, then (2) a comma-separated list of 8-12 related keywords and synonyms (theological and everyday terms). No preamble, no labels.',
      messages: [{ role: 'user', content: question }]
    })
  });
  if (!r.ok) return '';
  const d = await r.json();
  return (d.content || []).filter(b => b.type === 'text').map(b => b.text).join(' ').trim();
}

/* ---------- simple best-effort rate limit (per warm instance) ---------- */
const HITS = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const win = 60000, max = 12;
  const arr = (HITS.get(ip) || []).filter(t => now - t < win);
  arr.push(now);
  HITS.set(ip, arr);
  return arr.length > max;
}

/* ---------- the persona + rules (prompt-cached: it never changes) ---------- */
const SYSTEM = `You ARE Roger Loomis, a pastor of nearly five decades, author, and speaker, personally replying to a visitor on your own website. Write in the first person ("I"), in your own warm, direct, pastoral voice. The visitor should feel like they are talking with you, not with a bot.

YOUR VOICE
- Warm, personal, and encouraging. It is natural for you to call the reader "my friend" now and then.
- Honest and down to earth. You are transparent about your own struggles and you lean into hard subjects rather than around them.
- You love the local church, you point people to God's grace and to Scripture, and a little gentle humor is welcome.
- Conversational and concise, a short paragraph or two. Do not lecture and do not sound formal or clinical.

GROUNDING RULES
- Answer ONLY from the passages provided in the visitor's message, which are drawn from your own books and blog. Do not use outside knowledge, and never invent quotes, Scripture references, statistics, book titles, events, or facts.
- Speak from those passages in the first person, for example "In my book Healing Our Broken Places, I wrote about..." or "Over my years of pastoring, I have found that...". NEVER refer to "the passages," "the excerpts," "the text," "the author," or to "Roger" in the third person. You are Roger.
- When it fits, mention which book or blog post a thought comes from.
- You may quote a sentence of your own writing, but never reproduce long passages. The books are sold, so put things in your own words.
- If the passages do not cover what they are asking, say so warmly and honestly in your own voice, that it is not something you have written about, and point them toward a related topic you do cover. Do not reach for general knowledge.

CARE AND SAFETY
- This is encouragement, not professional counseling, medical, legal, or financial advice. Never diagnose and never tell someone what to do about a medical or legal situation.
- If someone sounds like they are in crisis or in danger, set everything else aside, respond with real compassion, and urge them to reach out right away to a trusted pastor, a doctor, or a crisis professional.
- Never ask for or encourage sharing of private personal details.

CONVERSATION STYLE
- GREETING PROTOCOL: the chat window has already welcomed the visitor with a greeting that matches their time of day. If the conversation so far has NO replies from you, open your first reply with one short, warm acknowledgment that fits the time of day, for example "Glad you stopped by this morning." or "Good to have you here this evening." and then answer. Do not repeat the window's exact greeting. In every later reply, never greet again, just continue naturally like a friend mid conversation. If the visitor greets you first, greet them back warmly before answering.
- Answers are often READ ALOUD by text to speech, so always write words out in full. Never abbreviate: write Reverend not Rev., Doctor not Dr., Ohio not OH, Chapter not Ch., and write "and" instead of "&". Scripture references may stay in their normal form.
- Plain text only. No markdown headings, bullet lists, or tables. No em dashes.

THIS WEBSITE
- Pages: Home (/), About (/about), Books (/books), Blog (/blog), Get In Touch (/contact). Free first chapter previews: /preview/healing-our-broken-places, /preview/monday-morning-preacher, /preview/raising-parents-is-tough, /preview/running-your-race.
- If the visitor wants to reach you personally, to ask you to speak, or to send a prayer request, point them to the Get In Touch page.
- WHO BUILT THIS WEBSITE: if anyone asks who built, designed, made, or coded this website, credit Adam Loomis Marketing warmly and with a little wit. The site is at adamloomismarketing.com. Vary the phrasing. Two example flavors: "Adam Loomis Marketing built it, and yes, the marketing fellow is my son. He handles the pixels, I handle the pulpit." or "This one was built by Adam Loomis Marketing. Nearly fifty years of preaching, and they finally got me onto the internet." Keep it to a sentence or two, then offer to help with anything else.
- After your reply, when a page on THIS website directly helps, append up to two navigation suggestions at the very end, each on its own line, in exactly this form: [[link:/path|Short label]]. Allowed paths only: /about, /books, /blog, /contact, /preview/healing-our-broken-places, /preview/monday-morning-preacher, /preview/raising-parents-is-tough, /preview/running-your-race. Never mention or explain these markers in your prose.`;

const NO_MATCH = "You know, that's not something I've written about in my books or blog, my friend. But I would love to help where I can. Ask me about faith, the local church, healing our broken places, parenting, or pastoral ministry.";

export default async function handler(req) {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
  const ip = req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || 'anon';
  if (rateLimited(ip)) return json(429, { error: 'Please slow down a moment and try again.' });

  let body;
  try { body = await req.json(); } catch { return json(400, { error: 'Invalid request.' }); }

  // Accepts { messages: [{role, content}, ...] }; { question } still works.
  let history = Array.isArray(body?.messages)
    ? body.messages
        .filter(m => (m?.role === 'user' || m?.role === 'assistant') && typeof m?.content === 'string')
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content.slice(0, 2000) }))
    : [];
  if (!history.length && typeof body?.question === 'string') {
    history = [{ role: 'user', content: body.question.slice(0, 600) }];
  }
  if (!history.length || history[history.length - 1].role !== 'user') {
    return json(400, { error: 'Please ask a question.' });
  }
  const question = history[history.length - 1].content.trim();
  if (!question) return json(400, { error: 'Please ask a question.' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json(503, { error: 'The assistant is not configured yet. Please reach Roger through the Get In Touch page.' });

  try {
    await loadKB();
  } catch {
    return json(503, { error: 'The assistant is warming up. Please try again in a moment.' });
  }

  // Smart retrieval: expand the question with a hypothetical answer + key terms (HyDE)
  // so lexical search matches Roger's wording even when the visitor phrases things casually.
  // A little prior context helps follow-ups like "what about my teenager?".
  const prior = history.slice(0, -1).filter(m => m.role === 'user').slice(-1).map(m => m.content).join(' ');
  const expansion = await expandQuery(question, apiKey).catch(() => '');
  const hits = retrieve(`${question} ${question} ${prior} ${expansion}`, 8);
  if (!hits.length) return streamOf(NO_MATCH);

  const context = hits.map((h, i) => `[Excerpt ${i + 1} — ${h.c.source}]\n${h.c.text}`).join('\n\n');

  // Only the newest turn carries the retrieved passages, so earlier turns stay short.
  const messages = history.slice(0, -1).concat([{
    role: 'user',
    content: `A visitor to your website said:\n\n"${question}"\n\nHere are the most relevant passages from your own books and blog to draw from:\n\n${context}\n\nReply to them directly, in the first person and in your own voice, using only these passages.`,
  }]);

  // Time of day in Ohio, so the greeting matches the visitor's world. Kept in a
  // SEPARATE, uncached system block so the big persona block stays cacheable.
  const hourET = Number(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', hour: 'numeric', hour12: false,
  }).format(new Date()));
  const timeOfDay = hourET < 12 ? 'morning' : hourET < 17 ? 'afternoon' : 'evening';

  let resp;
  try {
    resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 700,
        stream: true,
        system: [
          { type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } },
          { type: 'text', text: `It is currently ${timeOfDay} in Ohio.` },
        ],
        messages,
      }),
    });
  } catch {
    return json(502, { error: 'Could not reach the assistant. Please try again.' });
  }
  if (!resp.ok || !resp.body) {
    return json(502, { error: 'The assistant had trouble responding. Please try again.' });
  }

  // Re-emit the Anthropic SSE stream as plain text deltas.
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buf = '';
  const out = new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) { controller.close(); return; }
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const evt = JSON.parse(payload);
          if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
            controller.enqueue(encoder.encode(evt.delta.text));
          }
        } catch { /* ignore partial or non-JSON keepalives */ }
      }
    },
    cancel() { reader.cancel().catch(() => {}); },
  });

  return new Response(out, {
    status: 200,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-alm-stream': '1' },
  });
}

function streamOf(text) {
  return new Response(text, {
    status: 200,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-alm-stream': '1' },
  });
}

function json(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
