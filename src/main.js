import '@fontsource-variable/frank-ruhl-libre';
import '@fontsource-variable/assistant';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-600.css';
import '@fontsource/cormorant-garamond/latin-300.css';

import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/sections.css';

import { createMotion } from './modules/motion.js';
import { initNav } from './modules/nav.js';
import { initReveal } from './modules/reveal.js';
import { initLeds } from './modules/leds.js';
import { initManifesto } from './modules/manifesto.js';
import { initServices } from './modules/services.js';
import { initRitual } from './modules/ritual.js';
import { initSpace } from './modules/space.js';
import { initMagnetic } from './modules/magnetic.js';
import { initTilt } from './modules/tilt.js';
import { initAccordion } from './modules/accordion.js';
import { initMediaFallbacks } from './modules/media.js';
import { initHero } from './modules/hero.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const motion = createMotion({ reducedMotion });

initMediaFallbacks();
initNav(motion);
initReveal();
initLeds(motion);
initManifesto(motion, { reducedMotion });
initServices({ finePointer });
initRitual(motion);
initSpace(motion, { reducedMotion });
initAccordion();
initHero(motion, { reducedMotion });

if (finePointer && !reducedMotion) {
  initMagnetic();
  initTilt();
}

const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());
