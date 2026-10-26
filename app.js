(function () {
  'use strict';
  var doc = document, html = doc.documentElement;
  var IDS = ["the-early-bird", "the-spiritual", "the-focused-mind", "the-enthusiast", "the-chill", "fresh-daily"];
  var NAMES = {"the-early-bird": "The Early Bird", "the-spiritual": "The Spiritual", "the-focused-mind": "The Focused Mind", "the-enthusiast": "The Enthusiast", "the-chill": "The Chill", "fresh-daily": "Fresh Daily"};
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var events = window.dopeEvents = [];

  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  function valid(m) { return IDS.indexOf(m) > -1; }
  function param(k) { try { return new URLSearchParams(location.search).get(k); } catch (e) { return null; } }
  function stored() { try { return localStorage.getItem('dope-mood'); } catch (e) { return null; } }
  function store(v) { try { if (v) { localStorage.setItem('dope-mood', v); } else { localStorage.removeItem('dope-mood'); } } catch (e) {} }

  /* analytics hook: one delegated listener, events kept in memory only */
  doc.addEventListener('click', function (ev) {
    var el = ev.target.closest ? ev.target.closest('[data-event]') : null;
    if (el) { events.push({ name: el.getAttribute('data-event'), at: Date.now() }); }
  }, { passive: true });

  /* ---- mood state shared by both pages */
  var mood = null;
  function lit() {
    $$('.stamp[data-persona], .pcard[data-persona]').forEach(function (el) {
      el.classList.toggle('lit', !!mood && el.getAttribute('data-persona') === mood);
    });
  }
  function carry() {
    $$('a[href]').forEach(function (a) {
      var h0 = a.getAttribute('data-h0');
      var href = h0 || a.getAttribute('href');
      if (href.indexOf('menu.html') !== 0 || href.indexOf('?mood=') > -1) { return; }
      if (!h0) { a.setAttribute('data-h0', href); }
      var parts = href.split('#');
      var base = parts[0].split('?')[0];
      var hash = parts[1] ? '#' + parts[1] : '';
      a.setAttribute('href', mood ? base + '?mood=' + mood + hash : href);
    });
  }
  function setMood(m, persist) {
    mood = valid(m) ? m : null;
    if (mood) { html.setAttribute('data-mood', mood); } else { html.removeAttribute('data-mood'); }
    if (persist !== false) { store(mood); }
    lit();
    carry();
  }
  var q = param('mood');
  setMood(valid(q) ? q : (valid(stored()) ? stored() : null), valid(q));

  /* ---- header: transparent over the hero, solid after it */
  var hdr = $('.site-header');
  var sentinel = $('#hero-end'), sTop = $('#hero-top');
  if (hdr && sentinel && sTop && 'IntersectionObserver' in window) {
    var hh = hdr.offsetHeight;
    var watch = function (el, cls) {
      new IntersectionObserver(function (es) {
        var e = es[es.length - 1];
        hdr.classList.toggle(cls, !e.isIntersecting && e.boundingClientRect.top < hh);
      }, { rootMargin: '-' + hh + 'px 0px 0px 0px' }).observe(el);
    };
    watch(sTop, 'is-solid');
    watch(sentinel, 'past-hero');
  }

  /* ---- drawer */
  var burger = $('.burger'), dlg = $('#drawer');
  if (burger && dlg && dlg.showModal) {
    var closing = false;
    var finish = function (after) {
      dlg.classList.remove('is-closing');
      dlg.close();
      closing = false;
      burger.focus();
      if (after) { after(); }
    };
    var closeDrawer = function (after) {
      if (!dlg.open || closing) { return; }
      closing = true;
      burger.setAttribute('aria-expanded', 'false');
      if (reduce) { finish(after); } else { dlg.classList.add('is-closing'); setTimeout(function () { finish(after); }, 180); }
    };
    burger.addEventListener('click', function () {
      dlg.showModal();
      burger.setAttribute('aria-expanded', 'true');
      events.push({ name: 'open-drawer', at: Date.now() });
    });
    $('.drawer-close', dlg).addEventListener('click', function () { closeDrawer(); });
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); closeDrawer(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) { closeDrawer(); } });
    $$('a', dlg).forEach(function (a) {
      a.addEventListener('click', function (e) {
        var href = a.getAttribute('href');
        e.preventDefault();
        closeDrawer(function () {
          var hash = href.indexOf('#') > -1 ? href.split('#')[1] : '';
          var path = href.split('#')[0].split('?')[0];
          var here = location.pathname.split('/').pop() || 'index.html';
          if (hash && (path === '' || path === here || (path === 'index.html' && here === ''))) {
            var t = doc.getElementById(hash);
            if (t) { t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); history.replaceState(null, '', '#' + hash); }
          } else {
            location.href = href;
          }
        });
      });
    });
    window.addEventListener('resize', function () { if (dlg.open && window.innerWidth >= 1024) { dlg.close(); burger.setAttribute('aria-expanded', 'false'); closing = false; } });
  }

  /* ---- reveals (arch wipes, stamps, stickers) */
  var rv = $$('[data-rv]');
  if (rv.length) {
    if ('IntersectionObserver' in window && !reduce) {
      var rio = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } });
      }, { threshold: 0.2 });
      rv.forEach(function (el) { rio.observe(el); });
    } else {
      rv.forEach(function (el) { el.classList.add('in'); });
    }
  }

  /* ---- sideways tracks */
  $$('[data-track-btn]').forEach(function (b) {
    b.addEventListener('click', function () {
      var tr = doc.getElementById(b.getAttribute('data-track-btn'));
      var dir = parseInt(b.getAttribute('data-dir'), 10);
      if (tr) { tr.scrollBy({ left: dir * Math.max(260, tr.clientWidth * 0.7), behavior: reduce ? 'auto' : 'smooth' }); }
    });
  });

  /* ---- home: the six arches */
  var picker = $('.picker');
  if (picker) {
    var say = function (id) {
      var s = doc.getElementById('mood-status');
      if (s) { s.textContent = 'Showing ' + NAMES[id]; }
    };
    $$('input[name=mood]', picker).forEach(function (r) {
      var pick = function () {
        if (r.checked) { setMood(r.value); say(r.value); events.push({ name: 'mood-' + r.value, at: Date.now() }); }
      };
      r.addEventListener('change', pick);
      r.addEventListener('click', pick);
    });
    if (mood) {
      var r0 = doc.getElementById('mood-' + mood);
      if (r0) { r0.checked = true; say(mood); }
    }
  }

  /* ---- menu page */
  var main = $('.m-main');
  if (main) {
    var chipbar = $('#chipbar');
    var filter = 'all';
    var live = $('#menu-live');
    var statusEl = $('#chip-status');
    var statusText = statusEl ? $('.st-text', statusEl) : null;

    var syncBarHeight = function () {
      if (chipbar && getComputedStyle(chipbar).display !== 'none') {
        html.style.setProperty('--chipbar-h', chipbar.offsetHeight + 'px');
      } else {
        html.style.removeProperty('--chipbar-h');
      }
    };
    var applyFilter = function (f, url) {
      filter = (f === 'all' || valid(f)) ? f : 'all';
      $$('.block[data-persona], .pcard[data-persona]', main).forEach(function (el) {
        el.classList.toggle('m-hidden', filter !== 'all' && el.getAttribute('data-persona') !== filter);
      });
      $$('.chapter', main).forEach(function (ch) {
        var bs = $$('.block[data-persona]', ch);
        if (bs.length) {
          ch.classList.toggle('m-hidden', !bs.some(function (b) { return !b.classList.contains('m-hidden'); }));
        }
      });
      $$('[data-mood-btn]').forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-mood-btn') === filter ? 'true' : 'false');
      });
      var act = $('.chips-mo [data-mood-btn="' + filter + '"]');
      var mrow = act && act.parentNode;
      if (mrow && mrow.scrollWidth > mrow.clientWidth) {
        mrow.scrollLeft = Math.max(0, act.offsetLeft - (mrow.clientWidth - act.offsetWidth) / 2);
      }
      var msg = filter === 'all' ? '' : 'Showing ' + NAMES[filter];
      if (statusEl) { statusEl.hidden = filter === 'all'; if (statusText) { statusText.textContent = msg; } }
      if (live) { live.textContent = msg || 'Showing all moods'; }
      main.classList.add('m-filtering');
      if (filter !== 'all') { setMood(filter); }
      if (url !== false) {
        history.replaceState(null, '', location.pathname + '?mood=' + filter + location.hash);
      }
      syncBarHeight();
    };
    $$('[data-mood-btn]').forEach(function (b) {
      b.addEventListener('click', function () {
        applyFilter(b.getAttribute('data-mood-btn'));
        events.push({ name: 'menu-mood-' + b.getAttribute('data-mood-btn'), at: Date.now() });
      });
    });
    $$('[data-mood-reset]').forEach(function (b) {
      b.addEventListener('click', function () { applyFilter('all'); events.push({ name: 'menu-mood-reset', at: Date.now() }); });
    });

    var goTo = function (id) {
      var t = doc.getElementById(id);
      if (!t) { return; }
      if (t.closest('.m-hidden')) { applyFilter('all'); }
      t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', location.pathname + location.search + '#' + id);
    };
    var spyIds = ['food-drop', 'sweet-cravings', 'thirst-traps', 'all-the-sips', 'from-our-roastery'];
    var setActive = function (id) {
      $$('[data-chap]').forEach(function (a) {
        var on = a.getAttribute('data-chap') === id;
        if (on) { a.setAttribute('aria-current', 'true'); } else { a.removeAttribute('aria-current'); }
      });
      var chip = $('.chips-ch [data-chap="' + id + '"]');
      var row = chip && chip.parentNode;
      if (row && row.scrollWidth > row.clientWidth) {
        row.scrollLeft = Math.max(0, chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2);
      }
    };
    $$('[data-chap]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var id = a.getAttribute('data-chap');
        goTo(id);
        setActive(id);
        events.push({ name: 'menu-chapter-' + id, at: Date.now() });
      });
    });
    $$('a[href^="#"]', main).forEach(function (a) {
      if (a.hasAttribute('data-chap')) { return; }
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href').slice(1);
        if (doc.getElementById(id)) { e.preventDefault(); goTo(id); }
      });
    });

    var spy = null;
    var buildSpy = function () {
      if (!('IntersectionObserver' in window)) { return; }
      if (spy) { spy.disconnect(); }
      var barShown = chipbar && getComputedStyle(chipbar).display !== 'none';
      var inset = (barShown ? chipbar.offsetHeight : (hdr ? hdr.offsetHeight : 0)) + 8;
      var seen = {};
      spy = new IntersectionObserver(function (es) {
        es.forEach(function (e) { seen[e.target.id] = e.isIntersecting; });
        var cur = null;
        spyIds.forEach(function (id) { if (seen[id]) { cur = id; } });
        if (cur) { setActive(cur); }
      }, { rootMargin: '-' + inset + 'px 0px -55% 0px' });
      spyIds.forEach(function (id) { var el = doc.getElementById(id); if (el) { spy.observe(el); } });
    };

    var start = param('mood');
    applyFilter(valid(start) ? start : (start ? 'all' : (mood || 'all')), false);
    syncBarHeight();
    buildSpy();
    if ('ResizeObserver' in window && chipbar) {
      new ResizeObserver(function () { syncBarHeight(); buildSpy(); }).observe(chipbar);
    }
    window.addEventListener('resize', function () { syncBarHeight(); buildSpy(); });
    if (location.hash) {
      var th = doc.getElementById(location.hash.slice(1));
      if (th && !th.closest('.m-hidden')) { requestAnimationFrame(function () { th.scrollIntoView({ block: 'start' }); }); }
    }
  }
})();
