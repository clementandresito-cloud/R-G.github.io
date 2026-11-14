/* =========================================================
   R&G — Capa de animaciones
   Independiente de app.js. Todo respeta "reducir movimiento"
   y los efectos de mouse solo se activan con mouse.
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const scrollFns = [];
  const onScroll = fn => { scrollFns.push(fn); fn(); };
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { ticking = false; scrollFns.forEach(f => f()); });
  }, { passive: true });
  addEventListener('resize', () => scrollFns.forEach(f => f()));

  /* Scroll suave (Lenis) -------------------------------------------- */
  if (!reduced && fine && typeof window.Lenis === 'function') {
    try {
      const lenis = new Lenis({ lerp: 0.1 });
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
      lenis.on('scroll', () => scrollFns.forEach(f => f()));
      // El menú móvil y la galería de fotos bloquean el scroll
      new MutationObserver(() => document.body.classList.contains('menu-open') ? lenis.stop() : lenis.start())
        .observe(document.body, { attributes: true, attributeFilter: ['class'] });
    } catch (e) { /* sin scroll suave */ }
  }

  /* Proceso que se energiza con el scroll ---------------------------- */
  $$('.steps').forEach(steps => {
    const fill = $('.line-fill', steps), items = $$('.step', steps);
    if (reduced) { items.forEach(s => s.classList.add('lit')); return; }
    steps.classList.add('rg-live');
    const lineShown = () => fill && getComputedStyle(fill).display !== 'none';
    onScroll(() => {
      const r = steps.getBoundingClientRect(), vh = innerHeight;
      if (lineShown()) {
        const p = clamp((vh * 0.78 - r.top) / (vh * 0.55));
        fill.style.transform = `scaleX(${p})`;
        steps.classList.toggle('flowing', p > 0.01 && p < 0.999);
        const n = items.length;
        items.forEach((s, i) => s.classList.toggle('lit', p > 0.01 && p >= (n > 1 ? i / (n - 1) : 0) - 0.001));
      } else {
        items.forEach(s => { if (s.getBoundingClientRect().top < vh * 0.75) s.classList.add('lit'); });
      }
    });
  });

  /* Contadores tipo display: parpadeo al terminar de contar ---------- */
  $$('.stat b [data-count]').forEach(el => {
    const b = el.closest('b');
    new MutationObserver(() => { if (el.textContent === el.dataset.count) b.classList.add('rg-done'); })
      .observe(el, { childList: true, characterData: true, subtree: true });
  });

  /* Tarjetas 3D en sectores ------------------------------------------ */
  if (fine && !reduced) $$('.sector').forEach(c => {
    c.classList.add('rg-tilt');
    const g = document.createElement('span'); g.className = 'rg-glare'; c.append(g);
    c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.classList.add('tilting');
      c.style.transform = `rotateX(${((0.5 - y) * 9).toFixed(2)}deg) rotateY(${((x - 0.5) * 11).toFixed(2)}deg) translateZ(0)`;
      c.style.setProperty('--gx', (x * 100) + '%'); c.style.setProperty('--gy', (y * 100) + '%');
    });
    c.addEventListener('pointerleave', () => { c.classList.remove('tilting'); c.style.transform = ''; });
  });

  /* Botones magnéticos ----------------------------------------------- */
  if (fine && !reduced) $$('.btn-yellow, .btn-primary, .btn-outline').forEach(b => {
    if (b.closest('form') || b.closest('.lightbox')) return;
    b.classList.add('rg-mag');
    b.addEventListener('pointermove', e => {
      const r = b.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      b.classList.add('pulling');
      b.style.translate = `${(dx * 0.22).toFixed(1)}px ${(dy * 0.32).toFixed(1)}px`;
    });
    b.addEventListener('pointerleave', () => { b.classList.remove('pulling'); b.style.translate = ''; });
  });

  /* Cursor personalizado --------------------------------------------- */
  if (fine && !reduced) {
    const ring = document.createElement('div'), dot = document.createElement('div');
    ring.className = 'rg-cursor'; dot.className = 'rg-dot';
    ring.setAttribute('aria-hidden', 'true'); dot.setAttribute('aria-hidden', 'true');
    document.body.append(ring, dot);
    let mx = -100, my = -100, rx = -100, ry = -100;
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
      ring.classList.add('show'); dot.classList.add('show');
      const t = e.target;
      ring.classList.toggle('hover', !!t.closest('a, button, [role="button"], .svc, .proj, .sector, label, select'));
      ring.classList.toggle('dark', !!t.closest('.hero, .pagehero, .dark, .cta, .footer, .sectors-band'));
    }, { passive: true });
    document.addEventListener('pointerleave', () => { ring.classList.remove('show'); dot.classList.remove('show'); });
    const follow = () => {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx.toFixed(1)}px, ${ry.toFixed(1)}px)`;
      requestAnimationFrame(follow);
    };
    requestAnimationFrame(follow);
  }
})();
