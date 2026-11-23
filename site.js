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

  // Einmalige Lichtfolge. Grundzustand und sämtliche Beschriftungen bleiben sichtbar.
  const anatomy = document.querySelector('.anatomy-study');
  const anatomyObserver = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      target.classList.add('is-illuminating');
      target.addEventListener('animationend', (event) => {
        if (event.target.classList.contains('force-mark')) {
          target.classList.remove('is-illuminating');
        }
      });
      anatomyObserver.unobserve(target);
    }
  }, { threshold: .25 });
  if (anatomy) anatomyObserver.observe(anatomy);

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
    anatomyObserver.disconnect();
    closing?.classList.remove('is-scroll-ready');
    hero?.classList.remove('is-scroll-ready');
    anatomy?.classList.remove('is-illuminating');
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
