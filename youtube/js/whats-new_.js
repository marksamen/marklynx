/* Mark Lynx What's New — TEST REV17. Public, read-only, no Firebase. */
(() => {
  'use strict';
  const ROOT = 'https://aikifibkcjibubqegvmb.supabase.co/rest/v1/';
  const KEY = 'sb_publishable_AMeGQySg9vDaKqkZRz_7HQ_yveiHHV_';
  const READ_KEY = 'marklynx.whatsnew.read.v1';
  const LANGUAGE_KEY = 'marklynx.public.language';
  // English source strings are permanent; translations use the site's existing
  // site_translations / TEST JSON recovery keys (managed centrally in Admin).
  const EN = {title:"What's New",new:'New',archive:'Archive',close:'Close',
    emptyNew:'No new announcements.',emptyArchive:'No archived announcements.',
    published:'Published'};
  const PREFIX='whats_new.';
  let uiTranslations = {}, uiLanguage = 'en', languageRequest = 0;
  const KEY_SUFFIX = {emptyNew:'empty_new',emptyArchive:'empty_archive'};
  const words = () => Object.fromEntries(Object.entries(EN).map(([k,v])=>[k,uiTranslations[PREFIX+(KEY_SUFFIX[k]||k)]||v]));
  async function loadUiLanguage() {
    const lang=language(); const token=++languageRequest;
    let next={};
    if(lang!=='en') {
      // Recovery JSON contains the approved UI labels. Load it first, then
      // allow Admin-managed Supabase translations to override individual keys.
      // An empty successful Supabase response must not erase recovery labels.
      try {
        const response=await fetch('data/translations_.json?v=WHATS-NEW-TEST-REV21',{cache:'no-store'});
        if(response.ok) next=(await response.json())[lang]||{};
      } catch(err) { console.warn('[WHATS NEW TEST] Translation recovery unavailable',err); }
      try {
        const rows=await request('site_translations','select=translation_key,translated_text&language_code=eq.'+encodeURIComponent(lang)+'&translation_key=like.whats_new.*');
        for(const row of rows) {
          if(typeof row.translated_text==='string' && row.translated_text.trim())
            next[row.translation_key]=row.translated_text;
        }
      } catch(err) { console.warn('[WHATS NEW TEST] Managed UI translations unavailable; using recovery',err); }
    }
    if(token===languageRequest) {uiLanguage=lang;uiTranslations=next;render();}
  }
  let announcements = [], translations = [], enabled = false, view = 'new', open = false;
  let button, overlay, dialog, list, tabs, title, closeButton;
  const readIds = (() => { try { const v = JSON.parse(localStorage.getItem(READ_KEY) || '[]'); return new Set(Array.isArray(v) ? v.map(String) : []); } catch { return new Set(); } })();
  const language = () => { let v = document.getElementById('siteLanguageSelect')?.value || document.documentElement.lang; if (!v) { try { v = localStorage.getItem(LANGUAGE_KEY); } catch {} } return v || 'en'; };
  const request = async (table, query) => {
    const r = await fetch(ROOT + table + '?' + query, { headers: { apikey: KEY }, cache: 'no-store' });
    if (!r.ok) throw new Error(table + ' HTTP ' + r.status);
    return r.json();
  };
  const date = value => { try { return new Intl.DateTimeFormat(undefined,{year:'numeric',month:'short',day:'numeric'}).format(new Date(value)); } catch { return ''; } };
  const persistRead = () => { try { localStorage.setItem(READ_KEY, JSON.stringify([...readIds])); } catch {} };
  const translate = a => translations.find(t => String(t.announcement_id) === String(a.id) && t.language_code === language()) || translations.find(t => String(t.announcement_id) === String(a.id) && t.language_code === 'en');
  const unread = a => !readIds.has(String(a.id));
  // Render Unicode country flags with the site's SVG assets, independently of OS emoji support.
  // Country-code filenames are the default; regional language variants use their established asset names.
  const FLAG_ASSET_OVERRIDES = { MX: 'es-mx', BR: 'pt-br' };
  const FLAG_PAIR = /[\u{1F1E6}-\u{1F1FF}]{2}/gu;
  function renderTitleWithFlags(element, value) {
    const text = String(value || '');
    element.textContent = '';
    let offset = 0;
    for (const match of text.matchAll(FLAG_PAIR)) {
      if (match.index > offset) element.append(document.createTextNode(text.slice(offset, match.index)));
      const emoji = match[0];
      const country = [...emoji].map(c => String.fromCharCode(65 + c.codePointAt(0) - 0x1F1E6)).join('');
      const asset = FLAG_ASSET_OVERRIDES[country] || country.toLowerCase();
      const img = document.createElement('img');
      img.className = 'wn-title-flag';
      img.src = 'images/flag-' + asset + '_.svg';
      img.alt = emoji;
      img.onerror = () => img.replaceWith(document.createTextNode(emoji));
      element.append(img);
      offset = match.index + emoji.length;
    }
    if (offset < text.length) element.append(document.createTextNode(text.slice(offset)));
  }
  function render() {
    if (!button || !overlay) return;
    button.hidden = !enabled;
    const mobile=document.getElementById('whatsNewMobileBtn');if(mobile){mobile.hidden=!enabled;mobile.title=words().title;mobile.setAttribute('aria-label',words().title);mobile.querySelector('.wn-label').textContent=words().title;mobile.querySelector('.wn-dot').hidden=!announcements.some(unread);}
    if (!enabled) { overlay.hidden = true; open = false; document.body.classList.remove('wn-open'); return; }
    const w = words();
    button.setAttribute('aria-label', w.title); button.title = w.title;
    button.querySelector('.wn-label').textContent = w.title;
    button.querySelector('.wn-dot').hidden = !announcements.some(unread);
    title.textContent = w.title; closeButton.setAttribute('aria-label',w.close);
    tabs[0].textContent = w.new; tabs[1].textContent = w.archive;
    tabs.forEach((t,i) => { t.setAttribute('aria-selected',String(view === (i ? 'archive':'new'))); });
    list.replaceChildren();
    const items = announcements.filter(a => view === 'new' ? unread(a) : !unread(a));
    if (!items.length) { const p = document.createElement('p'); p.className='wn-empty'; p.textContent = w[view === 'new' ? 'emptyNew':'emptyArchive']; list.append(p); return; }
    for (const a of items) {
      const tr = translate(a); if (!tr) continue;
      const card = document.createElement('article'); card.className='wn-card';
      const heading = document.createElement('button'); heading.type='button'; heading.className='wn-entry'; heading.setAttribute('aria-expanded','false');
      const h = document.createElement('strong'); renderTitleWithFlags(h,tr.title);
      const summary=document.createElement('span'); summary.textContent=tr.summary;
      const timestamp=document.createElement('small'); timestamp.textContent=w.published+': '+date(a.published_at);
      heading.append(h,summary,timestamp);
      const body=document.createElement('div'); body.className='wn-body'; body.hidden=true; body.textContent=tr.body;
      heading.addEventListener('click', () => {
        const expanding=body.hidden; body.hidden=!expanding; heading.setAttribute('aria-expanded',String(expanding));
        if (expanding && unread(a)) { readIds.add(String(a.id)); persistRead(); button.querySelector('.wn-dot').hidden = !announcements.some(unread);document.getElementById('whatsNewMobileBtn')?.querySelector('.wn-dot')?.toggleAttribute('hidden',!announcements.some(unread)); }
      });
      card.append(heading,body);list.append(card);
    }
  }
  function setOpen(value) {
    if (!enabled) return;
    open=value; overlay.hidden=!open;
    document.body.classList.toggle('wn-open',open);
    if (open) { view='new'; render(); closeButton.focus(); } else {const focusTarget=(button.offsetParent!==null?button:document.getElementById('whatsNewMobileBtn'));focusTarget?.focus();}
  }
  function init() {
    if (button) return;
    const anchor=document.querySelector('.subscribe-strip-inner');
    if (!anchor) return;
    button=document.createElement('button'); button.id='whatsNewPublicBtn';button.type='button';button.className='wn-button';button.hidden=true;
    button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg><span class="wn-label"></span><span class="wn-dot" hidden></span>';
    anchor.insertBefore(button,anchor.firstChild);
    const prefs=document.querySelector('.site-preferences-inner');
    if(prefs){ const mobile=button.cloneNode(true);mobile.id='whatsNewMobileBtn';mobile.classList.add('wn-mobile-button');mobile.addEventListener('click',()=>setOpen(true));prefs.append(mobile); }
    overlay=document.createElement('div');overlay.className='wn-overlay';overlay.hidden=true;
    overlay.innerHTML='<section class="wn-dialog" role="dialog" aria-modal="true" aria-labelledby="wn-title"><header class="wn-head"><h2 id="wn-title"></h2><button type="button" class="wn-close" aria-label="Close">×</button></header><div class="wn-tabs" role="tablist"><button type="button" role="tab"></button><button type="button" role="tab"></button></div><div class="wn-list"></div></section>';
    document.body.append(overlay);
    dialog=overlay.querySelector('.wn-dialog');title=overlay.querySelector('#wn-title');closeButton=overlay.querySelector('.wn-close');tabs=[...overlay.querySelectorAll('[role=tab]')];list=overlay.querySelector('.wn-list');
    button.addEventListener('click',()=>setOpen(true));closeButton.addEventListener('click',()=>setOpen(false));
    tabs.forEach((t,i)=>t.addEventListener('click',()=>{view=i?'archive':'new';render();}));
    document.addEventListener('keydown',e=>{if(open && e.key==='Escape'){e.preventDefault();setOpen(false);}});
    document.addEventListener('change',e=>{if(e.target?.id==='siteLanguageSelect') loadUiLanguage();});
    new MutationObserver(()=>{if(language()!==uiLanguage)loadUiLanguage();}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    render(); loadUiLanguage();
  }
  async function refresh() {
    try {
      const settings=await request('whats_new_settings','select=enabled&id=eq.1');
      enabled=settings.length===1 && settings[0].enabled===true;
      if (enabled) {
        announcements=await request('whats_new_announcements','select=id,status,published_at,created_at&status=eq.published&order=published_at.desc&limit=200');
        translations=await request('whats_new_translations','select=announcement_id,language_code,title,summary,body&limit=1200');
      } else {announcements=[];translations=[];}
    } catch (e) { console.warn('[WHATS NEW TEST] Public read unavailable; hiding bell',e); enabled=false; announcements=[]; translations=[]; }
    render();
  }
  const observer=new MutationObserver(()=>{if (!button && document.querySelector('.subscribe-strip-inner')) init();if(button && !document.body.contains(button)){button=null;overlay?.remove();overlay=null;init();}});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{init();refresh();},{once:true});else{init();refresh();}
  window.addEventListener('focus',refresh);
})();
