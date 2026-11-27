/* Christmas — shared viewport clearance for occasional events. */
(function(){
  'use strict';
  var root=document.documentElement, gap=12;
  function measure(){
    var toolbar=document.querySelector('.toolbar');
    var vw=root.clientWidth, vh=Math.min(root.clientHeight,window.innerHeight);
    var vv=window.visualViewport;
    // Fixed-position coordinates at normal zoom; pause rather than guess when pinched.
    if(vv){if(Math.abs(vv.scale-1)>.02||Math.abs(vv.offsetTop)>1||Math.abs(vv.offsetLeft)>1)return null;vh=Math.min(vh,vv.height);vw=Math.min(vw,vv.width);}
    if(!toolbar||!toolbar.isConnected||!toolbar.getClientRects().length||vw<80||vh<100)return null;
    var bottom=toolbar.getBoundingClientRect().bottom;
    // Include visible overflowing controls, if any, rather than just the outer box.
    toolbar.querySelectorAll('.toolbar-inner,.view-toggle,#gridBtn,#listBtn,#clearFiltersBtn').forEach(function(e){
      if(e.getClientRects().length)bottom=Math.max(bottom,e.getBoundingClientRect().bottom);
    });
    var top=Math.max(gap,Math.ceil(bottom)+gap), end=Math.floor(vh)-gap;
    if(!Number.isFinite(top)||end<=top)return null;
    return {width:Math.floor(vw),height:Math.floor(vh),top:top,bottom:end,toolbarBottom:bottom,available:end-top};
  }
  // Reserve the full vertical extent of the whole animation, not just its current frame.
  // A scroll/resize/layout change that invalidates that reservation cancels the entire event.
  function watch(node,minY,maxY,onUnsafe){
    var raf=null,stopped=false;
    var vv=window.visualViewport;
    function stop(){
      if(stopped)return;stopped=true;
      if(raf!==null)window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll',check,true);window.removeEventListener('resize',check);
      if(vv){vv.removeEventListener('scroll',check);vv.removeEventListener('resize',check);}
    }
    function check(){
      if(stopped)return false;
      if(!node.isConnected){stop();return false;}
      var b=measure();
      if(!b||minY<b.top-.01||maxY>b.bottom+.01){
        node.style.setProperty('visibility','hidden','important');stop();onUnsafe();return false;
      }
      return true;
    }
    function tick(){raf=null;if(check())raf=window.requestAnimationFrame(tick);}
    window.addEventListener('scroll',check,{capture:true,passive:true});window.addEventListener('resize',check,{passive:true});
    if(vv){vv.addEventListener('scroll',check,{passive:true});vv.addEventListener('resize',check,{passive:true});}
    if(check())raf=window.requestAnimationFrame(tick);
    return stop;
  }
  window.mlChristmasSafeArea=Object.freeze({measure:measure,watch:watch});
})();
