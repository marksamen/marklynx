/* CHRISTMAS TEST REV55 — authenticated parent-only seasonal bridge. */
export function initSeasonalConfiguration({auth,url}){
  if(url!=="https://aikifibkcjibubqegvmb.supabase.co")throw new Error("Seasonal configuration TEST URL mismatch");
  const frame=document.getElementById("adminPageModalFrame"),modal=document.getElementById("adminPageModal");
  let busy=false;
  const active=e=>e.origin===location.origin&&e.source===frame.contentWindow&&modal.classList.contains("open")&&frame.getAttribute("src")?.startsWith("seasonal/index_.html");
  window.addEventListener("message",async e=>{
    if(!active(e)||e.data?.type!=="seasonal55-request")return;
    const {requestId,payload}=e.data;
    if(typeof requestId!=="string"||!/^s55-[a-z0-9-]{1,100}$/.test(requestId))return;
    const send=data=>{if(active(e))e.source.postMessage({type:"seasonal55-response",requestId,...data},e.origin);};
    if(busy){send({ok:false,error:"Another seasonal request is in progress. Retry shortly."});return;}
    const a=payload?.action, modes=["none","christmas","new_year"], themes=["none","halloween","christmas"];
    const validYear=y=>Number.isInteger(y)&&y>=2000&&y<=9999;
    let clean={action:a};
    if(a==="set-seasonal-theme"){
      if(!themes.includes(payload.theme)){send({ok:false,error:"Invalid theme"});return;}clean.theme=payload.theme;
    }else if(a==="set-seasonal-celebration"){
      if(!modes.includes(payload.mode)||!modes.includes(payload.expected_mode)||!validYear(payload.year)||!validYear(payload.expected_year)){send({ok:false,error:"Invalid celebration settings"});return;}
      clean={action:a,mode:payload.mode,year:payload.year,expected_mode:payload.expected_mode,expected_year:payload.expected_year};
    }else if(!["get-seasonal-theme","get-seasonal-celebration"].includes(a)){send({ok:false,error:"Action not permitted"});return;}
    busy=true;
    try{
      const user=auth.currentUser;if(!user)throw new Error("Admin login required");
      const token=await user.getIdToken();if(auth.currentUser!==user||!active(e))throw new Error("Admin session or submenu changed");
      const res=await fetch(url+"/functions/v1/games-admin",{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify(clean),cache:"no-store"});
      const data=await res.json().catch(()=>({}));
      if(!res.ok||data.ok!==true)throw new Error(String(data.error||("HTTP "+res.status)).slice(0,240));
      if(auth.currentUser!==user)throw new Error("Admin session changed");
      if(a.endsWith("seasonal-theme")){
        if(!themes.includes(data.theme))throw new Error("Invalid stored theme response");send({ok:true,theme:data.theme});
      }else{
        if(!modes.includes(data.mode)||!validYear(data.year))throw new Error("Invalid stored celebration response");send({ok:true,mode:data.mode,year:data.year});
      }
    }catch(err){send({ok:false,error:err instanceof Error?err.message:"Seasonal request failed"});}
    finally{busy=false;}
  });
}
