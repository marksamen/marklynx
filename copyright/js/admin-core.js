import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs, query, orderBy, updateDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAyaoxwg1-Ru821Y6ohRxwT_DL3bsO8zfQ",
  authDomain: "mark-lynx-admin.firebaseapp.com",
  projectId: "mark-lynx-admin",
  storageBucket: "mark-lynx-admin.firebasestorage.app",
  messagingSenderId: "749999035332",
  appId: "1:749999035332:web:52c78e6e358c1fef794a91"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const login = document.getElementById("login");
const admin = document.getElementById("admin");
const form = document.getElementById("loginForm");
const error = document.getElementById("error");

function loggedOut(){admin.style.display="none";login.style.display="block";}
function loggedIn(){login.style.display="none";admin.style.display="block";form.reset();error.textContent="";loadTrafficAnalytics();loadGamesTest();loadDataSourceStatus();}

async function loadDataSourceStatus(){
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
    const user=auth.currentUser;
    if(!user)throw new Error("Admin authentication is required.");
    const firebaseToken=await user.getIdToken();
    const response=await fetch(`${SUPABASE_PROD_URL}/functions/v1/games-admin`,{
      method:"POST",
      headers:{"Authorization":`Bearer ${firebaseToken}`,"Content-Type":"application/json"},
      body:JSON.stringify({action:"get-data-source"})
    });
    const result=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(result.error||`Supabase PROD returned HTTP ${response.status}.`);
    const source=String(result?.source||"").toLowerCase();
    if(source!=="supabase"&&source!=="json")throw new Error("Unknown override value");
    override.textContent=source.toUpperCase();
  }catch(e){
    override.textContent="UNAVAILABLE";
    console.error("PROD data source override read failed:",e);
  }
}

