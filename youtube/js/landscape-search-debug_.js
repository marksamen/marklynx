(() => {
  'use strict';
  const ID = 'rev18-landscape-debug';
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
      panel.textContent = 'REV18 LIVE';
    }

    /* Put the diagnostic immediately ABOVE the Search box in the same layout area. */
    if (panel.nextSibling !== box) box.parentNode.insertBefore(panel, box);
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
        `REV18 LIVE | A:${active} | VV L:${n(left)} T:${n(top)} W:${n(vw)} H:${n(vh)} S:${n(scale)} | ` +
        `PAGE L:${n(vv ? vv.pageLeft : window.scrollX)} T:${n(vv ? vv.pageTop : window.scrollY)} | ` +
        `WIN X:${n(window.scrollX)} Y:${n(window.scrollY)} | ` +
        `IN L:${n(ir?.left)} R:${n(ir?.right)} W:${n(ir?.width)} | ` +
        `BOX L:${n(br?.left)} R:${n(br?.right)} W:${n(br?.width)} | ` +
        `PEAK L:${n(peakLeft)} T:${n(peakTop)} S:${n(peakScale)} minH:${n(peakMinH)}`;
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