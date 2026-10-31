(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* private window */ } }
  };
  $$('form').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (f.classList.contains('search')) {
        var q = f.querySelector('input');
        window.location.href = '/benchmark-shop/search.html' + (q && q.value ? '?q=' + encodeURIComponent(q.value) : '');
      }
    });
  });
  function closeMenu(o) { o.setAttribute('aria-expanded', 'false'); document.getElementById(o.getAttribute('aria-controls')).classList.remove('open'); }
  $$('.menu-toggle').forEach(function (b) {
    var panel = document.getElementById(b.getAttribute('aria-controls'));
    var item = b.parentNode;
    b.addEventListener('click', function () {
      var open = b.getAttribute('aria-expanded') === 'true';
      $$('.menu-toggle[aria-expanded=true]').forEach(function (o) { if (o !== b) closeMenu(o); });
      b.setAttribute('aria-expanded', String(!open));
      panel.classList.toggle('open', !open);
    });
    item.addEventListener('focusout', function (e) { if (b.getAttribute('aria-expanded') === 'true' && !(e.relatedTarget && item.contains(e.relatedTarget))) closeMenu(b); });
  });
  document.addEventListener('click', function (e) {
    $$('.menu-toggle[aria-expanded=true]').forEach(function (o) { if (!o.parentNode.contains(e.target)) closeMenu(o); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var b = $('.menu-toggle[aria-expanded=true]');
    if (b) { b.setAttribute('aria-expanded', 'false'); document.getElementById(b.getAttribute('aria-controls')).classList.remove('open'); b.focus(); }
  });
  function cards() { return $$('#product-grid > li.card'); }
  window.lsFilterCards = function (test) {
    var n = 0;
    cards().forEach(function (c) { c.hidden = !test(c); if (!c.hidden) n++; });
    var count = $('#result-count');
    if (count) count.textContent = n + (n === 1 ? ' product' : ' products');
  };
  window.lsCardHas = function (c, attr, wanted) {
    if (!wanted.length) return true;
    var have = (c.getAttribute(attr) || '').split('|');
    return wanted.some(function (w) { return have.indexOf(w) !== -1; });
  };
  window.lsSortCards = function (how) {
    var grid = $('#product-grid');
    if (!grid) return;
    var num = function (c, a) { return Number(c.getAttribute(a)); };
    var by = [function (a, b) { return num(a, 'data-order') - num(b, 'data-order'); }, function (a, b) { return num(a, 'data-price') - num(b, 'data-price') || num(a, 'data-order') - num(b, 'data-order'); },
      function (a, b) { return num(b, 'data-price') - num(a, 'data-price') || num(a, 'data-order') - num(b, 'data-order'); }, function (a, b) { return num(b, 'data-order') - num(a, 'data-order'); }][how] || function () { return 0; };
    cards().sort(by).forEach(function (c) { grid.appendChild(c); });
  };
  var filters = $('#filters');
  if (filters) {
    filters.addEventListener('submit', function () {
      var picked = function (name) { return $$('input[name=' + name + ']:checked', filters).map(function (i) { return i.value; }); };
      var colours = picked('colour'), sizes = picked('size'), range = $('#price-range', filters), most = range ? Number(range.value) : Infinity;
      window.lsFilterCards(function (c) { return window.lsCardHas(c, 'data-colours', colours) && window.lsCardHas(c, 'data-sizes', sizes) && Number(c.getAttribute('data-price')) <= most; });
    });
  }
  var sortForm = $('#sort-form');
  if (sortForm) {
    sortForm.addEventListener('submit', function () {
      var sel = $('#sort', sortForm);
      window.lsSortCards(sel.selectedIndex);
      window.lsAnnounce('Sorted by ' + sel.options[sel.selectedIndex].text.toLowerCase());
    });
  }
  var status = $('#status');
  window.lsAnnounce = function (msg) {
    if (!status) return;
    status.textContent = '';
    setTimeout(function () { status.textContent = msg; clearIfOver(); }, 50);
    setTimeout(function () { status.textContent = ''; }, 6000);
  };
  function clearIfOver() {
    var f = document.activeElement;
    if (!status || !status.textContent || !f || f === document.body) return;
    var a = status.getBoundingClientRect(), b = f.getBoundingClientRect();
    if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) status.textContent = '';
  }
  document.addEventListener('focusin', function () { clearIfOver(); window.requestAnimationFrame(clearIfOver); });
  window.addEventListener('scroll', clearIfOver, { passive: true });
  $$('[data-add]').forEach(function (b) { b.addEventListener('click', function () { window.lsAnnounce(b.getAttribute('data-add') + ' added to your basket'); }); });
  var lastTrigger = null;
  function focusables(el) { return $$('a[href], button:not([disabled]), input, select, textarea, [tabindex="0"]', el).filter(function (x) { return x.offsetParent !== null; }); }
  window.lsOpenDialog = function (id, trigger) {
    var bd = document.getElementById(id);
    if (!bd) return;
    lastTrigger = trigger || document.activeElement;
    bd.hidden = false;
    var dlg = $('[role=dialog]', bd);
    var f = focusables(dlg);
    (f[0] || dlg).focus();
  };
  window.lsOpenOnFirstFocus = function (id, el) {
    if (el.lsOpenedOnce) return;
    el.lsOpenedOnce = true;
    window.lsOpenDialog(id, el);
  };
  window.lsCloseDialog = function (bd) {
    bd.hidden = true;
    if (lastTrigger) lastTrigger.focus();
  };
  $$('.backdrop').forEach(function (bd) {
    bd.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { window.lsCloseDialog(bd); return; }
      if (e.key !== 'Tab') return;
      var f = focusables(bd);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    });
    $$('[data-close]', bd).forEach(function (c) { c.addEventListener('click', function () { window.lsCloseDialog(bd); }); });
  });
  $$('[data-dialog]').forEach(function (t) { t.addEventListener('click', function (e) { e.preventDefault(); window.lsOpenDialog(t.getAttribute('data-dialog'), t); }); });
  $$('.accordion h3 button').forEach(function (b) {
    b.addEventListener('click', function () {
      var open = b.getAttribute('aria-expanded') === 'true';
      b.setAttribute('aria-expanded', String(!open));
      document.getElementById(b.getAttribute('aria-controls')).hidden = open;
    });
  });
  $$('[role=tablist]').forEach(function (list) {
    var tabs = $$('[role=tab]', list);
    function select(t) {
      tabs.forEach(function (x) {
        var on = x === t;
        x.setAttribute('aria-selected', String(on));
        x.tabIndex = on ? 0 : -1;
        document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
      });
      t.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') select(tabs[(i + 1) % tabs.length]);
        if (e.key === 'ArrowLeft') select(tabs[(i - 1 + tabs.length) % tabs.length]);
      });
    });
  });
  $$('.tip-wrap').forEach(function (w) {
    var tip = $('.tooltip', w);
    if (!tip) return;
    var show = function () { tip.hidden = false; };
    var hide = function () { tip.hidden = true; };
    w.addEventListener('mouseenter', show);
    w.addEventListener('mouseleave', hide);
    w.addEventListener('focusin', show);
    w.addEventListener('focusout', hide);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });
  });
  $$('.gallery').forEach(function (g) {
    var main = $('.main-img', g);
    if (!main) return;
    $$('.thumbs button', g).forEach(function (b) {
      b.addEventListener('click', function () {
        main.src = b.getAttribute('data-src');
        if (b.hasAttribute('data-alt')) main.alt = b.getAttribute('data-alt');
        $$('.thumbs button', g).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      });
    });
  });
  $$('.wish').forEach(function (b) {
    b.addEventListener('click', function () {
      var on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', String(on));
      window.lsAnnounce(on ? 'Saved to your wishlist' : 'Removed from your wishlist');
    });
  });
  var cb = $('#cookie-banner');
  if (cb) {
    if (store.get('ls-cookies')) cb.hidden = true;
    $$('[data-cookie]', cb).forEach(function (b) {
      b.addEventListener('click', function () {
        store.set('ls-cookies', b.getAttribute('data-cookie'));
        cb.hidden = true;
        window.lsAnnounce('Your cookie choice is saved');
        var main = $('#main');
        if (main) main.focus();
      });
    });
  }
  var chatForm = $('#chat-form');
  if (chatForm) {
    chatForm.addEventListener('submit', function () {
      var input = $('#chat-input');
      var log = $('#chat-log');
      if (!input.value.trim()) return;
      var p = document.createElement('p');
      p.textContent = 'You: ' + input.value;
      log.appendChild(p);
      input.value = '';
      setTimeout(function () {
        var r = document.createElement('p');
        r.textContent = 'Larkspindle: Thanks. This is a test shop, so nobody will answer, but the chat works.';
        log.appendChild(r);
      }, 600);
    });
  }
  $$('.carousel').forEach(function (c) {
    var slides = $$('.slides > *', c);
    var i = 0;
    var live = $('.carousel-status', c);
    function show(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.hidden = k !== i; });
      if (live) live.textContent = 'Slide ' + (i + 1) + ' of ' + slides.length;
    }
    $('.prev', c).addEventListener('click', function () { show(i - 1); });
    $('.next', c).addEventListener('click', function () { show(i + 1); });
    show(0);
  });
  function fitInWindow(el) {
    el.style.maxWidth = ''; el.style.minWidth = ''; el.style.boxSizing = ''; el.style.marginLeft = '';
    if (!el.getClientRects().length) return;
    var edge = 8, room = document.documentElement.clientWidth - 2 * edge;
    var r = el.getBoundingClientRect();
    if (r.width > room) { el.style.boxSizing = 'border-box'; el.style.minWidth = '0'; el.style.maxWidth = room + 'px'; r = el.getBoundingClientRect(); }
    var over = r.right - (room + edge);
    if (over > 0) el.style.marginLeft = -Math.min(over, Math.max(0, r.left - edge)) + 'px';
  }
  var FIT = '.tooltip, .menu-panel';
  new MutationObserver(function (list) {
    list.forEach(function (m) { if (m.target.nodeType === 1 && m.target.matches(FIT)) fitInWindow(m.target); });
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['hidden', 'class'] });
  window.addEventListener('resize', function () { $$(FIT).forEach(fitInWindow); });
  var tw = $('#timeout-warning');
  if (tw) {
    setTimeout(function () { tw.hidden = false; $('#extend-session').focus(); }, 15 * 60 * 1000);
    $('#extend-session').addEventListener('click', function () { tw.hidden = true; window.lsAnnounce('You have 20 more minutes'); });
  }
})();
