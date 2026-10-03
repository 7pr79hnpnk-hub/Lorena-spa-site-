/**
 * Word-by-word scrub reveal. Text nodes are split into .w spans; inline images
 * count as words so they light up in sequence with the sentence.
 */
export function initManifesto(motion, { reducedMotion }) {
  const block = document.querySelector('[data-scrub-text]');
  if (!block) return;

  const units = [];
  const walk = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) {
        const parts = child.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        for (const part of parts) {
          if (!part) continue;
          if (/^\s+$/.test(part)) {
            frag.append(document.createTextNode(' '));
            continue;
          }
          const span = document.createElement('span');
          span.className = 'w';
          span.textContent = part;
          frag.append(span);
          units.push(span);
        }
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        if (child.classList.contains('inline-media')) {
          child.classList.add('w');
          units.push(child);
        } else {
          walk(child);
        }
      }
    }
  };
  walk(block);

  if (reducedMotion) {
    units.forEach((u) => (u.style.opacity = '1'));
    return;
  }

  const total = units.length;
  let last = -1;
  const paint = (progress) => {
    const lit = progress * (total + 4);
    const key = Math.round(lit * 10);
    if (key === last) return;
    last = key;
    for (let i = 0; i < total; i++) {
      const t = Math.min(1, Math.max(0, lit - i));
      units[i].style.opacity = (0.16 + t * 0.84).toFixed(3);
    }
  };

  motion.ScrollTrigger.create({
    trigger: block,
    start: 'top 82%',
    end: 'bottom 46%',
    onUpdate: (self) => paint(self.progress),
    onRefresh: (self) => paint(self.progress),
  });
}
