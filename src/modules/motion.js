import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * One shared motion runtime: Lenis smooth scroll driven by the GSAP ticker,
 * so ScrollTrigger and Lenis read the exact same scroll position every frame.
 */
export function createMotion({ reducedMotion }) {
  let lenis = null;

  if (!reducedMotion) {
    lenis = new Lenis({
      lerp: 0.09,
      wheelMultiplier: 0.95,
      smoothWheel: true,
      syncTouch: false,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const scrollTo = (target) => {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    if (lenis) {
      lenis.scrollTo(el, { offset: 0, duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
    } else {
      el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  };

  // In-page anchors glide instead of jumping.
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const hash = link.getAttribute('href');
    if (hash.length < 2) return;
    const target = document.querySelector(hash);
    if (!target) return;
    event.preventDefault();
    scrollTo(target);
    history.replaceState(null, '', hash);
  });

  return {
    gsap,
    ScrollTrigger,
    lenis,
    scrollTo,
    stop: () => lenis?.stop(),
    start: () => lenis?.start(),
  };
}
