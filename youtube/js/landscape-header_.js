/* Landscape Header TEST REV02 — relocates existing controls, never clones or rewires them. */
(() => {
  const mq = matchMedia('(orientation: landscape) and (max-height: 500px) and (pointer: coarse)');
  let shell = null;
  const moved = [];
  const original = new Map();
  function relocate(node, target) {
    if (!node || !target) return;
    const marker = document.createComment('landscape-original-position');
    node.parentNode.insertBefore(marker, node);
    original.set(node, marker);
    moved.push(node);
    target.appendChild(node);
  }
  function restore() {
    if (!shell) return;
    moved.reverse().forEach(node => {
      const marker = original.get(node);
      if (marker && marker.parentNode) marker.replaceWith(node);
    });
    moved.length = 0;
    original.clear();
    shell.remove();
    shell = null;
    document.body.classList.remove('ml-compact-landscape');
  }
  function activate() {
    if (!mq.matches || shell) return;
    const mount = document.querySelector('#mainModuleMount');
    const prefs = mount?.querySelector('.site-preferences');
    const banner = mount?.querySelector('.banner-wrap');
    const strip = mount?.querySelector('.subscribe-strip');
    const search = mount?.querySelector('.toolbar .search-box');
    const buttons = strip?.querySelector('.subscribe-strip-inner');
    if (!prefs || !banner || !strip || !search || !buttons || !document.getElementById('siteLanguageControl')) return;
    shell = document.createElement('div');
    shell.className = 'ml-landscape-header';
    shell.innerHTML = '<div class="ml-landscape-brand"></div><div class="ml-landscape-side"><div class="ml-landscape-top"><div class="ml-landscape-subscribe"></div><div class="ml-landscape-prefs"></div></div><div class="ml-landscape-buttons"></div><div class="ml-landscape-search"></div></div>';
    prefs.parentNode.insertBefore(shell, prefs);
    const subscribe = buttons.querySelector('.youtube-subscribe-btn');
    if (!subscribe) { shell.remove(); shell = null; return; }
    relocate(banner, shell.querySelector('.ml-landscape-brand'));
    relocate(prefs, shell.querySelector('.ml-landscape-prefs'));
    relocate(subscribe, shell.querySelector('.ml-landscape-subscribe'));
    relocate(buttons, shell.querySelector('.ml-landscape-buttons'));
    relocate(search, shell.querySelector('.ml-landscape-search'));
    document.body.classList.add('ml-compact-landscape');
  }
  function update() { if (mq.matches) activate(); else restore(); }
  const observer = new MutationObserver(() => { if (mq.matches && !shell) activate(); });
  observer.observe(document.documentElement, {childList:true, subtree:true});
  mq.addEventListener('change', update);
  document.addEventListener('DOMContentLoaded', update);
  update();
})();
