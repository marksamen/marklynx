// PROD Admin submissions/suggestions modal
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
    activeAdminModalUrl="";
  }
  document.querySelectorAll("[data-admin-modal-url]").forEach(button=>button.addEventListener("click",()=>openAdminPageModal(button.dataset.adminModalUrl,button.dataset.adminModalTitle)));
  adminPageModalClose.addEventListener("click",closeAdminPageModal);
  adminPageModal.addEventListener("click",event=>{if(event.target===adminPageModal&&!activeAdminModalUrl.startsWith("developers/")&&!activeAdminModalUrl.startsWith("suggestions/"))closeAdminPageModal();});
  document.addEventListener("keydown",event=>{if(event.key==="Escape"&&adminPageModal.classList.contains("open")&&!activeAdminModalUrl.startsWith("developers/")&&!activeAdminModalUrl.startsWith("suggestions/"))closeAdminPageModal();});
}