async function setTestDataSource(source){
  if(source!=="supabase"&&source!=="json")return;
  const message=document.getElementById("dataSourceControlMessage");
  const buttons=[document.getElementById("dataSourceUseSupabase"),document.getElementById("dataSourceUseJson")];
  buttons.forEach(button=>button.disabled=true);
  message.style.color="#ffd36d";
  message.textContent=`Setting PROD manual override to ${source.toUpperCase()}…`;
  try{
    const user=auth.currentUser;
    if(!user)throw new Error("Admin authentication is required.");
    const firebaseToken=await user.getIdToken();
    const response=await fetch(`${SUPABASE_PROD_URL}/functions/v1/games-admin`,{
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

document.getElementById("dataSourceUseSupabase").addEventListener("click",()=>setTestDataSource("supabase"));
document.getElementById("dataSourceUseJson").addEventListener("click",()=>setTestDataSource("json"));

function drawTrafficValue(elementId,data){
  const el=document.getElementById(elementId);
  el.textContent=`${data?.activeUsers ?? 0} active users · ${data?.pageViews ?? 0} page views`;
}
async function loadTrafficAnalytics(){
  const trafficError=document.getElementById("trafficError");
  const trafficUpdated=document.getElementById("trafficUpdated");
  trafficError.textContent="";
  try{
    const snap=await getDoc(doc(db,"trafficAnalytics","current"));
    if(!snap.exists()) throw new Error("Traffic analytics snapshot not found.");
    const data=snap.data();
    drawTrafficValue("trafficToday",data.today);
    drawTrafficValue("traffic7",data.last7Days);
    drawTrafficValue("traffic30",data.last30Days);
    drawTrafficValue("trafficAll",data.allTime);
    const updated=data.updatedAt?.toDate?.();
    trafficUpdated.textContent=updated?`Last updated: ${updated.toLocaleString()}`:"";
  }catch(e){
    trafficError.textContent="Traffic analytics unavailable.";
    console.error(e);
  }
}


async function loadGamesTest(){
  const status=document.getElementById("gameDevStatus");
  const details=document.getElementById("gameDevDetails");
  const gameError=document.getElementById("gameDevError");
  status.textContent="Reading games from Supabase PROD…";
  details.textContent="";
  gameError.textContent="";

  try{
    const endpoint="https://igmunmyxaskizltdvvti.supabase.co/rest/v1/games?select=*&order=id.asc&limit=1000";
    const publishableKey="sb_publishable_FwiOj7IyowVx1pvzwXx-Rw_QN_QFRdE";
    const response=await fetch(endpoint,{
      headers:{"apikey":publishableKey},
      cache:"no-store"
    });
    if(!response.ok) throw new Error(`Supabase PROD returned HTTP ${response.status}.`);
    const rows=await response.json();
    if(!Array.isArray(rows)) throw new Error("Supabase PROD returned an invalid games payload.");

    const games=rows.map(row=>({
      ...row,
      id:String(Number(row.id)).padStart(4,"0"),
      order:Number(row.id),
      testContent:row.testContent===true || row.testContent==="true",
      adult:row.adult===true || row.adult==="true",
      kinect:row.kinect===true || row.kinect==="true"
    }));
    const first=games[0];
    const last=games[games.length-1];
    const passed=
      games.length>=320 &&
      first?.id==="0001" &&
      first?.n==="7 Days Of Rose" &&
      games.some(g=>g.id==="0320" && g.n==="Hole In Many");

    status.textContent=passed
      ?"PASS — Supabase PROD returned the expected GAMEDEV dataset."
      :"CHECK REQUIRED — Supabase PROD responded, but the dataset did not match the expected baseline.";

    details.textContent=
      `Total records: ${games.length}\n`+
      `First: ${first?.id ?? "?"} — ${first?.n ?? "?"}\n`+
      `Last: ${last?.id ?? "?"} — ${last?.n ?? "?"}\n`+
      `Source: Supabase PROD`;

    status.style.color=passed?"#6dff8b":"#ffd36d";
    window.GAMEDEV_RAW=games;
    populateGameDev(games);
  }catch(e){
    status.textContent="FAILED — could not read Supabase PROD games.";
    status.style.color="#ff6d6d";
    gameError.textContent=e?.message || String(e);
    console.error("GAMEDEV Supabase PROD read failed:",e);
  }
}

function populateGameDev(games){
  const tools=document.getElementById("gameDevTools");
  tools.style.display="block";
  filterGameDevList();
}
function filterGameDevList(){
  const games=window.GAMEDEV_RAW||[];
  const list=document.getElementById("gameDevList");
  const search=document.getElementById("gameDevSearch");
  const previous=list.value;
  const q=(search.value||"").trim().toLowerCase();
  const filtered=!q?games:games.filter(g=>[
    g.id,g.n,g.pl,g.v
  ].some(v=>String(v??"").toLowerCase().includes(q)));
  list.innerHTML="";
  for(const g of filtered){
    const o=document.createElement("option");
    o.value=g.id;
    o.textContent=`${String(g.order ?? "?").padStart(4,"0")} — ${g.n || "(unnamed)"}${g.testContent===true?" [TEST]":""}`;
    list.appendChild(o);
  }
  if(previous && filtered.some(g=>g.id===previous)) list.value=previous;
  if(filtered.length){
    drawSelectedGame();
  }else{
    document.getElementById("gameDevWriteStatus").style.color="#ffd36d";
    document.getElementById("gameDevWriteStatus").textContent="No matching games.";
  }
}
function selectedGame(){
  const id=document.getElementById("gameDevList").value;
  return (window.GAMEDEV_RAW||[]).find(g=>g.id===id);
}
const GD_GENRES=["Action","Adventure","Beat 'em up","Dancing","First Person Shooter","Management","Open World","Party","Platformer","Point & Click","Puzzle","Racing","Roguelite","Shoot 'em up","Shooter","Simulation","Sports","Strategy","3rd Person Shooter","Visual Novel"];
const GD_PLATFORMS=["XBOX 360","XBOX ONE","XBOX Series S/X","Windows","Nintendo Switch","Nintendo Switch 2"];
function splitMulti(v){return String(v||"").split("|").map(x=>x.trim()).filter(Boolean);}
function updateChoiceSummary(id){const checked=[...document.querySelectorAll(`#${id} input[type=checkbox]:checked`)].map(cb=>cb.value);const summary=document.getElementById(id==="gdTypeChoices"?"gdTypeSummary":"gdPlatformSummary");if(!summary)return;const noun=id==="gdTypeChoices"?"genres":"platforms";summary.textContent=checked.length?`${checked.length} selected`:`Select ${noun}…`;}
function buildChoices(id,values){const box=document.getElementById(id);box.innerHTML=values.map(v=>`<label><input type="checkbox" value="${v.replace(/&/g,"&amp;").replace(/"/g,"&quot;")}"> ${v}</label>`).join("");box.addEventListener("change",()=>updateChoiceSummary(id));updateChoiceSummary(id);}
function setChoices(id,value){const wanted=new Set(splitMulti(value));document.querySelectorAll(`#${id} input[type=checkbox]`).forEach(cb=>cb.checked=wanted.has(cb.value));updateChoiceSummary(id);}
function getChoices(id){return [...document.querySelectorAll(`#${id} input[type=checkbox]:checked`)].map(cb=>cb.value).join(" | ");}
function normalizeGamerscore(raw){const v=String(raw||"").trim();if(!v)return "";const digits=v.replace(/\s+Update$/i,"").replace(/,/g,"").replace(/G$/i,"").trim();if(!/^\d+$/.test(digits))return null;return Number(digits).toLocaleString("en-US")+"G";}
function gamerscoreValue(){const base=normalizeGamerscore(document.getElementById("gdGamerscore").value);if(!base)return base;return base+(document.getElementById("gdGamerscoreUpdate").checked?" Update":"");}
function validateGamerscore(format=false){const el=document.getElementById("gdGamerscore"),err=document.getElementById("gdGamerscoreError");const n=normalizeGamerscore(el.value);if(n===null){err.textContent="Enter numbers only, e.g. 2000. Or leave blank.";return false;}err.textContent="";if(format&&n)el.value=n;return true;}
function setCompletionTime(value){const m=String(value||"").trim().match(/^(.+?)\s+(Minutes|Hours)$/i);document.getElementById("gdTime").value=m?m[1]:String(value||"").trim();document.getElementById("gdTimeUnit").value=m&&/^hours$/i.test(m[2])?"Hours":"Minutes";}
function completionTimeValue(){const amount=document.getElementById("gdTime").value.trim();return amount?`${amount} ${document.getElementById("gdTimeUnit").value}`:"";}
function validateCompletionTime(addMode=false){const el=document.getElementById("gdTime"),v=el.value.trim(),unit=document.getElementById("gdTimeUnit").value,err=document.getElementById("gdTimeError");if(!v){err.textContent="";return true;}if(addMode&&!/^\d+(?:\.\d+)?$/.test(v)){err.textContent="Enter a number only, then choose Minutes or Hours.";return false;}if(addMode){const n=Number(v);if(!Number.isFinite(n)||n<=0){err.textContent="Completion time must be greater than 0.";return false;}if(unit==="Minutes"&&(!Number.isInteger(n)||n<1||n>59)){err.textContent="Minutes must be a whole number from 1 to 59. Use Hours for 60 minutes or more.";return false;}}err.textContent="";return true;}
function setQualityValue(value){const sel=document.getElementById("gdQuality"),other=document.getElementById("gdQualityOther"),v=String(value||"").trim();if(!v||v==="4K"||v==="1080p"){sel.value=v;other.value="";other.style.display="none";}else{sel.value="__other__";other.value=v;other.style.display="block";}}
function qualityValue(){const sel=document.getElementById("gdQuality");return sel.value==="__other__"?document.getElementById("gdQualityOther").value.trim():sel.value;}
function setTextGuideValue(value){const sel=document.getElementById("gdTextGuide"),v=String(value||"No");let opt=[...sel.options].find(o=>o.value===v);if(!opt&&v){opt=new Option(v,v);opt.dataset.legacy="1";sel.add(opt);}sel.value=v||"No";}
function parseYoutubeLink(raw){
  const value=String(raw||"").trim().replace(/\s+/g,""); if(!value)return null;
  let url; try{url=new URL(value);}catch(e){return null;}
  const host=url.hostname.toLowerCase().replace(/^www\./,"");
  if(!["youtube.com","m.youtube.com","youtu.be"].includes(host))return null;
  const list=url.searchParams.get("list");
  if(list && /^[A-Za-z0-9_-]{10,100}$/.test(list)) return {type:"playlist",id:list,url:`https://www.youtube.com/playlist?list=${list}`};
  let id="";
  if(host==="youtu.be") id=url.pathname.split("/").filter(Boolean)[0]||"";
  else if(url.pathname==="/watch") id=url.searchParams.get("v")||"";
  else {const parts=url.pathname.split("/").filter(Boolean);if(["shorts","embed","live"].includes(parts[0]))id=parts[1]||"";}
  if(/^[A-Za-z0-9_-]{11}$/.test(id)) return {type:"video",id,url:`https://www.youtube.com/watch?v=${id}`};
  return null;
}
function validateYoutubeLink(addMode=false){
  const el=document.getElementById("gdYoutubeLink"),err=document.getElementById("gdYoutubeLinkError"); if(!el)return true;
  err.textContent=""; if(!addMode)return true;
  if(!el.value.trim()){err.textContent="YouTube Link is required.";return false;}
  if(!parseYoutubeLink(el.value)){err.textContent="Paste a valid YouTube video or playlist link.";return false;}
  return true;
}
function addFormIsValid(){return !!document.getElementById("gdName").value.trim()&&validateGamerscore(false)&&validateCompletionTime(true)&&validateYoutubeLink(true);}
function updateCreateButtonState(){const add=document.getElementById("gameDevAdd");if(!add||add.dataset.mode!=="confirm")return;add.disabled=!addFormIsValid();}
document.getElementById("gdGamerscore").addEventListener("blur",()=>{validateGamerscore(true);updateCreateButtonState();});
document.getElementById("gdGamerscore").addEventListener("input",()=>document.getElementById("gdGamerscoreError").textContent="");
document.getElementById("gdTime").addEventListener("input",()=>document.getElementById("gdTimeError").textContent="");
document.getElementById("gdTime").addEventListener("input",()=>validateCompletionTime(true));
document.getElementById("gdTimeUnit").addEventListener("change",()=>validateCompletionTime(true));
document.getElementById("gdQuality").addEventListener("change",()=>{document.getElementById("gdQualityOther").style.display=document.getElementById("gdQuality").value==="__other__"?"block":"none";if(document.getElementById("gdQuality").value==="__other__")document.getElementById("gdQualityOther").focus();});
buildChoices("gdTypeChoices",GD_GENRES);buildChoices("gdPlatformChoices",GD_PLATFORMS);

document.addEventListener("click",e=>{
  document.querySelectorAll("details.multi-select[open]").forEach(d=>{
    if(!d.contains(e.target)) d.removeAttribute("open");
  });
});
["gdName","gdGamerscore","gdTime","gdYoutubeLink"].forEach(id=>{
  document.getElementById(id).addEventListener("input",()=>updateCreateButtonState());
});
document.getElementById("gdTimeUnit").addEventListener("change",()=>updateCreateButtonState());

function drawSelectedGame(){
  const g=selectedGame(); if(!g)return;
  document.getElementById("gdId").value=g.id||"";
  document.getElementById("gdOrder").value=g.order??"";
  document.getElementById("gdName").value=g.n??"";
  document.getElementById("gdDifficulty").value=g.df??"";
  setChoices("gdTypeChoices",g.ty??"");
  document.getElementById("gdGamerscoreUpdate").checked=/\s+Update$/i.test(String(g.g||""));
  document.getElementById("gdGamerscore").value=normalizeGamerscore(g.g??"")??"";
  setCompletionTime(g.t??"");
  setQualityValue(g.q??"");
  setTextGuideValue(g.tx??"No");
  document.getElementById("gdAdult").value=g.adult===true?"true":"false";
  document.getElementById("gdKinect").value=g.kinect===true?"true":"false";
  setChoices("gdPlatformChoices",g.p??"");
  document.getElementById("gdTest").value=g.testContent===true?"true":"false";
  const mediaUrl=g.pl ? `https://www.youtube.com/playlist?list=${g.pl}` : (g.v ? `https://www.youtube.com/watch?v=${g.v}` : (g.u||""));
  document.getElementById("gdYoutubeLink").value=mediaUrl;
  document.getElementById("gdYoutubeLinkError").textContent="";
  document.getElementById("gdRaw").value=JSON.stringify(g);
  document.getElementById("gameDevWriteStatus").textContent="";
}

function nextGameDevIdentity(){
  const games=window.GAMEDEV_RAW||[];
  const maxOrder=games.reduce((m,g)=>Number.isInteger(Number(g.order))?Math.max(m,Number(g.order)):m,0);
  const maxId=games.reduce((m,g)=>/^\d+$/.test(g.id||"")?Math.max(m,Number(g.id)):m,0);
  return {id:String(maxId+1).padStart(4,"0"),order:maxOrder+1};
}
const gameDevFormHome=document.createComment("gameDevForm home");
const gameDevActionsHome=document.createComment("gameDevActions home");
document.getElementById("gameDevForm").before(gameDevFormHome);
document.getElementById("gameDevActions").before(gameDevActionsHome);
function openEditModal(){
  const g=selectedGame(); if(!g)return;
  drawSelectedGame();
  document.getElementById("gameDevEditTitle").textContent=`Edit ${g.id} — ${g.n||"(unnamed)"}`;
  document.getElementById("gameDevEditMount").append(document.getElementById("gameDevForm"),document.getElementById("gameDevActions"));
  document.getElementById("gameDevAdd").style.display="none";
  document.getElementById("gameDevCancel").style.display="none";
  document.getElementById("gameDevSave").style.display="block";
  document.getElementById("gameDevDelete").style.display="block";
  document.getElementById("gameDevReload").style.display="none";
  document.getElementById("gameDevEditModal").classList.add("open");
  document.getElementById("gameDevEditModal").setAttribute("aria-hidden","false");
  document.body.style.overflow="hidden";
}
function closeEditModal(){
  gameDevFormHome.after(document.getElementById("gameDevForm"));
  gameDevActionsHome.after(document.getElementById("gameDevActions"));
  document.getElementById("gameDevEditModal").classList.remove("open");
  document.getElementById("gameDevEditModal").setAttribute("aria-hidden","true");
  document.body.style.overflow="";
  document.querySelectorAll(".multi-select").forEach(d=>d.open=false);
}
let pendingDeleteGame=null;
function openDeleteConfirm(){
  const g=selectedGame(); if(!g)return;
  pendingDeleteGame={id:g.id,n:g.n||"(unnamed)"};
  document.getElementById("gameDevDeleteTarget").textContent=`${pendingDeleteGame.id} — ${pendingDeleteGame.n}`;
  document.getElementById("gameDevDeleteModal").classList.add("open");
  document.getElementById("gameDevDeleteModal").setAttribute("aria-hidden","false");
}
function closeDeleteConfirm(){
  pendingDeleteGame=null;
  document.getElementById("gameDevDeleteModal").classList.remove("open");
  document.getElementById("gameDevDeleteModal").setAttribute("aria-hidden","true");
}
function openAddModal(){
  const mount=document.getElementById("gameDevAddMount");
  mount.append(document.getElementById("gameDevForm"),document.getElementById("gameDevActions"));
  document.getElementById("gameDevAddModal").classList.add("open");
  document.getElementById("gameDevAddModal").setAttribute("aria-hidden","false");
  document.body.style.overflow="hidden";
}
function closeAddModal(){
  gameDevFormHome.after(document.getElementById("gameDevForm"));
  gameDevActionsHome.after(document.getElementById("gameDevActions"));
  document.getElementById("gameDevAddModal").classList.remove("open");
  document.getElementById("gameDevAddModal").setAttribute("aria-hidden","true");
  document.body.style.overflow="";
  document.querySelectorAll(".multi-select").forEach(d=>d.open=false);
}
function beginAddGame(){
  const next=nextGameDevIdentity();
  openAddModal();
  document.getElementById("gdId").value=next.id;
  document.getElementById("gdOrder").value=next.order;
  document.getElementById("gdName").value="";
  document.getElementById("gdDifficulty").value="";
  setChoices("gdTypeChoices","");
  document.getElementById("gdGamerscore").value="";
  document.getElementById("gdGamerscoreUpdate").checked=false;
  document.getElementById("gdGamerscoreError").textContent="";
  document.getElementById("gdTime").value="";
  document.getElementById("gdTimeUnit").value="Minutes";
  document.getElementById("gdTimeError").textContent="";
  setQualityValue("");
  setTextGuideValue("No");
  document.getElementById("gdAdult").value="false";
  document.getElementById("gdKinect").value="false";
  document.getElementById("gdYoutubeLink").value="";
  document.getElementById("gdYoutubeLinkError").textContent="";
  setChoices("gdPlatformChoices","");
  document.getElementById("gdTest").value="false";
  document.getElementById("gdRaw").value="NEW games record";
  document.getElementById("gameDevSave").style.display="none";
  document.getElementById("gameDevDelete").style.display="none";
  document.getElementById("gameDevReload").style.display="none";
  const status=document.getElementById("gameDevWriteStatus");
  status.style.color="#ffd36d";
  status.textContent=`NEW RECORD — ${next.id}. Test Content defaults to true. Nothing is written until Create New Game is clicked.`;
  document.getElementById("gameDevAdd").dataset.mode="confirm";
  document.getElementById("gameDevAdd").textContent="Create New Game";
  document.getElementById("gameDevCancel").style.display="block";  updateCreateButtonState();
}
function cancelAddMode(){
  closeAddModal();
  const add=document.getElementById("gameDevAdd"); add.disabled=false;
  add.dataset.mode="";
  add.textContent="Add New Game";
  document.getElementById("gameDevSave").style.display="block";
  document.getElementById("gameDevDelete").style.display="block";
  document.getElementById("gameDevReload").style.display="block";
  document.getElementById("gameDevCancel").style.display="none";
}
async function createGameDev(){
  const writeStatus=document.getElementById("gameDevWriteStatus");
  const id=document.getElementById("gdId").value.trim();
  const order=Number(document.getElementById("gdOrder").value);
  const name=document.getElementById("gdName").value.trim();
  if(!/^\d{4}$/.test(id)){writeStatus.style.color="#ff6d6d";writeStatus.textContent="New ID must be four digits.";return;}
  if(!Number.isInteger(order)){writeStatus.style.color="#ff6d6d";writeStatus.textContent="Order must be an integer.";return;}
  if(!name){writeStatus.style.color="#ff6d6d";writeStatus.textContent="Name is required.";return;}
  if((window.GAMEDEV_RAW||[]).some(g=>g.id===id)){writeStatus.style.color="#ff6d6d";writeStatus.textContent=`CREATE BLOCKED — ${id} already exists.`;return;}
  if((window.GAMEDEV_RAW||[]).some(g=>Number(g.order)===order)){writeStatus.style.color="#ff6d6d";writeStatus.textContent=`CREATE BLOCKED — order ${order} already exists.`;return;}
  if(!validateGamerscore(true)||!validateCompletionTime(true)||!validateYoutubeLink(true)){writeStatus.style.color="#ff6d6d";writeStatus.textContent="CREATE BLOCKED — fix the highlighted field(s).";updateCreateButtonState();return;}
  const record={
    order, n:name,
    p:getChoices("gdPlatformChoices"),
    ty:getChoices("gdTypeChoices"),
    tx:document.getElementById("gdTextGuide").value,
    df:document.getElementById("gdDifficulty").value.trim(),
    testContent:document.getElementById("gdTest").value==="true"
  };
  const gs=gamerscoreValue(); if(gs) record.g=gs;
  const ct=completionTimeValue(); if(ct) record.t=ct;
  const qv=qualityValue(); if(qv) record.q=qv;
  const media=parseYoutubeLink(document.getElementById("gdYoutubeLink").value);
  if(!media){writeStatus.style.color="#ff6d6d";writeStatus.textContent="CREATE BLOCKED — paste a valid YouTube video or playlist link.";updateCreateButtonState();return;}
  if(media.type==="playlist")record.pl=media.id;else record.v=media.id;
  record.u=media.url;
  if(document.getElementById("gdAdult").value==="true") record.adult=true;
  if(document.getElementById("gdKinect").value==="true") record.kinect=true;
  writeStatus.style.color="#ffd36d";writeStatus.textContent=`Creating ${id} in Supabase PROD…`;
  try{
    const user=auth.currentUser;
    if(!user) throw new Error("Admin authentication is required.");
    const firebaseToken=await user.getIdToken();
    const supabaseRecord={
      id:Number(id),
      n:record.n ?? null,
      p:record.p || null,
      g:record.g || null,
      t:record.t || null,
      ty:record.ty || null,
      tx:record.tx || null,
      q:record.q || null,
      df:record.df || null,
      u:record.u || null,
      v:record.v || null,
      pl:record.pl || null,
      kinect:record.kinect===true ? "true" : null,
      adult:record.adult===true ? "true" : null,
      testContent:record.testContent===true ? "true" : "false"
    };
    const response=await fetch("https://igmunmyxaskizltdvvti.supabase.co/functions/v1/games-admin",{
      method:"POST",
      headers:{
        "Authorization":`Bearer ${firebaseToken}`,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({action:"add",game:supabaseRecord})
    });
    const result=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(result.error || `Supabase PROD returned HTTP ${response.status}.`);
    cancelAddMode();
    await loadGamesTest();
    const refreshedList=document.getElementById("gameDevList");
    if([...refreshedList.options].some(option=>option.value===id)){
      refreshedList.value=id;
      drawSelectedGame();
    }
    writeStatus.style.color="#6dff8b";
    writeStatus.textContent=`✓ CREATED — ${id} ${name} added to Supabase PROD. List refreshed automatically.`;
    alert(`✓ ${id} — ${name} was added to Supabase PROD successfully.`);
  }catch(e){
    writeStatus.style.color="#ff6d6d";writeStatus.textContent="CREATE FAILED — Supabase PROD was not changed.";console.error(e);
  }
}

document.getElementById("gameDevAddLauncher").addEventListener("click",beginAddGame);
document.getElementById("gameDevEditLauncher").addEventListener("click",openEditModal);
document.getElementById("gameDevReloadLauncher").addEventListener("click",()=>loadGamesTest());
document.getElementById("gameDevEditClose").addEventListener("click",closeEditModal);
document.getElementById("gameDevAdd").addEventListener("click",()=>{
  const add=document.getElementById("gameDevAdd");
  if(add.dataset.mode==="confirm") createGameDev(); else beginAddGame();
});
document.getElementById("gameDevCancel").addEventListener("click",()=>{cancelAddMode();drawSelectedGame();document.getElementById("gameDevWriteStatus").textContent="";});
document.getElementById("gameDevAddClose").addEventListener("click",()=>{cancelAddMode();drawSelectedGame();document.getElementById("gameDevWriteStatus").textContent="";});
document.addEventListener("keydown",e=>{
  if(e.key!=="Escape")return;
  if(document.getElementById("gameDevDeleteModal").classList.contains("open")){closeDeleteConfirm();return;}
  if(document.getElementById("gameDevEditModal").classList.contains("open")){closeEditModal();return;}
  if(document.getElementById("gameDevAddModal").classList.contains("open")){cancelAddMode();document.getElementById("gameDevWriteStatus").textContent="";}
});
document.getElementById("gameDevSearch").addEventListener("input",filterGameDevList);
document.getElementById("gameDevList").addEventListener("change",()=>{document.getElementById("gameDevWriteStatus").textContent="";});
document.getElementById("gameDevReload").addEventListener("click",()=>{cancelAddMode();loadGamesTest();});
document.getElementById("gameDevDelete").addEventListener("click",openDeleteConfirm);
document.getElementById("gameDevDeleteConfirm").addEventListener("click",async()=>{
  if(!pendingDeleteGame)return;
  const target={...pendingDeleteGame};
  const writeStatus=document.getElementById("gameDevWriteStatus");
  document.getElementById("gameDevDeleteConfirm").disabled=true;
  writeStatus.style.color="#ffd36d";
  writeStatus.textContent=`Deleting ${target.id} from Supabase PROD…`;
  try{
    const user=auth.currentUser;
    if(!user) throw new Error("Admin authentication is required.");
    const firebaseToken=await user.getIdToken();
    const response=await fetch("https://igmunmyxaskizltdvvti.supabase.co/functions/v1/games-admin",{
      method:"POST",
      headers:{
        "Authorization":`Bearer ${firebaseToken}`,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({action:"delete",id:Number(target.id)})
    });
    const result=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(result.error || `Supabase PROD returned HTTP ${response.status}.`);
    closeDeleteConfirm();
    closeEditModal();
    await loadGamesTest();
    writeStatus.style.color="#6dff8b";
    writeStatus.textContent=`DELETED — ${target.id} — ${target.n} removed from Supabase PROD. List refreshed automatically.`;
    alert(`✓ ${target.id} — ${target.n} was deleted from Supabase PROD successfully.`);
  }catch(e){
    writeStatus.style.color="#ff6d6d";
    writeStatus.textContent=`DELETE FAILED — Supabase PROD was not changed. ${e?.message||e}`;
    console.error(e);
  }finally{
    document.getElementById("gameDevDeleteConfirm").disabled=false;
  }
});
document.getElementById("gameDevDeleteCancel").addEventListener("click",closeDeleteConfirm);
document.getElementById("gameDevDeleteClose").addEventListener("click",closeDeleteConfirm);

document.getElementById("gameDevSave").addEventListener("click",async()=>{
  const g=selectedGame(); if(!g)return;
  const writeStatus=document.getElementById("gameDevWriteStatus");
  if(!validateGamerscore(true)||!validateCompletionTime(true)){writeStatus.style.color="#ff6d6d";writeStatus.textContent="SAVE BLOCKED — fix the highlighted field(s).";return;}
  const patch={
    id:Number(g.id),
    n:document.getElementById("gdName").value.trim(),
    p:getChoices("gdPlatformChoices") || null,
    g:gamerscoreValue() || null,
    t:completionTimeValue() || null,
    ty:getChoices("gdTypeChoices") || null,
    tx:document.getElementById("gdTextGuide").value || null,
    q:qualityValue() || null,
    df:document.getElementById("gdDifficulty").value.trim() || null,
    adult:document.getElementById("gdAdult").value==="true",
    kinect:document.getElementById("gdKinect").value==="true",
    testContent:document.getElementById("gdTest").value==="true" ? "true" : "false"
  };
  const media=parseYoutubeLink(document.getElementById("gdYoutubeLink").value);
  if(!media){
    document.getElementById("gdYoutubeLinkError").textContent="Paste a valid YouTube video or playlist link.";
    writeStatus.style.color="#ff6d6d";
    writeStatus.textContent="SAVE BLOCKED — paste a valid YouTube video or playlist link.";
    return;
  }
  patch.u=media.url;
  patch.v=media.type==="video" ? media.id : null;
  patch.pl=media.type==="playlist" ? media.id : null;
  writeStatus.style.color="#ffd36d";writeStatus.textContent=`Saving ${g.id} to Supabase PROD…`;
  try{
    const user=auth.currentUser;
    if(!user) throw new Error("Admin authentication is required.");
    const firebaseToken=await user.getIdToken();
    const response=await fetch(`${SUPABASE_PROD_URL}/functions/v1/games-admin`,{
      method:"POST",
      headers:{"Authorization":`Bearer ${firebaseToken}`,"Content-Type":"application/json"},
      body:JSON.stringify({action:"update",game:patch})
    });
    const result=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(result.error || `Supabase PROD returned HTTP ${response.status}.`);
    closeEditModal();
    await loadGamesTest();
    document.getElementById("gameDevList").value=g.id;
    drawSelectedGame();
    writeStatus.style.color="#6dff8b";
    writeStatus.textContent=`SAVED — ${g.id} updated in Supabase PROD. List refreshed automatically.`;
    alert(`✓ ${g.id} — ${patch.n} was updated in Supabase PROD successfully.`);
  }catch(e){
    writeStatus.style.color="#ff6d6d";writeStatus.textContent=`SAVE FAILED — Supabase PROD was not changed. ${e?.message||e}`;console.error(e);
  }
});


// Supabase PROD recovery export — public SELECT only. No database writes.
const SUPABASE_PROD_URL="https://igmunmyxaskizltdvvti.supabase.co";
const SUPABASE_PROD_PUBLISHABLE_KEY="sb_publishable_FwiOj7IyowVx1pvzwXx-Rw_QN_QFRdE";
const GAME_EXPORT_FIELDS=["n","p","g","t","ty","tx","q","df","u","v","pl","kinect","adult","testContent"];

async function fetchAllSupabaseTestGames(){
  const pageSize=1000;
  const all=[];
  for(let from=0;;from+=pageSize){
    const to=from+pageSize-1;
    const response=await fetch(`${SUPABASE_PROD_URL}/rest/v1/games?select=*&order=id.asc`,{
      headers:{
        apikey:SUPABASE_PROD_PUBLISHABLE_KEY,
        Range:`${from}-${to}`
      }
    });
    if(!response.ok)throw new Error(`Supabase PROD read failed (${response.status}).`);
    const page=await response.json();
    all.push(...page);
    if(page.length<pageSize)break;
  }
  return all;
}

function cleanGameForJson(game){
  const clean={};
  for(const field of GAME_EXPORT_FIELDS)clean[field]=game[field]??null;
  return clean;
}

document.getElementById("gameDevExportSupabase").addEventListener("click",async()=>{
  const button=document.getElementById("gameDevExportSupabase");
  const writeStatus=document.getElementById("gameDevWriteStatus");
  button.disabled=true;
  writeStatus.style.color="#ffd36d";
  writeStatus.textContent="Reading Supabase PROD and generating games.json…";
  try{
    const games=await fetchAllSupabaseTestGames();
    if(!games.length)throw new Error("Supabase PROD returned zero games.");
    const cleanGames=games.map(cleanGameForJson);
    const blob=new Blob([JSON.stringify(cleanGames,null,2)+"\n"],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download="games.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    writeStatus.style.color="#6dff8b";
    writeStatus.textContent=`GENERATED — games.json downloaded from Supabase PROD (${cleanGames.length} games).`;
  }catch(e){
    writeStatus.style.color="#ff6d6d";
    writeStatus.textContent="EXPORT FAILED — no file was generated.";
    console.error("Supabase PROD games.json export failed:",e);
  }finally{
    button.disabled=false;
  }
});

await setPersistence(auth,browserLocalPersistence);
onAuthStateChanged(auth,user=>user?loggedIn():loggedOut());

form.addEventListener("submit",async e=>{
  e.preventDefault(); error.textContent="";
  try{
    await signInWithEmailAndPassword(auth,
      document.getElementById("email").value.trim(),
      document.getElementById("password").value);
  }catch(e){error.textContent="Invalid email or password.";}
});

document.getElementById("logout").addEventListener("click",()=>signOut(auth));

const TEST_KEY="marklynxTestContent";
const testStatus=document.getElementById("testStatus");
const testToggle=document.getElementById("testToggle");
function testHidden(){return (localStorage.getItem(TEST_KEY)||"Y").toUpperCase()==="Y";}
function drawTestControl(){
  const hidden=testHidden();
  testStatus.textContent="TEST CONTENT: "+(hidden?"OFF":"ON");
  testStatus.className=hidden?"off":"on";
  testToggle.textContent=hidden?"TURN TEST CONTENT ON":"TURN TEST CONTENT OFF";
  testToggle.className=hidden?"enable":"disable";
}
testToggle.addEventListener("click",()=>{
  localStorage.setItem(TEST_KEY,testHidden()?"N":"Y");
  drawTestControl();
});
drawTestControl();


// Admin submissions/suggestions modal
const adminPageModal=document.getElementById("adminPageModal");
const adminPageModalFrame=document.getElementById("adminPageModalFrame");
const adminPageModalTitle=document.getElementById("adminPageModalTitle");
const adminPageModalClose=document.getElementById("adminPageModalClose");
function openAdminPageModal(url,title){
  adminPageModalTitle.textContent=title;
  adminPageModalFrame.src=url;
  adminPageModal.classList.add("open");
  adminPageModal.setAttribute("aria-hidden","false");
  document.body.classList.add("admin-modal-open");
  adminPageModalClose.focus();
}
function closeAdminPageModal(){
  adminPageModal.classList.remove("open");
  adminPageModal.setAttribute("aria-hidden","true");
  document.body.classList.remove("admin-modal-open");
  adminPageModalFrame.src="about:blank";
}
document.querySelectorAll("[data-admin-modal-url]").forEach(button=>button.addEventListener("click",()=>openAdminPageModal(button.dataset.adminModalUrl,button.dataset.adminModalTitle)));
adminPageModalClose.addEventListener("click",closeAdminPageModal);
adminPageModal.addEventListener("click",event=>{if(event.target===adminPageModal)closeAdminPageModal();});
document.addEventListener("keydown",event=>{if(event.key==="Escape"&&adminPageModal.classList.contains("open"))closeAdminPageModal();});
