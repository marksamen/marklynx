/* CHRISTMAS TEST REV61 — local, interaction-unlocked event audio; no player or Halloween changes. */
(function(){
  'use strict';
  var root=document.documentElement, motion=matchMedia('(prefers-reduced-motion: reduce)');
  var Ctx=window.AudioContext||window.webkitAudioContext, ctx=null, master=null;
  var files={santa:'santa-ho-ho-ho',bells:'sleigh-bells',land:'landing',chimney:'chimney',return:'magic-chime',elf:'elf-giggle',star:'shooting-star',train:'train-whistle',gingerbread:'gingerbread-run-wave',fireworks:'new-year-fireworks',confetti:'new-year-confetti',toast:'new-year-toast'};
  var buffers={}, loading={}, errors={}, jobs=new Map(), active=null, printing=false, hiddenPage=false, unlocked=false;
  var counts={played:0,stopped:0,skipped:0}, lastCue=null;
  // TEST-only passive meter. Keep the original master -> destination connection intact.
  var masterBytes=new Uint8Array(2048), meter=null, meterData=null, meterError=null, cueRecord=null, history=[];
  var bufferInfo={}, lifecycle=[], diagnosticErrors=[];
  function diagnosticError(e){diagnosticErrors.push(String(e.message||e));if(diagnosticErrors.length>16)diagnosticErrors.shift();}
  function trace(event,detail){try{lifecycle.push({event:event,detail:detail||null,wall:Date.now(),clock:ctx?ctx.currentTime:null,state:ctx?ctx.state:null,hidden:document.hidden,activation:navigator.userActivation?{active:navigator.userActivation.isActive,ever:navigator.userActivation.hasBeenActive}:null});if(lifecycle.length>32)lifecycle.shift();}catch(e){diagnosticError(e);}}
  function inspectBuffer(key,b){try{var channels=[];for(var ch=0;ch<b.numberOfChannels;ch++){var a=b.getChannelData(ch),peak=0,first=null,nonzero=0;for(var i=0;i<a.length;i++){var v=Math.abs(a[i]);if(v>peak)peak=v;if(v>0.00001){nonzero++;if(first===null)first=i;}}channels.push({peak:peak,nonzero:nonzero,firstSignalSeconds:first===null?null:first/b.sampleRate});}bufferInfo[key]={duration:b.duration,length:b.length,sampleRate:b.sampleRate,channels:channels};}catch(e){diagnosticError(e);}}
  function tap(node){try{var a=ctx.createAnalyser();a.fftSize=2048;node.connect(a);return {node:a,float:new Float32Array(a.fftSize),byte:new Uint8Array(a.fftSize)};}catch(e){diagnosticError(e);return null;}}
  function sampleTap(t,out){if(!t)return;try{if(typeof t.node.getFloatTimeDomainData==='function'){t.node.getFloatTimeDomainData(t.float);var f=0;for(var i=0;i<t.float.length;i++)f=Math.max(f,Math.abs(t.float[i]));out.floatPeak=Math.max(out.floatPeak||0,f);out.floatSamples++;}}catch(e){diagnosticError(e);}try{t.node.getByteTimeDomainData(t.byte);var v=0;for(var j=0;j<t.byte.length;j++)v=Math.max(v,Math.abs(t.byte[j]-128));out.bytePeak=Math.max(out.bytePeak||0,v);out.byteSamples++;}catch(e){diagnosticError(e);}}
  function newStage(){return {floatPeak:null,bytePeak:null,floatSamples:0,byteSamples:0};}
  function finishRecord(a,reason){try{if(a.record){a.record.endReason=reason;a.record.endClock=ctx.currentTime;a.record.endWall=Date.now();}if(a.taps){a.taps.forEach(function(t){if(t)try{t.node.disconnect();}catch(e){}});a.taps=null;}}catch(e){diagnosticError(e);}}
  function attachMeter(){
    try{meter=ctx.createAnalyser();meter.fftSize=2048;meterData=new Float32Array(meter.fftSize);master.connect(meter);ctx.addEventListener("statechange",function(){trace("statechange");});trace("context created");}
    catch(e){meterError=String(e.message||e);meter=null;meterData=null;}
  }
  function sampleMeter(){
    if(!cueRecord||!active)return;
    try{var rec=active.record;if(rec){rec.lastClock=ctx.currentTime;rec.clockAdvance=rec.lastClock-rec.startClock;rec.wallElapsedMs=Date.now()-rec.startWall;sampleTap(active.taps&&active.taps[0],rec.stages.source);sampleTap(active.taps&&active.taps[1],rec.stages.cue);sampleTap(meter&&{node:meter,float:meterData,byte:masterBytes},rec.stages.master);}}catch(e){diagnosticError(e);}
    if(!meter)return;
    try{
      var peak=0;
      if(typeof meter.getFloatTimeDomainData==='function'){
        meter.getFloatTimeDomainData(meterData);
        for(var i=0;i<meterData.length;i++)peak=Math.max(peak,Math.abs(meterData[i]));
      }else{throw Error('Float time-domain analyser unavailable');}
      cueRecord.samples++;cueRecord.peak=Math.max(cueRecord.peak===null?0:cueRecord.peak,peak);
    }catch(e){meterError=String(e.message||e);}
  }
  function recordCue(key,gain,a){
    try{
    cueRecord={key:key,master:master.gain.value,cueGain:gain.gain.value,effectiveGain:master.gain.value*gain.gain.value,peak:null,samples:0,startedAt:new Date().toISOString()};
    cueRecord.startClock=ctx.currentTime;cueRecord.startWall=Date.now();cueRecord.buffer=bufferInfo[key]||null;cueRecord.stages={source:newStage(),cue:newStage(),master:newStage()};a.record=cueRecord;
    history.push(cueRecord);if(history.length>12)history.shift();}catch(e){diagnosticError(e);}
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
    }).then(function(buffer){buffers[key]=buffer;inspectBuffer(key,buffer);}).catch(function(e){errors[key]=String(e.message||e);}).finally(function(){delete loading[key];});
  }
  function unlock(e){
    if(!e.isTrusted||blocked()||!Ctx)return;
    try{
      if(!ctx){ctx=new Ctx();master=ctx.createGain();master.gain.value=.175;master.connect(ctx.destination);attachMeter();}
      trace("resume requested",e.type);var promise=ctx.resume();
      Promise.resolve(promise).then(function(){trace('resume resolved');if(ctx.state==='running'){unlocked=true;Object.keys(files).forEach(load);}}).catch(function(e){trace("resume rejected",String(e));});
    }catch(e){/* No audio support: leave visuals intact. */}
  }
  function stop(){if(active){var a=active;active=null;finishRecord(a,"stopped");try{a.source.stop();}catch(e){}try{a.source.disconnect();a.gain.disconnect();}catch(e){}counts.stopped++;}}
  function cancel(owner){var timers=jobs.get(owner);if(timers){timers.forEach(clearTimeout);jobs.delete(owner);}if(active&&active.owner===owner)stop();}
  function stopAll(){Array.from(jobs.keys()).forEach(cancel);stop();}
  function cue(owner,key,priority,volume){
    if(blocked()||!owner.isConnected||!ctx||ctx.state!=='running'||!buffers[key]){counts.skipped++;return;}
    if(active){if(active.priority>=priority){counts.skipped++;return;}stop();}
    try{
      var source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffers[key];gain.gain.value=volume;
      source.connect(gain);gain.connect(master);var a={source:source,gain:gain,owner:owner,priority:priority,key:key};active=a;
      try{a.taps=[tap(source),tap(gain)];}catch(e){diagnosticError(e);}
      source.onended=function(){if(!a.record||!a.record.endReason)finishRecord(a,"ended");if(active===a)active=null;try{source.disconnect();gain.disconnect();}catch(e){}};
      source.start();counts.played++;lastCue=key;recordCue(key,gain,a);
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
  document.addEventListener('visibilitychange',function(){trace('visibilitychange');});document.addEventListener('visibilitychange',reconcile);window.addEventListener('beforeprint',function(){printing=true;reconcile();});window.addEventListener('afterprint',function(){printing=false;});
  window.addEventListener('pagehide',function(){hiddenPage=true;stopAll();});window.addEventListener('pageshow',function(){hiddenPage=false;});
  if(motion.addEventListener)motion.addEventListener('change',reconcile);else if(motion.addListener)motion.addListener(reconcile);
  window.mlChristmasSounds=Object.freeze({event:start,cancel:cancel});
  window.mlChristmasSoundDiagnostics=function(){return {revision:'SEASONAL-CHRISTMAS-REFINEMENT TEST REV09',blocked:blocked()||null,unlocked:unlocked,context:ctx?ctx.state:'not created',ready:Object.keys(buffers),loading:Object.keys(loading),errors:Object.assign({},errors),active:active?active.key:null,pendingEvents:jobs.size,lastCue:lastCue,counts:Object.assign({},counts),masterGain:master?master.gain.value:null,sampleRate:ctx?ctx.sampleRate:null,baseLatency:ctx&&typeof ctx.baseLatency==='number'?ctx.baseLatency:null,outputLatency:ctx&&typeof ctx.outputLatency==='number'?ctx.outputLatency:null,meterAvailable:!!meter,meterError:meterError,lastCueMeasurement:cueRecord,measurements:history.slice(),bufferInfo:bufferInfo,lifecycle:lifecycle.slice(),diagnosticErrors:diagnosticErrors.slice(),destination:ctx?{channelCount:ctx.destination.channelCount,maxChannelCount:ctx.destination.maxChannelCount,channelCountMode:ctx.destination.channelCountMode,channelInterpretation:ctx.destination.channelInterpretation,currentTime:ctx.currentTime}:null};};
})();
