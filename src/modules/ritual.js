/**
 * Ritual narrative: the step crossing the viewport centre becomes active,
 * the golden halo fills with section progress and lights one node per step.
 */
export function initRitual(motion) {
  const section = document.querySelector('[data-ritual]');
  if (!section) return;

  const steps = [...section.querySelectorAll('[data-step]')];
  const halo = section.querySelector('[data-halo]');
  const progress = section.querySelector('[data-halo-progress]');
  const nodes = [...section.querySelectorAll('[data-halo-node]')];
  const count = section.querySelector('[data-step-count]');
  const label = section.querySelector('[data-step-label]');
  const stepsList = section.querySelector('.steps');

  let current = 0;
  let swapTimer;

  const setStep = (index) => {
    if (index === current) return;
    current = index;
    steps.forEach((s, i) => s.classList.toggle('is-active', i === index));
    nodes.forEach((n, i) => n.classList.toggle('is-on', i <= index));

    if (!halo) return;
    clearTimeout(swapTimer);
    halo.classList.add('is-switching');
    swapTimer = setTimeout(() => {
      count.textContent = String(index + 1).padStart(2, '0');
      label.textContent = steps[index].querySelector('.step__title')?.textContent ?? '';
      halo.classList.remove('is-switching');
    }, 260);
  };

  nodes[0]?.classList.add('is-on');

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) setStep(steps.indexOf(entry.target));
      }
    },
    { rootMargin: '-48% 0px -48% 0px' },
  );
  steps.forEach((s) => observer.observe(s));

  if (progress && stepsList) {
    motion.ScrollTrigger.create({
      trigger: stepsList,
      start: 'top 55%',
      end: 'bottom 55%',
      onUpdate: (self) => progress.style.setProperty('--halo-offset', (1 - self.progress).toFixed(4)),
    });
  }
}
