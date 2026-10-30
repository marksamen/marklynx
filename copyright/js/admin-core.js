import { initSeasonalThemeControl } from "./admin-seasonal-theme.js?v=SEASONAL-PROD-REV01";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs, query, orderBy, updateDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { loadTrafficAnalytics } from "./admin-traffic.js";
import { initTestContentControl } from "./admin-test-content.js";
import { initAdminPageModal } from "./admin-page-modal.js?v=MLM-PROD-REV01";
import { initDataSourceControl, loadDataSourceStatus, verifyProdDatabaseIdentity } from "./admin-data-source.js?v=20260924-prod-db-recovery-rev02";
import { initGameManagement, loadGamesProd, loadQualityBadges,loadTextGuideOptions,loadPlatformOptions,loadGenreOptions,loadCompletionTypeOptions } from "./admin-game-management.js?v=RECOMPLETION-PROD-REV04-20261014";
import { initRecentRefresh } from "./admin-recent-refresh.js?v=recent-refresh-prod-rev01";
import { initVideoCountRefresh } from "./admin-video-count-refresh.js?v=REV30-video-count-refresh";
import { initDeveloperPublisherSearch } from "./admin-devpub-search.js?v=devpub-search-prod-rev01";

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
function loggedIn(){refreshSeasonalTheme();login.style.display="none";admin.style.display="block";form.reset();error.textContent="";loadTrafficAnalytics({db,getDoc,doc});loadGamesProd();loadDataSourceStatus();}


// Supabase PROD recovery export — public SELECT only. No database writes.
const SUPABASE_PROD_URL="https://igmunmyxaskizltdvvti.supabase.co";
const SUPABASE_PROD_PUBLISHABLE_KEY="sb_publishable_FwiOj7IyowVx1pvzwXx-Rw_QN_QFRdE";

window.addEventListener("message",event=>{
  if(event.origin!==window.location.origin) return;
  if(event.data?.type!=="text-guides-updated") return;
  loadGamesProd().catch(error=>console.error("Text Guide game-data refresh failed:",error));
});

window.addEventListener("text-guides-modal-closed",()=>{
  loadGamesProd().catch(error=>console.error("Text Guide close game-data refresh failed:",error));
});
window.addEventListener("message",event=>{
  if(event.origin!==window.location.origin) return;
  if(event.data?.type!=="platforms-updated") return;
  loadGamesProd().catch(error=>console.error("Platform game-data refresh failed:",error));
});
window.addEventListener("platforms-modal-closed",()=>{
  loadGamesProd().catch(error=>console.error("Platform close game-data refresh failed:",error));
});
window.addEventListener("message",event=>{
  if(event.origin!==window.location.origin) return;
  if(event.data?.type!=="genres-updated") return;
  loadGamesProd().catch(error=>console.error("Genre game-data refresh failed:",error));
});
window.addEventListener("genres-modal-closed",()=>{
  loadGamesProd().catch(error=>console.error("Genre close game-data refresh failed:",error));
});

initDataSourceControl({auth,SUPABASE_PROD_URL,SUPABASE_PROD_PUBLISHABLE_KEY});
const refreshSeasonalTheme=initSeasonalThemeControl({auth,url:SUPABASE_PROD_URL});
initGameManagement({auth,verifyProdDatabaseIdentity});
initRecentRefresh({auth});
initVideoCountRefresh({auth});
initDeveloperPublisherSearch();

window.addEventListener("message",event=>{
  if(event.origin!==window.location.origin) return;
  if(event.data?.type!=="quality-badges-updated") return;
  loadQualityBadges().catch(error=>console.error("Quality badge refresh failed:",error));
});

window.addEventListener("quality-badges-modal-closed",()=>{
  loadQualityBadges().catch(error=>console.error("Quality badge close refresh failed:",error));
});


