(function () {
  'use strict';
  var ENDPOINT = '/.netlify/functions/ask-roger';

  var css = ''
    + '#ar-fab{position:fixed;right:20px;bottom:20px;z-index:2147482000;display:inline-flex;align-items:center;gap:9px;'
    + 'background:#b8963e;color:#fff;border:none;border-radius:999px;padding:13px 20px;cursor:pointer;'
    + "font-family:'Montserrat',system-ui,sans-serif;font-size:.8rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;"
    + 'box-shadow:0 6px 22px rgba(0,0,0,.28);transition:transform .2s,background .2s;}'
    + '#ar-fab:hover{background:#d4af6a;transform:translateY(-2px);}'
    + '#ar-fab svg{width:18px;height:18px;}'
    + '#ar-panel{position:fixed;right:20px;bottom:20px;z-index:2147483000;width:380px;max-width:calc(100vw - 32px);height:560px;max-height:calc(100vh - 40px);'
    + 'background:#faf8f4;border-radius:14px;box-shadow:0 18px 60px rgba(0,0,0,.34);display:none;flex-direction:column;overflow:hidden;}'
    + '#ar-panel.open{display:flex;}'
    + '#ar-head{background:#1a1a1a;color:#fff;padding:15px 18px;display:flex;align-items:center;justify-content:space-between;flex:0 0 auto;}'
    + "#ar-head .ar-t{font-family:'Cormorant Garamond',Georgia,serif;font-size:1.5rem;font-weight:700;line-height:1;}"
    + "#ar-head .ar-s{font-family:'Montserrat',system-ui,sans-serif;font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;color:#d4af6a;margin-top:3px;}"
    + '#ar-close{background:none;border:none;color:rgba(255,255,255,.7);font-size:1.5rem;line-height:1;cursor:pointer;padding:0 4px;}'
    + '#ar-close:hover{color:#fff;}'
    + "#ar-msgs{flex:1 1 auto;overflow-y:auto;padding:18px;font-family:'Lora',Georgia,serif;font-size:.95rem;line-height:1.6;color:#2e2e2e;}"
    + '.ar-b{margin-bottom:14px;display:flex;}'
    + '.ar-b.u{justify-content:flex-end;}'
    + '.ar-b .bub{max-width:84%;padding:10px 14px;border-radius:14px;white-space:pre-wrap;}'
    + '.ar-b.u .bub{background:#1a1a1a;color:#fff;border-bottom-right-radius:4px;}'
    + '.ar-b.a .bub{background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.07);border-bottom-left-radius:4px;}'
    + '.ar-src{font-family:"Montserrat",system-ui,sans-serif;font-size:.66rem;letter-spacing:.04em;color:#8a8378;margin-top:7px;}'
    + '.ar-dots span{display:inline-block;width:6px;height:6px;margin:0 2px;background:#b8963e;border-radius:50%;animation:arb 1s infinite;}'
    + '.ar-dots span:nth-child(2){animation-delay:.2s;}.ar-dots span:nth-child(3){animation-delay:.4s;}'
    + '@keyframes arb{0%,60%,100%{opacity:.25;}30%{opacity:1;}}'
    + '#ar-form{flex:0 0 auto;display:flex;gap:8px;padding:12px;border-top:1px solid #e6e1d8;background:#fff;}'
    + "#ar-in{flex:1;border:1px solid #ddd8d0;border-radius:9px;padding:11px 12px;font-family:'Lora',Georgia,serif;font-size:.95rem;resize:none;max-height:90px;}"
    + '#ar-in:focus{outline:none;border-color:#b8963e;}'
    + '#ar-send{background:#b8963e;color:#fff;border:none;border-radius:9px;padding:0 16px;cursor:pointer;font-weight:700;}'
    + '#ar-send:disabled{opacity:.5;cursor:default;}'
    + '.ar-disc{font-family:"Montserrat",system-ui,sans-serif;font-size:.6rem;color:#9a9384;text-align:center;padding:0 12px 9px;background:#fff;}'
    + '@media(max-width:480px){#ar-panel{right:8px;bottom:8px;height:calc(100vh - 16px);}}';

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

  function init() {
    var style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

    var fab = el('button', { id: 'ar-fab', 'aria-label': 'Ask Roger a question' },
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>Ask Roger');
    var panel = el('div', { id: 'ar-panel', role: 'dialog', 'aria-label': 'Ask Roger' });
    panel.innerHTML =
      '<div id="ar-head"><div><div class="ar-t">Ask Roger</div><div class="ar-s">From his books &amp; blog</div></div>'
      + '<button id="ar-close" aria-label="Close">&times;</button></div>'
      + '<div id="ar-msgs"></div>'
      + '<form id="ar-form"><textarea id="ar-in" rows="1" placeholder="Ask about faith, church, healing, parenting..." aria-label="Your question"></textarea>'
      + '<button id="ar-send" type="submit">Send</button></form>'
      + '<div class="ar-disc">Answers come only from Roger’s books and blog. For encouragement, not professional advice.</div>';

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    var msgs = panel.querySelector('#ar-msgs');
    var form = panel.querySelector('#ar-form');
    var input = panel.querySelector('#ar-in');
    var sendBtn = panel.querySelector('#ar-send');
    var greeted = false;

    function addBubble(role, html) {
      var b = el('div', { class: 'ar-b ' + (role === 'user' ? 'u' : 'a') });
      var bub = el('div', { class: 'bub' }, html);
      b.appendChild(bub); msgs.appendChild(b); msgs.scrollTop = msgs.scrollHeight;
      return bub;
    }
    function open() {
      panel.classList.add('open'); fab.style.display = 'none';
      if (!greeted) { greeted = true; addBubble('a', 'Hi! I’m here to answer questions from Roger’s books and blog — things like faith, the local church, healing our broken places, parenting, and pastoral ministry. What’s on your mind?'); }
      setTimeout(function(){ input.focus(); }, 50);
    }
    function close() { panel.classList.remove('open'); fab.style.display = 'inline-flex'; }

    fab.addEventListener('click', open);
    panel.querySelector('#ar-close').addEventListener('click', close);
    input.addEventListener('input', function(){ input.style.height='auto'; input.style.height=Math.min(input.scrollHeight,90)+'px'; });
    input.addEventListener('keydown', function(e){ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); form.requestSubmit(); } });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var q = input.value.trim();
      if (!q) return;
      addBubble('user', esc(q));
      input.value = ''; input.style.height = 'auto';
      sendBtn.disabled = true;
      var typing = addBubble('a', '<span class="ar-dots"><span></span><span></span><span></span></span>');
      try {
        var r = await fetch(ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: q }) });
        var data = await r.json();
        if (!r.ok) { typing.innerHTML = esc(data.error || 'Something went wrong. Please try again.'); }
        else {
          typing.innerHTML = esc(data.answer);
          if (data.sources && data.sources.length) {
            var s = el('div', { class: 'ar-src' }, 'Source' + (data.sources.length>1?'s':'') + ': ' + esc(data.sources.join(', ')));
            typing.parentNode.appendChild(s);
          }
        }
      } catch (err) {
        typing.innerHTML = 'I had trouble reaching the server. Please try again in a moment.';
      }
      msgs.scrollTop = msgs.scrollHeight;
      sendBtn.disabled = false; input.focus();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
