// PROD Admin submissions/suggestions modal — Developer/Publisher close synchronization
export function initAdminPageModal(){
  const adminPageModal=document.getElementById("adminPageModal");
  const adminPageModalFrame=document.getElementById("adminPageModalFrame");
  const adminPageModalTitle=document.getElementById("adminPageModalTitle");
  const adminPageModalClose=document.getElementById("adminPageModalClose");
  let activeAdminModalUrl="";
  function openAdminPageModal(url,title){
    activeAdminModalUrl=url;
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
    const closingAdminModalUrl=activeAdminModalUrl;
    if(closingAdminModalUrl.startsWith("text-guides/")){
      window.dispatchEvent(new CustomEvent("text-guides-modal-closed"));
    }
    if(closingAdminModalUrl.startsWith("platforms/")){
      window.dispatchEvent(new CustomEvent("platforms-modal-closed"));
    }
    if(closingAdminModalUrl.startsWith("genres/")){
      window.dispatchEvent(new CustomEvent("genres-modal-closed"));
    }
    activeAdminModalUrl="";
    if(closingAdminModalUrl.startsWith("quality-badges/")){
      window.dispatchEvent(new CustomEvent("quality-badges-modal-closed"));
    }
    if(closingAdminModalUrl.startsWith("developer-publishers/")){
      window.dispatchEvent(new CustomEvent("developer-publishers-modal-closed"));
    }
  }
  document.querySelectorAll("[data-admin-modal-url]").forEach(button=>button.addEventListener("click",()=>openAdminPageModal(button.dataset.adminModalUrl,button.dataset.adminModalTitle)));
  adminPageModalClose.addEventListener("click",closeAdminPageModal);
  adminPageModal.addEventListener("click",event=>{if(event.target===adminPageModal&&!activeAdminModalUrl.startsWith("developers/")&&!activeAdminModalUrl.startsWith("suggestions/")&&!activeAdminModalUrl.startsWith("developer-publishers/")&&!activeAdminModalUrl.startsWith("quality-badges/")&&!activeAdminModalUrl.startsWith("text-guides/")&&!activeAdminModalUrl.startsWith("platforms/")&&!activeAdminModalUrl.startsWith("genres/")&&!activeAdminModalUrl.startsWith("languages/"))closeAdminPageModal();});
  document.addEventListener("keydown",event=>{if(event.key==="Escape"&&adminPageModal.classList.contains("open")&&!activeAdminModalUrl.startsWith("developers/")&&!activeAdminModalUrl.startsWith("suggestions/")&&!activeAdminModalUrl.startsWith("developer-publishers/")&&!activeAdminModalUrl.startsWith("languages/"))closeAdminPageModal();});
}