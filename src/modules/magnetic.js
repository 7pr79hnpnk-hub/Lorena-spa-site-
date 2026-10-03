/**
 * Magnetic buttons: the pill leans a few pixels toward the pointer and springs back.
 */
export function initMagnetic() {
  const strength = 0.22;
  const max = 10;

  for (const el of document.querySelectorAll('[data-magnetic]')) {
    let frame = 0;
    let tx = 0;
    let ty = 0;

    const apply = () => {
      frame = 0;
      el.style.translate = `${tx.toFixed(2)}px ${ty.toFixed(2)}px`;
    };

    el.addEventListener('pointermove', (event) => {
      const rect = el.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      tx = Math.max(-max, Math.min(max, dx * strength));
      ty = Math.max(-max, Math.min(max, dy * strength));
      if (!frame) frame = requestAnimationFrame(apply);
    });

    el.addEventListener('pointerleave', () => {
      tx = 0;
      ty = 0;
      if (!frame) frame = requestAnimationFrame(apply);
    });

    el.style.transition = `${getComputedStyle(el).transition}, translate 0.6s cubic-bezier(0.32, 0.72, 0, 1)`;
  }
}
