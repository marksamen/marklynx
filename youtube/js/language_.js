/* MARKLYNX PUBLIC LANGUAGE — TEST REV08. Additive layer; never alters game data or frozen Recent scripts. */
(() => {
  'use strict';
  const ROOT = 'https://aikifibkcjibubqegvmb.supabase.co/rest/v1/';
  const API_KEY = 'sb_publishable_AMeGQySg9vDaKqkZRz_7HQ_yveiHHV_';
  const KEY = 'marklynx.public.language';
  const originals = new WeakMap();
  const lastRendered = new WeakMap();
  const english = Object.create(null);
  let translations = {}, language = 'en', enabled = new Set(['en']), busy = false, scheduled = false;
  const norm = v => String(v ?? '').replace(/\s+/g, ' ').trim();
  const headers = {apikey: API_KEY};
  const fetchRows = async (table, query) => {
    const r = await fetch(ROOT + table + '?' + query, {headers,cache:'no-store'});
    if (!r.ok) throw Error(table + ': HTTP ' + r.status);
    const rows = await r.json();
    if (!Array.isArray(rows)) throw Error(table + ': invalid rows');
    return rows;
  };
  const selector = document.createElement('select');
  selector.id = 'siteLanguageSelect';
  selector.setAttribute('aria-label','Website language');
  selector.title = 'Website language';
  selector.style.cssText = 'background:#20242b;color:#fff;border:1px solid #777;border-radius:6px;padding:7px 9px;max-width:145px;cursor:pointer;';
  const label = document.createElement('label');
  label.htmlFor = selector.id;
  label.textContent = 'Language';
  label.style.cssText = 'font-size:12px;font-weight:600;color:inherit;';
  const wrap = document.createElement('div');
  wrap.id = 'siteLanguageControl';
  wrap.style.cssText = 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;';
  wrap.append(label,selector);
  const insertSelector = () => {
    const prefs = document.querySelector('.site-preferences-inner');
    if (prefs && !wrap.isConnected) prefs.append(wrap);
  };
  const addEnglish = (key,value) => { if (value) english[key] = norm(value); };
  const englishByText = () => {
    const lookup = new Map();
    for (const [key,value] of Object.entries(english)) {
      if (!lookup.has(value)) lookup.set(value,key);
    }
    // Explicitly resolve the identical English strings that have distinct translation keys.
    lookup.set('Recent Uploads','recent.heading');
    return lookup;
  };
  let lookup = new Map();
  const setLanguages = rows => {
    enabled = new Set(['en']);
    const options = [{value:'en',text:'English'}];
    for (const row of rows) {
      if (row.code === 'en' || !row.enabled || !/^[a-z]{2,3}(?:-[a-z0-9]+)*$/i.test(row.code)) continue;
      enabled.add(row.code);
      options.push({value:row.code,text:row.native_name || row.english_name || row.code});
    }
    selector.replaceChildren(...options.map(o => new Option(o.text,o.value)));
    selector.value = enabled.has(language) ? language : 'en';
  };
  const getTranslation = (key,source) => language !== 'en' && translations[key] ? translations[key] : source;
  const translated = source => {
    const key = lookup.get(norm(source));
    if (key) return getTranslation(key,source);
    // A count line is produced by the existing game renderer.
    const m = norm(source).match(/^Showing (\d+) of (\d+) guides$/);
    if (m && language !== 'en' && translations['main.count_template'])
      return translations['main.count_template'].replace('{shown}',m[1]).replace('{total}',m[2]);
    return source;
  };
  const updateNode = node => {
    const current = node.nodeValue;
    if (!norm(current)) return;
    let source = originals.get(node);
    if (source === undefined) { source = current; originals.set(node,source); }
    else if (current !== lastRendered.get(node)) { source = current; originals.set(node,source); }
    const result = translated(source);
    lastRendered.set(node,result);
    if (result !== current) node.nodeValue = result;
  };
  const updateAttribute = (element,attr) => {
    const current = element.getAttribute(attr);
    if (!current) return;
    const key = '__lang_original_' + attr;
    let source = element[key];
    if (source === undefined) { source = current; element[key] = source; }
    else if (current !== element[key + '_last']) { source = current; element[key] = source; }
    const result = translated(source);
    element[key + '_last'] = result;
    if (result !== current) element.setAttribute(attr,result);
  };
  const apply = () => {
    if (busy) return;
    busy = true;
    try {
      insertSelector();
      const walker = document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{
        acceptNode(node) {
          const el = node.parentElement;
          return el && !el.closest('script,style,textarea,option#siteLanguageSelect, #siteLanguageControl, .video-modal-player')
            ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      });
      while (walker.nextNode()) updateNode(walker.currentNode);
      document.querySelectorAll('[placeholder],[title],[aria-label]').forEach(el => {
        if (el.closest('#siteLanguageControl')) return;
        for (const attr of ['placeholder','title','aria-label']) if (el.hasAttribute(attr)) updateAttribute(el,attr);
      });
    } finally {busy = false;}
  };
  const schedule = () => {
    if (scheduled || busy) return;
    scheduled = true;
    requestAnimationFrame(() => {scheduled = false;apply();});
  };
  const observer = new MutationObserver(schedule);
  const setLanguage = async code => {
    language = enabled.has(code) ? code : 'en';
    selector.value = language;
    document.documentElement.lang = language;
    translations = {};
    if (language !== 'en') {
      try {
        const rows = await fetchRows('site_translations','language_code=eq.' + encodeURIComponent(language) + '&select=translation_key,translated_text&limit=1000');
        translations = Object.fromEntries(rows.map(r => [r.translation_key,r.translated_text]));
      } catch (err) {
        console.warn('[LANG TEST] Supabase translations unavailable; trying TEST JSON:',err);
        try {
          const response = await fetch('data/translations_.json?v=LANG-REV08',{cache:'no-store'});
          if (!response.ok) throw Error('HTTP ' + response.status);
          translations = (await response.json())[language] || {};
        } catch (jsonError) {console.warn('[LANG TEST] Translation recovery unavailable; English fallback:',jsonError);}
      }
    }
    apply();
  };
  selector.addEventListener('change',() => {
    try {localStorage.setItem(KEY,selector.value);} catch (_) {}
    setLanguage(selector.value);
  });
  const start = async () => {
    insertSelector();
    try {
      const response = await fetch('data/language-english_.json?v=LANG-REV08',{cache:'no-store'});
      if (!response.ok) throw Error('English inventory HTTP ' + response.status);
      Object.entries(await response.json()).forEach(([k,v]) => addEnglish(k,v));
    } catch (e) {console.warn('[LANG TEST] English inventory unavailable:',e);}
    // Dynamic options are keyed by stable IDs; never modify underlying English game data.
    for (const [table,prefix] of [['genre_options','genre'],['platform_options','platform'],['text_guide_options','text_guide']]) {
      try {
        const rows = await fetchRows(table,'select=id,value&limit=1000');
        for (const r of rows) addEnglish(prefix+'.'+r.id,r.value);
      } catch (e) {console.warn('[LANG TEST] Dynamic English labels unavailable:',table,e);}
    }
    lookup = englishByText();
    let rows = [];
    try {rows = await fetchRows('site_languages','select=code,native_name,english_name,enabled,sort_order&order=sort_order.asc');}
    catch (e) {console.warn('[LANG TEST] Language registry unavailable; English only:',e);}
    setLanguages(rows);
    let preferred = 'en';
    try {preferred = localStorage.getItem(KEY) || 'en';} catch (_) {}
    await setLanguage(preferred);
    observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','title','aria-label']});
    console.info('[LANG TEST] Language layer ready:',language);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
