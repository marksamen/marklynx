let authRef=null;
let supabaseTestUrl=null;

export function initTestContentControl({auth,SUPABASE_TEST_URL}){
  authRef=auth;
  supabaseTestUrl=SUPABASE_TEST_URL;
  const testToggle=document.getElementById("testToggle");
  testToggle.addEventListener("click",toggleTestContent);
}

function drawTestControl(enabled){
  const testStatus=document.getElementById("testStatus");
  const testToggle=document.getElementById("testToggle");
  testStatus.textContent="TEST CONTENT: "+(enabled?"ON":"OFF");
  testStatus.className=enabled?"on":"off";
  testToggle.textContent=enabled?"TURN TEST CONTENT OFF":"TURN TEST CONTENT ON";
  testToggle.className=enabled?"disable":"enable";
  testToggle.dataset.enabled=enabled?"true":"false";
}

export async function loadTestContentStatus(){
  const testStatus=document.getElementById("testStatus");
  const testToggle=document.getElementById("testToggle");
  try{
    const user=authRef.currentUser;
    if(!user)throw new Error("Admin authentication is required.");
    const firebaseToken=await user.getIdToken();
    const response=await fetch(`${supabaseTestUrl}/functions/v1/games-admin`,{
      method:"POST",
      headers:{"Authorization":`Bearer ${firebaseToken}`,"Content-Type":"application/json"},
      body:JSON.stringify({action:"get-test-content"})
    });
    const result=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(result.error||`Supabase TEST returned HTTP ${response.status}.`);
    drawTestControl(result.enabled===true);
    testToggle.disabled=false;
  }catch(e){
    testStatus.textContent="TEST CONTENT: UNAVAILABLE";
    testStatus.className="off";
    testToggle.disabled=true;
    console.error("TEST content status read failed:",e);
  }
}

async function toggleTestContent(){
  const testToggle=document.getElementById("testToggle");
  const currentlyEnabled=testToggle.dataset.enabled==="true";
  testToggle.disabled=true;
  try{
    const user=authRef.currentUser;
    if(!user)throw new Error("Admin authentication is required.");
    const firebaseToken=await user.getIdToken();
    const response=await fetch(`${supabaseTestUrl}/functions/v1/games-admin`,{
      method:"POST",
      headers:{"Authorization":`Bearer ${firebaseToken}`,"Content-Type":"application/json"},
      body:JSON.stringify({action:"set-test-content",enabled:!currentlyEnabled})
    });
    const result=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(result.error||`Supabase TEST returned HTTP ${response.status}.`);
    drawTestControl(result.enabled===true);
  }catch(e){
    console.error("TEST content change failed:",e);
    await loadTestContentStatus();
  }finally{
    testToggle.disabled=false;
  }
}
