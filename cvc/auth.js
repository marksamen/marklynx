import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

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

// REV15: expose the current Firebase ID token to the CVC archive layer.
window.getCvcIdToken = async function () {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("CVC authentication is not ready.");
  }
  return user.getIdToken();
};
const login = document.getElementById("login");
const cvcApp = document.getElementById("cvcApp");
const form = document.getElementById("loginForm");
const error = document.getElementById("error");

function loggedOut(){
  cvcApp.style.display="none";
  login.style.display="block";
}

function loggedIn(){
  login.style.display="none";
  cvcApp.style.display="block";
  form.reset();
  error.textContent="";
}

await setPersistence(auth,browserLocalPersistence);
onAuthStateChanged(auth,user=>user?loggedIn():loggedOut());

form.addEventListener("submit",async event=>{
  event.preventDefault();
  error.textContent="";
  try{
    await signInWithEmailAndPassword(
      auth,
      document.getElementById("email").value.trim(),
      document.getElementById("password").value
    );
  }catch(e){
    error.textContent="Invalid email or password.";
  }
});

document.getElementById("logout").addEventListener("click",()=>signOut(auth));
