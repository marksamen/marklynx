/* CHRISTMAS TEST REV61 — local, interaction-unlocked event audio; no player or Halloween changes. */
(function(){
  'use strict';
  var root=document.documentElement, motion=matchMedia('(prefers-reduced-motion: reduce)');
  var Ctx=window.AudioContext||window.webkitAudioContext, ctx=null, master=null;
  var files={santa:'santa-ho-ho-ho',bells:'sleigh-bells',land:'landing',chimney:'chimney',return:'magic-chime',elf:'elf-giggle',star:'shooting-star',train:'train-whistle',gingerbread:'gingerbread-run-wave',fireworks:'new-year-fireworks',confetti:'new-year-confetti',toast:'new-year-toast'};
  var buffers={}, loading={}, errors={}, jobs=new Map(), active=null, printing=false, hiddenPage=false, unlocked=false;
  var counts={played:0,stopped:0,skipped:0}, lastCue=null;
  // TEST-only passive meter. Keep the original master -> destination connection intact.
  var meter=null, meterData=null, meterError=null, cueRecord=null, history=[];
  function attachMeter(){
    try{meter=ctx.createAnalyser();meter.fftSize=2048;meterData=new Float32Array(meter.fftSize);master.connect(meter);}
    catch(e){meterError=String(e.message||e);meter=null;meterData=null;}
  }
  function sampleMeter(){
    if(!meter||!cueRecord||!active)return;
    try{
      var peak=0;
      if(typeof meter.getFloatTimeDomainData==='function'){
        meter.getFloatTimeDomainData(meterData);
        for(var i=0;i<meterData.length;i++)peak=Math.max(peak,Math.abs(meterData[i]));
      }else{throw Error('Float time-domain analyser unavailable');}
      cueRecord.samples++;cueRecord.peak=Math.max(cueRecord.peak===null?0:cueRecord.peak,peak);
    }catch(e){meterError=String(e.message||e);}
  }
  function recordCue(key,gain){
    cueRecord={key:key,master:master.gain.value,cueGain:gain.gain.value,effectiveGain:master.gain.value*gain.gain.value,peak:null,samples:0,startedAt:new Date().toISOString()};
    history.push(cueRecord);if(history.length>12)history.shift();
  }
  function blocked(){
    if(root.getAttribute('data-seasonal-theme')!=='christmas')return 'not Christmas';
    if(document.hidden||hiddenPage)return 'hidden page';
    if(printing)return 'printing';
    if(motion.matches)return 'reduced motion';
    var modal=document.getElementById('videoModalOverlay');
    if(modal&&modal.classList.contains('open'))return 'video modal';
    if(Array.prototype.some.call(document.querySelectorAll('iframe,video,audio'),function(el){
      var r=el.getBoundingClientRect(),cs=getComputedStyle(el);
      return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&cs.display!=='none'&&cs.visibility!=='hidden';
    }))return 'visible media';
    return '';
  }
  function load(key){
    if(buffers[key]||loading[key]||errors[key]||!ctx)return;
    loading[key]=true;
    fetch('audio/christmas/'+files[key]+'.mp3?v=CHRISTMAS-TEST-'+(key==='toast'?'REV61':key==='confetti'?'REV60B':key==='fireworks'?'REV59':key==='gingerbread'?'REV53':key==='train'?'REV49':'REV47'),{credentials:'same-origin'}).then(function(r){if(!r.ok)throw Error('HTTP '+r.status);return r.arrayBuffer();}).then(function(bytes){
      return new Promise(function(resolve,reject){ctx.decodeAudioData(bytes,resolve,reject);});
    }).then(function(buffer){buffers[key]=buffer;}).catch(function(e){errors[key]=String(e.message||e);}).finally(function(){delete loading[key];});
  }
  function unlock(e){
    if(!e.isTrusted||blocked()||!Ctx)return;
    try{
      if(!ctx){ctx=new Ctx();master=ctx.createGain();master.gain.value=.175;master.connect(ctx.destination);attachMeter();}
      var promise=ctx.resume();
      Promise.resolve(promise).then(function(){if(ctx.state==='running'){unlocked=true;Object.keys(files).forEach(load);}}).catch(function(){});
    }catch(e){/* No audio support: leave visuals intact. */}
  }
  function stop(){if(active){var a=active;active=null;try{a.source.stop();}catch(e){}try{a.source.disconnect();a.gain.disconnect();}catch(e){}counts.stopped++;}}
  function cancel(owner){var timers=jobs.get(owner);if(timers){timers.forEach(clearTimeout);jobs.delete(owner);}if(active&&active.owner===owner)stop();}
  function stopAll(){Array.from(jobs.keys()).forEach(cancel);stop();}
  function cue(owner,key,priority,volume){
    if(blocked()||!owner.isConnected||!ctx||ctx.state!=='running'||!buffers[key]){counts.skipped++;return;}
    if(active){if(active.priority>=priority){counts.skipped++;return;}stop();}
    try{
      var source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffers[key];gain.gain.value=volume;
      source.connect(gain);gain.connect(master);var a={source:source,gain:gain,owner:owner,priority:priority,key:key};active=a;
      source.onended=function(){if(active===a)active=null;try{source.disconnect();gain.disconnect();}catch(e){}};
      source.start();counts.played++;lastCue=key;recordCue(key,gain);
    }catch(e){stop();counts.skipped++;}
  }
  function event(type,owner,duration){
    if(!owner||!owner.isConnected||blocked())return;
    cancel(owner);var timers=[];jobs.set(owner,timers);
    function later(ms,key,priority,volume){timers.push(setTimeout(function(){if(jobs.get(owner)===timers)cue(owner,key,priority,volume);},ms));}
    if(type==='flyby'){later(Math.round((duration||12000)*.09),'santa',3,.85);later(Math.round((duration||12000)*.55),'bells',3,.7);}
    else if(type==='delivery'){later(200,'santa',3,.85);later(4800,'land',3,.7);later(9200,'chimney',3,.7);later(13400,'return',3,.65);later(18800,'bells',3,.7);}
    else if(type==='elf'){later(750,'elf',2,.65);}
    else if(type==='star'){later(200,'star',1,.48);}
    else if(type==='train'){later(1200,'train',2,.65);}
    else if(type==='gingerbread'){later(50,'gingerbread',1,.65);}
    else if(type==='fireworks'){later(0,'fireworks',2,.72);}
    else if(type==='confetti'){later(0,'confetti',2,.48);}
    else if(type==='toast'){later(1800,'toast',2,.65);}
  }
  function reconcile(){if(blocked())stopAll();else Array.from(jobs.keys()).forEach(function(node){if(!node.isConnected)cancel(node);});}
  // Check visual media continuously only while a cue is active/pending, including dynamically mounted players.
  // No perpetual frame loop in Normal/Halloween or when idle: observe DOM and use a bounded monitor only when needed.
  var frame=0;function tick(){frame=0;sampleMeter();reconcile();if(jobs.size||active)frame=requestAnimationFrame(tick);}
  function start(type,owner,duration){event(type,owner,duration);if(jobs.size&&!frame)frame=requestAnimationFrame(tick);}
  document.addEventListener('pointerdown',unlock,{passive:true});document.addEventListener('touchend',unlock,{passive:true});document.addEventListener('keydown',unlock);
  new MutationObserver(reconcile).observe(root,{attributes:true,attributeFilter:['data-seasonal-theme']});
  document.addEventListener('visibilitychange',reconcile);window.addEventListener('beforeprint',function(){printing=true;reconcile();});window.addEventListener('afterprint',function(){printing=false;});
  window.addEventListener('pagehide',function(){hiddenPage=true;stopAll();});window.addEventListener('pageshow',function(){hiddenPage=false;});
  if(motion.addEventListener)motion.addEventListener('change',reconcile);else if(motion.addListener)motion.addListener(reconcile);
  window.mlChristmasSounds=Object.freeze({event:start,cancel:cancel});
  window.mlChristmasSoundDiagnostics=function(){return {revision:'SEASONAL-CHRISTMAS-REFINEMENT TEST REV08',blocked:blocked()||null,unlocked:unlocked,context:ctx?ctx.state:'not created',ready:Object.keys(buffers),loading:Object.keys(loading),errors:Object.assign({},errors),active:active?active.key:null,pendingEvents:jobs.size,lastCue:lastCue,counts:Object.assign({},counts),masterGain:master?master.gain.value:null,sampleRate:ctx?ctx.sampleRate:null,baseLatency:ctx&&typeof ctx.baseLatency==='number'?ctx.baseLatency:null,outputLatency:ctx&&typeof ctx.outputLatency==='number'?ctx.outputLatency:null,meterAvailable:!!meter,meterError:meterError,lastCueMeasurement:cueRecord,measurements:history.slice()};};
})();
