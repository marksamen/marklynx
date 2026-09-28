const SUPABASE_TEST_URL="https://aikifibkcjibubqegvmb.supabase.co";

export function initVideoCountRefresh({auth}){
  const button=document.getElementById("videoCountRefresh");
  const status=document.getElementById("videoCountRefreshStatus");
  if(!button||!status)return;

  button.addEventListener("click",async()=>{
    button.disabled=true;
    status.style.color="#ffd36d";
    status.textContent="Starting Video Count refresh…";

    try{
      const user=auth.currentUser;
      if(!user)throw new Error("Admin authentication is required.");

      const firebaseToken=await user.getIdToken();
      const response=await fetch(`${SUPABASE_TEST_URL}/functions/v1/video-counter-refresh`,{
        method:"POST",
        headers:{
          "Authorization":`Bearer ${firebaseToken}`,
          "Content-Type":"application/json"
        }
      });

      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result.error||`Supabase TEST returned HTTP ${response.status}.`);

      status.style.color="#6dff8b";
      status.textContent="✓ Video Count refresh request sent to GitHub.";
    }catch(e){
      status.style.color="#ff6d6d";
      status.textContent=`REFRESH FAILED — ${e?.message||e}`;
      console.error(e);
    }finally{
      button.disabled=false;
    }
  });
}
