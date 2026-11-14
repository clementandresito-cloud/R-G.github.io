/* =========================================================
   R&G Proyectos e Ingeniería — Interacciones del sitio
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WHATSAPP = '51997848742';
  const MAIL = 'administracion@rgproyectos.com';
  /* ---------- Pantalla de carga con el logo ---------- */
  const pl = $('.preloader');
  if (pl) {
    const root = document.documentElement;
    const first = root.classList.contains('pl-wait');
    try { sessionStorage.setItem('rg-visited', '1'); } catch (e) {}
    const start = performance.now();
    const minTime = first && !reduced ? 400 : 0;
    let gone = false;
    const hide = () => {
      if (gone) return; gone = true;
      setTimeout(() => {
        pl.classList.add('done');
        root.classList.remove('pl-wait');
        setTimeout(() => pl.remove(), 700);
      }, Math.max(0, minTime - (performance.now() - start)));
    };
    if (document.readyState === 'complete') hide(); else addEventListener('load', hide);
    setTimeout(hide, 4000);
  }

  /* ---------- Saltos directos: al llegar con #destino, ir justo ahí ---------- */
  const jumpToHash = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    const el = id && document.getElementById(id);
    if (!el) return;
    // offsetTop ignora las animaciones de entrada (transform), así el cálculo es exacto
    let y = 0;
    for (let n = el; n; n = n.offsetParent) y += n.offsetTop;
    y -= (innerWidth <= 920 ? 72 : 72) + 20;
    document.documentElement.style.scrollBehavior = 'auto';
    scrollTo(0, Math.max(0, y));
    document.documentElement.style.scrollBehavior = '';
  };
  if (location.hash) {
    addEventListener('load', () => { jumpToHash(); setTimeout(jumpToHash, 250); });
  }

  /* ---------- Al cambiar de página, empezar siempre desde arriba ---------- */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const toTop = () => { if (!location.hash) { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 0); document.documentElement.style.scrollBehavior = ''; } };
  toTop();
  addEventListener('load', () => { toTop(); setTimeout(toTop, 60); });
  addEventListener('pageshow', e => { if (e.persisted) toTop(); });

  const icon = {
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M8 7h9v9"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>'
  };

  /* ---------- Cabecera: oculta en la portada, aparece al bajar ---------- */
  const header = $('.header');
  const isHome = document.body.classList.contains('home');
  const hero = $('.hero');
  const progress = $('.progress');
  const totop = $('.totop');
  function onScroll() {
    const y = window.scrollY;
    const threshold = isHome && hero ? hero.offsetHeight * 0.55 : 40;
    if (header) {
      header.classList.toggle('solid', y > (isHome ? threshold : 40));
      if (isHome) header.classList.toggle('visible', y > threshold);
    }
    if (progress) {
      const max = document.documentElement.scrollHeight - innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    }
    if (totop) totop.classList.toggle('show', y > innerHeight);
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();
  totop?.addEventListener('click', () => scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));

  /* ---------- Menú móvil ---------- */
  const mm = $('.mobile-menu');
  const toggles = $$('.menu-toggle');
  function setMenu(open) {
    if (!mm) return;
    mm.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    mm.setAttribute('aria-hidden', String(!open));
    toggles.forEach(t => t.setAttribute('aria-expanded', String(open)));
    if (open) $('.mm-close', mm)?.focus();
  }
  toggles.forEach(t => t.addEventListener('click', () => setMenu(true)));
  $('.mm-close', mm || document)?.addEventListener('click', () => setMenu(false));
  $$('a', mm || document.createElement('div')).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && mm?.classList.contains('open')) setMenu(false); });

  /* ---------- Aparición al hacer scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  $$('.reveal, .img-reveal, .steps').forEach(el => io.observe(el));

  /* ---------- Contadores animados ---------- */
  const counters = $$('[data-count]');
  const cio = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target, end = Number(el.dataset.count);
      cio.unobserve(el);
      if (reduced) { el.textContent = end; return; }
      const dur = 1800, start = performance.now();
      const tick = now => {
        const p = Math.min((now - start) / dur, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => { c.textContent = '0'; cio.observe(c); });

  /* ---------- Parallax suave de la portada ---------- */
  const heroImg = $('.hero-media');
  if (heroImg && !reduced) {
    addEventListener('scroll', () => {
      const y = scrollY;
      if (y < innerHeight) heroImg.style.transform = `translateY(${y * 0.3}px)`;
    }, { passive: true });
  }

  /* ---------- Carruseles (clientes y testimonios): una tarjeta a la derecha cada 2 s ---------- */
  $$('.carousel-viewport').forEach(view => {
    const track = $('.carousel-track', view);
    if (!track || track.children.length < 2) return;
    let hover = false, busy = false;
    const settle = () => { track.style.transition = 'none'; track.style.transform = 'translateX(0)'; busy = false; };
    function move() {
      if (reduced || hover || busy || document.hidden) return;
      busy = true;
      const step = track.firstElementChild.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || 0);
      track.style.transition = 'none';
      track.prepend(track.lastElementChild);
      track.style.transform = `translateX(-${step}px)`;
      void track.offsetWidth;
      track.style.transition = 'transform 650ms cubic-bezier(.22,.61,.36,1)';
      track.style.transform = 'translateX(0)';
    }
    track.addEventListener('transitionend', e => { if (e.target === track) settle(); });
    view.addEventListener('mouseenter', () => hover = true);
    view.addEventListener('mouseleave', () => hover = false);
    addEventListener('resize', settle);
    let timer = setInterval(move, 2000);
    addEventListener('pagehide', () => clearInterval(timer));
    addEventListener('pageshow', e => { if (e.persisted) { clearInterval(timer); timer = setInterval(move, 2000); } });
  });

  /* ---------- Catálogo de servicios (pestañas) ---------- */
  const services = window.RG_SERVICES || [];
  const panel = $('#servicepanel');
  const tabs = $$('.tab');
  function showService(i, focus = false) {
    const s = services[i];
    if (!s || !panel) return;
    tabs.forEach((t, j) => {
      t.classList.toggle('active', i === j);
      t.setAttribute('aria-selected', String(i === j));
      t.tabIndex = i === j ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', 'tab' + i);
    const lists = s.groups.map(g => `<div><h4>${g.title}</h4><ul>${g.items.map(x => `<li>${x}</li>`).join('')}</ul></div>`).join('');
    panel.innerHTML = `
      <div class="sp-media"><img src="${s.img}" alt="${s.name}"><div class="sp-title"><small>Servicio ${s.num}</small><h2>${s.tagline}</h2></div></div>
      <div class="sp-body">
        <p>${s.desc}</p>
        <div class="sp-lists${s.groups.length === 1 ? ' single' : ''}">${lists}</div>
        <div class="sp-actions">
          <a class="btn btn-primary" href="contacto.html?servicio=${encodeURIComponent(s.name)}#contacto">Consultar este servicio ${icon.arrow}</a>
          <a class="btn btn-outline" href="proyectos.html#galeria">Ver proyectos</a>
        </div>
      </div>`;
    if (focus) $('#tab' + i)?.focus();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => {
      showService(i);
      if (innerWidth < 920) panel.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    });
    t.addEventListener('keydown', e => {
      const n = tabs.length;
      let k;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') k = (i + 1) % n;
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') k = (i + n - 1) % n;
      if (e.key === 'Home') k = 0;
      if (e.key === 'End') k = n - 1;
      if (k !== undefined) { e.preventDefault(); showService(k, true); }
    });
  });
  if (panel) {
    const q = Number(new URLSearchParams(location.search).get('especialidad'));
    showService(Number.isInteger(q) && q >= 0 && q < services.length ? q : 0);
  }

  /* ---------- Filtros de proyectos ---------- */
  $$('.filter').forEach(b => b.addEventListener('click', () => {
    $$('.filter').forEach(x => { x.classList.remove('active'); x.setAttribute('aria-pressed', 'false'); });
    b.classList.add('active'); b.setAttribute('aria-pressed', 'true');
    const f = b.dataset.filter;
    $$('.proj').forEach(p => p.classList.toggle('hidden', f !== 'Todos' && p.dataset.category !== f));
  }));

  /* ---------- Galería de fotos por proyecto ---------- */
  const lb = $('.lightbox');
  if (lb) {
    const img = $('.lb-stage img', lb), title = $('.lb-top h3', lb), sub = $('.lb-top small', lb), thumbs = $('.lb-thumbs', lb);
    let photos = [], idx = 0, lastFocus = null;
    const render = () => {
      img.src = photos[idx];
      img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
      sub.textContent = `${sub.dataset.base} · Foto ${idx + 1} de ${photos.length}`;
      $$('button', thumbs).forEach((b, j) => b.classList.toggle('active', j === idx));
    };
    const open = card => {
      photos = card.dataset.photos.split(',');
      idx = 0; lastFocus = card;
      title.textContent = card.querySelector('h3').textContent;
      img.alt = title.textContent;
      sub.dataset.base = card.dataset.category || 'Trabajo realizado';
      thumbs.innerHTML = photos.map((p, j) => `<button type="button" aria-label="Foto ${j + 1}"><img src="${p}" alt=""></button>`).join('');
      $$('button', thumbs).forEach((b, j) => b.addEventListener('click', () => { idx = j; render(); }));
      render();
      lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
      document.body.classList.add('menu-open');
      $('.lb-close', lb).focus();
    };
    const close = () => {
      lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('menu-open');
      lastFocus?.focus();
    };
    const go = d => { idx = (idx + d + photos.length) % photos.length; render(); };
    $$('.proj[data-photos]').forEach(c => c.addEventListener('click', () => open(c)));
    $('.lb-close', lb).addEventListener('click', close);
    $('.lb-prev', lb).addEventListener('click', () => go(-1));
    $('.lb-next', lb).addEventListener('click', () => go(1));
    lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb-stage')) close(); });
    addEventListener('keydown', e => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    });
    let sx = 0;
    lb.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
    lb.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); });
  }

  /* ---------- Formulario → WhatsApp ---------- */
  const form = $('#quote');
  if (form) {
    const select = $('[name=servicio]', form);
    const pre = new URLSearchParams(location.search).get('servicio');
    if (pre && [...select.options].some(o => o.value === pre)) select.value = pre;
    const buildText = () => {
      const f = new FormData(form);
      return `Hola R&G, quisiera solicitar una cotización.

Nombre: ${f.get('nombre')}
Empresa: ${f.get('empresa')}
Correo: ${f.get('email')}
Teléfono: ${f.get('telefono') || '-'}
Servicio: ${f.get('servicio')}

${f.get('mensaje')}`;
    };
    form.addEventListener('submit', e => {
      e.preventDefault();
      window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(buildText())}`, '_blank', 'noopener');
    });
    $('[data-send-mail]', form)?.addEventListener('click', () => {
      if (!form.reportValidity()) return;
      const subject = `Solicitud de cotización - ${new FormData(form).get('servicio')}`;
      location.href = `mailto:${MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildText())}`;
    });
  }

  /* ---------- Aviso de cookies y mapa con consentimiento ---------- */
  const KEY = 'rg-cookies';
  const getPref = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const setPref = v => { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch (e) {} };
  const banner = $('.cookie-banner');
  // Dentro de otra página (vista previa) los mapas incrustados se bloquean: ahí se deja la tarjeta con el enlace.
  const framed = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
  const loadMap = () => {
    const box = $('.map[data-map]');
    if (!box || framed || box.querySelector('iframe')) return;
    const link = box.querySelector('.map-consent a.btn')?.href || 'https://www.google.com/maps';
    box.classList.add('loaded');
    box.innerHTML = `<iframe title="Ubicación de R&G en San Martín de Porres, Lima" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${box.dataset.map}"></iframe>
      <div class="map-card"><b>R&amp;G Proyectos e Ingeniería</b><span>Urb. El Rosario del Norte, Mz. R, Lt. 35 · San Martín de Porres, Lima</span><a href="${link}" target="_blank" rel="noopener">Cómo llegar ↗</a></div>`;
  };
  if (framed) $$('[data-load-map]').forEach(b => b.hidden = true);
  const showBanner = show => { if (banner) { banner.hidden = !show; requestAnimationFrame(() => banner.classList.toggle('show', show)); } };
  if (!getPref()) setTimeout(() => showBanner(true), 1200);
  if (getPref() === 'accept') loadMap();
  $$('[data-cookies]').forEach(b => b.addEventListener('click', () => {
    const v = b.dataset.cookies;
    if (v === 'reset') { setPref(null); showBanner(true); return; }
    setPref(v); showBanner(false);
    if (v === 'accept') loadMap();
  }));
  $('[data-load-map]')?.addEventListener('click', loadMap);

  /* ---------- Año del footer ---------- */
  $$('.year').forEach(y => y.textContent = new Date().getFullYear());
})();
