let authRef=null;
let supabaseTestUrl=null;

export function initTestContentControl({auth,SUPABASE_TEST_URL}){
  authRef=auth;
  supabaseTestUrl=SUPABASE_TEST_URL;
  document.getElementById("testToggle").addEventListener("click",toggleTestContent);
}

function drawTestControl(hidden){
  const testStatus=document.getElementById("testStatus");
  const testToggle=document.getElementById("testToggle");
  testStatus.textContent="TEST CONTENT: "+(hidden?"OFF":"ON");
  testStatus.className=hidden?"off":"on";
  testToggle.textContent=hidden?"TURN TEST CONTENT ON":"TURN TEST CONTENT OFF";
  testToggle.className=hidden?"enable":"disable";
  testToggle.dataset.testContentHidden=hidden?"true":"false";
}

export async function loadTestContentStatus(){
  const testStatus=document.getElementById("testStatus");
  const testToggle=document.getElementById("testToggle");
  testToggle.disabled=true;
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
    const value=String(result?.value||"").toLowerCase();
    if(value!=="on"&&value!=="off")throw new Error("Unknown TEST CONTENT value");
    drawTestControl(value!=="on");
  }catch(e){
    testStatus.textContent="TEST CONTENT: UNAVAILABLE";
    testStatus.className="off";
    testToggle.textContent="TEST CONTENT CONTROL UNAVAILABLE";
    testToggle.className="disable";
    delete testToggle.dataset.testContentHidden;
    console.error("TEST CONTENT status read failed:",e);
  }finally{testToggle.disabled=false;}
}

async function toggleTestContent(){
  const testStatus=document.getElementById("testStatus");
  const testToggle=document.getElementById("testToggle");
  if(testToggle.dataset.testContentHidden!=="true"&&testToggle.dataset.testContentHidden!=="false"){await loadTestContentStatus();return;}
  const hidden=testToggle.dataset.testContentHidden==="true";
  const value=hidden?"on":"off";
  testToggle.disabled=true;
  try{
    const user=authRef.currentUser;
    if(!user)throw new Error("Admin authentication is required.");
    const firebaseToken=await user.getIdToken();
    const response=await fetch(`${supabaseTestUrl}/functions/v1/games-admin`,{
      method:"POST",
      headers:{"Authorization":`Bearer ${firebaseToken}`,"Content-Type":"application/json"},
      body:JSON.stringify({action:"set-test-content",value})
    });
    const result=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(result.error||`Supabase TEST returned HTTP ${response.status}.`);
    drawTestControl(String(result?.value||"").toLowerCase()!=="on");
  }catch(e){
    testStatus.textContent="TEST CONTENT: CHANGE FAILED";
    testStatus.className="off";
    console.error("TEST CONTENT change failed:",e);
  }finally{testToggle.disabled=false;}
}
