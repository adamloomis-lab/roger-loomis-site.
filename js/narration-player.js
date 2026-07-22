/* "Listen to this page": an audio tour of the current page in Roger's voice.

   Audio is pre-generated per section (scripts/narrate.mjs) and served as static
   files, so listeners cost nothing. Any missing file falls back to the
   browser's own voice, so the player works even before audio exists.

   While a section plays, its [data-narrate] block scrolls into view and gently
   highlights. User initiated only (WCAG 1.4.2), reduced motion aware, and it
   stops cleanly on close or when leaving the page.
*/
import { narration } from './narration.js';

(function () {
  'use strict';

  // Pretty URLs and .html URLs both resolve to the same narration key.
  var path = window.location.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  if (path.length > 1 && path.slice(-1) === '/') path = path.slice(0, -1);
  if (path === '') path = '/';
  var page = narration[path];
  if (!page || !page.sections.length) return;

  var slug = path === '/' ? 'home' : path.replace(/^\//, '').replace(/\//g, '-');
  var sections = page.sections;

  var css = [
    '#np-root{position:fixed;right:20px;bottom:96px;z-index:94;font-family:Montserrat,system-ui,sans-serif;display:flex;flex-direction:column;align-items:flex-end}',
    '#np-pill{display:inline-flex;align-items:center;gap:9px;min-height:44px;padding:11px 17px;border:1px solid #ddd8d0;border-radius:999px;background:rgba(255,255,255,.96);color:#1a1a1a;font:600 13.5px/1 Montserrat,system-ui,sans-serif;cursor:pointer;box-shadow:0 14px 34px -14px rgba(26,26,26,.5);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);transition:transform .18s ease,border-color .18s ease}',
    '#np-pill:hover{transform:translateY(-2px);border-color:#b8963e}',
    '#np-pill svg{width:17px;height:17px;color:#b8963e}',
    '#np-panel{display:none;width:min(92vw,320px);padding:16px;background:#faf8f4;border:1px solid #ddd8d0;border-radius:16px;box-shadow:0 28px 60px -24px rgba(26,26,26,.5)}',
    '#np-root.open #np-panel{display:block;animation:np-pop .22s ease-out}',
    '#np-root.open #np-pill{display:none}',
    '@keyframes np-pop{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}',
    '#np-panel .np-top{display:flex;align-items:flex-start;gap:10px}',
    '#np-panel .np-kicker{margin:0;font:700 10.5px/1 Montserrat,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#8a8378}',
    '#np-panel .np-title{margin:5px 0 0;font:600 17px/1.25 "Cormorant Garamond",Georgia,serif;color:#1a1a1a}',
    '#np-panel .np-count{margin:2px 0 0;font:400 11.5px/1.3 Montserrat,system-ui,sans-serif;color:#8a8378}',
    '#np-close{margin-left:auto;flex:none;width:34px;height:34px;border:0;border-radius:50%;background:none;color:#8a8378;font-size:17px;cursor:pointer}',
    '#np-close:hover{background:#f0ece4;color:#1a1a1a}',
    '.np-ctrls{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:14px}',
    '.np-ctrls button{display:grid;place-items:center;border-radius:50%;cursor:pointer}',
    '.np-step{width:46px;height:46px;border:1px solid #ddd8d0;background:#fff;color:#555}',
    '.np-step:hover:not(:disabled){border-color:#b8963e;color:#1a1a1a}',
    '.np-step:disabled{opacity:.35;cursor:default}',
    '#np-toggle{width:58px;height:58px;border:0;background:#1a1a1a;color:#d4af6a;box-shadow:0 12px 26px -10px rgba(26,26,26,.8)}',
    '#np-toggle:hover{transform:scale(1.05)}',
    '.np-ctrls svg{width:19px;height:19px}',
    '#np-toggle svg{width:23px;height:23px}',
    '.np-ticks{display:flex;gap:6px;margin-top:14px}',
    '.np-ticks span{flex:1;height:4px;border-radius:999px;background:#e4dfd6;transition:background-color .3s ease}',
    '.np-ticks span.done{background:#d4af6a}',
    '.np-ticks span.now{background:#1a1a1a}',
    '.narrate-active{outline:3px solid rgba(184,150,62,.6);outline-offset:-3px;transition:outline-color .4s ease}',
    '@media(forced-colors:active){.narrate-active{outline-color:Highlight}}',
    '@media(max-width:1023px){#np-root{bottom:calc(146px + env(safe-area-inset-bottom));right:14px}}',
    '@media(max-width:600px){#np-root{left:14px;right:14px;align-items:stretch}#np-panel{width:auto}#np-pill{justify-content:center}}',
    '@media(prefers-reduced-motion:reduce){#np-root.open #np-panel,#np-pill,#np-toggle{animation:none;transition:none}}'
  ].join('');

  var I = {
    head: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 14v-2a9 9 0 0 1 18 0v2"/><path d="M21 15a2 2 0 0 1-2 2h-1v-5h1a2 2 0 0 1 2 2z"/><path d="M3 15a2 2 0 0 0 2 2h1v-5H5a2 2 0 0 0-2 2z"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="7 4 20 12 7 20 7 4"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="19 20 9 12 19 4 19 20"/><rect x="5" y="4" width="2.5" height="16" rx="1"/></svg>',
    fwd: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5 4 15 12 5 20 5 4"/><rect x="16.5" y="4" width="2.5" height="16" rx="1"/></svg>'
  };

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var root = document.createElement('div');
  root.id = 'np-root';
  root.innerHTML =
    '<button id="np-pill" type="button" aria-expanded="false" aria-controls="np-panel">' + I.head + 'Listen to this page</button>' +
    '<section id="np-panel" aria-label="Page narration player">' +
      '<div class="np-top">' +
        '<div>' +
          '<p class="np-kicker">' + page.title + '</p>' +
          '<p class="np-title" id="np-sect"></p>' +
          '<p class="np-count" id="np-count" aria-live="polite"></p>' +
        '</div>' +
        '<button id="np-close" type="button" aria-label="Close the narration player">&times;</button>' +
      '</div>' +
      '<div class="np-ctrls">' +
        '<button class="np-step" id="np-prev" type="button" aria-label="Previous section">' + I.back + '</button>' +
        '<button id="np-toggle" type="button" aria-label="Pause narration">' + I.pause + '</button>' +
        '<button class="np-step" id="np-next" type="button" aria-label="Next section">' + I.fwd + '</button>' +
      '</div>' +
      '<div class="np-ticks" id="np-ticks" aria-hidden="true">' +
        sections.map(function () { return '<span></span>'; }).join('') +
      '</div>' +
    '</section>';
  document.body.appendChild(root);

  var pill = root.querySelector('#np-pill');
  var panel = root.querySelector('#np-panel');
  var sectEl = root.querySelector('#np-sect');
  var countEl = root.querySelector('#np-count');
  var prevBtn = root.querySelector('#np-prev');
  var nextBtn = root.querySelector('#np-next');
  var toggleBtn = root.querySelector('#np-toggle');
  var ticks = root.querySelectorAll('#np-ticks span');

  var idx = 0;
  var playing = false;
  var run = 0;                 // monotonic token: stale async work is ignored
  var audio = null;            // ONE element, unlocked by the first tap (iOS)
  var speech = 'speechSynthesis' in window ? window.speechSynthesis : null;
  if (speech) speech.getVoices();

  function pickVoice() {
    if (!speech) return null;
    var voices = speech.getVoices() || [];
    var preferred = ['Daniel', 'Alex', 'Google US English', 'Samantha'];
    for (var i = 0; i < preferred.length; i++) {
      for (var j = 0; j < voices.length; j++) {
        if (voices[j].name.indexOf(preferred[i]) !== -1) return voices[j];
      }
    }
    for (var k = 0; k < voices.length; k++) if (voices[k].lang === 'en-US') return voices[k];
    return voices[0] || null;
  }

  function clearHighlight() {
    var els = document.querySelectorAll('.narrate-active');
    for (var i = 0; i < els.length; i++) els[i].classList.remove('narrate-active');
  }

  function highlight(anchor) {
    clearHighlight();
    if (!anchor) return;
    var el = document.querySelector('[data-narrate="' + anchor + '"]') || document.getElementById(anchor);
    if (!el) return;
    el.classList.add('narrate-active');
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }

  function paint() {
    sectEl.textContent = sections[idx] ? sections[idx].title : '';
    countEl.textContent = 'Part ' + (idx + 1) + ' of ' + sections.length;
    prevBtn.disabled = idx === 0;
    nextBtn.disabled = idx >= sections.length - 1;
    toggleBtn.innerHTML = playing ? I.pause : I.play;
    toggleBtn.setAttribute('aria-label', playing ? 'Pause narration' : 'Play narration');
    for (var i = 0; i < ticks.length; i++) {
      ticks[i].className = i < idx ? 'done' : i === idx ? 'now' : '';
    }
  }

  function stop() {
    run += 1;
    if (audio) { audio.onended = null; audio.onerror = null; audio.pause(); }
    if (speech) speech.cancel();
    clearHighlight();
    playing = false;
    paint();
  }

  function speakFallback(text, token, done) {
    if (!speech) { done(); return; }
    var u = new SpeechSynthesisUtterance(text);
    var v = pickVoice();
    if (v) u.voice = v;
    u.rate = 0.95;
    u.onend = u.onerror = function () { if (run === token) done(); };
    speech.speak(u);
  }

  function play(i) {
    stop();
    var section = sections[i];
    if (!section) { idx = 0; paint(); return; }
    var token = run;
    idx = i;
    playing = true;
    paint();
    highlight(section.anchor);

    var advance = function () {
      if (run !== token) return;
      if (i + 1 < sections.length) play(i + 1);
      else { stop(); idx = 0; paint(); }
    };

    if (!audio) audio = new Audio();
    var fellBack = false;
    var fallback = function () {
      // No pre-generated file yet: read this section with the browser voice.
      if (fellBack || run !== token) return;
      fellBack = true;
      speakFallback(section.text, token, advance);
    };
    audio.onended = function () { if (run === token) advance(); };
    audio.onerror = fallback;
    audio.src = '/audio/narration/' + slug + '/' + section.id + '.mp3';
    var p = audio.play();
    if (p && p.catch) p.catch(fallback);
  }

  pill.addEventListener('click', function () {
    root.classList.add('open');
    pill.setAttribute('aria-expanded', 'true');
    play(0);
  });
  toggleBtn.addEventListener('click', function () {
    if (playing) stop();
    else play(idx);
  });
  prevBtn.addEventListener('click', function () { play(Math.max(0, idx - 1)); });
  nextBtn.addEventListener('click', function () { play(Math.min(sections.length - 1, idx + 1)); });
  root.querySelector('#np-close').addEventListener('click', function () {
    stop();
    idx = 0;
    paint();
    root.classList.remove('open');
    pill.setAttribute('aria-expanded', 'false');
  });
  window.addEventListener('pagehide', stop);

  paint();
})();
