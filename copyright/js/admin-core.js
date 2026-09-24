import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs, query, orderBy, updateDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { loadTrafficAnalytics } from "./admin-traffic.js";
import { initTestContentControl } from "./admin-test-content.js";
import { initAdminPageModal } from "./admin-page-modal.js?v=game-suggestions-x-only-rev01";
import { initDataSourceControl, loadDataSourceStatus, verifyProdDatabaseIdentity } from "./admin-data-source.js?v=20260924-prod-db-recovery-rev02";
import { initGameManagement, loadGamesProd } from "./admin-game-management.js?v=20260924-prod-db-recovery-rev02";

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
function loggedIn(){login.style.display="none";admin.style.display="block";form.reset();error.textContent="";loadTrafficAnalytics({db,getDoc,doc});loadGamesProd();loadDataSourceStatus();}


// Supabase PROD recovery export — public SELECT only. No database writes.
const SUPABASE_PROD_URL="https://igmunmyxaskizltdvvti.supabase.co";
const SUPABASE_PROD_PUBLISHABLE_KEY="sb_publishable_FwiOj7IyowVx1pvzwXx-Rw_QN_QFRdE";

initDataSourceControl({auth,SUPABASE_PROD_URL,SUPABASE_PROD_PUBLISHABLE_KEY});
initGameManagement({auth,verifyProdDatabaseIdentity});


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
