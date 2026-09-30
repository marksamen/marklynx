import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs, query, orderBy, updateDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { loadTrafficAnalytics } from "./admin-traffic_.js";
import { initTestContentControl } from "./admin-test-content_.js?v=REV58-test-content-isolation";
import { initAdminPageModal } from "./admin-page-modal_.js?v=DEVELOPER-PROVIDED-ADMIN-REV08";
import { initDataSourceControl, loadDataSourceStatus, verifyTestDatabaseIdentity } from "./admin-data-source_.js";
import { initGameManagement, loadGamesTest, loadQualityBadges } from "./admin-game-management_.js?v=DEVELOPER-PROVIDED-REBUILD-REV15";
import { initRecentRefresh } from "./admin-recent-refresh_.js?v=recent-refresh-rev01";
import { initVideoCountRefresh } from "./admin-video-count-refresh_.js?v=REV30-video-count-refresh";
import { initDeveloperPublisherSearch } from "./admin-devpub-search_.js?v=devpub-search-rev01";

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
function loggedIn(){login.style.display="none";admin.style.display="block";form.reset();error.textContent="";loadTrafficAnalytics({db,getDoc,doc});loadGamesTest();loadDataSourceStatus();}


// Supabase TEST recovery export — public SELECT only. No database writes.
const SUPABASE_TEST_URL="https://aikifibkcjibubqegvmb.supabase.co";
const SUPABASE_TEST_PUBLISHABLE_KEY="sb_publishable_AMeGQySg9vDaKqkZRz_7HQ_yveiHHV_";

initDataSourceControl({auth,SUPABASE_TEST_URL,SUPABASE_TEST_PUBLISHABLE_KEY});
initGameManagement({auth,verifyTestDatabaseIdentity});
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


initAdminPageModal();