window.addEventListener("message",event=>{
  if(event.origin!==window.location.origin||event.data?.type!=="completion-types-updated")return;
  loadCompletionTypeOptions().catch(console.error);
  loadGamesProd().catch(console.error);
});
window.addEventListener("completion-types-modal-closed",()=>{
  loadCompletionTypeOptions().catch(console.error);
  loadGamesProd().catch(console.error);
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

initTestContentControl();


const WN_SUPABASE_PROD_URL = 'https://igmunmyxaskizltdvvti.supabase.co';
// What's New PROD REV04: parent-owned auth status handshake; no credentials sent.
window.addEventListener("message", event => {
  if (event.origin !== window.location.origin || event.data?.type !== "wn-probe-auth-status-request") return;
  const frame = document.getElementById("adminPageModalFrame");
  if (!frame || event.source !== frame.contentWindow || !frame.getAttribute("src")?.startsWith("whats-new-probe/")) return;
  event.source.postMessage({type:"wn-probe-auth-status-response", authenticated: Boolean(auth.currentUser)}, event.origin);
});


// What's New PROD REV06: parent-only authenticated read-only connection.
// No Firebase SDK in iframe; no credentials/tokens posted to iframe.
let wnReadOnlyBusy = false;
window.addEventListener("message", async event => {
  if (event.origin !== window.location.origin || event.data?.type !== "wn-probe-readonly-request") return;
  const frame = document.getElementById("adminPageModalFrame");
  if (!frame || event.source !== frame.contentWindow || !frame.getAttribute("src")?.startsWith("whats-new-probe/")) return;
  if (wnReadOnlyBusy) return;
  wnReadOnlyBusy = true;
  const reply = payload => {
    // Avoid posting a result into a different page if the modal closed while fetching.
    if (frame.contentWindow === event.source && frame.getAttribute("src")?.startsWith("whats-new-probe/")) {
      event.source.postMessage({type:"wn-probe-readonly-response", ...payload}, event.origin);
    }
  };
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Parent Admin is not authenticated");
    const token = await user.getIdToken();
    const response = await fetch(`${WN_SUPABASE_PROD_URL}/functions/v1/whats-new-admin`, {
      method: "POST",
      headers: {"Authorization": `Bearer ${token}`, "Content-Type": "application/json"},
      body: JSON.stringify({action:"list"}),
      cache: "no-store"
    });
    const raw = await response.text();
    let result;
    try { result = JSON.parse(raw); }
    catch { throw new Error(`Edge Function HTTP ${response.status}: invalid JSON response (${raw.slice(0,120)})`); }
    if (!response.ok || result?.ok !== true) throw new Error(`Edge Function HTTP ${response.status}: ${String(result?.error || "Unknown response").slice(0,180)}`);
    // Deployed TEST function returns settings, announcements and translations; it does not return languages.
    if (!result.settings || typeof result.settings !== "object" ||
        !Array.isArray(result.announcements) || !Array.isArray(result.translations)) {
      throw new Error(`Edge Function HTTP ${response.status}: unexpected list response structure`);
    }
    reply({ok:true, httpStatus:response.status, enabled:result.settings.enabled === true,
      announcements: result.announcements.map(a => ({id:a.id, status:a.status, created_at:a.created_at, published_at:a.published_at, updated_at:a.updated_at})),
      translations: result.translations.map(t => ({announcement_id:t.announcement_id, language_code:t.language_code, title:t.title, summary:t.summary, body:t.body}))});
  } catch (error) {
    reply({ok:false, error: error instanceof Error ? error.message : "Unknown connection error"});
  } finally {
    wnReadOnlyBusy = false;
  }
});


// What's New PROD REV08: narrowly scoped authenticated draft management.
// Parent owns Firebase and token. Never send credentials or tokens to the iframe.
let wnWriteBusy = false;
window.addEventListener("message", async event => {
  if (event.origin !== window.location.origin || event.data?.type !== "wn-admin-action-request") return;
  const frame = document.getElementById("adminPageModalFrame");
  if (!frame || event.source !== frame.contentWindow || !frame.getAttribute("src")?.startsWith("whats-new-probe/")) return;
  const requestId = event.data.requestId;
  if (typeof requestId !== "string" || !/^wn08-[0-9]+$/.test(requestId)) return;
  const send = payload => {
    if (frame.contentWindow === event.source && frame.getAttribute("src")?.startsWith("whats-new-probe/")) {
      event.source.postMessage({type:"wn-admin-action-response", requestId, ...payload}, event.origin);
    }
  };
  if (wnWriteBusy) { send({ok:false,error:"Another save is in progress"}); return; }
  const incoming = event.data.payload;
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) return;
  const action = incoming.action;
  if (!["set-enabled", "create", "save-translation", "publish", "unpublish", "delete"].includes(action)) {send({ok:false,error:"Action not permitted in PROD REV12"});return;}
  // Reject malformed input before calling the PROD Edge Function.
  const clean = {action};
  if (action === "set-enabled") {
    if (typeof incoming.enabled !== "boolean") {send({ok:false,error:"Invalid switch value"});return;}
    clean.enabled = incoming.enabled;
  } else if (action === "save-translation") {
    const id = Number(incoming.id);
    const code = incoming.language_code;
    if (!Number.isSafeInteger(id) || id <= 0 || typeof code !== "string" || !/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(code)) {
      send({ok:false,error:"Invalid announcement or language"});return;
    }
    const fields = [["title",160],["summary",500],["body",15000]];
    if (fields.some(([key,max]) => typeof incoming[key] !== "string" || !incoming[key].trim() || incoming[key].trim().length > max)) {
      send({ok:false,error:"Title, summary and body are required within length limits"});return;
    }
    Object.assign(clean,{id,language_code:code,title:incoming.title.trim(),summary:incoming.summary.trim(),body:incoming.body.trim()});
  }
  if (["publish", "unpublish", "delete"].includes(action)) {
    const id = Number(incoming.id);
    if (!Number.isSafeInteger(id) || id <= 0) {send({ok:false,error:"Invalid announcement ID"});return;}
    clean.id = id;
    if (action === "delete") {
      if (incoming.confirm !== true) {send({ok:false,error:"Explicit delete confirmation required"});return;}
      clean.confirm = true;
    }
  }
  wnWriteBusy = true;
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Admin authentication required");
    const token = await user.getIdToken();
    const response = await fetch(`${WN_SUPABASE_PROD_URL}/functions/v1/whats-new-admin`, {
      method:"POST", headers:{"Authorization":`Bearer ${token}`,"Content-Type":"application/json"},
      body:JSON.stringify(clean),cache:"no-store"
    });
    const raw = await response.text();
    let result;
    try {result=JSON.parse(raw);} catch {throw new Error(`HTTP ${response.status}: invalid JSON response`);}
    if (!response.ok || result?.ok !== true) throw new Error(`HTTP ${response.status}: ${String(result?.error || "Request failed").slice(0,220)}`);
    send({ok:true,httpStatus:response.status,action});
  } catch (error) {
    send({ok:false,error:error instanceof Error?error.message:"Unexpected save error"});
  } finally {wnWriteBusy=false;}
});


