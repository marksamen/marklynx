/* SEASONAL TEST REV05: Firebase-authenticated TEST-only Admin control. */
export function initSeasonalThemeControl({auth,url}){
  var status=document.getElementById('seasonalThemeStatus');
  var select=document.getElementById('seasonalThemeSelect');
  var save=document.getElementById('seasonalThemeSave');
  async function call(action,theme){
    var user=auth.currentUser;
    if(!user)throw new Error('Admin login required');
    var token=await user.getIdToken();
    var response=await fetch(url+'/functions/v1/games-admin',{
      method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
      body:JSON.stringify({action:action,theme:theme})
    });
    var result=await response.json();
    if(!response.ok||!result.ok)throw new Error(result.error||'HTTP '+response.status);
    return result;
  }
  async function refresh(){
    status.textContent='Reading TEST setting…';
    select.disabled=true;save.disabled=true;
    try{
      var result=await call('get-seasonal-theme');
      select.value=result.theme;
      status.textContent='TEST setting: '+result.theme.toUpperCase();
      select.disabled=false;save.disabled=false;
    }catch(error){status.textContent='ERROR: '+error.message;console.error('[SEASONAL TEST REV05]',error);}
  }
  function confirmSeasonal(theme){
    return new Promise(function(resolve){
      var modal=document.getElementById('seasonalConfirmModal');
      var yes=document.getElementById('seasonalConfirmYes');
      var no=document.getElementById('seasonalConfirmNo');
      var message=document.getElementById('seasonalConfirmMessage');
      var previous=document.activeElement;
      message.textContent='Apply '+(theme==='halloween'?'Halloween':'Normal (OFF)')+' to the TEST seasonal theme setting?';
      modal.classList.add('open');modal.setAttribute('aria-hidden','false');
      function finish(value){
        yes.removeEventListener('click',onYes);no.removeEventListener('click',onNo);
        document.removeEventListener('keydown',onKey);
        modal.classList.remove('open');modal.setAttribute('aria-hidden','true');
        if(previous&&typeof previous.focus==='function')previous.focus();
        resolve(value);
      }
      function onYes(){finish(true)}
      function onNo(){finish(false)}
      function onKey(event){if(event.key==='Escape'){event.preventDefault();finish(false)}}
      yes.addEventListener('click',onYes);no.addEventListener('click',onNo);
      document.addEventListener('keydown',onKey);no.focus();
    });
  }
  save.addEventListener('click',async function(){
    var theme=select.value;
    if(theme!=='none'&&theme!=='halloween')return;
    if(!(await confirmSeasonal(theme)))return;
    save.disabled=true;select.disabled=true;status.textContent='Saving TEST setting…';
    try{await call('set-seasonal-theme',theme);await refresh();}
    catch(error){status.textContent='SAVE FAILED: '+error.message;console.error('[SEASONAL TEST REV05]',error);save.disabled=false;select.disabled=false;}
  });
  return refresh;
}
