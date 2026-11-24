/* Only the German home page may select a language on an external entry. */
(() => {
  'use strict';
  const { location, navigator, document } = window;
  if (!['/', '/index.html'].includes(location.pathname)) return;
  if (navigator.webdriver || /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|headless|lighthouse|chatgpt|claude|perplexity|anthropic|openai|google-inspectiontool/i.test(navigator.userAgent || '')) return;
  let internal = false;
  if (document.referrer) {
    try {
      const host = new URL(document.referrer).hostname.toLowerCase().replace(/^www\./, '');
      internal = host === location.hostname.toLowerCase().replace(/^www\./, '');
    } catch (_) { return; }
  }
  if (internal) return;
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language || ''];
  if (languages.some(language => /^de/i.test(language))) return;
  location.replace('/en/' + location.search + location.hash);
})();

/* Optionale Bewegung. Alle Inhalte sind ohne JS sichtbar und in Endposition. */
(() => {
  'use strict';
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || !('IntersectionObserver' in window)) return;

  // Native Scroll-Timeline statt JS pro Frame. Ohne Unterstützung bleibt die Endlage.
  const closing = document.querySelector('.closing-card');
  if (closing && window.CSS?.supports('animation-timeline: view()') &&
      window.CSS.supports('view-timeline-name: --closing') &&
      window.CSS.supports('animation-range: entry 20% cover 60%')) {
    closing.classList.add('is-scroll-ready');
  }
  const hero = document.querySelector('.hero');
  if (hero && window.CSS?.supports('animation-timeline: --hero') &&
      window.CSS.supports('view-timeline-name: --hero') &&
      window.CSS.supports('view-timeline-inset: 0') &&
      window.CSS.supports('animation-range: exit-crossing 0% exit-crossing 100%')) {
    hero.classList.add('is-scroll-ready');
  }

  const observer = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      // Direkt angesprungene oder bereits sichtbare Inhalte bleiben sofort da.
      if (target.getBoundingClientRect().top > window.innerHeight * .7) {
        target.classList.add('is-entering');
        target.addEventListener('animationend', () => {
          target.classList.remove('is-entering');
        }, { once: true });
      }
      observer.unobserve(target);
    }
  }, { threshold: 0, rootMargin: '0px 0px 0px 0px' });

  for (const target of document.querySelectorAll('.reveal')) observer.observe(target);

  const stop = () => {
    if (!motion.matches) return;
    observer.disconnect();
    closing?.classList.remove('is-scroll-ready');
    hero?.classList.remove('is-scroll-ready');
    for (const target of document.querySelectorAll('.is-entering')) {
      target.classList.remove('is-entering');
    }
  };
  if (motion.addEventListener) motion.addEventListener('change', stop);
  else if (motion.addListener) motion.addListener(stop);
  // Tastaturfokus darf niemals auf noch einblendendem Inhalt landen.
  document.addEventListener('focusin', ({ target }) => {
    target.closest('.is-entering')?.classList.remove('is-entering');
  });
})();

/* ZEIT-Karten: eine gemeinsame, optionale Mausbewegung für DE/EN und Über. */
(() => {
  'use strict';
  const hover = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  const cards = document.querySelectorAll('.press-card');
  if (!cards.length) return;
  const resets = [];
  const invalidations = [];
  for (const card of cards) {
    let bounds = null;
    let frame = 0;
    let position = null;
    // Die unbewegte Hülle liefert stabile Koordinaten, auch beim Wiedereintritt.
    const measure = () => {
      const shell = card.parentElement;
      const rect = shell.getBoundingClientRect();
      const style = window.getComputedStyle(shell);
      const left = parseFloat(style.paddingLeft) || 0;
      const right = parseFloat(style.paddingRight) || 0;
      const top = parseFloat(style.paddingTop) || 0;
      bounds = { left: rect.left + left, top: rect.top + top,
        width: rect.width - left - right, height: card.offsetHeight };
    };
    const update = () => {
      frame = 0;
      if (!hover.matches || !position || !bounds?.width || !bounds.height) return;
      const x = Math.max(0, Math.min(1, (position.x - bounds.left) / bounds.width));
      const y = Math.max(0, Math.min(1, (position.y - bounds.top) / bounds.height));
      card.style.setProperty('--press-rx', `${((.5 - y) * 4).toFixed(3)}deg`);
      card.style.setProperty('--press-ry', `${((x - .5) * 4).toFixed(3)}deg`);
      card.style.setProperty('--press-x', `${(x * 100).toFixed(2)}%`);
      card.style.setProperty('--press-y', `${(y * 100).toFixed(2)}%`);
      card.classList.remove('is-entering');
      card.classList.add('is-hovering');
    };
    const move = event => {
      if (!hover.matches || event.pointerType !== 'mouse') return;
      if (!bounds) measure();
      position = { x: event.clientX, y: event.clientY };
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const reset = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      position = null;
      bounds = null;
      card.classList.remove('is-hovering');
      card.style.removeProperty('--press-rx');
      card.style.removeProperty('--press-ry');
    };
    card.addEventListener('pointerenter', move);
    card.addEventListener('pointermove', move);
    card.addEventListener('pointerleave', reset);
    card.addEventListener('pointercancel', reset);
    resets.push(reset);
    invalidations.push(() => { bounds = null; });
  }
  const resetAll = () => resets.forEach(reset => reset());
  const invalidate = () => invalidations.forEach(invalidate => invalidate());
  window.addEventListener('resize', invalidate, { passive: true });
  window.addEventListener('scroll', invalidate, { passive: true });
  window.addEventListener('blur', resetAll);
  if (hover.addEventListener) hover.addEventListener('change', resetAll);
  else if (hover.addListener) hover.addListener(resetAll);
})();
