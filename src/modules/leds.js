/**
 * Side LED rails: a glowing bead on each edge that travels with page progress,
 * and dims to bronze over the light academy section.
 */
export function initLeds(motion) {
  const beads = document.querySelectorAll('.leds__bead');
  if (!beads.length) return;

  let travel = 0;
  const measure = () => {
    const bead = beads[0];
    travel = window.innerHeight - bead.offsetHeight;
  };
  measure();
  window.addEventListener('resize', measure, { passive: true });

  const update = (progress) => {
    const y = `${(progress * travel).toFixed(1)}px`;
    beads.forEach((b) => b.style.setProperty('--led-y', y));
  };

  motion.ScrollTrigger.create({
    trigger: document.documentElement,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => update(self.progress),
    onRefresh: (self) => {
      measure();
      update(self.progress);
    },
  });

  const light = document.querySelectorAll('[data-theme="light"]');
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) entry.target.__mid = entry.isIntersecting;
      document.body.classList.toggle('is-light', [...light].some((s) => s.__mid));
    },
    { rootMargin: '-50% 0px -50% 0px' },
  );
  light.forEach((s) => observer.observe(s));
}
