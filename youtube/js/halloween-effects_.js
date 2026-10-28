/* REV26: Halloween-only decorative layer. No writes to site controls, layout or app state. */
(function(){
  'use strict';
  var root=document.documentElement,layer=null,lastScroll=0,accumulated=0,lastFlight=0;
  // REV31: Sound is desired ON, but browser requires real user activation. Never alter players.
  // Fail closed: suppress sounds if any visible iframe/video is present.
  var audioContext=null,lastSound=0;
  function playerPotentiallyVisible(){
    return Array.prototype.some.call(document.querySelectorAll('iframe,video,audio'),function(el){
      if(el.closest('#ml-halloween-fx'))return false;
      var r=el.getBoundingClientRect(),cs=getComputedStyle(el);
      return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&
        cs.display!=='none'&&cs.visibility!=='hidden';
    });
  }
  function canPlayEffect(){
    return active()&&!document.hidden&&
      !matchMedia('(prefers-reduced-motion: reduce)').matches&&
      !playerPotentiallyVisible()&&performance.now()-lastSound>10000;
  }
  // REV33: full-length, controlled bat flutter. Keep audio independent of visuals.
  // 5.8s matches CSS flyby duration. A single shared sound, not one per bat.
  function flutter(){
    if(!canPlayEffect())return;
    if(!audioContext||audioContext.state!=='running')return;
    lastSound=performance.now();
    var duration=5.8,rate=audioContext.sampleRate;
    var frames=Math.ceil(rate*duration);
    var buffer=audioContext.createBuffer(1,frames,rate);
    var data=buffer.getChannelData(0);
    // Soft, band-limited air movement; slow noise modulation avoids harsh static.
    var smooth=0;
    for(var i=0;i<frames;i++){
      smooth=smooth*.92+(Math.random()*2-1)*.08;
      data[i]=smooth;
    }
    var noise=audioContext.createBufferSource();noise.buffer=buffer;
    var filter=audioContext.createBiquadFilter();filter.type='lowpass';filter.frequency.value=950;
    var gain=audioContext.createGain();gain.gain.value=0;
    noise.connect(filter);filter.connect(gain);gain.connect(audioContext.destination);
    var start=audioContext.currentTime+.015;
    // Fade in/out, with 0.32-second wingbeats throughout the entire flyby.
    // Peak gain ~0.13, intentionally bounded to avoid startling visitors.
    gain.gain.setValueAtTime(0,start);
    for(var k=0;k<18;k++){
      var t=start+k*.32;
      var envelope=Math.min(1,(k+.5)/3,(18-k)/3);
      var peak=.13*Math.max(.15,envelope);
      gain.gain.linearRampToValueAtTime(peak,t+.105);
      gain.gain.linearRampToValueAtTime(peak*.25,t+.285);
    }
    gain.gain.linearRampToValueAtTime(0,start+duration);
    noise.start(start);noise.stop(start+duration);
    noise.onended=function(){noise.disconnect();filter.disconnect();gain.disconnect();};
  }
  // First ordinary trusted pointer/keyboard interaction unlocks Web Audio.
  // A simulated click cannot unlock it; no sound is played on activation itself.
  function unlockSound(event){
    if(!event.isTrusted||!active())return;
    var Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx)return;
    try{
      if(!audioContext)audioContext=new Ctx();
      if(audioContext.state==='running')return;
      var pending=audioContext.resume();
      if(pending&&typeof pending.catch==='function')pending.catch(function(){});
    }catch(e){/* Silent fail: visuals remain usable without audio. */}
  }
  document.addEventListener('pointerdown',unlockSound,{passive:true});
  document.addEventListener('keydown',unlockSound);
  document.addEventListener('touchend',unlockSound,{passive:true});
  // REV44: Quiet Halloween feedback for intentional site UI clicks/selections.
  // Delegated listeners cover dynamically loaded toolbar, menus and header controls.
  // Exclude player/video controls and media links; never change the click behavior.
  var lastUiChime=0;
  function isSiteControl(el){
    if(!el||!el.closest)return false;
    var control=el.closest('button,select,input[type="checkbox"],input[type="radio"],a,[role="button"],[role="tab"],[role="switch"]');
    if(!control||control.disabled||control.getAttribute('aria-disabled')==='true')return false;
    if(control.closest('#ml-halloween-fx,#ml-halloween-intro-ui,iframe,video,audio,[class*="video-modal"],[id*="video-modal"],[class*="player"],[id*="player"]'))return false;
    if(control.matches('a')){
      var href=control.getAttribute('href')||'';
      if(/^(?:https?:)?\/\//i.test(href)||/youtube\.com|youtu\.be|\.(?:mp4|webm|mp3)(?:[?#]|$)/i.test(href))return false;
    }
    return true;
  }
  function uiChime(event){
    if(!event.isTrusted||!active()||document.hidden||!isSiteControl(event.target))return;
    // No key-repeat/duplicate change+click sounds; keep rapid filter use comfortable.
    var now=performance.now();if(now-lastUiChime<115)return;
    if(!audioContext||audioContext.state!=='running')return;
    lastUiChime=now;
    try{
      var t=audioContext.currentTime+.008;
      var variant=Math.floor(Math.random()*3);
      var notes=[[523.25,659.25],[392,493.88],[440,587.33]][variant];
      var volume=audioContext.createGain();volume.gain.setValueAtTime(.0001,t);
      volume.gain.exponentialRampToValueAtTime(.037,t+.018);
      volume.gain.exponentialRampToValueAtTime(.0001,t+.27);
      volume.connect(audioContext.destination);
      notes.forEach(function(hz,i){
        var osc=audioContext.createOscillator();osc.type=i?'sine':'triangle';
        osc.frequency.setValueAtTime(hz,t);
        osc.frequency.exponentialRampToValueAtTime(hz*(variant===1?.84:1.06),t+.24);
        var partial=audioContext.createGain();partial.gain.value=i?.32:.68;
        osc.connect(partial);partial.connect(volume);
        osc.start(t+i*.025);osc.stop(t+.28);
        osc.onended=function(){osc.disconnect();partial.disconnect();};
      });
      // Clean up envelope after all voices have stopped.
      setTimeout(function(){volume.disconnect();},450);
    }catch(e){/* UI interactions always work even when audio is unavailable. */}
  }
  // Capture clicks before navigation; changes cover keyboard-driven select controls.
  document.addEventListener('click',uiChime,true);
  document.addEventListener('change',uiChime,true);
  // REV47: Licensed site-hosted MP3 recordings replace REV46 synthesized creature tones.
  // Existing REV44 UI chimes and REV33 bat flyby remain untouched.
  var soundBase='audio/halloween/';
  var creatureFiles={ghost:'ghost.mp3',bat:'bat.mp3',spider:'spider.mp3',eyes:'eyes.mp3',pumpkin:'pumpkin.mp3'};
  var playingSounds=[];
  var introAudio=null,introUi=null,introButton=null,introSkip=null,introStopped=false;
  function stopAudio(el){
    if(!el)return;
    try{el.pause();el.currentTime=0;}catch(e){}
  }
  function stopAllHalloweenAudio(){
    stopAudio(introAudio);
    playingSounds.forEach(stopAudio);playingSounds=[];
  }
  function setIntroLabel(){
    if(!introButton)return;
    introButton.textContent=introAudio&&!introAudio.paused?'■ Stop Halloween Intro':'▶ Play Halloween Intro';
    if(introSkip)introSkip.hidden=!!introStopped||!!(introAudio&&!introAudio.paused);
  }
  function stopIntro(){stopAudio(introAudio);introStopped=true;setIntroLabel();}
  function playIntro(){
    if(!active()||document.hidden||playerPotentiallyVisible()||!introAudio)return;
    introStopped=false;
    introAudio.currentTime=0;
    var promise=introAudio.play();
    if(promise&&promise.then)promise.then(setIntroLabel).catch(function(){setIntroLabel();});
    setIntroLabel();
  }
  function buildIntroUi(){
    if(introUi||!active()||!document.body)return;
    introAudio=new Audio(soundBase+'intro.mp3');introAudio.preload='none';introAudio.volume=.38;
    introAudio.addEventListener('ended',function(){introStopped=true;setIntroLabel();});
    introUi=document.createElement('div');introUi.id='ml-halloween-intro-ui';
    introUi.setAttribute('role','group');introUi.setAttribute('aria-label','Halloween introduction audio');
    introButton=document.createElement('button');introButton.type='button';introButton.className='ml-intro-toggle';
    introButton.textContent='▶ Play Halloween Intro';
    introButton.addEventListener('click',function(event){
      event.stopPropagation();
      if(!introAudio.paused)stopIntro();else playIntro();
    });
    introSkip=document.createElement('button');introSkip.type='button';introSkip.className='ml-intro-skip';
    introSkip.textContent='Skip';introSkip.setAttribute('aria-label','Skip Halloween introduction');
    introSkip.addEventListener('click',function(event){event.stopPropagation();stopIntro();});
    introUi.appendChild(introButton);introUi.appendChild(introSkip);
    document.body.appendChild(introUi);
    setIntroLabel();
    // Try on each page load. Browser autoplay rules may block it; button remains available.
    if(!playerPotentiallyVisible()){
      var p=introAudio.play();
      if(p&&p.then)p.then(setIntroLabel).catch(function(){setIntroLabel();});
    }
  }
  function removeIntroUi(){
    stopAllHalloweenAudio();
    if(introUi)introUi.remove();
    introUi=null;introButton=null;introSkip=null;introAudio=null;introStopped=false;
  }
  function creatureSound(kind){
    if(!active()||document.hidden||playerPotentiallyVisible()||!creatureFiles[kind])return;
    try{
      var el=new Audio(soundBase+creatureFiles[kind]);
      el.volume=.5;el.preload='auto';
      playingSounds.push(el);
      el.addEventListener('ended',function(){playingSounds=playingSounds.filter(function(x){return x!==el;});},{once:true});
      var promise=el.play();
      if(promise&&promise.catch)promise.catch(function(){playingSounds=playingSounds.filter(function(x){return x!==el;});});
    }catch(e){/* Never interfere with site controls. */}
  }
  // A visible video/player must take precedence over background Halloween music.
  var introWatch=setInterval(function(){
    if(introAudio&&!introAudio.paused&&(document.hidden||!active()||playerPotentiallyVisible()))stopIntro();
  },700);
  function creatureClick(event){
    if(!event.isTrusted||!active()||!layer||!layer.contains(event.target))return;
    var el=event.target.closest('.ml-halloween-ghost,.ml-halloween-bat,.ml-halloween-spider-body,.ml-halloween-eyes,.ml-halloween-pumpkin');
    if(!el||!layer.contains(el))return;
    var kind=el.classList.contains('ml-halloween-ghost')?'ghost':
      el.classList.contains('ml-halloween-bat')?'bat':
      el.classList.contains('ml-halloween-spider-body')?'spider':
      el.classList.contains('ml-halloween-eyes')?'eyes':'pumpkin';
    var now=performance.now();if(now-lastCreatureClick<180)return;
    lastCreatureClick=now;
    event.stopPropagation();
    creatureSound(kind);
  }
  var webSvg='<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M0 0H100 M0 0V100 M0 0Q50 0 100 100 M0 0Q0 50 100 100 M0 0Q65 15 85 85 M0 0Q15 65 85 85"/><path d="M25 0Q25 25 0 25 M50 0Q50 50 0 50 M75 0Q75 75 0 75"/></svg>';
  function active(){return root.getAttribute('data-seasonal-theme')==='halloween';}
  function svgBat(){
    var svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 48 22');svg.setAttribute('aria-hidden','true');
    svg.style.cssText='width:100%;height:100%;fill:currentColor';
    // REV28: independent wings; retain the same flyby container and trigger logic.
    // The left/right wings flap around their shoulder joints; body stays centered.
    var ns='http://www.w3.org/2000/svg';
    function part(cls,path){
      var p=document.createElementNS(ns,'path');p.setAttribute('class',cls);
      p.setAttribute('d',path);svg.appendChild(p);
    }
    part('ml-bat-wing-left','M23 9 Q17 2 13 7 Q7 1 1 11 L7 12 L10 18 L16 14 L20 17 Z');
    part('ml-bat-wing-right','M25 9 Q31 2 35 7 Q41 1 47 11 L41 12 L38 18 L32 14 L28 17 Z');
    part('ml-bat-body','M22 8 L21 5 L23 6 L24 8 L25 6 L27 5 L26 8 L28 12 L25 18 L24 16 L23 18 L20 12 Z');
    return svg;
  }
  // REV34: Silent, decorative ghosts and spiders. Independent of REV33 bat/audio logic.
  function ghostSvg(){
    return '<svg viewBox="0 0 100 116" aria-hidden="true"><path d="M12 105 V47 C12 19 30 7 50 7 S88 19 88 47 V105 L74 95 L61 108 L49 96 L36 108 L24 96 Z" fill="currentColor" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><ellipse cx="37" cy="54" rx="6" ry="10" fill="#25102d"/><ellipse cx="63" cy="54" rx="6" ry="10" fill="#25102d"/><ellipse cx="50" cy="79" rx="7" ry="10" fill="#25102d"/></svg>';
  }
  // REV38: Eight separately articulated legs. Alternating groups step while
  // the body climbs, and twitch gently when it is stationary.
  function spiderSvg(){
    return '<svg viewBox="0 0 80 80" aria-hidden="true">'+
      '<g fill="none" stroke="currentColor" stroke-width="3.7" stroke-linecap="round" stroke-linejoin="round">'+
      '<g class="ml-spider-leg ml-spider-leg-a"><path d="M30 35 L17 17 L5 18"/></g>'+
      '<g class="ml-spider-leg ml-spider-leg-b"><path d="M29 40 L12 31 L3 37"/></g>'+
      '<g class="ml-spider-leg ml-spider-leg-a"><path d="M29 47 L12 51 L5 61"/></g>'+
      '<g class="ml-spider-leg ml-spider-leg-b"><path d="M32 53 L20 65 L18 77"/></g>'+
      '<g class="ml-spider-leg ml-spider-leg-b"><path d="M50 35 L63 17 L75 18"/></g>'+
      '<g class="ml-spider-leg ml-spider-leg-a"><path d="M51 40 L68 31 L77 37"/></g>'+
      '<g class="ml-spider-leg ml-spider-leg-b"><path d="M51 47 L68 51 L75 61"/></g>'+
      '<g class="ml-spider-leg ml-spider-leg-a"><path d="M48 53 L60 65 L62 77"/></g>'+
      '</g><ellipse cx="40" cy="44" rx="16" ry="20" fill="currentColor"/>'+
      '<circle cx="35" cy="39" r="2.5" fill="#ffbe65"/>'+
      '<circle cx="45" cy="39" r="2.5" fill="#ffbe65"/></svg>';
  }
  // REV35: Use the actual sticky toolbar bottom/divider geometry, not viewport percentages.
  // The toolbar is loaded asynchronously by the existing main module.
  function decorationBoundary(){
    var toolbar=document.querySelector('.toolbar');
    if(!toolbar)return {bottom:0,left:0,right:innerWidth};
    var r=toolbar.getBoundingClientRect();
    // styles_.css: toolbar::after is centered, width:min(100%-56px,1400px).
    var width=Math.min(Math.max(0,r.width-56),1400);
    return {bottom:Math.max(0,Math.min(innerHeight,r.bottom)),
      left:r.left+(r.width-width)/2,right:r.left+(r.width+width)/2};
  }
  // REV36: independent scroll-responsive and idle climbing; the web always joins the body.
  // Movement is confined to the viewport space below the real toolbar divider.
  var spiderStates=[],spiderFrame=0,spiderLastTick=0;
  function spiderRange(){
    var boundary=decorationBoundary().bottom;
    var mobile=matchMedia('(max-width: 700px)').matches;
    var bodySize=mobile?40:64;
    return {min:mobile?25:38,max:Math.max(mobile?25:38,
      Math.min(mobile?160:260,innerHeight-boundary-bodySize-22))};
  }
  function animateSpiders(time){
    spiderFrame=0;
    if(!layer||!active())return;
    var dt=spiderLastTick?Math.min(0.06,(time-spiderLastTick)/1000):0;
    spiderLastTick=time;
    // REV37: The toolbar is inserted/reflowed asynchronously after mount.
    // Recheck its actual divider each animation frame, including before any scroll.
    // positionSpiders writes only when geometry changes (see below).
    positionSpiders();
    positionPumpkins();
    var range=spiderRange();
    var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    spiderStates.forEach(function(st){
      if(!st.hang.isConnected)return;
      st.target=Math.max(range.min,Math.min(range.max,st.target));
      if(reduce){st.current=range.min;}
      else{
        // Scroll steers the spider; when idle, each spider wanders independently.
        // Pauses at different phases prevent synchronized yo-yo motion.
        var idle=Math.sin(time*(st.side==='left'?.00038:.00031)+st.phase);
        var rest=Math.abs(idle)<.20;
        var idleTarget=st.base+idle*(st.side==='left'?42:55);
        idleTarget=Math.max(range.min,Math.min(range.max,idleTarget));
        if(time-st.lastScrollTime>1250&&!rest){
          st.target+=(idleTarget-st.target)*Math.min(1,dt*.62);
        }
        st.current+=(st.target-st.current)*Math.min(1,dt*5.8);
      }
      // REV38: Animate legs in proportion to actual vertical travel. Idle
      // twitching remains gentle, and reduced-motion users get no leg motion.
      var speed=dt>0?Math.abs(st.current-(st.lastLegPosition===undefined?st.current:st.lastLegPosition))/dt:0;
      st.lastLegPosition=st.current;
      var period=Math.max(.22,Math.min(3.6,1.45/(1+speed*.065)));
      st.hang.style.setProperty('--ml-spider-step-period',period.toFixed(2)+'s');
      st.hang.classList.toggle('ml-spider-climbing',!reduce&&speed>1.5);
      var thread=st.hang.querySelector('.ml-halloween-spider-thread');
      if(thread)thread.style.height=Math.round(st.current)+'px';
    });
    if(!document.hidden)spiderFrame=requestAnimationFrame(animateSpiders);
  }
  function resumeSpiders(){
    if(!layer||spiderFrame||document.hidden)return;
    spiderLastTick=0;spiderFrame=requestAnimationFrame(animateSpiders);
  }
  function steerSpiders(delta){
    if(!layer||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    var now=performance.now(),range=spiderRange();
    spiderStates.forEach(function(st){
      st.lastScrollTime=now;
      // Down scroll = descend; up scroll = ascend. Slightly different reactions.
      st.target=Math.max(range.min,Math.min(range.max,
        st.target+delta*(st.side==='left'?.28:.23)));
      st.base=st.target;
    });
    resumeSpiders();
  }
  function positionSpiders(){
    if(!layer)return;
    var b=decorationBoundary();
    Array.prototype.forEach.call(layer.querySelectorAll('.ml-halloween-spider-hang'),function(el){
      var w=el.getBoundingClientRect().width;
      var top=Math.round(b.bottom+2)+'px';
      var left=Math.round((el.classList.contains('left')?b.left:b.right)-w/2)+'px';
      if(el.style.top!==top)el.style.top=top;
      if(el.style.left!==left)el.style.left=left;
      if(el.style.right!=='auto')el.style.right='auto';
    });
    // When toolbar height changes, keep existing ghosts below its lower edge too.
    Array.prototype.forEach.call(layer.querySelectorAll('.ml-halloween-ghost'),function(el){
      var minTop=b.bottom+8;
      if(parseFloat(el.style.top)<minTop)el.style.top=Math.round(minTop)+'px';
    });
  }
  var ghostTimer=null,lastGhost=0,ghostCount=0;
  function spawnGhost(force){
    if(!layer||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    var now=performance.now();
    if(now-lastGhost<(force?12000:17000))return;
    lastGhost=now;ghostCount++;
    var ghost=document.createElement('div');
    var side=ghostCount%2?'left':'right';
    ghost.className='ml-halloween-ghost '+side;
    var boundary=decorationBoundary().bottom+8;
    var ghostHeight=matchMedia('(max-width: 700px)').matches?68:Math.min(135,Math.max(72,innerWidth*.065))*1.16;
    var available=Math.max(0,innerHeight-boundary-ghostHeight-8);
    ghost.style.top=Math.round(boundary+available*(.18+(ghostCount%3)*.28))+'px';
    ghost.innerHTML=ghostSvg();layer.appendChild(ghost);
    ghost.addEventListener('animationend',function(){ghost.remove();},{once:true});
    setTimeout(function(){ghost.remove();},7200);
  }
  function scheduleGhost(){
    if(ghostTimer!==null)clearTimeout(ghostTimer);
    ghostTimer=setTimeout(function(){ghostTimer=null;if(layer)spawnGhost(false);scheduleGhost();},24000);
  }
  function addSpiders(){
    ['left','right'].forEach(function(side){
      var hang=document.createElement('div');hang.className='ml-halloween-spider-hang '+side;
      hang.innerHTML='<div class="ml-halloween-spider-thread"></div><div class="ml-halloween-spider-body">'+spiderSvg()+'</div>';
      layer.appendChild(hang);
      var min=matchMedia('(max-width: 700px)').matches?25:38;
      spiderStates.push({hang:hang,side:side,base:min+ (side==='left'?50:85),
        current:min+ (side==='left'?50:85),target:min+(side==='left'?50:85),
        phase:side==='left'?.4:2.1,lastScrollTime:0});
    });
    resumeSpiders();
  }
  // REV42: Full-width rolling fog, visually behind the pumpkins.
  // Three staggered layers create distinct wisps, without handling input.
  function addFog(){
    var fog=document.createElement('div');
    fog.className='ml-halloween-fog';
    fog.innerHTML='<span class="ml-fog-wisp a"></span><span class="ml-fog-wisp b"></span><span class="ml-fog-wisp c"></span>';
    layer.appendChild(fog);
  }
  // REV43: Quiet, occasional blinking eyes in the side shadows.
  // No sound, input, storage, or site-state changes. Timer removed on OFF.
  var eyesTimer=null,eyesCount=0;
  function spawnEyes(){
    if(!layer||!active()||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    var boundary=decorationBoundary().bottom;
    var available=innerHeight-boundary;
    if(available<165)return;
    var eyes=document.createElement('div');
    eyes.className='ml-halloween-eyes '+(eyesCount++%2?'right':'left');
    var maxTop=Math.max(0,available-100);
    eyes.style.top=Math.round(boundary+Math.min(maxTop,available*(.24+Math.random()*.46)))+'px';
    eyes.innerHTML='<span class="ml-eye"></span><span class="ml-eye"></span>';
    layer.appendChild(eyes);
    eyes.addEventListener('animationend',function(e){if(e.target===eyes)eyes.remove();});
    setTimeout(function(){eyes.remove();},7600);
  }
  function scheduleEyes(){
    if(eyesTimer!==null)clearTimeout(eyesTimer);
    eyesTimer=setTimeout(function(){eyesTimer=null;if(!layer)return;spawnEyes();scheduleEyes();},11000+Math.round(Math.random()*8000));
  }
  // REV40: Silent decorative jack-o'-lanterns. Isolated from bat audio and
  // spider/ghost timing. Their glow flickers independently, never blocks input.
  function pumpkinSvg(){
    return '<svg viewBox="0 0 100 94" aria-hidden="true" focusable="false">'+
      '<path d="M48 15 Q43 6 51 2 L59 4 Q53 11 54 18" fill="#497b35" stroke="#264b23" stroke-width="2"/>'+
      '<path d="M49 20 C13 2 1 32 9 61 C15 85 32 91 50 90 C69 91 87 84 92 60 C100 31 87 3 51 20Z" fill="#c65c0d" stroke="#74310b" stroke-width="3"/>'+
      '<path d="M48 20 C30 14 23 33 24 56 C25 77 34 87 49 89 M54 20 C73 14 79 33 77 56 C76 77 67 87 53 89" fill="none" stroke="#ed8b20" stroke-width="4" opacity=".75"/>'+
      '<g class="ml-pumpkin-light" fill="#ffe17b" stroke="#6c270a" stroke-width="2">'+
      '<path d="M20 45 L38 36 L35 55 Z"/><path d="M80 45 L62 36 L65 55 Z"/>'+
      '<path d="M48 49 L43 62 L57 62 Z"/>'+
      '<path d="M23 66 Q49 85 77 66 L71 76 L61 73 L54 81 L45 74 L35 79 L30 70 Z"/>'+
      '</g></svg>';
  }
  function addPumpkins(){
    ['left','right'].forEach(function(side){
      var el=document.createElement('div');
      el.className='ml-halloween-pumpkin '+side;
      el.innerHTML=pumpkinSvg();
      layer.appendChild(el);
    });
    positionPumpkins();
  }
  function positionPumpkins(){
    if(!layer)return;
    var boundary=decorationBoundary().bottom;
    var room=innerHeight-boundary;
    Array.prototype.forEach.call(layer.querySelectorAll('.ml-halloween-fog'),function(el){
      var show=room>=150;
      if(el.style.display!==(show?'':'none'))el.style.display=show?'':'none';
    });
    Array.prototype.forEach.call(layer.querySelectorAll('.ml-halloween-pumpkin'),function(el){
      // On very short screens, do not overlap the sticky toolbar.
      var show=room>=120;
      if(el.style.display!==(show?'':'none'))el.style.display=show?'':'none';
    });
  }
  // REV39: Header cobwebs scroll away with the banner, while the overlay
  // (spiders, ghosts and bats) stays viewport-fixed. No layout changes.
  function positionCornerWebs(){
    if(!layer)return;
    var offset=-(window.scrollY||window.pageYOffset||0)+'px';
    Array.prototype.forEach.call(layer.querySelectorAll('.ml-halloween-corner'),function(web){
      if(web.style.top!==offset)web.style.top=offset;
    });
  }
  function mount(){
    if(layer||!document.body)return;
    layer=document.createElement('div');layer.id='ml-halloween-fx';layer.setAttribute('aria-hidden','true');
    ['left','right'].forEach(function(side){
      var web=document.createElement('div');web.className='ml-halloween-corner '+side;
      web.innerHTML=webSvg;layer.appendChild(web);
    });
    document.body.appendChild(layer);
    layer.addEventListener('click',creatureClick);
    positionCornerWebs();
    addSpiders();positionSpiders();addFog();addPumpkins();scheduleGhost();scheduleEyes();buildIntroUi();
    lastScroll=window.scrollY||0;previousSpiderScrollY=lastScroll;accumulated=0;
  }
  function unmount(){removeIntroUi();if(eyesTimer!==null){clearTimeout(eyesTimer);eyesTimer=null;}if(spiderFrame)cancelAnimationFrame(spiderFrame);spiderFrame=0;spiderLastTick=0;spiderStates=[];if(ghostTimer!==null){clearTimeout(ghostTimer);ghostTimer=null;}if(layer){layer.remove();layer=null;}accumulated=0;lastGhost=0;}
  function sync(){if(active())mount();else unmount();}
  function fly(){
    if(!layer||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    flutter();
    var n=matchMedia('(max-width: 700px)').matches?2:5;
    var y=Math.round(Math.min(innerHeight*.72,Math.max(90,innerHeight*.49)));
    for(var i=0;i<n;i++){
      (function(index){
        var bat=document.createElement('div');bat.className='ml-halloween-bat';
        bat.style.top=(y+index*(matchMedia('(max-width: 700px)').matches?28:46))+'px';bat.style.color=root.getAttribute('data-theme')==='bright'?'#30143f':'#d7a0e8';
        bat.style.animationDelay=(index*.16)+'s';bat.appendChild(svgBat());layer.appendChild(bat);
        bat.classList.add('fly');
        bat.addEventListener('animationend',function(){bat.remove();},{once:true});
        setTimeout(function(){bat.remove();},8500);
      })(i);
    }
  }
  function onScroll(){
    var y=window.scrollY||0,delta=Math.abs(y-lastScroll);lastScroll=y;
    if(!layer)return;
    positionCornerWebs();
    positionSpiders();
    positionPumpkins();
    if(delta>innerHeight*2)return;
    steerSpiders(y-previousSpiderScrollY);
    previousSpiderScrollY=y;
    accumulated+=delta;
    if(y>lastScrollDirectionY&&delta>0)downwardAccumulated+=delta;else if(y<lastScrollDirectionY)downwardAccumulated=0;
    lastScrollDirectionY=y;
    if(downwardAccumulated>=380){downwardAccumulated=0;spawnGhost(true);}
    var now=performance.now();
    if(accumulated>=550&&now-lastFlight>=11000){accumulated=0;lastFlight=now;fly();}
  }
  var downwardAccumulated=0,lastScrollDirectionY=window.scrollY||0,previousSpiderScrollY=window.scrollY||0;
  var observer=new MutationObserver(function(records){
    if(records.some(function(r){return r.attributeName==='data-seasonal-theme';}))sync();
  });
  observer.observe(root,{attributes:true,attributeFilter:['data-seasonal-theme']});
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',function(){positionSpiders();positionPumpkins();},{passive:true});
  document.addEventListener('visibilitychange',function(){if(document.hidden){stopAllHalloweenAudio();setIntroLabel();if(spiderFrame)cancelAnimationFrame(spiderFrame);spiderFrame=0;}else resumeSpiders();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});
  else sync();
})();
