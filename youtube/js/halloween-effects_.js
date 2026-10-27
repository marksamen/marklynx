/* REV26: Halloween-only decorative layer. No writes to site controls, layout or app state. */
(function(){
  'use strict';
  var root=document.documentElement,layer=null,lastScroll=0,accumulated=0,lastFlight=0;
  var batPath='M1 11 Q8 2 15 9 Q20 2 24 7 Q28 2 33 9 Q40 2 47 11 L40 12 L37 18 L31 14 L26 19 L24 15 L22 19 L16 14 L10 18 L7 12 Z';
  var webSvg='<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M0 0H100 M0 0V100 M0 0Q50 0 100 100 M0 0Q0 50 100 100 M0 0Q65 15 85 85 M0 0Q15 65 85 85"/><path d="M25 0Q25 25 0 25 M50 0Q50 50 0 50 M75 0Q75 75 0 75"/></svg>';
  function active(){return root.getAttribute('data-seasonal-theme')==='halloween';}
  function svgBat(){
    var svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 48 22');svg.setAttribute('aria-hidden','true');
    svg.style.cssText='width:100%;height:100%;fill:currentColor';
    var p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',batPath);svg.appendChild(p);return svg;
  }
  function mount(){
    if(layer||!document.body)return;
    layer=document.createElement('div');layer.id='ml-halloween-fx';layer.setAttribute('aria-hidden','true');
    ['left','right'].forEach(function(side){
      var web=document.createElement('div');web.className='ml-halloween-corner '+side;
      web.innerHTML=webSvg;layer.appendChild(web);
    });
    document.body.appendChild(layer);
    lastScroll=window.scrollY||0;accumulated=0;
  }
  function unmount(){if(layer){layer.remove();layer=null;}accumulated=0;}
  function sync(){if(active())mount();else unmount();}
  function fly(){
    if(!layer||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    var n=matchMedia('(max-width: 700px)').matches?2:3;
    var y=Math.round(Math.min(innerHeight*.65,Math.max(90,innerHeight*.22)));
    for(var i=0;i<n;i++){
      (function(index){
        var bat=document.createElement('div');bat.className='ml-halloween-bat';
        bat.style.top=(y+index*21)+'px';bat.style.color=root.getAttribute('data-theme')==='bright'?'#30143f':'#d7a0e8';
        bat.style.animationDelay=(index*.16)+'s';bat.appendChild(svgBat());layer.appendChild(bat);
        bat.classList.add('fly');
        bat.addEventListener('animationend',function(){bat.remove();},{once:true});
        setTimeout(function(){bat.remove();},4000);
      })(i);
    }
  }
  function onScroll(){
    var y=window.scrollY||0,delta=Math.abs(y-lastScroll);lastScroll=y;
    if(!layer||delta>innerHeight*2)return;
    accumulated+=delta;
    var now=performance.now();
    if(accumulated>=550&&now-lastFlight>=11000){accumulated=0;lastFlight=now;fly();}
  }
  var observer=new MutationObserver(function(records){
    if(records.some(function(r){return r.attributeName==='data-seasonal-theme';}))sync();
  });
  observer.observe(root,{attributes:true,attributeFilter:['data-seasonal-theme']});
  window.addEventListener('scroll',onScroll,{passive:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});
  else sync();
})();
