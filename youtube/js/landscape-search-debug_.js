(()=>{
'use strict';
const ID='REV16';
let panel=null,peak='none yet',peakScore=-1,last='boot';
const n=v=>Number.isFinite(v)?v.toFixed(1):'n/a';
const rect=e=>{if(!e)return'missing';const r=e.getBoundingClientRect();return`${n(r.left)}/${n(r.right)}/${n(r.width)}`};
function ensure(){
 if(panel&&panel.isConnected)return panel;
 panel=document.createElement('div'); panel.id='landscapeSearchDebug16'; panel.textContent='REV16 alive';
 document.body.appendChild(panel); return panel;
}
function render(ev){
 last=ev||last; ensure();
 const vv=window.visualViewport,i=document.querySelector('.search-box input'),b=document.querySelector('.search-box'),
       de=document.documentElement,bo=document.body,active=document.activeElement===i,
       ir=i?.getBoundingClientRect(),br=b?.getBoundingClientRect(),
       vl=vv?.offsetLeft||0,vw=vv?.width||innerWidth,vr=vl+vw;
 const outI=!!ir&&(ir.left<vl-.5||ir.right>vr+.5),outB=!!br&&(br.left<vl-.5||br.right>vr+.5),
       outD=Math.max(de.scrollWidth,bo?.scrollWidth||0)>de.clientWidth+1;
 const score=Math.abs(vv?.offsetTop||0)*10+Math.abs(vv?.offsetLeft||0)*100+
             Math.abs((vv?.scale||1)-1)*1000+Math.abs(scrollY||0);
 const snap=`off ${n(vv?.offsetLeft||0)}/${n(vv?.offsetTop||0)} page ${n(vv?.pageLeft||0)}/${n(vv?.pageTop||0)} size ${n(vv?.width||innerWidth)}x${n(vv?.height||innerHeight)} @${n(vv?.scale||1)} scroll ${n(scrollX)}/${n(scrollY)} S ${rect(i)} B ${rect(b)}`;
 if(active&&score>=peakScore){peakScore=score;peak=snap;}
 panel.textContent=`${ID} | ${last} | ${active?'SEARCH':'other'} | VV ${n(vv?.offsetLeft||0)}/${n(vv?.offsetTop||0)} ${n(vv?.width||innerWidth)}x${n(vv?.height||innerHeight)} @${n(vv?.scale||1)} | scroll ${n(scrollX)}/${n(scrollY)} | SEARCH ${rect(i)} | BOX ${rect(b)} | OUT I:${outI?'Y':'N'} B:${outB?'Y':'N'} D:${outD?'Y':'N'}\nPEAK | ${peak}`;
}
function burst(e){render(e);requestAnimationFrame(()=>render(e+'+raf'));[50,150,350,700,1200].forEach(ms=>setTimeout(()=>render(e+'+'+ms),ms))}
function bind(){
 ensure(); burst('ready');
 document.addEventListener('focusin',e=>{if(e.target?.matches?.('.search-box input'))burst('focusin')},true);
 document.addEventListener('focusout',e=>{if(e.target?.matches?.('.search-box input'))burst('focusout')},true);
 addEventListener('resize',()=>burst('win-resize'),{passive:true});
 visualViewport?.addEventListener('resize',()=>burst('vv-resize'),{passive:true});
 visualViewport?.addEventListener('scroll',()=>burst('vv-scroll'),{passive:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();