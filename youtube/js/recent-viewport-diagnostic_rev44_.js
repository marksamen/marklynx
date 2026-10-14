/* TEST REV44: read-only viewport + Recent LIST badge diagnostic. */
(function(){'use strict';
const id='ml-vp-rev44';
function info(el){if(!el)return 'ABSENT FROM DOM';const c=getComputedStyle(el),r=el.getBoundingClientRect();return `text=${JSON.stringify((el.textContent||'').trim().slice(0,65))} display=${c.display} visibility=${c.visibility} opacity=${c.opacity} box=${Math.round(r.width)}x${Math.round(r.height)} color=${c.color} bg=${c.backgroundColor}`;}
function inspect(){const root=document.querySelector('#recentUploadsSection');const list=document.querySelector('.recent-uploads-grid');const cards=[...document.querySelectorAll('.recent-upload-card')];const withGS=cards.filter(x=>x.querySelector('.recent-upload-meta.gs'));const withCT=cards.filter(x=>x.querySelector('.recent-upload-meta.completion-type'));const selected=cards.find(x=>/New Super Mario Bros/i.test(x.textContent))||withCT[0]||withGS[0]||cards[0];const rect=selected?.getBoundingClientRect();const vv=window.visualViewport;const lines=[
'TEST REV44 · SAFARI VIEWPORT / RECENT LIST',
`inner ${innerWidth}x${innerHeight} outer ${outerWidth}x${outerHeight}`,
`documentElement ${document.documentElement.clientWidth}x${document.documentElement.clientHeight}`,
`visualViewport ${vv?`${Math.round(vv.width)}x${Math.round(vv.height)} scale=${vv.scale}`:'unavailable'}`,
`screen ${screen.width}x${screen.height} DPR=${devicePixelRatio}`,
`orientation landscape=${matchMedia('(orientation:landscape)').matches} >=901=${matchMedia('(min-width:901px)').matches}`,
`hover=${matchMedia('(hover:hover)').matches} fine=${matchMedia('(pointer:fine)').matches} coarse=${matchMedia('(pointer:coarse)').matches}`,
`Recent root=${!!root} grid=${!!list} class=${list?.className||'-'}`,
`Recent cards=${cards.length} GS DOM=${withGS.length} CT DOM=${withCT.length}`,
`Sample=${(selected?.querySelector('.recent-upload-title')?.textContent||'NONE').trim().slice(0,55)}`,
`Sample card=${selected?.className||'NONE'} ${rect?`box=${Math.round(rect.width)}x${Math.round(rect.height)}`:''}`,
`Gamerscore: ${info(selected?.querySelector('.recent-upload-meta.gs'))}`,
`Completion: ${info(selected?.querySelector('.recent-upload-meta.completion-type'))}`,
`Card markup badges: ${selected?[...selected.querySelectorAll('[class*=meta]')].map(x=>x.className).slice(0,18).join(' | '):'NONE'}`
];return lines.join('\n');}
function mount(){if(document.getElementById(id))return;const box=document.createElement('section');box.id=id;box.style.cssText='position:fixed!important;bottom:8px!important;right:8px!important;z-index:2147483647!important;width:355px!important;max-width:calc(100vw - 16px)!important;max-height:65vh!important;overflow:auto!important;padding:9px!important;background:#101010!important;color:#fff!important;border:2px solid #ffce00!important;border-radius:8px!important;font:11px/1.35 monospace!important;white-space:pre-wrap!important;box-sizing:border-box!important';const btn=document.createElement('button');btn.textContent='Inspect again';btn.style.cssText='background:#ffce00;color:#000;border:0;padding:4px 8px;font-weight:bold';const close=document.createElement('button');close.textContent='Hide';close.style.cssText=btn.style.cssText+';margin-left:6px';const pre=document.createElement('div');pre.style.marginTop='7px';btn.onclick=()=>pre.textContent=inspect();close.onclick=()=>{pre.hidden=!pre.hidden;close.textContent=pre.hidden?'Show':'Hide'};box.append(btn,close,pre);document.body.appendChild(box);pre.textContent=inspect();window.addEventListener('resize',()=>pre.textContent=inspect());window.addEventListener('orientationchange',()=>pre.textContent=inspect());}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();