(() => {
  'use strict';

  const ID = 'rev17-landscape-debug';
  let panel = null;
  let peakTop = 0;
  let peakLeft = 0;
  let peakScale = 0;
  let peakMinH = Infinity;

  function ensurePanel() {
    if (panel && panel.isConnected) return panel;
    panel = document.getElementById(ID);
    if (!panel) {
      panel = document.createElement('div');
      panel.id = ID;
      panel.textContent = 'REV17 LIVE';
      document.documentElement.appendChild(panel);
    }
    return panel;
  }

  function n(v) {
    return Number.isFinite(v) ? v.toFixed(1) : 'na';
  }

  function update() {
    const p = ensurePanel();
    const vv = window.visualViewport;
    const input = document.getElementById('searchInput');
    const box = input ? input.closest('.search-box') : null;
    const ir = input ? input.getBoundingClientRect() : null;
    const br = box ? box.getBoundingClientRect() : null;

    const left = vv ? vv.offsetLeft : 0;
    const top = vv ? vv.offsetTop : 0;
    const scale = vv ? vv.scale : 1;
    const vh = vv ? vv.height : window.innerHeight;
    const vw = vv ? vv.width : window.innerWidth;

    peakLeft = Math.max(peakLeft, Math.abs(left || 0));
    peakTop = Math.max(peakTop, Math.abs(top || 0));
    peakScale = Math.max(peakScale, scale || 0);
    peakMinH = Math.min(peakMinH, vh || Infinity);

    const active = document.activeElement === input ? 'SEARCH' :
      (document.activeElement ? document.activeElement.tagName : 'none');

    p.textContent =
      `REV17 LIVE | A:${active} | VV L:${n(left)} T:${n(top)} W:${n(vw)} H:${n(vh)} S:${n(scale)} | ` +
      `PAGE L:${n(vv ? vv.pageLeft : window.scrollX)} T:${n(vv ? vv.pageTop : window.scrollY)} | ` +
      `WIN X:${n(window.scrollX)} Y:${n(window.scrollY)} IW:${n(window.innerWidth)} IH:${n(window.innerHeight)} | ` +
      `IN L:${n(ir?.left)} R:${n(ir?.right)} W:${n(ir?.width)} | ` +
      `BOX L:${n(br?.left)} R:${n(br?.right)} W:${n(br?.width)} | ` +
      `PEAK L:${n(peakLeft)} T:${n(peakTop)} S:${n(peakScale)} minH:${n(peakMinH)}`;

    requestAnimationFrame(update);
  }

  ensurePanel();
  requestAnimationFrame(update);
})();