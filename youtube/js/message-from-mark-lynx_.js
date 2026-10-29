/* Message from Mark Lynx — public TEST REV11. Independent read-only frontend. */
(() => {
  'use strict';
  const ROOT='https://aikifibkcjibubqegvmb.supabase.co/rest/v1/';
  const KEY='sb_publishable_AMeGQySg9vDaKqkZRz_7HQ_yveiHHV_';
  const READ_KEY='marklynx.messagefrommarklynx.read.v1';
  const TITLE='Message from Mark Lynx';
  const WN_ID='whatsNewMobileBtn';
  const LANGUAGE_KEY='marklynx.public.language';
  const LABELS={new:'New',archive:'Archive',close:'Close',published:'Published',emptyNew:'No new messages.',emptyArchive:'No archived messages.'};
  let enabled=false,messages=[],translations=[],ui={...LABELS},view='new',opened=false;
  let desktop,hub,overlay,hubOverlay,hubWhats,hubMark,hubCount,closeButton,heading,tabs,list;
  let langRequest=0,read=new Set();
  let lastFetch='PENDING',lastError='';
  function diagnostics(){
    let panel=document.getElementById('mlm-test-rev11-diagnostics');
    if(!panel){panel=document.createElement('aside');panel.id='mlm-test-rev11-diagnostics';panel.setAttribute('aria-label','Message from Mark Lynx TEST diagnostics');document.body.append(panel);}
    panel.replaceChildren();
    const header=document.createElement('strong');header.textContent='MESSAGE FROM MARK LYNX — TEST REV11';
    const state=document.createElement('div');state.textContent='Master: '+(enabled?'ON':'OFF')+' | Published: '+messages.length;
    const status=document.createElement('div');status.textContent='Public read: '+lastFetch;
    const error=document.createElement('div');error.textContent=lastError?'Error: '+lastError:'';
    panel.append(header,state,status);if(lastError)panel.append(error);
  }

  try {const saved=JSON.parse(localStorage.getItem(READ_KEY)||'[]');if(Array.isArray(saved))read=new Set(saved.map(String));}catch(e){console.warn('[MARK MESSAGE TEST] Invalid read state',e);}
  const lang=()=>{let v=document.getElementById('siteLanguageSelect')?.value||document.documentElement.lang;if(!v){try{v=localStorage.getItem(LANGUAGE_KEY);}catch{}}return v||'en';};
  const unread=m=>!read.has(String(m.id));
  const request=async(table,query)=>{const r=await fetch(ROOT+table+'?'+query,{headers:{apikey:KEY},cache:'no-store'});if(!r.ok)throw Error(table+' HTTP '+r.status);return r.json();};
  const store=()=>{try{localStorage.setItem(READ_KEY,JSON.stringify([...read]));}catch(e){console.warn('[MARK MESSAGE TEST] Cannot save read state',e);}};
  const translation=m=>translations.find(t=>String(t.message_id)===String(m.id)&&t.language_code===lang())||translations.find(t=>String(t.message_id)===String(m.id)&&t.language_code==='en');
  const visibleWhats=()=>{const b=document.getElementById(WN_ID);return !!(b&&!b.hidden);};
  const whatsUnread=()=>{const b=document.getElementById(WN_ID);return !!(visibleWhats()&&b.querySelector('.wn-dot')&&!b.querySelector('.wn-dot').hidden);};
  const date=v=>{try{return new Intl.DateTimeFormat(undefined,{year:'numeric',month:'short',day:'numeric'}).format(new Date(v));}catch{return '';}};
  function draw(){
    diagnostics();
    if(!desktop||!overlay)return;
    desktop.hidden=!enabled;
    if(!enabled&&opened)toggle(false);
    if(hub){const active=enabled||visibleWhats();hub.hidden=!active;hub.setAttribute('aria-label','Notifications');hub.title='Notifications';hub.querySelector('.mlm-dot').hidden=!(enabled&&messages.some(unread))&&!whatsUnread();}
    if(hubOverlay){hubWhats.hidden=!visibleWhats();hubMark.hidden=!enabled;hubCount.textContent=(whatsUnread()?'• ':'')+(enabled&&messages.some(unread)?'•':'');if(!enabled&&!visibleWhats())hubOverlay.hidden=true;}
    desktop.querySelector('.mlm-dot').hidden=!messages.some(unread);
    if(!enabled)return;
    heading.textContent=TITLE;closeButton.setAttribute('aria-label',ui.close);
    tabs[0].textContent=ui.new;tabs[1].textContent=ui.archive;
    tabs.forEach((t,i)=>t.setAttribute('aria-selected',String(view===(i?'archive':'new'))));
    list.replaceChildren();
    const items=messages.filter(m=>view==='new'?unread(m):!unread(m));
    if(!items.length){const p=document.createElement('p');p.className='mlm-empty';p.textContent=view==='new'?ui.emptyNew:ui.emptyArchive;list.append(p);return;}
    for(const m of items){const tr=translation(m);if(!tr)continue;
      const card=document.createElement('article');card.className='mlm-card';
      const entry=document.createElement('button');entry.type='button';entry.className='mlm-entry';entry.setAttribute('aria-expanded','false');
      const title=document.createElement('strong');title.textContent=tr.title;
      const summary=document.createElement('span');summary.textContent=tr.summary;
      const stamp=document.createElement('small');stamp.textContent=ui.published+': '+date(m.published_at);
      entry.append(title,summary,stamp);
      const body=document.createElement('div');body.className='mlm-body';body.hidden=true;body.textContent=tr.body;
      entry.addEventListener('click',()=>{const expanding=body.hidden;body.hidden=!expanding;entry.setAttribute('aria-expanded',String(expanding));if(expanding&&unread(m)){read.add(String(m.id));store();draw();}});
      card.append(entry,body);list.append(card);
    }
  }
  function toggle(open){if(open&&!enabled)return;opened=open;overlay.hidden=!open;document.body.classList.toggle('mlm-open',open);if(open){view='new';draw();closeButton.focus();}else{(window.matchMedia('(max-width:950px) and (pointer:coarse)').matches?hub:desktop)?.focus();}}
  function toggleHub(open){if(!hubOverlay)return;hubOverlay.hidden=!open;if(open)hubOverlay.querySelector('.mlm-hub-close').focus();else hub?.focus();}
  async function loadUi(){const requestId=++langRequest;let next={...LABELS};if(lang()!=='en'){
    try{const r=await fetch('data/translations_.json?v=MESSAGE-FROM-MARK-LYNX-TEST-REV11',{cache:'no-store'});if(r.ok){const row=(await r.json())[lang()]||{};for(const k of ['new','archive','close','published','emptyNew','emptyArchive']){const key='whats_new.'+({emptyNew:'empty_new',emptyArchive:'empty_archive'}[k]||k);const value=row[key];if(typeof value==='string'&&value.trim())next[k]=value;}}}catch(e){console.warn('[MARK MESSAGE TEST] UI recovery unavailable',e);}
    try{const rows=await request('site_translations','select=translation_key,translated_text&language_code=eq.'+encodeURIComponent(lang())+'&translation_key=like.whats_new.*');for(const r of rows){for(const k of ['new','archive','close','published','emptyNew','emptyArchive']){const key='whats_new.'+({emptyNew:'empty_new',emptyArchive:'empty_archive'}[k]||k);if(r.translation_key===key&&typeof r.translated_text==='string'&&r.translated_text.trim())next[k]=r.translated_text;}}}catch(e){console.warn('[MARK MESSAGE TEST] Managed UI labels unavailable; using recovery',e);}
  }if(requestId===langRequest){ui=next;draw();}}
  function init(){if(desktop)return;
    const anchor=document.querySelector('.subscribe-strip-inner');const prefs=document.querySelector('.site-preferences-inner');
    if(!anchor||!prefs)return;
    desktop=document.createElement('button');desktop.id='markLynxMessagePublicBtn';desktop.type='button';desktop.className='mlm-button';desktop.hidden=true;
    desktop.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v12H8l-4 3V5z"/><path d="M8 9h8M8 13h6"/></svg><span class="mlm-label">Message from<br>Mark Lynx</span><span class="mlm-dot" hidden></span>';
    const wn=document.getElementById('whatsNewPublicBtn');if(wn&&wn.parentNode===anchor)wn.after(desktop);else anchor.prepend(desktop);
    hub=document.createElement('button');hub.id='markLynxMobileHubBtn';hub.type='button';hub.className='mlm-mobile-hub';hub.hidden=true;
    hub.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg><span class="mlm-dot" hidden></span>';
    prefs.append(hub);
    overlay=document.createElement('div');overlay.className='mlm-overlay';overlay.hidden=true;
    overlay.innerHTML='<section class="mlm-dialog" role="dialog" aria-modal="true" aria-labelledby="mlm-title"><header class="mlm-head"><h2 id="mlm-title"></h2><button type="button" class="mlm-close">×</button></header><div class="mlm-tabs" role="tablist"><button type="button" role="tab"></button><button type="button" role="tab"></button></div><div class="mlm-list"></div></section>';
    document.body.append(overlay);
    heading=overlay.querySelector('#mlm-title');closeButton=overlay.querySelector('.mlm-close');tabs=[...overlay.querySelectorAll('[role=tab]')];list=overlay.querySelector('.mlm-list');
    hubOverlay=document.createElement('div');hubOverlay.className='mlm-hub-overlay';hubOverlay.hidden=true;
    hubOverlay.innerHTML='<section class="mlm-hub-dialog" role="dialog" aria-modal="true" aria-label="Notifications"><header class="mlm-head"><h2>Notifications</h2><button type="button" class="mlm-hub-close" aria-label="Close">×</button></header><div class="mlm-hub-options"><button type="button" class="mlm-hub-whats">What\'s New</button><button type="button" class="mlm-hub-mark">Message from Mark Lynx</button></div><span class="mlm-hub-count" hidden></span></section>';
    document.body.append(hubOverlay);
    hubWhats=hubOverlay.querySelector('.mlm-hub-whats');hubMark=hubOverlay.querySelector('.mlm-hub-mark');hubCount=hubOverlay.querySelector('.mlm-hub-count');
    desktop.addEventListener('click',()=>toggle(true));closeButton.addEventListener('click',()=>toggle(false));
    tabs.forEach((t,i)=>t.addEventListener('click',()=>{view=i?'archive':'new';draw();}));
    hub.addEventListener('click',()=>toggleHub(true));hubOverlay.querySelector('.mlm-hub-close').addEventListener('click',()=>toggleHub(false));
    hubWhats.addEventListener('click',()=>{toggleHub(false);document.getElementById(WN_ID)?.click();});
    hubMark.addEventListener('click',()=>{toggleHub(false);toggle(true);});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(opened){e.preventDefault();toggle(false);}else if(hubOverlay&&!hubOverlay.hidden){e.preventDefault();toggleHub(false);}}});
    document.addEventListener('change',e=>{if(e.target?.id==='siteLanguageSelect')loadUi();});
    new MutationObserver(()=>{if(desktop&&!document.body.contains(desktop)){desktop=null;overlay?.remove();hubOverlay?.remove();hub?.remove();init();draw();}}).observe(document.documentElement,{childList:true,subtree:true});
    const wnMobile=document.getElementById(WN_ID);if(wnMobile)new MutationObserver(draw).observe(wnMobile,{attributes:true,subtree:true,attributeFilter:['hidden']});
    draw();loadUi();
  }
  async function refresh(){try{
    const settings=await request('mark_lynx_message_settings','select=enabled&id=eq.1');enabled=settings.length===1&&settings[0].enabled===true;
    if(enabled){messages=await request('mark_lynx_messages','select=id,status,published_at,created_at&status=eq.published&order=published_at.desc&limit=200');translations=await request('mark_lynx_message_translations','select=message_id,language_code,title,summary,body&limit=1600');}
    else{messages=[];translations=[];}
    lastFetch='PASS';lastError='';
  }catch(e){lastFetch='FAIL';lastError=String(e.message||e);console.warn('[MARK MESSAGE TEST] Public read unavailable; hiding message control',e);enabled=false;messages=[];translations=[];}draw();}
  const mountObserver=new MutationObserver(()=>{if(!desktop)init();});mountObserver.observe(document.documentElement,{childList:true,subtree:true});
  const start=()=>{init();refresh();};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('focus',()=>{refresh();draw();});
})();
