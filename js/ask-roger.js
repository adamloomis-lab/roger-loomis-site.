/* Ask Roger: the site assistant, in Roger's own voice, grounded in his books
   and blog. Self-contained (injects its own CSS), no dependencies.

   Built for older visitors: a labeled pill launcher, 16px type, large tap
   targets, a Listen button that reads any answer aloud in Roger's ElevenLabs
   voice (/api/tts) with the browser voice as fallback, and a mic button for
   asking out loud. Any element with [data-ask-roger] opens the chat; a value
   on that attribute is sent as the question. window.askRoger(q) does the same.
*/
(function () {
  'use strict';
  if (window.__askRogerLoaded) return;
  window.__askRogerLoaded = true;

  var API = '/api/ask-roger';
  var TTS = '/api/tts';
  var GREET_KEY = 'roger-chat-greeted';

  var STARTERS = [
    'How do I heal from past hurts?',
    'Why should I be part of a local church?',
    'What have you learned about parenting?'
  ];

  /* ---------------- styles ---------------- */
  var css = [
    '#ar-root{font-family:Montserrat,system-ui,sans-serif}',
    '.ar-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}',
    '#ar-launch{position:fixed;right:20px;bottom:28px;z-index:95;display:inline-flex;align-items:center;gap:10px;padding:14px 20px 14px 16px;border:1px solid rgba(184,150,62,.5);border-radius:999px;background:#1a1a1a;color:#faf8f4;font:600 15px/1 Montserrat,system-ui,sans-serif;cursor:pointer;box-shadow:0 14px 34px rgba(0,0,0,.35);transition:transform .18s ease,border-color .18s ease}',
    '#ar-launch:hover{transform:translateY(-2px);border-color:#b8963e}',
    '#ar-launch:active{transform:scale(.97)}',
    '#ar-launch .ar-dot{position:absolute;top:-3px;right:-3px;width:14px;height:14px;border-radius:50%;background:#b8963e;box-shadow:0 0 0 2px #1a1a1a}',
    '#ar-launch svg{width:24px;height:24px;color:#d4af6a}',
    '#ar-nudge{position:fixed;right:20px;bottom:96px;z-index:95;width:270px;padding:16px 16px 16px 14px;background:#fff;border:1px solid #ddd8d0;border-radius:16px;box-shadow:0 28px 60px -24px rgba(26,26,26,.5);text-align:left}',
    '#ar-nudge button.ar-nudge-open{display:flex;gap:11px;align-items:flex-start;background:none;border:0;padding:0;text-align:left;cursor:pointer;width:100%}',
    '#ar-nudge .ar-nudge-ic{flex:none;width:34px;height:34px;border-radius:9px;background:#1a1a1a;display:grid;place-items:center}',
    '#ar-nudge .ar-nudge-ic svg{width:18px;height:18px;color:#d4af6a}',
    '#ar-nudge strong{display:block;font:600 15px/1.3 Montserrat,system-ui,sans-serif;color:#1a1a1a}',
    '#ar-nudge span.ar-nudge-sub{display:block;margin-top:3px;font:400 13px/1.5 Montserrat,system-ui,sans-serif;color:#555}',
    '#ar-nudge .ar-nudge-x{position:absolute;top:6px;right:6px;width:30px;height:30px;border:0;background:none;border-radius:50%;color:#8a8378;cursor:pointer;font-size:16px;line-height:1}',
    '#ar-nudge .ar-nudge-x:hover{background:#f5f3ef;color:#1a1a1a}',
    '#ar-panel{position:fixed;right:20px;bottom:96px;z-index:96;width:min(92vw,420px);max-height:min(70vh,640px);display:none;flex-direction:column;overflow:hidden;background:#faf8f4;border:1px solid #ddd8d0;border-radius:18px;box-shadow:0 30px 70px -20px rgba(26,26,26,.55)}',
    '#ar-panel.open{display:flex;animation:ar-pop .22s ease-out}',
    '@keyframes ar-pop{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}',
    '#ar-head{display:flex;align-items:center;gap:13px;padding:16px 18px;background:#1a1a1a;color:#faf8f4}',
    '#ar-head .ar-av{flex:none;width:42px;height:42px;border-radius:50%;overflow:hidden;background:rgba(250,248,244,.1);display:grid;place-items:center}',
    '#ar-head .ar-av img{width:100%;height:100%;object-fit:cover}',
    // Colour and alignment are set explicitly: the site's global h2 rule would
    // otherwise paint this dark-on-dark and centre it.
    '#ar-head h2{margin:0;font:600 19px/1.2 "Cormorant Garamond",Georgia,serif;letter-spacing:.01em;color:#faf8f4;text-align:left;text-transform:none}',
    '#ar-head p{margin:2px 0 0;font:400 12px/1.3 Montserrat,system-ui,sans-serif;color:rgba(250,248,244,.62)}',
    '#ar-head .ar-x{margin-left:auto;width:40px;height:40px;flex:none;border:0;background:none;color:rgba(250,248,244,.75);font-size:20px;border-radius:50%;cursor:pointer}',
    '#ar-head .ar-x:hover{background:rgba(250,248,244,.12);color:#fff}',
    '#ar-msgs{flex:1;min-height:0;overflow-y:auto;padding:18px 16px;display:flex;flex-direction:column;gap:14px;-webkit-overflow-scrolling:touch}',
    '.ar-row{display:flex;flex-direction:column;max-width:100%}',
    '.ar-b{max-width:88%;padding:13px 16px;font:400 16px/1.6 Lora,Georgia,serif;border-radius:16px;white-space:pre-wrap;word-wrap:break-word}',
    '.ar-b.me{align-self:flex-end;background:#1a1a1a;color:#faf8f4;border-bottom-right-radius:6px}',
    '.ar-b.roger{align-self:flex-start;background:#fff;color:#2e2e2e;border:1px solid #ddd8d0;border-bottom-left-radius:6px}',
    '.ar-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}',
    '.ar-chips a{display:inline-flex;align-items:center;gap:6px;min-height:42px;padding:8px 14px;border:1px solid rgba(184,150,62,.55);border-radius:9px;background:#faf8f4;color:#8a6d1f;font:600 14px/1 Montserrat,system-ui,sans-serif;text-decoration:none}',
    '.ar-chips a:hover{background:#1a1a1a;border-color:#1a1a1a;color:#d4af6a}',
    '.ar-listen{align-self:flex-start;margin-top:7px;display:inline-flex;align-items:center;gap:7px;min-height:40px;padding:8px 14px;border:0;border-radius:999px;background:none;color:#6b645a;font:600 13px/1 Montserrat,system-ui,sans-serif;cursor:pointer}',
    '.ar-listen:hover{background:#f0ece4;color:#1a1a1a}',
    '.ar-listen[aria-pressed="true"],.ar-listen.loading{background:#1a1a1a;color:#d4af6a}',
    '.ar-listen svg{width:16px;height:16px}',
    '.ar-starters{display:flex;flex-wrap:wrap;gap:8px}',
    '.ar-starters button{min-height:44px;padding:10px 15px;border:1px solid #ddd8d0;border-radius:11px;background:#fff;color:#555;font:400 14.5px/1.35 Montserrat,system-ui,sans-serif;text-align:left;cursor:pointer}',
    '.ar-starters button:hover{border-color:#b8963e;color:#1a1a1a}',
    '.ar-typing{align-self:flex-start;display:inline-flex;gap:5px;padding:15px 18px;background:#fff;border:1px solid #ddd8d0;border-radius:16px;border-bottom-left-radius:6px}',
    '.ar-typing i,.ar-listen i{display:block;width:7px;height:7px;border-radius:50%;background:currentColor;opacity:.35;animation:ar-bounce 1.1s infinite}',
    '.ar-typing i{background:#b8963e}',
    '.ar-typing i:nth-child(2),.ar-listen i:nth-child(2){animation-delay:.18s}',
    '.ar-typing i:nth-child(3),.ar-listen i:nth-child(3){animation-delay:.36s}',
    '@keyframes ar-bounce{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-4px)}}',
    '#ar-form{display:flex;align-items:center;gap:8px;padding:12px;border-top:1px solid #ddd8d0;background:#faf8f4}',
    '#ar-input{flex:1;min-width:0;padding:13px 15px;border:1px solid #ddd8d0;border-radius:12px;background:#fff;color:#2e2e2e;font:400 16px/1.4 Montserrat,system-ui,sans-serif}',
    '#ar-input:focus{outline:none;border-color:#b8963e}',
    '#ar-mic,#ar-send{flex:none;width:48px;height:48px;display:grid;place-items:center;border-radius:12px;cursor:pointer;border:1px solid #ddd8d0;background:#fff;color:#555}',
    '#ar-mic:hover{border-color:#b8963e;color:#1a1a1a}',
    '#ar-mic.on{background:#a3302a;border-color:#a3302a;color:#fff;animation:ar-pulse 1.2s infinite}',
    '@keyframes ar-pulse{50%{opacity:.6}}',
    '#ar-send{background:#1a1a1a;border-color:#1a1a1a;color:#d4af6a}',
    '#ar-send:disabled{opacity:.45;cursor:default}',
    '#ar-mic svg,#ar-send svg{width:19px;height:19px}',
    '#ar-disc{margin:0;padding:10px 16px;border-top:1px solid #ddd8d0;background:#f5f3ef;font:400 12px/1.5 Montserrat,system-ui,sans-serif;color:#6b645a}',
    '@media(max-width:1023px){#ar-launch{bottom:calc(78px + env(safe-area-inset-bottom));right:14px}#ar-nudge{bottom:calc(146px + env(safe-area-inset-bottom));right:14px}}',
    '@media(max-width:600px){',
    '#ar-panel{top:0;left:0;right:0;bottom:0;width:100%;max-width:100%;height:100dvh;max-height:100dvh;border-radius:0;border:0}',
    '#ar-form{padding-bottom:calc(12px + env(safe-area-inset-bottom))}',
    '#ar-disc{padding-bottom:calc(10px + env(safe-area-inset-bottom))}',
    '}',
    '@media(prefers-reduced-motion:reduce){#ar-panel.open,.ar-typing i,.ar-listen i,#ar-mic.on{animation:none}#ar-launch{transition:none}}'
  ].join('');

  var ICON_CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
  var ICON_SPK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a9 9 0 0 1 0 14"/></svg>';
  var ICON_STOP = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>';
  var ICON_MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>';
  var ICON_SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
  var ICON_ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:13px;height:13px"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';

  /* ---------------- markup ---------------- */
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var root = document.createElement('div');
  root.id = 'ar-root';
  root.innerHTML =
    '<button id="ar-launch" type="button" aria-expanded="false" aria-controls="ar-panel">' +
      '<span class="ar-dot" aria-hidden="true"></span>' + ICON_CHAT +
      '<span>Chat with Roger</span>' +
    '</button>' +
    '<section id="ar-panel" role="dialog" aria-modal="false" aria-label="Ask Roger, automated assistant">' +
      '<header id="ar-head">' +
        '<span class="ar-av"><img src="/assets/logo.webp" alt="" /></span>' +
        '<div><h2>Ask Roger</h2><p>Answers drawn from his books and blog</p></div>' +
        '<button class="ar-x" type="button" aria-label="Close chat">&times;</button>' +
      '</header>' +
      '<div id="ar-msgs" role="log" aria-live="polite" aria-label="Conversation"></div>' +
      '<form id="ar-form">' +
        '<button id="ar-mic" type="button" hidden aria-pressed="false" aria-label="Ask your question out loud">' + ICON_MIC + '</button>' +
        '<input id="ar-input" type="text" autocomplete="off" placeholder="Type your question" aria-label="Your question" />' +
        '<button id="ar-send" type="submit" aria-label="Send">' + ICON_SEND + '</button>' +
      '</form>' +
      '<p id="ar-disc">This assistant is automated and answers only from Roger\'s published writing. It is encouragement, not counseling or medical advice.</p>' +
    '</section>';
  document.body.appendChild(root);

  var launch = root.querySelector('#ar-launch');
  var panel = root.querySelector('#ar-panel');
  var msgsEl = root.querySelector('#ar-msgs');
  var form = root.querySelector('#ar-form');
  var input = root.querySelector('#ar-input');
  var sendBtn = root.querySelector('#ar-send');
  var micBtn = root.querySelector('#ar-mic');

  var history = [];   // {role, content} sent to the function (opener excluded)
  var busy = false;

  /* ---------------- read aloud ---------------- */
  // ONE persistent audio element, unlocked by the first tap. Reusing it keeps
  // iOS playing Roger's real voice instead of silently falling back.
  var audio = null;
  var speech = 'speechSynthesis' in window ? window.speechSynthesis : null;
  var speakingBtn = null;

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
  if (speech) speech.getVoices();

  function setListenState(btn, state) {
    if (!btn) return;
    btn.classList.toggle('loading', state === 'loading');
    btn.setAttribute('aria-pressed', state === 'playing' ? 'true' : 'false');
    if (state === 'loading') {
      btn.innerHTML = '<i></i><i></i><i></i><span class="ar-sr">Loading audio</span>';
    } else if (state === 'playing') {
      btn.innerHTML = ICON_STOP + ' Stop';
    } else {
      btn.innerHTML = ICON_SPK + ' Listen';
    }
  }

  function stopSpeaking() {
    if (audio) { audio.onended = null; audio.onerror = null; audio.onplaying = null; audio.pause(); }
    if (speech) speech.cancel();
    if (speakingBtn) setListenState(speakingBtn, 'idle');
    speakingBtn = null;
  }

  function speakBrowser(text, btn) {
    if (!speech) { setListenState(btn, 'idle'); return; }
    var u = new SpeechSynthesisUtterance(text);
    var v = pickVoice();
    if (v) u.voice = v;
    u.rate = 0.95;
    u.onend = u.onerror = function () { if (speakingBtn === btn) { setListenState(btn, 'idle'); speakingBtn = null; } };
    speakingBtn = btn;
    setListenState(btn, 'playing');
    speech.speak(u);
  }

  function toggleSpeak(text, btn) {
    if (speakingBtn === btn) { stopSpeaking(); return; }
    stopSpeaking();
    speakingBtn = btn;
    setListenState(btn, 'loading');
    if (!audio) audio = new Audio();
    var fellBack = false;
    var fallback = function () {
      if (fellBack || speakingBtn !== btn) return;
      fellBack = true;
      speakBrowser(text, btn);
    };
    audio.onended = function () { if (speakingBtn === btn) { setListenState(btn, 'idle'); speakingBtn = null; } };
    audio.onerror = fallback;
    audio.onplaying = function () { if (speakingBtn === btn) setListenState(btn, 'playing'); };
    // Direct GET src so playback begins inside the tap gesture (iOS requires it).
    audio.src = TTS + '?text=' + encodeURIComponent(text.slice(0, 800));
    var p = audio.play();
    if (p && p.catch) p.catch(fallback);
  }

  /* ---------------- rendering ---------------- */
  function scrollDown() { msgsEl.scrollTop = msgsEl.scrollHeight; }

  function splitChips(text) {
    var chips = [];
    var clean = text.replace(/\[\[link:([^\]|]+)\|([^\]]+)\]\]/g, function (_, href, label) {
      href = href.trim();
      if (href.charAt(0) === '/' && href.charAt(1) !== '/' && chips.length < 2) {
        chips.push({ href: href, label: label.trim() });
      }
      return '';
    }).replace(/\n{3,}/g, '\n\n').trim();
    return { text: clean, chips: chips };
  }

  function addRow(role) {
    var row = document.createElement('div');
    row.className = 'ar-row';
    var bubble = document.createElement('div');
    bubble.className = 'ar-b ' + (role === 'user' ? 'me' : 'roger');
    row.appendChild(bubble);
    msgsEl.appendChild(row);
    scrollDown();
    return { row: row, bubble: bubble };
  }

  function finishAssistant(row, bubble, full) {
    var parsed = splitChips(full);
    bubble.textContent = parsed.text;
    if (parsed.chips.length) {
      var wrap = document.createElement('div');
      wrap.className = 'ar-chips';
      parsed.chips.forEach(function (c) {
        var a = document.createElement('a');
        a.href = c.href;
        a.innerHTML = '';
        a.appendChild(document.createTextNode(c.label));
        a.insertAdjacentHTML('beforeend', ICON_ARROW);
        wrap.appendChild(a);
      });
      bubble.appendChild(wrap);
    }
    var listen = document.createElement('button');
    listen.type = 'button';
    listen.className = 'ar-listen';
    setListenState(listen, 'idle');
    listen.addEventListener('click', function () { toggleSpeak(parsed.text, listen); });
    row.appendChild(listen);
    scrollDown();
  }

  function showStarters() {
    var wrap = document.createElement('div');
    wrap.className = 'ar-starters';
    STARTERS.forEach(function (q) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = q;
      b.addEventListener('click', function () { wrap.remove(); send(q); });
      wrap.appendChild(b);
    });
    msgsEl.appendChild(wrap);
  }

  function opener() {
    var h = new Date().getHours();
    var greeting = h < 12
      ? 'Good morning! Glad you are here.'
      : h < 17
        ? 'Good afternoon! Glad you stopped by.'
        : 'Good evening! Thanks for spending a little time here.';
    var r = addRow('assistant');
    var text = greeting + " I'm Roger. Ask me about anything I've written on: faith, the local church, healing our broken places, parenting, or pastoral ministry. What's on your heart, my friend?";
    r.bubble.textContent = text;
    var listen = document.createElement('button');
    listen.type = 'button';
    listen.className = 'ar-listen';
    setListenState(listen, 'idle');
    listen.addEventListener('click', function () { toggleSpeak(text, listen); });
    r.row.appendChild(listen);
    showStarters();
  }

  /* ---------------- sending ---------------- */
  function send(text) {
    var content = (text != null ? text : input.value).trim();
    if (!content || busy) return;
    var starters = msgsEl.querySelector('.ar-starters');
    if (starters) starters.remove();

    var mine = addRow('user');
    mine.bubble.textContent = content;
    history.push({ role: 'user', content: content });
    input.value = '';
    busy = true;
    sendBtn.disabled = true;

    var typing = document.createElement('div');
    typing.className = 'ar-typing';
    typing.innerHTML = '<i></i><i></i><i></i>';
    msgsEl.appendChild(typing);
    scrollDown();

    fetch(API, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: history })
    }).then(function (res) {
      typing.remove();
      if (res.headers.get('x-alm-stream') === '1' && res.body) {
        var out = addRow('assistant');
        var reader = res.body.getReader();
        var dec = new TextDecoder();
        var full = '';
        var pump = function () {
          return reader.read().then(function (r) {
            if (r.done) {
              history.push({ role: 'assistant', content: full });
              finishAssistant(out.row, out.bubble, full);
              return;
            }
            full += dec.decode(r.value, { stream: true });
            out.bubble.textContent = splitChips(full).text;
            scrollDown();
            return pump();
          });
        };
        return pump();
      }
      return res.json().then(function (d) {
        var out = addRow('assistant');
        var msg = d.error || d.answer || 'Something went wrong. Please try again in a moment.';
        finishAssistant(out.row, out.bubble, msg);
      });
    }).catch(function () {
      typing.remove();
      var out = addRow('assistant');
      finishAssistant(out.row, out.bubble, 'I could not connect just now, my friend. Please try again in a moment.');
    }).then(function () {
      busy = false;
      sendBtn.disabled = false;
      scrollDown();
    });
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); send(); });

  /* ---------------- voice input ---------------- */
  var Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  var rec = null;
  if (Rec) {
    micBtn.hidden = false;
    micBtn.addEventListener('click', function () {
      if (rec) { rec.stop(); return; }
      var r = new Rec();
      r.lang = 'en-US';
      r.interimResults = true;
      r.continuous = false;
      r.onresult = function (e) {
        var t = '';
        for (var i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
        input.value = t;
      };
      r.onend = r.onerror = function () {
        rec = null;
        micBtn.classList.remove('on');
        micBtn.setAttribute('aria-pressed', 'false');
        input.placeholder = 'Type your question';
      };
      rec = r;
      micBtn.classList.add('on');
      micBtn.setAttribute('aria-pressed', 'true');
      input.placeholder = 'Listening...';
      r.start();
    });
  }

  /* ---------------- open / close ---------------- */
  var vv = window.visualViewport;
  function isMobile() { return window.innerWidth <= 600; }
  function clearFit() { panel.style.height = ''; panel.style.top = ''; panel.style.bottom = ''; }
  function fit() {
    if (!panel.classList.contains('open') || !isMobile() || !vv) { clearFit(); return; }
    panel.style.height = vv.height + 'px';
    panel.style.top = vv.offsetTop + 'px';
    panel.style.bottom = 'auto';
    scrollDown();
  }
  if (vv) { vv.addEventListener('resize', fit); vv.addEventListener('scroll', fit); }
  window.addEventListener('orientationchange', function () { setTimeout(fit, 200); });

  function open(focus) {
    dismissNudge();
    if (!msgsEl.children.length) opener();
    panel.classList.add('open');
    launch.setAttribute('aria-expanded', 'true');
    fit();
    scrollDown();
    if (focus !== false && !isMobile()) input.focus();
  }
  function close() {
    panel.classList.remove('open');
    launch.setAttribute('aria-expanded', 'false');
    clearFit();
    stopSpeaking();
    if (rec) rec.abort ? rec.abort() : rec.stop();
  }
  launch.addEventListener('click', function () {
    panel.classList.contains('open') ? close() : open();
  });
  root.querySelector('.ar-x').addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) close();
  });

  /* External triggers anywhere on the site. */
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-ask-roger]') : null;
    if (!t) return;
    e.preventDefault();
    open();
    var q = (t.getAttribute('data-ask-roger') || '').trim();
    if (q) { input.value = q; setTimeout(function () { send(q); }, 120); }
  });
  window.askRoger = function (q) {
    open();
    if (q) setTimeout(function () { send(q); }, 120);
  };

  /* ---------------- first-visit nudge ---------------- */
  var nudge = null;
  function dismissNudge() {
    if (nudge) { nudge.remove(); nudge = null; }
    try { sessionStorage.setItem(GREET_KEY, '1'); } catch (err) { /* private mode */ }
  }
  function showNudge() {
    if (panel.classList.contains('open') || nudge) return;
    nudge = document.createElement('div');
    nudge.id = 'ar-nudge';
    nudge.innerHTML =
      '<button class="ar-nudge-x" type="button" aria-label="Dismiss">&times;</button>' +
      '<button class="ar-nudge-open" type="button">' +
        '<span class="ar-nudge-ic">' + ICON_CHAT + '</span>' +
        '<span><strong>Have a question?</strong>' +
        '<span class="ar-nudge-sub">Ask Roger anything from his books and blog. He can read the answers out loud.</span></span>' +
      '</button>';
    root.appendChild(nudge);
    nudge.querySelector('.ar-nudge-x').addEventListener('click', dismissNudge);
    nudge.querySelector('.ar-nudge-open').addEventListener('click', function () { open(); });
  }
  (function scheduleNudge() {
    var seen = false;
    try { seen = sessionStorage.getItem(GREET_KEY) === '1'; } catch (err) { /* show it */ }
    if (seen) return;
    var done = false;
    var reveal = function () {
      if (done) return;
      done = true;
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timer);
      showNudge();
    };
    var onScroll = function () { if (window.scrollY > 700) reveal(); };
    var timer = setTimeout(reveal, 12000);
    window.addEventListener('scroll', onScroll, { passive: true });
  })();
})();
