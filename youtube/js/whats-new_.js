/* What's New — isolated TEST layer. Never touches games or Recent. */
(() => {
'use strict';
const BASE='https://aikifibkcjibubqegvmb.supabase.co/rest/v1/';
const KEY='sb_publishable_AMeGQySg9vDaKqkZRz_7HQ_yveiHHV_';
const headers={apikey:KEY};
const STORAGE='marklynx.whatsnew.read.test.v1';
let items=[],texts=[],tab='new',detail=null,visible=false,previousFocus=null;
const read=()=>{try{return new Set(JSON.parse(localStorage.getItem(STORAGE)||'[]').map(String));}catch{return new Set();}};
const mark=id=>{try{const ids=read();ids.add(String(id));localStorage.setItem(STORAGE,JSON.stringify([...ids]));}catch{}updateDot();};
const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const english=["What’s New", "New", "Archive", "Back to Announcements", "Close", "No announcements here yet."];
const labelKeys=["whats_new.title", "whats_new.new", "whats_new.archive", "whats_new.back", "whats_new.close", "whats_new.empty"];
let translatedLabels={};
const locale=()=>document.documentElement.lang||'en';
const words=()=>labelKeys.map((key,i)=>locale()==='en'?english[i]:(translatedLabels[key]||english[i]));
document.addEventListener('marklynx:translations-ready',event=>{if(event.detail?.language!==locale())return;translatedLabels=event.detail.translations||{};refreshLanguage();});
function refreshLanguage(){if(!overlay.hidden)render();document.querySelectorAll('.wn-title').forEach(n=>n.textContent=words()[0]);const b=document.getElementById('wnMobile');if(b)b.setAttribute('aria-label',words()[0]);}
const getText=id=>texts.find(t=>String(t.announcement_id)===String(id)&&t.language_code===locale())||texts.find(t=>String(t.announcement_id)===String(id)&&t.language_code==='en');
const overlay=node('div','wn-overlay');overlay.id='whatsNewOverlay';overlay.hidden=true;overlay.setAttribute('role','presentation');
const panel=node('section','wn-panel');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','wnTitle');
const header=node('header','wn-header');const heading=node('h2','',words()[0]);heading.id='wnTitle';const close=node('button','wn-close','×');close.type='button';close.setAttribute('aria-label','Close');close.onclick=hide;header.append(heading,close);
const content=node('div','wn-content');panel.append(header,content);overlay.append(panel);document.body.append(overlay);
overlay.addEventListener('click',e=>{if(e.target===overlay)hide();});
document.addEventListener('keydown',e=>{if(overlay.hidden)return;if(e.key==='Escape'){e.preventDefault();hide();}if(e.key==='Tab'){const focusables=[...panel.querySelectorAll('button:not([disabled])')];if(!focusables.length)return;const first=focusables[0],last=focusables[focusables.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
function hide(){overlay.hidden=true;document.body.classList.remove('wn-open');previousFocus?.focus?.();}
function show(){previousFocus=document.activeElement;detail=null;tab='new';render();overlay.hidden=false;document.body.classList.add('wn-open');close.focus();}
function updateDot(){const unread=items.some(x=>!read().has(String(x.id)));document.querySelectorAll('.wn-dot').forEach(n=>n.hidden=!unread);}
function render(){const w=words();heading.textContent=w[0];close.setAttribute('aria-label',w[4]);content.replaceChildren();
 if(detail!==null){const t=getText(detail);const back=node('button','wn-back','← '+w[3]);back.onclick=()=>{detail=null;render();};content.append(back);if(t){content.append(node('h3','',t.title),node('p','wn-body',t.body));}return;}
 const tabs=node('div','wn-tabs');[['new',w[1]],['archive',w[2]]].forEach(([id,label])=>{const b=node('button',tab===id?'active':'',label);b.setAttribute('aria-pressed',String(tab===id));b.onclick=()=>{tab=id;render();};tabs.append(b);});content.append(tabs);
 const ids=read(),selected=items.filter(x=>tab==='new'?!ids.has(String(x.id)):ids.has(String(x.id)));
 if(!selected.length){content.append(node('p','wn-empty',w[5]));return;}
 for(const a of selected){const t=getText(a.id);if(!t)continue;const b=node('button','wn-item');b.append(node('strong','',t.title),node('span','',t.summary));b.onclick=()=>{mark(a.id);detail=a.id;render();};content.append(b);}
}
function installButtons(){if(!visible)return;const strip=document.querySelector('.subscribe-strip-inner');if(strip&&!document.getElementById('wnDesktop')){const b=node('button','wn-launch wn-desktop');b.id='wnDesktop';b.type='button';b.append(node('span','wn-bell','🔔'),node('span','wn-title',words()[0]),node('span','wn-dot'));b.querySelector('.wn-bell').textContent='🔔';b.onclick=show;strip.prepend(b);}
 const prefs=document.querySelector('.site-preferences-inner');if(prefs&&!document.getElementById('wnMobile')){const b=node('button','wn-launch wn-mobile');b.id='wnMobile';b.type='button';b.setAttribute('aria-label',words()[0]);b.append(node('span','','🔔'),node('span','wn-dot'));b.onclick=show;prefs.insertBefore(b,prefs.querySelector('#siteLanguageControl'));}
 updateDot();}
async function fetchTable(name,query){const r=await fetch(BASE+name+'?'+query,{headers,cache:'no-store'});if(!r.ok)throw Error(name+' HTTP '+r.status);return r.json();}
async function load(){try{const settings=await fetchTable('whats_new_settings','id=eq.1&select=enabled');if(settings[0]?.enabled!==true)return;const a=await fetchTable('whats_new_announcements','select=id,published_at&status=eq.published&order=published_at.desc&limit=100');if(!a.length)return;const t=await fetchTable('whats_new_translations','select=announcement_id,language_code,title,summary,body&limit=2000');items=a;texts=t.filter(x=>a.some(y=>String(y.id)===String(x.announcement_id)));visible=true;installButtons();}catch(e){console.warn('[WHAT’S NEW TEST] Not available:',e.message);}}
const observer=new MutationObserver(()=>{if(visible)installButtons();});observer.observe(document.body,{childList:true,subtree:true});
const langObserver=new MutationObserver(()=>{translatedLabels={};refreshLanguage();});langObserver.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
load();
})();
