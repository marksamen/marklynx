(() => {
  'use strict';
  const ID = 'rev21-landscape-debug';
  let panel = null, peakTop = 0, peakLeft = 0, peakScale = 0, peakMinH = Infinity;

  function install() {
    const input = document.getElementById('searchInput');
    if (!input) return false;
    const box = input.closest('.search-box');
    if (!box || !box.parentNode) return false;

    panel = document.getElementById(ID);
    if (!panel) {
      panel = document.createElement('div');
      panel.id = ID;
      panel.textContent = 'REV21 LIVE';
    }

    /* REV21: start immediately above Search; long tail may extend across Search. */
    if (panel.nextSibling !== box) box.parentNode.insertBefore(panel, box);

    Object.assign(panel.style, {
      position: 'absolute',
      zIndex: '2147483647',
      boxSizing: 'border-box',
      width: 'max-content',
      maxWidth: 'none',
      margin: '0',
      padding: '1px 2px',
      font: '700 6px/1 monospace',
      whiteSpace: 'nowrap',
      overflow: 'visible',
      pointerEvents: 'none'
    });

    const parent = box.parentElement;
    if (parent && getComputedStyle(parent).position === 'static') parent.style.position = 'relative';

    const parentRect = parent.getBoundingClientRect();
    const boxRect = box.getBoundingClientRect();
    panel.style.left = `${boxRect.left - parentRect.left}px`;

    /* Bottom edge begins at Search's top edge; no second-line wrap. */
    panel.style.top = `${boxRect.top - parentRect.top - panel.offsetHeight}px`;
    return true;
  }

  function n(v) { return Number.isFinite(v) ? v.toFixed(1) : 'na'; }

  function update() {
    if (!panel || !panel.isConnected) install();

    const vv = window.visualViewport;
    const input = document.getElementById('searchInput');
    const box = input ? input.closest('.search-box') : null;
    const ir = input ? input.getBoundingClientRect() : null;
    const br = box ? box.getBoundingClientRect() : null;

    const left = vv ? vv.offsetLeft : 0, top = vv ? vv.offsetTop : 0;
    const scale = vv ? vv.scale : 1;
    const vh = vv ? vv.height : window.innerHeight, vw = vv ? vv.width : window.innerWidth;

    peakLeft = Math.max(peakLeft, Math.abs(left || 0));
    peakTop = Math.max(peakTop, Math.abs(top || 0));
    peakScale = Math.max(peakScale, scale || 0);
    peakMinH = Math.min(peakMinH, vh || Infinity);

    if (panel) {
      const active = document.activeElement === input ? 'SEARCH' :
        (document.activeElement ? document.activeElement.tagName : 'none');
      panel.textContent =
        `REV21 | A:${active} | VV:${n(left)},${n(top)},${n(vw)},${n(vh)},${n(scale)} | ` +
        `PG:${n(vv ? vv.pageLeft : window.scrollX)},${n(vv ? vv.pageTop : window.scrollY)} | ` +
        `W:${n(window.scrollX)},${n(window.scrollY)} | ` +
        `IN:${n(ir?.left)},${n(ir?.right)},${n(ir?.width)} | ` +
        `BX:${n(br?.left)},${n(br?.right)},${n(br?.width)} | ` +
        `PK:${n(peakLeft)},${n(peakTop)},${n(peakScale)},${n(peakMinH)}`;
    }
    requestAnimationFrame(update);
  }

  const boot = () => {
    install();
    requestAnimationFrame(update);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();