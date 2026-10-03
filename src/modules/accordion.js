/**
 * FAQ accordion — one open at a time, height animated via grid rows.
 */
export function initAccordion() {
  for (const root of document.querySelectorAll('[data-accordion]')) {
    const items = [...root.querySelectorAll('.qa')];
    for (const item of items) {
      const button = item.querySelector('.qa__q');
      button?.addEventListener('click', () => {
        const willOpen = !item.classList.contains('is-open');
        for (const other of items) {
          const on = other === item && willOpen;
          other.classList.toggle('is-open', on);
          other.querySelector('.qa__q')?.setAttribute('aria-expanded', String(on));
        }
      });
    }
  }
}
