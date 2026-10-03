/**
 * Gift card: tilts toward the pointer in 3D with a travelling foil glare.
 */
export function initTilt() {
  for (const card of document.querySelectorAll('[data-tilt]')) {
    const stage = card.closest('.gift__stage') ?? card;
    let frame = 0;
    let state = null;

    const apply = () => {
      frame = 0;
      if (!state) return;
      card.style.setProperty('--rx', `${state.rx.toFixed(2)}deg`);
      card.style.setProperty('--ry', `${state.ry.toFixed(2)}deg`);
      card.style.setProperty('--gx', `${state.gx.toFixed(1)}%`);
      card.style.setProperty('--gy', `${state.gy.toFixed(1)}%`);
      card.style.setProperty('--glare', String(state.glare));
    };

    stage.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const cx = Math.max(-0.5, Math.min(0.5, px - 0.5));
      const cy = Math.max(-0.5, Math.min(0.5, py - 0.5));
      state = { rx: -cy * 18, ry: cx * 22, gx: px * 100, gy: py * 100, glare: 1 };
      card.classList.add('is-tilting');
      if (!frame) frame = requestAnimationFrame(apply);
    });

    stage.addEventListener('pointerleave', () => {
      card.classList.remove('is-tilting');
      state = { rx: 6, ry: -10, gx: 30, gy: 20, glare: 0.55 };
      if (!frame) frame = requestAnimationFrame(apply);
    });
  }
}