initAdminPageModal();

// REV06: on iframe load, proactively deliver auth state to the correct same-origin frame.
const mlmFrame = document.getElementById('adminPageModalFrame');
mlmFrame?.addEventListener('load', () => {
  const src = mlmFrame.getAttribute('src') || '';
  if (!src.startsWith('message-from-mark-lynx/')) return;
  const target = mlmFrame.contentWindow;
  if (target) target.postMessage({type:'mlm-auth-status-response',authenticated:Boolean(auth.currentUser)},window.location.origin);
});

// MESSAGE FROM MARK LYNX PROD REV01 — parent-only auth status handshake.
// Never send Firebase credentials or ID tokens to the iframe.
window.addEventListener("message", event => {
  if (event.origin !== window.location.origin || event.data?.type !== "mlm-auth-status-request") return;
  const frame = document.getElementById("adminPageModalFrame");
  if (!frame || event.source !== frame.contentWindow ||
      !frame.getAttribute("src")?.startsWith("message-from-mark-lynx/")) return;
  event.source.postMessage({
    type:"mlm-auth-status-response",
    authenticated:Boolean(auth.currentUser)
  }, event.origin);
});

// MESSAGE FROM MARK LYNX PROD REV01 — separate Firebase-authenticated iframe bridge.
let mlmReadOnlyBusy = false;
window.addEventListener("message", async event => {
  if (event.origin !== window.location.origin || event.data?.type !== "mlm-probe-readonly-request") return;
  const frame = document.getElementById("adminPageModalFrame");
  if (!frame || event.source !== frame.contentWindow || !frame.getAttribute("src")?.startsWith("message-from-mark-lynx/")) return;
  if (mlmReadOnlyBusy) return;
  mlmReadOnlyBusy = true;
  const reply = payload => {
    // Avoid posting a result into a different page if the modal closed while fetching.
    if (frame.contentWindow === event.source && frame.getAttribute("src")?.startsWith("message-from-mark-lynx/")) {
      event.source.postMessage({type:"mlm-probe-readonly-response", ...payload}, event.origin);
    }
  };
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Parent Admin is not authenticated");
    const token = await user.getIdToken();
    const response = await fetch(`${SUPABASE_PROD_URL}/functions/v1/message-from-mark-lynx-admin`, {
      method: "POST",
      headers: {"Authorization": `Bearer ${token}`, "Content-Type": "application/json"},
      body: JSON.stringify({action:"list"}),
      cache: "no-store"
    });
    const raw = await response.text();
    let result;
    try { result = JSON.parse(raw); }
    catch { throw new Error(`Edge Function HTTP ${response.status}: invalid JSON response (${raw.slice(0,120)})`); }
    if (!response.ok || result?.ok !== true) throw new Error(`Edge Function HTTP ${response.status}: ${String(result?.error || "Unknown response").slice(0,180)}`);
    // Deployed TEST function returns settings, messages and translations; it does not return languages.
    if (!result.settings || typeof result.settings !== "object" ||
        !Array.isArray(result.messages) || !Array.isArray(result.translations)) {
      throw new Error(`Edge Function HTTP ${response.status}: unexpected list response structure`);
    }
    reply({ok:true, httpStatus:response.status, enabled:result.settings.enabled === true,
      messages: result.messages.map(a => ({id:a.id, status:a.status, created_at:a.created_at, published_at:a.published_at, updated_at:a.updated_at})),
      translations: result.translations.map(t => ({message_id:t.message_id, language_code:t.language_code, title:t.title, summary:t.summary, body:t.body}))});
  } catch (error) {
    reply({ok:false, error: error instanceof Error ? error.message : "Unknown connection error"});
  } finally {
    mlmReadOnlyBusy = false;
  }
});


