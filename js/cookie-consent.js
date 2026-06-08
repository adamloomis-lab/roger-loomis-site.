(function () {
  'use strict';
  var KEY = 'roger-cookie-consent';
  try { if (localStorage.getItem(KEY)) return; } catch (e) { /* storage blocked: still show */ }

  var css = '' +
    '#rl-cookie{position:fixed;left:1rem;right:1rem;bottom:1rem;z-index:2147483000;' +
    'background:#1a1a1a;color:rgba(255,255,255,.85);border:1px solid rgba(184,150,62,.4);' +
    'border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.35);padding:1rem 1.25rem;' +
    'display:flex;align-items:center;gap:1rem 1.25rem;flex-wrap:wrap;justify-content:center;' +
    "font-family:'Montserrat',system-ui,sans-serif;max-width:880px;margin:0 auto;" +
    'transform:translateY(160%);transition:transform .4s ease;}' +
    '#rl-cookie.show{transform:translateY(0);}' +
    '#rl-cookie p{font-size:.85rem;line-height:1.55;margin:0;flex:1 1 380px;min-width:260px;}' +
    '#rl-cookie a{color:#d4af6a;font-weight:600;text-decoration:none;}' +
    '#rl-cookie a:hover{text-decoration:underline;}' +
    '#rl-cookie .rl-cc-btns{display:flex;gap:.6rem;flex:0 0 auto;}' +
    '#rl-cookie button{font-family:inherit;font-size:.78rem;font-weight:700;letter-spacing:.04em;' +
    'text-transform:uppercase;padding:.6rem 1.25rem;border-radius:4px;cursor:pointer;border:2px solid transparent;transition:all .2s ease;}' +
    '#rl-cookie .rl-cc-accept{background:#b8963e;color:#fff;border-color:#b8963e;}' +
    '#rl-cookie .rl-cc-accept:hover{background:#d4af6a;border-color:#d4af6a;}' +
    '#rl-cookie .rl-cc-decline{background:transparent;color:rgba(255,255,255,.8);border:1.5px solid rgba(255,255,255,.3);}' +
    '#rl-cookie .rl-cc-decline:hover{border-color:rgba(255,255,255,.6);background:rgba(255,255,255,.06);}' +
    '@media(max-width:560px){#rl-cookie{flex-direction:column;align-items:stretch;text-align:center;gap:.75rem;padding:.875rem 1rem;}' +
    '#rl-cookie p{flex:0 1 auto;}' +
    '#rl-cookie .rl-cc-btns{justify-content:center;}}';

  function init() {
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var bar = document.createElement('div');
    bar.id = 'rl-cookie';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Cookie notice');
    bar.innerHTML =
      '<p>We use cookies to give you the best experience on our website and to understand how it is used. ' +
      'See our <a href="/privacy">Privacy Policy</a> for details.</p>' +
      '<div class="rl-cc-btns">' +
      '<button type="button" class="rl-cc-decline">Decline</button>' +
      '<button type="button" class="rl-cc-accept">Accept</button>' +
      '</div>';
    document.body.appendChild(bar);
    requestAnimationFrame(function () { bar.classList.add('show'); });

    function dismiss(choice) {
      try { localStorage.setItem(KEY, choice); } catch (e) {}
      bar.classList.remove('show');
      setTimeout(function () { if (bar.parentNode) bar.parentNode.removeChild(bar); }, 400);
    }
    bar.querySelector('.rl-cc-accept').addEventListener('click', function () { dismiss('accepted'); });
    bar.querySelector('.rl-cc-decline').addEventListener('click', function () { dismiss('declined'); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
