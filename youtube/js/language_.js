/* MARKLYNX PUBLIC LANGUAGE — TEST REV10. Additive layer; never alters game data or frozen Recent scripts. */
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
  const flag = document.createElement('img');
  flag.alt = '';
  flag.setAttribute('aria-hidden','true');
  flag.width = 20; flag.height = 14;
  flag.style.cssText = 'width:20px;height:14px;object-fit:cover;border-radius:1px;flex:none;';
  wrap.append(label,flag,selector);
  wrap.style.marginLeft = 'auto';
  wrap.style.justifyContent = 'flex-end';
  const refreshFlag = () => { flag.src = language === 'es' ? 'images/flag-es_.svg' : 'images/flag-gb_.svg'; };
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
    for (const [source,key] of [...lookup.entries()]) {
      const folded = source.toLocaleLowerCase('en');
      if (!lookup.has(folded)) lookup.set(folded,key);
    }
    return lookup;
  };
  let lookup = new Map();
  const setLanguages = rows => {
    enabled = new Set(['en']);
    const options = [{value:'en',text:'English'}];
    for (const row of rows) {
      if (row.code === 'en' || !row.enabled || !/^[a-z]{2,3}(?:-[a-z0-9]+)*$/i.test(row.code)) continue;
      enabled.add(row.code);
      options.push({value:row.code,text:(row.native_name || row.english_name || row.code)});
    }
    selector.replaceChildren(...options.map(o => new Option(o.text,o.value)));
    selector.value = enabled.has(language) ? language : 'en';
    refreshFlag();
  };
  const getTranslation = (key,source) => language !== 'en' && translations[key] ? translations[key] : source;
  const translated = source => {
    const clean = norm(source).replace(/^[⚡🚫📄🎁×✕✖]\s*/u,'');
    const key = lookup.get(norm(source)) || lookup.get(clean) || lookup.get(clean.toLocaleLowerCase('en'));
    if (key) {
      const prefix = String(source).match(/^(\s*[⚡🚫📄🎁×✕✖]\s*)/u);
      return prefix ? prefix[1] + getTranslation(key,source.replace(prefix[1],'')) : getTranslation(key,source);
    }
    // Dynamic numeric durations must retain their numbers.
    const duration = norm(source).match(/^(\d+(?:[.,]\d+)?)\s+(Minute|Minutes|Hour|Hours)$/i);
    if (duration && language !== 'en') {
      const unit = duration[2].toLowerCase();
      const singular = unit === 'minute' || unit === 'hour';
      const key = 'game.' + (unit.startsWith('minute') ? (singular ? 'minute' : 'minutes') : (singular ? 'hour' : 'hours'));
      if (translations[key]) return duration[1] + ' ' + translations[key];
    }
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
      refreshFlag();
      // Footer counters: preserve the original number nodes and explicit spacing.
      const footerLabels = [
        ['quickEasyCount','footer.quick_easy','Quick & Easy'],
        ['totalGamesCount','footer.games','Games'],
        ['totalPlaylistsCount','footer.playlists','Playlists'],
        ['totalVideosCount','footer.total_videos','Total Videos']
      ];
      for (const [id,key,source] of footerLabels) {
        const number = document.getElementById(id);
        if (!number) continue;
        const span = number.closest('.footer-stats > span');
        if (!span) continue;
        let trailing = number.nextSibling;
        if (!trailing || trailing.nodeType !== Node.TEXT_NODE) {
          trailing = document.createTextNode('');
          number.after(trailing);
        }
        const rendered = language !== 'en' && translations[key] ? translations[key] : source;
        const expected = ' ' + rendered;
        if (trailing.nodeValue !== expected) trailing.nodeValue = expected;
        // The site uses a flex row; keep visual separation even with long Spanish labels.
        span.style.whiteSpace = 'nowrap';
      }
      const footer = document.querySelector('#footerModuleMount footer');
      if (footer) {
        const stats = footer.querySelector('.footer-stats');
        if (stats) {
          stats.style.display = 'flex';
          stats.style.flexWrap = 'wrap';
          stats.style.justifyContent = 'center';
          stats.style.columnGap = '16px';
          stats.style.rowGap = '5px';
        }
        for (const node of footer.childNodes) {
          if (node.nodeType !== Node.TEXT_NODE || !node.nodeValue.includes('100% Walkthroughs')) continue;
          const en = 'Mark Lynx Gaming Network  ·  100% Walkthroughs, Achievement Guides & Speed Runs';
          const es = translations['footer.tagline'];
          node.nodeValue = language !== 'en' && es ? '\\n  ' + es + '\\n  ' : '\\n  ' + en + '\\n  ';
        }
        const copyright = footer.querySelector('.copyright');
        if (copyright) {
          const tail = [...copyright.childNodes].find(n => n.nodeType === Node.TEXT_NODE && (n.nodeValue.includes('Rights Reserved') || n.__langFooterTail));
          if (tail) {
            tail.__langFooterTail = true;
            tail.nodeValue = ' Mark Lynx Gaming Network. ' + (language !== 'en' && translations['footer.rights'] ? translations['footer.rights'] : 'All Rights Reserved.');
          }
        }
      }
      const count = document.getElementById('countLine');
      if (count && count.querySelectorAll('strong').length === 2) {
        const numbers = [...count.querySelectorAll('strong')].map(n => n.textContent);
        const template = language !== 'en' ? translations['main.count_template'] : null;
        const leading = template ? template.split('{shown}')[0] : 'Showing ';
        const middle = template ? template.split('{shown}')[1]?.split('{total}')[0] : ' of ';
        const trailing = template ? template.split('{total}')[1] : ' guides';
        const nodes = [...count.childNodes];
        if (nodes.length === 5 && nodes[1].nodeName === 'STRONG' && nodes[3].nodeName === 'STRONG') {
          nodes[0].nodeValue = leading; nodes[2].nodeValue = middle; nodes[4].nodeValue = trailing;
          // This renderer can rewrite the count on filtering; leave numbers untouched.
        }
      }
      const walker = document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{
        acceptNode(node) {
          const el = node.parentElement;
          return el && !el.closest('script,style,textarea, #siteLanguageControl, #countLine, #footerModuleMount, .video-modal-player')
            ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      });
      while (walker.nextNode()) updateNode(walker.currentNode);
      document.querySelectorAll('optgroup[label]').forEach(el => updateAttribute(el,'label'));
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
    refreshFlag();
    document.documentElement.lang = language;
    translations = {};
    if (language !== 'en') {
      try {
        const rows = await fetchRows('site_translations','language_code=eq.' + encodeURIComponent(language) + '&select=translation_key,translated_text&limit=1000');
        translations = Object.fromEntries(rows.map(r => [r.translation_key,r.translated_text]));
      } catch (err) {
        console.warn('[LANG TEST] Supabase translations unavailable; trying TEST JSON:',err);
        try {
          const response = await fetch('data/translations_.json?v=LANG-REV10',{cache:'no-store'});
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
      const response = await fetch('data/language-english_.json?v=LANG-REV10',{cache:'no-store'});
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
    observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','title','aria-label','label']});
    console.info('[LANG TEST] Language layer ready:',language);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
