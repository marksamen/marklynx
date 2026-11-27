/* Christmas — configuration only; parent Admin owns Firebase authentication. */
const $=id=>document.getElementById(id);
let theme=null,saved=null,draft="none",busy=false,dialogActive=false,sequence=0;
const session=crypto.randomUUID(), pending=new Map();
const validYear=y=>Number.isInteger(y)&&y>=2000&&y<=9999;
const label=m=>({none:"OFF",christmas:"Christmas",new_year:"New Year",halloween:"Halloween"}[m]);
function status(id,message,state=""){ $(id).textContent=message;$(id).dataset.state=state; }
function request(payload){
 return new Promise((resolve,reject)=>{
  if(parent===window){reject(new Error("Open Seasonal Configuration from the authenticated PROD Admin."));return;}
  const requestId=`s55-${session}-${++sequence}`;
  const timer=setTimeout(()=>{pending.delete(requestId);reject(new Error("Request timed out. Reload settings before retrying."));},30000);
  pending.set(requestId,{resolve,reject,timer});parent.postMessage({type:"seasonal55-request",requestId,payload},location.origin);
 });
}
window.addEventListener("message",e=>{
 if(e.origin!==location.origin||e.source!==parent||e.data?.type!=="seasonal55-response")return;
 const p=pending.get(e.data.requestId);if(!p)return;pending.delete(e.data.requestId);clearTimeout(p.timer);
 if(e.data.ok===true)p.resolve(e.data);else p.reject(new Error(e.data.error||"Request failed"));
});
function render(){
 const locked=busy||dialogActive;
 const celebrationLocked=locked||theme!=="christmas"||saved===null;
 $("theme").disabled=locked||theme===null;$("themeSave").disabled=locked||theme===null||$("theme").value===theme;
 for(const [id,mode] of [["christmas","christmas"],["newYear","new_year"]]){
  const on=draft===mode;$(id).textContent=on?"ON":"OFF";$(id).setAttribute("aria-checked",String(on));
  // Both the draft and the stored value must permit enabling the other mode.
  $(id).disabled=celebrationLocked||(draft!=="none"&&!on)||(saved!==null&&saved.mode!=="none"&&saved.mode!==mode);
 }
 const y=$("year").valueAsNumber;
 $("year").disabled=celebrationLocked;$("reload").disabled=locked;
 $("celebrationSave").disabled=celebrationLocked||!validYear(y)||(saved.mode===draft&&saved.year===y);
}
function dialog(title,message,confirm=false,error=false){
 dialogActive=true;const prev=document.activeElement;$("dialogTitle").textContent=title;$("dialogMessage").textContent=message;$("card").classList.toggle("error",error);$("no").hidden=!confirm;$("yes").textContent=confirm?"Yes":"OK";$("dialog").classList.add("open");$("dialog").setAttribute("aria-hidden","false");$("content").inert=true;render();
 return new Promise(resolve=>{
  function done(v){$("yes").onclick=null;$("no").onclick=null;$("dialog").classList.remove("open");$("dialog").setAttribute("aria-hidden","true");$("content").inert=false;dialogActive=false;render();if(prev?.isConnected&&!prev.disabled)prev.focus();resolve(v);}
  $("yes").onclick=()=>done(true);$("no").onclick=()=>done(false);(confirm?$("no"):$("yes")).focus();
 });
}
function adoptTheme(r){theme=r.theme;$("theme").value=theme;status("themeStatus","Saved PROD theme: "+label(theme),"ok");}
function adoptCelebration(r){saved={mode:r.mode,year:r.year};draft=r.mode;$("year").value=String(r.year);status("celebrationStatus",`Saved PROD celebration: ${label(r.mode)} · New Year ${r.year}`,"ok");}
async function load(){
 if(busy||dialogActive)return;busy=true;theme=null;saved=null;draft="none";$("year").value="";render();
 status("themeStatus","Reading PROD theme…");status("celebrationStatus","Reading PROD celebration settings…");
 try{adoptTheme(await request({action:"get-seasonal-theme"}));}catch(e){status("themeStatus",e.message,"error");}
 try{adoptCelebration(await request({action:"get-seasonal-celebration"}));}catch(e){status("celebrationStatus",e.message,"error");}
 busy=false;render();
}
$("theme").onchange=render;$("year").oninput=render;$("reload").onclick=load;
for(const [id,mode] of [["christmas","christmas"],["newYear","new_year"]])$(id).onclick=()=>{if($(id).disabled)return;draft=draft===mode?"none":mode;render();};
$("themeSave").onclick=async()=>{
 if($("themeSave").disabled)return;const value=$("theme").value;
 if(!await dialog("Save Seasonal Theme?",`Apply ${label(value)} to the PROD seasonal theme?`,true))return;
 busy=true;render();status("themeStatus","Saving PROD theme…");
 try{adoptTheme(await request({action:"set-seasonal-theme",theme:value}));busy=false;await dialog("Seasonal Theme Saved",`PROD theme: ${label(theme)}.`);}
 catch(e){theme=null;status("themeStatus",e.message+" Reload Settings before retrying.","error");busy=false;await dialog("Theme Save Failed",e.message,false,true);}finally{busy=false;render();}
};
$("celebrationSave").onclick=async()=>{
 if($("celebrationSave").disabled)return;const value={mode:draft,year:$("year").valueAsNumber,expected_mode:saved.mode,expected_year:saved.year};
 if(!await dialog("Save Celebration Settings?",`Apply ${label(value.mode)} and New Year celebration year ${value.year} to PROD?`,true))return;
 busy=true;render();status("celebrationStatus","Saving PROD celebration settings…");
 try{adoptCelebration(await request({action:"set-seasonal-celebration",...value}));busy=false;await dialog("Celebration Settings Saved",`PROD celebration: ${label(saved.mode)}. New Year ${saved.year}.`);}
 catch(e){saved=null;draft="none";status("celebrationStatus",e.message+" Reload Settings before retrying.","error");busy=false;await dialog("Celebration Save Failed",e.message,false,true);}finally{busy=false;render();}
};
render();load();
