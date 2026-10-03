/**
 * Floating island nav: scrolled state, light-section contrast, current-section
 * highlight, and the full-screen menu with a morphing toggle.
 */
export function initNav(motion) {
  const nav = document.querySelector('[data-nav]');
  if (!nav) return;

  const toggle = nav.querySelector('[data-menu-toggle]');
  const menu = nav.querySelector('[data-menu]');
  const links = [...nav.querySelectorAll('.nav__links a')];

  // Scrolled state
  const sentinel = document.createElement('div');
  sentinel.style.cssText = 'position:absolute;top:0;height:80px;width:1px;pointer-events:none';
  document.body.prepend(sentinel);
  new IntersectionObserver(([entry]) => {
    nav.classList.toggle('is-scrolled', !entry.isIntersecting);
  }).observe(sentinel);

  // Light-section contrast (academy)
  const lightSections = document.querySelectorAll('[data-theme="light"]');
  const navProbe = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) entry.target.__underNav = entry.isIntersecting;
      nav.classList.toggle('is-light', [...lightSections].some((s) => s.__underNav));
    },
    { rootMargin: '-40px 0px -92% 0px' },
  );
  lightSections.forEach((s) => navProbe.observe(s));

  // Current section (sections without a nav link — hero, contact — clear the highlight)
  const sections = [...document.querySelectorAll('main > section[id]')];
  const current = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const id = `#${entry.target.id}`;
        for (const a of links) {
          const on = a.getAttribute('href') === id;
          a.classList.toggle('is-current', on);
          if (on) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        }
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  sections.forEach((s) => current.observe(s));

  // Menu
  if (!toggle || !menu) return;

  let open = false;
  let closeTimer;

  const setOpen = (next) => {
    if (next === open) return;
    open = next;
    clearTimeout(closeTimer);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'סגירת תפריט' : 'פתיחת תפריט');
    document.documentElement.style.overflow = open ? 'hidden' : '';

    if (open) {
      menu.hidden = false;
      motion.stop();
      requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open')));
      menu.querySelector('a')?.focus({ preventScroll: true });
    } else {
      menu.classList.remove('is-open');
      motion.start();
      closeTimer = setTimeout(() => (menu.hidden = true), 700);
    }
  };

  toggle.addEventListener('click', () => setOpen(!open));
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && open) {
      setOpen(false);
      toggle.focus();
    }
  });
  window.matchMedia('(min-width: 1080px)').addEventListener('change', (e) => e.matches && setOpen(false));
}
