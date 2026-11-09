(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  try {
    const arrival = Number(sessionStorage.getItem('mx-site-arrival'));
    sessionStorage.removeItem('mx-site-arrival');
    if (arrival && Date.now() - arrival < 10000) {
      root.classList.add('mx-page-arriving');
      const clearArrival = () => requestAnimationFrame(() => {
        requestAnimationFrame(() => root.classList.remove('mx-page-arriving'));
      });
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', clearArrival, { once: true });
      } else {
        clearArrival();
      }
    }
  } catch (error) {
    console.warn('La transition d’arrivée MY EXAM n’a pas pu être initialisée.', error);
  }

  document.addEventListener('click', event => {
    if (
      reduceMotion ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const link = event.target.closest('a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) {
      return;
    }

    const destination = new URL(link.href, window.location.href);
    if (
      destination.protocol !== window.location.protocol ||
      destination.host !== window.location.host ||
      destination.pathname === window.location.pathname ||
      !/\.html?$/i.test(destination.pathname)
    ) {
      return;
    }

    event.preventDefault();
    try {
      sessionStorage.setItem('mx-site-arrival', String(Date.now()));
    } catch (error) {
      console.warn('La transition entre les pages MY EXAM ne peut pas mémoriser son arrivée.', error);
    }
    document.body.classList.add('mx-page-leaving');
    window.setTimeout(() => window.location.assign(destination.href), 120);
  });

  if (reduceMotion) {
    return;
  }

  const revealTargets = document.querySelectorAll([
    'main > section:not(.hero)',
    'main > .section',
    'main .hero-content',
    'main .hero-text',
    'main .hero-stage',
    'main .hero-grid > *',
    'main .hero-layout > *',
    'main .service-card',
    'main .course-card',
    'main .product-card',
    'main .info-tile',
    'main .strip-item',
    'main .highlight',
    'main .strength',
    'main .feature-item',
    'main .academy-banner',
    'main .contact-panel',
    'main .about-art'
  ].join(','));

  const revealGroups = new Map();
  revealTargets.forEach(target => {
    const group = revealGroups.get(target.parentElement) || [];
    group.push(target);
    revealGroups.set(target.parentElement, group);
  });

  const reveal = target => {
    target.classList.add('mx-revealed');
    observer?.unobserve(target);
  };
  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          reveal(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' })
    : null;

  revealGroups.forEach(group => {
    group.forEach((target, index) => {
      target.dataset.mxReveal = '';
      target.style.setProperty('--mx-reveal-delay', `${Math.min(index, 4) * 65}ms`);
      observer?.observe(target);
    });
  });

  root.classList.add('mx-effects-ready');

  let revealCheckScheduled = false;
  const revealVisibleTargets = () => {
    revealCheckScheduled = false;
    revealTargets.forEach(target => {
      if (target.classList.contains('mx-revealed')) {
        return;
      }
      const bounds = target.getBoundingClientRect();
      if (bounds.bottom > 24 && bounds.top < window.innerHeight - 24) {
        reveal(target);
      }
    });
  };
  const scheduleRevealCheck = () => {
    if (!revealCheckScheduled) {
      revealCheckScheduled = true;
      requestAnimationFrame(revealVisibleTargets);
    }
  };

  window.addEventListener('scroll', scheduleRevealCheck, { passive: true });
  window.addEventListener('resize', scheduleRevealCheck);
  scheduleRevealCheck();
})();