// What's New PROD REV01: narrowly scoped authenticated draft management.
// Parent owns Firebase and token. Never send credentials or tokens to the iframe.
let mlmWriteBusy = false;
window.addEventListener("message", async event => {
  if (event.origin !== window.location.origin || event.data?.type !== "mlm-admin-action-request") return;
  const frame = document.getElementById("adminPageModalFrame");
  if (!frame || event.source !== frame.contentWindow || !frame.getAttribute("src")?.startsWith("message-from-mark-lynx/")) return;
  const requestId = event.data.requestId;
  if (typeof requestId !== "string" || !/^mlm03-[0-9]+$/.test(requestId)) return;
  const send = payload => {
    if (frame.contentWindow === event.source && frame.getAttribute("src")?.startsWith("message-from-mark-lynx/")) {
      event.source.postMessage({type:"mlm-admin-action-response", requestId, ...payload}, event.origin);
    }
  };
  if (mlmWriteBusy) { send({ok:false,error:"Another save is in progress"}); return; }
  const incoming = event.data.payload;
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) return;
  const action = incoming.action;
  if (!["set-enabled", "create", "save-translation", "publish", "unpublish", "delete"].includes(action)) {send({ok:false,error:"Action not permitted in PROD REV01"});return;}
  // Reject malformed input before calling the PROD Edge Function.
  const clean = {action};
  if (action === "set-enabled") {
    if (typeof incoming.enabled !== "boolean") {send({ok:false,error:"Invalid switch value"});return;}
    clean.enabled = incoming.enabled;
  } else if (action === "save-translation") {
    const id = Number(incoming.id);
    const code = incoming.language_code;
    if (!Number.isSafeInteger(id) || id <= 0 || typeof code !== "string" || !/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(code)) {
      send({ok:false,error:"Invalid message or language"});return;
    }
    const fields = [["title",160],["summary",500],["body",15000]];
    if (fields.some(([key,max]) => typeof incoming[key] !== "string" || !incoming[key].trim() || incoming[key].trim().length > max)) {
      send({ok:false,error:"Title, summary and body are required within length limits"});return;
    }
    Object.assign(clean,{id,language_code:code,title:incoming.title.trim(),summary:incoming.summary.trim(),body:incoming.body.trim()});
  }
  if (["publish", "unpublish", "delete"].includes(action)) {
    const id = Number(incoming.id);
    if (!Number.isSafeInteger(id) || id <= 0) {send({ok:false,error:"Invalid message ID"});return;}
    clean.id = id;
    if (action === "delete") {
      if (incoming.confirm !== true) {send({ok:false,error:"Explicit delete confirmation required"});return;}
      clean.confirm = true;
    }
  }
  mlmWriteBusy = true;
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Admin authentication required");
    const token = await user.getIdToken();
    const response = await fetch(`${SUPABASE_PROD_URL}/functions/v1/message-from-mark-lynx-admin`, {
      method:"POST", headers:{"Authorization":`Bearer ${token}`,"Content-Type":"application/json"},
      body:JSON.stringify(clean),cache:"no-store"
    });
    const raw = await response.text();
    let result;
    try {result=JSON.parse(raw);} catch {throw new Error(`HTTP ${response.status}: invalid JSON response`);}
    if (!response.ok || result?.ok !== true) throw new Error(`HTTP ${response.status}: ${String(result?.error || "Request failed").slice(0,220)}`);
    send({ok:true,httpStatus:response.status,action});
  } catch (error) {
    send({ok:false,error:error instanceof Error?error.message:"Unexpected save error"});
  } finally {mlmWriteBusy=false;}
});

