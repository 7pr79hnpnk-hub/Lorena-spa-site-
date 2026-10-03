/**
 * Hero orchestration: scroll progress, photo push-in, and the lazy 3D scene.
 * The gold DOM wordmark is the instant first paint and the no-WebGL fallback;
 * the WebGL wordmark cross-fades over it once its first frame is ready.
 */
function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export function initHero(motion, { reducedMotion }) {
  const hero = document.querySelector('[data-hero]');
  if (!hero) return;

  const canvas = hero.querySelector('[data-hero-canvas]');
  const slot = hero.querySelector('[data-hero-mark]');
  const media = hero.querySelector('[data-hero-media]');

  let scene = null;
  let progress = 0;

  motion.ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: 'bottom top',
    onUpdate: (self) => {
      progress = self.progress;
      scene?.setProgress(progress);
      if (!reducedMotion) {
        media?.style.setProperty('--hero-zoom', (1.04 + progress * 0.1).toFixed(4));
        if (scene) canvas.style.opacity = String(1 - Math.max(0, (progress - 0.45) / 0.45));
      }
    },
  });

  const saveData = navigator.connection?.saveData === true;
  if (!canvas || !slot || saveData || !supportsWebGL()) return;

  const boot = async () => {
    try {
      const { createHeroScene } = await import('../scene/hero-scene.js');
      scene = await createHeroScene({ canvas, slot, hero, reducedMotion });
      scene.setProgress(progress);
      hero.classList.add('is-3d');
      // After the cross-fade, scroll drives the canvas opacity directly.
      setTimeout(() => (canvas.style.transition = 'none'), 1700);
      document.fonts?.ready.then(() => scene.relayout());
    } catch (error) {
      console.warn('[LORENSA] 3D hero unavailable, keeping the static wordmark.', error);
    }
  };

  // Let the first paint land, then fetch three.js in the background.
  requestAnimationFrame(() => setTimeout(boot, 30));
}
