/* TEST REV02 — mobile-only custom popup for Genre; native select remains authoritative. */
(() => {
  const select = document.getElementById('typeFilter');
  if (!select || select.dataset.mlPopupEnhanced) return;
  const mobile = matchMedia('(max-width: 900px), (orientation: landscape) and (max-height: 500px)');
  // Capture the pre-wrapper width before the original direct-child CSS stops applying.
  // This prevents a zero/intrinsic-width flash while site_.js schedules its measurement.
  const initialWidth = Math.ceil(select.getBoundingClientRect().width);
  const anchor = document.createElement('span');
  anchor.className = 'ml-filter-popup-anchor';
  if (initialWidth > 0) anchor.style.width = `${initialWidth}px`;
  select.parentNode.insertBefore(anchor, select);
  anchor.appendChild(select);
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'ml-filter-popup-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-label', 'Genre');
  anchor.appendChild(trigger);
  const popup = document.createElement('div');
  popup.className = 'ml-filter-popup-menu';
  popup.id = 'ml-genre-popup';
  popup.setAttribute('role', 'listbox');
  popup.setAttribute('aria-label', 'Genre');
  popup.hidden = true;
  document.body.appendChild(popup);
  trigger.setAttribute('aria-controls', popup.id);
  select.dataset.mlPopupEnhanced = '1';
  let open = false;
  let activeIndex = 0;
  let lastSignature = '';
  let raf = 0;
  function options() { return Array.from(select.options).filter(o => !o.disabled); }
  function sync() {
    const selected = select.selectedOptions[0];
    trigger.textContent = selected ? selected.textContent.trim() : '';
    const width = getComputedStyle(select).getPropertyValue('--mobile-filter-selected-width').trim();
    // site_.js is the authoritative selected-label width calculator.
    // Its measurement is applied asynchronously; never collapse the wrapper while
    // that CSS variable is temporarily absent.
    if (width) anchor.style.width = width;
    const signature = options().map(o => `${o.value}:${o.textContent}:${o.selected}`).join('\u0001');
    if (open && signature !== lastSignature) renderOptions();
    lastSignature = signature;
  }
  function renderOptions() {
    popup.replaceChildren();
    let idx = 0;
    Array.from(select.children).forEach(child => {
      if (child.tagName === 'OPTGROUP') {
        const label = document.createElement('div');
        label.className = 'ml-filter-popup-group';
        label.textContent = child.label;
        popup.appendChild(label);
        Array.from(child.children).forEach(addOption);
      } else if (child.tagName === 'OPTION') addOption(child);
    });
    function addOption(opt) {
      if (opt.disabled) return;
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'ml-filter-popup-option';
      row.setAttribute('role', 'option');
      row.setAttribute('aria-selected', String(opt.selected));
      row.dataset.index = String(idx++);
      row.textContent = opt.textContent.trim();
      if (opt.selected) row.classList.add('is-selected');
      row.addEventListener('click', () => {
        select.value = opt.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        close();
        trigger.focus({ preventScroll: true });
      });
      popup.appendChild(row);
    }
    activeIndex = Math.max(0, options().findIndex(o => o.selected));
  }
  function position() {
    if (!open) return;
    const rect = trigger.getBoundingClientRect();
    const spaceBelow = innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const above = spaceBelow < 160 && spaceAbove > spaceBelow;
    const available = Math.max(90, above ? spaceAbove : spaceBelow);
    popup.style.maxHeight = `${Math.min(260, available)}px`;
    popup.style.left = `${Math.max(8, Math.min(rect.left, innerWidth - Math.max(180, rect.width) - 8))}px`;
    popup.style.minWidth = `${Math.min(rect.width, innerWidth - 16)}px`;
    popup.style.maxWidth = `${innerWidth - 16}px`;
    popup.style.top = above ? 'auto' : `${rect.bottom + 4}px`;
    popup.style.bottom = above ? `${innerHeight - rect.top + 4}px` : 'auto';
  }
  function close() {
    open = false;
    popup.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  }
  function show() {
    if (!mobile.matches) return;
    renderOptions();
    open = true;
    popup.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    position();
    const selected = popup.querySelector('.is-selected');
    if (selected) selected.scrollIntoView({ block: 'nearest' });
  }
  trigger.addEventListener('click', () => open ? close() : show());
  trigger.addEventListener('keydown', e => {
    if (e.key === 'Escape') { close(); return; }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(e.key)) return;
    e.preventDefault();
    if (!open) show();
    const rows = Array.from(popup.querySelectorAll('[role="option"]'));
    if (!rows.length) return;
    if (e.key === 'ArrowDown') activeIndex = Math.min(rows.length - 1, activeIndex + 1);
    if (e.key === 'ArrowUp') activeIndex = Math.max(0, activeIndex - 1);
    if (e.key === 'Home') activeIndex = 0;
    if (e.key === 'End') activeIndex = rows.length - 1;
    if (e.key === 'Enter' || e.key === ' ') rows[activeIndex].click();
    else rows[activeIndex].scrollIntoView({ block: 'nearest' });
  });
  document.addEventListener('pointerdown', e => {
    if (open && !anchor.contains(e.target) && !popup.contains(e.target)) close();
  });
  document.addEventListener('keydown', e => { if (open && e.key === 'Escape') close(); });
  select.addEventListener('change', () => { sync(); if (open) renderOptions(); });
  document.getElementById('clearFiltersBtn')?.addEventListener('click', () => requestAnimationFrame(sync));
  new MutationObserver(() => {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; sync(); });
  }).observe(select, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['label', 'selected', 'style'] });
  addEventListener('resize', () => { if (!mobile.matches) close(); sync(); position(); });
  addEventListener('scroll', position, true);
  if (mobile.addEventListener) mobile.addEventListener('change', () => { close(); sync(); });
  sync();
})();
