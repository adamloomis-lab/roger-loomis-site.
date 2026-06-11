import { getStore } from '@netlify/blobs';

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
  const scored = KB.map(c => {
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
  return scored;
}

/* Query expansion (HyDE): a short hypothetical answer + key terms to improve lexical recall. */
async function expandQuery(question, apiKey) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
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

const SYSTEM = `You are "Ask Roger," a warm, encouraging assistant on the website of pastor and author Roger Loomis. You answer questions using ONLY the excerpts provided to you from Roger's books and blog posts.

Rules:
- Answer strictly from the provided excerpts. Do not use outside knowledge, and do not invent quotes, Scripture references, or facts.
- If the excerpts do not cover the question, reply briefly that Roger doesn't really touch on that subject in his books or blog, and (if relevant) suggest a related topic he does cover. Do not try to answer from general knowledge.
- Speak warmly and pastorally, in Roger's encouraging spirit, but keep answers concise (a short paragraph or two).
- You may briefly quote a sentence, but never reproduce long passages verbatim — paraphrase and summarize instead.
- When you draw on a source, mention it naturally (e.g., "In Healing Our Broken Places, Roger explains...").
- This is encouragement and information, not professional counseling, medical, or legal advice.`;

export default async function handler(req) {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
  const ip = req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || 'anon';
  if (rateLimited(ip)) return json(429, { error: 'Please slow down a moment and try again.' });

  let body;
  try { body = await req.json(); } catch { return json(400, { error: 'Invalid request.' }); }
  const question = (body && typeof body.question === 'string') ? body.question.slice(0, 600).trim() : '';
  if (!question) return json(400, { error: 'Please ask a question.' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json(503, { error: 'The assistant is not configured yet.' });

  try {
    await loadKB();
  } catch {
    return json(503, { error: 'The assistant is warming up. Please try again in a moment.' });
  }

  // Smart retrieval: expand the question with a hypothetical answer + key terms (HyDE)
  // so lexical search matches Roger's wording even when the visitor phrases things casually.
  const expansion = await expandQuery(question, apiKey).catch(() => '');
  const hits = retrieve(question + ' ' + question + ' ' + expansion, 8);
  if (!hits.length) {
    return json(200, { answer: "That doesn't seem to be something Roger touches on in his books or blog. Feel free to ask about faith, the local church, healing, parenting, or pastoral ministry.", sources: [] });
  }

  const context = hits.map((h, i) => `[Excerpt ${i + 1} — ${h.c.source}]\n${h.c.text}`).join('\n\n');
  const sources = [...new Set(hits.map(h => h.c.source))];

  const userMsg = `A visitor asked: "${question}"\n\nHere are the most relevant excerpts from Roger's books and blog:\n\n${context}\n\nAnswer the visitor's question using only these excerpts, following your rules.`;

  let resp;
  try {
    resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 700,
        system: SYSTEM,
        messages: [{ role: 'user', content: userMsg }]
      })
    });
  } catch {
    return json(502, { error: 'Could not reach the assistant. Please try again.' });
  }

  if (!resp.ok) {
    return json(502, { error: 'The assistant had trouble responding. Please try again.' });
  }
  const data = await resp.json();
  const answer = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim()
    || "I'm sorry, I couldn't find an answer in Roger's writing for that.";

  return json(200, { answer, sources });
}

function json(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
  });
}
