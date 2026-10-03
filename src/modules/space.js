/**
 * The space photograph settles from a slow push-in to rest as it scrolls by.
 */
export function initSpace(motion, { reducedMotion }) {
  const section = document.querySelector('[data-space]');
  const media = section?.querySelector('[data-space-media]');
  if (!section || !media) return;

  if (reducedMotion) {
    media.style.setProperty('--space-scale', '1');
    return;
  }

  motion.ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: (self) => {
      const scale = 1.18 - self.progress * 0.18;
      media.style.setProperty('--space-scale', scale.toFixed(4));
    },
  });
}
