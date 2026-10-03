/**
 * Treatment picker: hovering (fine pointers) or tapping a row expands it and
 * cross-fades the matching photograph in the sticky media frame.
 */
export function initServices({ finePointer }) {
  const list = document.querySelector('[data-services]');
  const media = document.querySelector('[data-service-media]');
  if (!list) return;

  const items = [...list.querySelectorAll('[data-service]')];
  const pictures = media ? [...media.querySelectorAll('[data-media]')] : [];
  let active = items.find((i) => i.classList.contains('is-active')) ?? items[0];

  const activate = (item) => {
    if (item === active) return;
    active = item;
    for (const el of items) {
      const on = el === item;
      el.classList.toggle('is-active', on);
      el.querySelector('.service__trigger')?.setAttribute('aria-expanded', String(on));
    }
    const key = item.dataset.service;
    for (const pic of pictures) pic.classList.toggle('is-active', pic.dataset.media === key);
  };

  for (const item of items) {
    const trigger = item.querySelector('.service__trigger');
    trigger?.addEventListener('click', () => activate(item));
    trigger?.addEventListener('focus', () => activate(item));
    if (finePointer) {
      let hoverTimer;
      item.addEventListener('pointerenter', () => {
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => activate(item), 90);
      });
      item.addEventListener('pointerleave', () => clearTimeout(hoverTimer));
    }
  }
}
