/**
 * If a photograph is missing, keep its gradient frame instead of a broken image.
 */
export function initMediaFallbacks() {
  const mark = (img) => img.closest('.media, .inline-media')?.classList.add('is-missing');

  document.addEventListener(
    'error',
    (event) => {
      if (event.target instanceof HTMLImageElement) mark(event.target);
    },
    true,
  );

  for (const img of document.images) {
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) mark(img);
  }
}
