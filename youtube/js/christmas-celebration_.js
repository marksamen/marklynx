/* CHRISTMAS TEST REV56 — read-only presentation; REV55 settings are sole celebration authority. */
(function(){
  'use strict';
  const root=document.documentElement, mount=document.getElementById('mainModuleMount');
  const url='https://aikifibkcjibubqegvmb.supabase.co/rest/v1/seasonal_celebration_settings?id=eq.primary&select=id,mode,celebration_year';
  const headers={apikey:'sb_publishable_AMeGQySg9vDaKqkZRz_7HQ_yveiHHV_'};
  const POLL_MS=10000, TIMEOUT_MS=8000;
  // Isolated new feature strings; the existing language renderer and inventories are unchanged.
  const words={
    en:['Merry Christmas!','Happy New Year {year}!','Christmas countdown','New Year countdown','Days','Hours','Minutes','Seconds'],
    de:['Frohe Weihnachten!','Frohes neues Jahr {year}!','Countdown bis Weihnachten','Countdown bis Neujahr','Tage','Stunden','Minuten','Sekunden'],
    es:['¡Feliz Navidad!','¡Feliz Año Nuevo {year}!','Cuenta atrás para Navidad','Cuenta atrás para Año Nuevo','Días','Horas','Minutos','Segundos'],
    'es-MX':['¡Feliz Navidad!','¡Feliz Año Nuevo {year}!','Cuenta regresiva para Navidad','Cuenta regresiva para Año Nuevo','Días','Horas','Minutos','Segundos'],
    fr:['Joyeux Noël !','Bonne année {year} !','Compte à rebours avant Noël','Compte à rebours avant le Nouvel An','Jours','Heures','Minutes','Secondes'],
    it:['Buon Natale!','Felice anno nuovo {year}!','Conto alla rovescia per Natale','Conto alla rovescia per Capodanno','Giorni','Ore','Minuti','Secondi'],
    pt:['Feliz Natal!','Feliz Ano Novo {year}!','Contagem decrescente para o Natal','Contagem decrescente para o Ano Novo','Dias','Horas','Minutos','Segundos'],
    'pt-BR':['Feliz Natal!','Feliz Ano Novo {year}!','Contagem regressiva para o Natal','Contagem regressiva para o Ano Novo','Dias','Horas','Minutos','Segundos']
  };
  const style=`
    :host{display:block;box-sizing:border-box;width:100%;padding:6px 12px 5px;color:#ffe6a8;font-family:var(--sans,system-ui,sans-serif);}
    :host([hidden]){display:none!important}
    *,*::before,*::after{box-sizing:border-box}
    .panel{max-width:950px;margin:auto;border:1px solid #c5a457;border-radius:10px;background:linear-gradient(110deg,#142f21,#17452d 52%,#142f21);padding:9px 12px;text-align:center;box-shadow:inset 0 0 0 2px #ffffff09}
    :host([data-mode="new_year"]) .panel{background:linear-gradient(110deg,#161b31,#29324b 52%,#161b31);border-color:#d8bc75}
    :host([data-color="bright"]) .panel{background:linear-gradient(110deg,#fff6de,#fffdf6 52%,#fff6de);color:#7c2025;border-color:#b88b3c}
    :host([data-color="bright"][data-mode="new_year"]) .panel{background:linear-gradient(110deg,#f7edcf,#fffdf6 52%,#f7edcf);color:#343049}
    .heading{display:flex;align-items:center;justify-content:center;gap:10px;margin:0;font-size:clamp(20px,3vw,34px);font-weight:800;line-height:1.16;overflow-wrap:anywhere}
    .ornament{font-size:.78em;flex:none}
    .count{margin-top:6px;display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap}
    .count[hidden]{display:none!important}
    .label{font-size:12px;font-weight:650;line-height:1.25}
    .units{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;width:min(100%,340px)}
    .unit{min-width:0;border-radius:5px;padding:4px 2px;background:#70252d;color:#fff1c9;border:1px solid #d9b56666}
    :host([data-mode="new_year"]) .unit{background:#343f60}
    :host([data-color="bright"]) .unit{background:#892c33;color:#fff7df}
    :host([data-color="bright"][data-mode="new_year"]) .unit{background:#414b70}
    .number{display:block;font-size:clamp(16px,2.5vw,22px);font-weight:800;font-variant-numeric:tabular-nums;line-height:1.1;overflow-wrap:anywhere}
    .unit-label{display:block;font-size:10px;line-height:1.15;overflow-wrap:anywhere;margin-top:2px}
    @media(max-width:600px){:host{padding:4px 8px}.panel{padding:7px 6px}.heading{gap:6px}.count{margin-top:5px;gap:4px}.units{width:min(100%,310px)}}
    @media(orientation:landscape) and (max-height:500px){:host{padding:3px 8px}.panel{padding:5px 8px}.heading{font-size:20px}.count{margin-top:3px}.number{font-size:16px}.unit{padding:2px}}
  `;
  let state=null,status='idle',host=null,parts=null,inflight=null,token=0,lastRead=null,lastError=null,pollTimer=null,tickTimer=null,lastFetchAt=0;
  function activeTheme(){return root.getAttribute('data-seasonal-theme')==='christmas';}
  function makeHost(){
    const el=document.createElement('div');el.id='ml-christmas-celebration';el.hidden=true;
    // Shadow root prevents the legacy whole-page translation observer from rewriting countdown text each second.
    const shadow=el.attachShadow({mode:'open'});const sheet=document.createElement('style');sheet.textContent=style;
    const panel=document.createElement('section');panel.className='panel';
    const heading=document.createElement('h2');heading.className='heading';
    const left=document.createElement('span'),title=document.createElement('span'),right=document.createElement('span');
    for(const o of [left,right]){o.className='ornament';o.setAttribute('aria-hidden','true');}
    heading.append(left,title,right);panel.append(heading);
    const count=document.createElement('div');count.className='count';count.hidden=true;
    const label=document.createElement('span');label.className='label';const units=document.createElement('div');units.className='units';units.setAttribute('role','timer');units.setAttribute('aria-live','off');
    const nums=[],labels=[];
    for(let i=0;i<4;i++){const cell=document.createElement('div');cell.className='unit';const n=document.createElement('span'),l=document.createElement('span');n.className='number';l.className='unit-label';cell.append(n,l);units.append(cell);nums.push(n);labels.push(l);}
    count.append(label,units);panel.append(count);shadow.append(sheet,panel);parts={left,title,right,count,label,nums,labels};return el;
  }
  function ensureHost(){const banner=mount&&mount.querySelector('.banner-wrap');if(!banner)return false;if(!host)host=makeHost();if(host.previousElementSibling!==banner||!host.isConnected)banner.after(host);return true;}
  function text(el,value){if(el.textContent!==value)el.textContent=value;}
  function timerValues(mode,year,now){
    // Local calendar dates affect countdown content only, never activation.
    const target=mode==='christmas'?new Date(now.getFullYear(),11,25,0,0,0,0):new Date(year,0,1,0,0,0,0);
    const sec=Math.max(0,Math.ceil((target.getTime()-now.getTime())/1000));
    return {target,sec,values:[Math.floor(sec/86400),Math.floor(sec%86400/3600),Math.floor(sec%3600/60),sec%60]};
  }
  function render(){
    if(!activeTheme()||!state||state.mode==='none'){if(host)host.hidden=true;return;}
    if(!ensureHost())return;
    const mode=state.mode, isChristmas=mode==='christmas',lang=words[root.lang]?root.lang:'en',w=words[lang];
    host.dataset.mode=mode;host.dataset.color=root.getAttribute('data-theme')==='bright'?'bright':'dark';host.lang=lang;
    text(parts.title,isChristmas?w[0]:w[1].replace('{year}',String(state.year)));
    text(parts.left,isChristmas?'🎄':'✦');text(parts.right,isChristmas?'🎄':'✦');
    const t=timerValues(mode,state.year,new Date());
    parts.count.hidden=t.sec===0;text(parts.label,w[isChristmas?2:3]);
    for(let i=0;i<4;i++){text(parts.nums[i],String(t.values[i]).padStart(2,'0'));text(parts.labels[i],w[i+4]);}
    host.hidden=false;
  }
  function clearRead(){token++;if(inflight){inflight.abort();inflight=null;}state=null;status='idle';lastError=null;lastFetchAt=0;render();}
  async function refresh(){
    if(!activeTheme()||document.hidden||inflight)return;
    const current=++token,controller=new AbortController();inflight=controller;lastFetchAt=Date.now();status='loading';
    const timeout=setTimeout(()=>controller.abort(),TIMEOUT_MS);
    try{
      const res=await fetch(url,{headers,cache:'no-store',signal:controller.signal});
      if(!res.ok)throw new Error('HTTP '+res.status);
      const rows=await res.json();
      if(current!==token||!activeTheme())return;
      if(!Array.isArray(rows)||rows.length!==1)throw new Error('Expected one settings row');
      const row=rows[0];if(!row||row.id!=='primary'||!['none','christmas','new_year'].includes(row.mode)||!Number.isInteger(row.celebration_year)||row.celebration_year<2000||row.celebration_year>9999)throw new Error('Invalid settings row');
      state={mode:row.mode,year:row.celebration_year};lastRead=new Date().toISOString();lastError=null;status='ready';render();
    }catch(e){if(current===token){state=null;status='error';lastError=e.name==='AbortError'?'Settings request timed out':String(e.message||e);render();}}
    finally{clearTimeout(timeout);if(current===token)inflight=null;}
  }
  function reconcile(){
    if(!activeTheme()){clearRead();return;}
    render();if(!document.hidden&&!inflight&&(!lastFetchAt||Date.now()-lastFetchAt>=POLL_MS))refresh();
  }
  function resume(){if(!document.hidden&&activeTheme()){render();refresh();}}
  function start(){if(pollTimer===null)pollTimer=setInterval(()=>{if(activeTheme()&&!document.hidden)refresh();},POLL_MS);if(tickTimer===null)tickTimer=setInterval(()=>{if(!document.hidden&&state&&state.mode!=='none')render();},1000);reconcile();}
  function stop(){if(pollTimer!==null)clearInterval(pollTimer);if(tickTimer!==null)clearInterval(tickTimer);pollTimer=tickTimer=null;clearRead();}
  new MutationObserver(reconcile).observe(root,{attributes:true,attributeFilter:['data-seasonal-theme','data-theme','lang']});
  if(mount)new MutationObserver(()=>{if(state&&state.mode!=='none')render();}).observe(mount,{childList:true,subtree:true});
  document.addEventListener('visibilitychange',resume);window.addEventListener('focus',resume);window.addEventListener('pagehide',stop);window.addEventListener('pageshow',()=>{start();resume();});
  window.mlChristmasCelebrationDiagnostics=()=>({revision:'REV56',status,mode:state?state.mode:null,year:state?state.year:null,visible:!!(host&&host.isConnected&&!host.hidden),lastRead,lastError,pollMs:POLL_MS,season:root.getAttribute('data-seasonal-theme')});
  start();
})();
