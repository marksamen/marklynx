/* NORMAL-LANGUAGE PROD REV01 — presentation only; native language engine owns values. */
(() => {
  'use strict';
  const mobile = matchMedia('(max-width:900px), (orientation:landscape) and (max-height:500px), (pointer:coarse)');
  function mount() {
    const select = document.getElementById('siteLanguageSelect');
    const control = document.getElementById('siteLanguageControl');
    if (!select || !control || !control.contains(select)) return false;
    if (control.dataset.mlLanguagePopup) return true;
    const label = control.querySelector('label[for="siteLanguageSelect"]');
    if (!label) return false;
    const anchor = document.createElement('span');
    anchor.className = 'ml-language-popup-anchor';
    const trigger = document.createElement('button');
    trigger.type = 'button'; trigger.id = 'mlLanguagePopupTrigger';
    trigger.className = 'ml-language-popup-trigger'; trigger.hidden = true;
    trigger.setAttribute('aria-haspopup','listbox'); trigger.setAttribute('aria-expanded','false');
    const menu = document.createElement('div');
    menu.id = 'mlLanguagePopupMenu'; menu.className = 'ml-filter-popup-menu ml-language-popup-menu';
    menu.setAttribute('role','listbox'); menu.hidden = true;
    trigger.setAttribute('aria-controls',menu.id);
    const originalLabelId = label.id;
    if (!label.id) label.id = 'mlLanguagePopupLabel';
    trigger.setAttribute('aria-labelledby',`${label.id} ${trigger.id}`);
    menu.setAttribute('aria-labelledby',label.id);
    select.before(anchor); anchor.append(select,trigger); control.append(menu);
    control.dataset.mlLanguagePopup = '1';
    let open = false, active = false, queued = false;
    let signature = '';
    const options = () => Array.from(select.options).filter(o => !o.disabled && !o.hidden && !o.parentElement.disabled);
    const rows = () => Array.from(menu.querySelectorAll('[role="option"]'));
    function close(focus = false) {
      open = false; menu.hidden = true; trigger.setAttribute('aria-expanded','false');
      if (focus && active) trigger.focus({preventScroll:true});
    }
    function position() {
      if (!open) return;
      const r = trigger.getBoundingClientRect(), vv = window.visualViewport;
      const left = vv ? vv.offsetLeft : 0, top = vv ? vv.offsetTop : 0;
      const right = left + (vv ? vv.width : innerWidth), bottom = top + (vv ? vv.height : innerHeight);
      if (r.bottom <= top || r.top >= bottom) {close(); return;}
      const width = Math.min(Math.max(r.width,190),right-left-16);
      const below = bottom-r.bottom-12, above = r.top-top-12;
      const useAbove = below < 160 && above > below;
      const maxHeight = Math.min(320,Math.max(0,useAbove?above:below));
      if (maxHeight < 34 || width < 40) {close();return;}
      menu.style.width = `${width}px`;
      menu.style.maxHeight = `${maxHeight}px`;
      menu.style.left = `${Math.max(left+8,Math.min(r.right-width,right-width-8))}px`;
      menu.style.top = useAbove ? `${Math.max(top+8,r.top-4-menu.offsetHeight)}px` : `${r.bottom+4}px`;
    }
    function choose(opt) {
      if (!active || !options().includes(opt)) return;
      close(true);
      if (select.value !== opt.value) {
        select.value = opt.value;
        select.dispatchEvent(new Event('change',{bubbles:true}));
      }
      sync();
    }
    function render() {
      menu.replaceChildren();
      options().forEach(opt => {
        const row = document.createElement('button'); row.type = 'button'; row.tabIndex = -1;
        row.className = 'ml-filter-popup-option'; row.setAttribute('role','option');
        row.setAttribute('aria-selected',String(opt.selected));
        row.classList.toggle('is-selected',opt.selected);
        row.textContent = opt.textContent.trim();
        row.addEventListener('click',() => choose(opt)); menu.append(row);
      });
    }
    function sync() {
      queued = false;
      const selected = select.selectedOptions[0];
      const nextActive = mobile.matches && !!selected && !select.disabled && options().length > 0;
      if (active !== nextActive) {
        close(); active = nextActive;
        anchor.classList.toggle('is-mobile',active);
        trigger.hidden = !active;
        label.htmlFor = active ? trigger.id : select.id;
        if (!active && originalLabelId) label.id = originalLabelId;
      }
      if (!active) return;
      const text = selected.textContent.trim();
      if (trigger.textContent !== text) trigger.textContent = text;
      // Copy only the existing closed selector's paint; its box still sizes the anchor.
      const css = getComputedStyle(select);
      for (const prop of ['backgroundColor','backgroundImage','color','borderColor','borderRadius','boxShadow','fontFamily','fontSize','fontWeight']) {
        if (trigger.style[prop] !== css[prop]) trigger.style[prop] = css[prop];
      }
      const next = JSON.stringify(options().map(o=>[o.value,o.textContent,o.selected]));
      if (open && next !== signature) {render();position();}
      signature = next;
    }
    function schedule() {if (!queued) {queued = true;requestAnimationFrame(sync);}}
    function show(keyboard = false) {
      sync(); if (!active) return;
      render(); open = true; menu.hidden = false; trigger.setAttribute('aria-expanded','true'); position();
      if (!open) return;
      const selected = menu.querySelector('.is-selected') || rows()[0];
      if (selected) {
        // Scroll only the menu, not the page behind it.
        menu.scrollTop = Math.max(0,selected.offsetTop-menu.clientHeight+selected.offsetHeight+6);
        if (keyboard) selected.focus({preventScroll:true});
      }
    }
    trigger.addEventListener('click',e=>open?close():show(e.detail===0));
    trigger.addEventListener('keydown',e=>{
      if (e.key==='Escape') {close(true);return;}
      if (['ArrowDown','ArrowUp','Home','End'].includes(e.key)) {
        e.preventDefault(); if (!open) show(true);
        else (menu.querySelector('.is-selected')||rows()[0])?.focus({preventScroll:true});
      }
    });
    menu.addEventListener('keydown',e=>{
      if (e.key==='Escape') {e.preventDefault();close(true);return;}
      if (e.key==='Tab') {close(true);return;}
      if (!['ArrowDown','ArrowUp','Home','End'].includes(e.key)) return;
      e.preventDefault(); const list=rows(); let i=list.indexOf(document.activeElement);
      i=e.key==='Home'?0:e.key==='End'?list.length-1:Math.max(0,Math.min(list.length-1,i+(e.key==='ArrowDown'?1:-1)));
      list[i]?.focus();
    });
    document.addEventListener('pointerdown',e=>{if(open&&!anchor.contains(e.target)&&!menu.contains(e.target)&&e.target!==label)close();},true);
    document.addEventListener('focusin',e=>{if(open&&!anchor.contains(e.target)&&!menu.contains(e.target))close();});
    document.addEventListener('keydown',e=>{if(open&&e.key==='Escape')close(true);});
    select.addEventListener('change',sync);
    new MutationObserver(schedule).observe(select,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['disabled','hidden','selected','label']});
    new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','data-seasonal-theme','lang']});
    const resize=()=>{sync();position();};
    addEventListener('resize',resize);addEventListener('scroll',e=>{if(open&&!menu.contains(e.target))close();},true);
    if (mobile.addEventListener) mobile.addEventListener('change',resize); else mobile.addListener(resize);
    window.visualViewport?.addEventListener('resize',position);
    window.visualViewport?.addEventListener('scroll',position);
    if (typeof ResizeObserver!=='undefined') new ResizeObserver(position).observe(anchor);
    sync(); return true;
  }
  if (!mount()) {
    const observer = new MutationObserver(()=>{if(mount())observer.disconnect();});
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }
})();
