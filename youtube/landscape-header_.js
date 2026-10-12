/* TEST REV03 — moves existing controls; restores originals on rotation. */
(() => {
 const mq=matchMedia('(orientation: landscape) and (max-height: 500px) and (pointer: coarse)');
 let header=null,actions=null;
 const moved=[];
 function move(node,target){
  if(!node||!target||!node.parentNode)return;
  const marker=document.createComment('landscape-restore');
  node.parentNode.insertBefore(marker,node);
  moved.push([node,marker]);target.appendChild(node);
 }
 function restore(){
  if(!header)return;
  for(let i=moved.length-1;i>=0;i--){const [node,marker]=moved[i];if(marker.parentNode)marker.replaceWith(node);}
  moved.length=0;header.remove();actions.remove();header=null;actions=null;
  document.body.classList.remove('ml-compact-landscape');
 }
 function activate(){
  if(!mq.matches||header)return;
  const mount=document.querySelector('#mainModuleMount');
  const prefs=mount?.querySelector('.site-preferences');
  const banner=mount?.querySelector('.banner-wrap');
  const strip=mount?.querySelector('.subscribe-strip');
  const buttons=strip?.querySelector('.subscribe-strip-inner');
  const subscribe=buttons?.querySelector('.youtube-subscribe-btn');
  const suggest=buttons?.querySelector('#suggestGameBtn');
  const developer=buttons?.querySelector('.developer-showcase-btn');
  const search=mount?.querySelector('.toolbar .search-box');
  if(!prefs||!banner||!strip||!buttons||!subscribe||!suggest||!developer||!search||!document.getElementById('siteLanguageControl'))return;
  header=document.createElement('div');header.className='ml-landscape-header';
  header.innerHTML='<div class="ml-landscape-brand"></div><div class="ml-landscape-side"><div class="ml-landscape-prefs"></div><div class="ml-landscape-subscribe"></div></div>';
  actions=document.createElement('div');actions.className='ml-landscape-actions';
  actions.innerHTML='<div class="ml-landscape-buttons"></div><div class="ml-landscape-search"></div>';
  prefs.parentNode.insertBefore(header,prefs);header.after(actions);
  move(banner,header.querySelector('.ml-landscape-brand'));
  move(prefs,header.querySelector('.ml-landscape-prefs'));
  move(subscribe,header.querySelector('.ml-landscape-subscribe'));
  move(buttons,actions.querySelector('.ml-landscape-buttons'));
  move(search,actions.querySelector('.ml-landscape-search'));
  document.body.classList.add('ml-compact-landscape');
 }
 function update(){if(mq.matches)activate();else restore();}
 new MutationObserver(()=>{if(mq.matches&&!header)activate();}).observe(document.documentElement,{childList:true,subtree:true});
 mq.addEventListener('change',update);document.addEventListener('DOMContentLoaded',update);update();
})();
