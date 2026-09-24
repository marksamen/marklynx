let authRef=null;
let supabaseProdUrl=null;
let supabaseProdPublishableKey=null;

export function initDataSourceControl({auth,SUPABASE_PROD_URL,SUPABASE_PROD_PUBLISHABLE_KEY}){
  authRef=auth;
  supabaseProdUrl=SUPABASE_PROD_URL;
  supabaseProdPublishableKey=SUPABASE_PROD_PUBLISHABLE_KEY;
  document.getElementById("dataSourceUseSupabase").addEventListener("click",()=>setProdDataSource("supabase"));
  document.getElementById("dataSourceUseJson").addEventListener("click",()=>setProdDataSource("json"));
}

let verifiedProdDatabaseIdentity=false;
let prodManualDataSource=null;

function renderVerifiedProdDatabaseIdentity(){
  if(!verifiedProdDatabaseIdentity||prodManualDataSource===null)return;
  const status=document.getElementById("databaseIdentityStatus");
  const offlineJson=prodManualDataSource==="json";
  const mode=offlineJson?"OFFLINE JSON VERIFIED":"ONLINE DB VERIFIED";
  status.textContent=`SUPABASE PROD — ${mode}`;
  status.style.color=offlineJson?"#ffd36d":"#6dff8b";
}

export async function loadDataSourceStatus(){
  const configured=document.getElementById("dataSourceConfigured");
  const override=document.getElementById("dataSourceOverride");
  const note=document.getElementById("dataSourceStatusNote");
  try{
    const response=await fetch("../youtube/data/data-source.json?status="+Date.now(),{cache:"no-store"});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const config=await response.json();
    const source=String(config?.source||"").toLowerCase();
    if(source!=="supabase"&&source!=="json")throw new Error("Unknown source value");
    configured.textContent=source.toUpperCase();
    note.textContent="Read-only PROD status from data-source.json.";
  }catch(e){
    configured.textContent="UNAVAILABLE";
    note.textContent="Could not read PROD data-source.json.";
    console.error("PROD data source status read failed:",e);
  }

  try{
    const user=authRef.currentUser;
    if(!user)throw new Error("Admin authentication is required.");
    const firebaseToken=await user.getIdToken();
    const response=await fetch(`${supabaseProdUrl}/functions/v1/games-admin`,{
      method:"POST",
      headers:{"Authorization":`Bearer ${firebaseToken}`,"Content-Type":"application/json"},
      body:JSON.stringify({action:"get-data-source"})
    });
    const result=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(result.error||`Supabase PROD returned HTTP ${response.status}.`);
    const source=String(result?.source||"").toLowerCase();
    if(source!=="supabase"&&source!=="json")throw new Error("Unknown override value");
    prodManualDataSource=source;
    override.textContent=source.toUpperCase();
    renderVerifiedProdDatabaseIdentity();
  }catch(e){
    override.textContent="UNAVAILABLE";
    console.error("PROD data source override read failed:",e);
  }
}

async function setProdDataSource(source){
  if(source!=="supabase"&&source!=="json")return;
  const message=document.getElementById("dataSourceControlMessage");
  const buttons=[document.getElementById("dataSourceUseSupabase"),document.getElementById("dataSourceUseJson")];
  buttons.forEach(button=>button.disabled=true);
  prodManualDataSource=null;
  const identityStatus=document.getElementById("databaseIdentityStatus");
  if(verifiedProdDatabaseIdentity){
    identityStatus.textContent="SUPABASE PROD — VERIFYING SOURCE…";
    identityStatus.style.color="#b8c0cc";
  }
  message.style.color="#ffd36d";
  message.textContent=`Setting PROD manual override to ${source.toUpperCase()}…`;
  try{
    const user=authRef.currentUser;
    if(!user)throw new Error("Admin authentication is required.");
    const firebaseToken=await user.getIdToken();
    const response=await fetch(`${supabaseProdUrl}/functions/v1/games-admin`,{
      method:"POST",
      headers:{"Authorization":`Bearer ${firebaseToken}`,"Content-Type":"application/json"},
      body:JSON.stringify({action:"set-data-source",source})
    });
    const result=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(result.error||`Supabase PROD returned HTTP ${response.status}.`);
    await loadDataSourceStatus();
    message.style.color="#6dff8b";
    message.textContent=`✓ PROD manual override set to ${source.toUpperCase()}. Loader does not use this override yet.`;
  }catch(e){
    message.style.color="#ff6d6d";
    message.textContent=`SOURCE CHANGE FAILED — ${e?.message||e}`;
    console.error(e);
  }finally{
    buttons.forEach(button=>button.disabled=false);
  }
}


const EXPECTED_PROD_DATABASE_IDENTITY={
  id:"primary",
  environment:"PROD",
  identity_marker:"MARKLYNX-GAMEDEV-PROD"
};

export async function verifyProdDatabaseIdentity(){
  const status=document.getElementById("databaseIdentityStatus");
  const details=document.getElementById("databaseIdentityDetails");
  status.textContent="VERIFYING…";
  status.style.color="#b8c0cc";
  details.textContent="Reading identity directly from Supabase PROD…";
  try{
    const response=await fetch(`${supabaseProdUrl}/rest/v1/system_identity?id=eq.primary&select=id,environment,identity_marker`,{
      headers:{apikey:supabaseProdPublishableKey},
      cache:"no-store"
    });
    if(!response.ok)throw new Error(`Identity read failed (${response.status}).`);
    const rows=await response.json();
    if(!Array.isArray(rows)||rows.length!==1)throw new Error(`Expected exactly one primary identity row; received ${Array.isArray(rows)?rows.length:"invalid payload"}.`);
    const actual=rows[0]||{};
    const verified=
      actual.id===EXPECTED_PROD_DATABASE_IDENTITY.id &&
      actual.environment===EXPECTED_PROD_DATABASE_IDENTITY.environment &&
      actual.identity_marker===EXPECTED_PROD_DATABASE_IDENTITY.identity_marker;
    if(!verified){
      verifiedProdDatabaseIdentity=false;
      status.textContent="NOT VERIFIED — DATABASE IDENTITY MISMATCH";
      status.style.color="#ff6d6d";
      details.textContent=`Database returned: environment=${actual.environment??"?"} · marker=${actual.identity_marker??"?"}`;
      return false;
    }
    verifiedProdDatabaseIdentity=true;
    renderVerifiedProdDatabaseIdentity();
    details.textContent=`Database returned: ${actual.environment} · ${actual.identity_marker}`;
    return true;
  }catch(e){
    verifiedProdDatabaseIdentity=false;
    status.textContent="NOT VERIFIED — IDENTITY CHECK FAILED";
    status.style.color="#ff6d6d";
    details.textContent=e?.message||String(e);
    console.error("PROD database identity verification failed:",e);
    return false;
  }
}
