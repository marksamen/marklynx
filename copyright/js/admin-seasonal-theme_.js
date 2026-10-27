/* SEASONAL TEST REV01: Firebase-authenticated TEST-only Admin control. */
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
    }catch(error){status.textContent='ERROR: '+error.message;console.error('[SEASONAL TEST REV01]',error);}
  }
  save.addEventListener('click',async function(){
    var theme=select.value;
    if(theme!=='none'&&theme!=='halloween')return;
    if(!window.confirm('Set TEST seasonal theme to '+theme.toUpperCase()+'?'))return;
    save.disabled=true;select.disabled=true;status.textContent='Saving TEST setting…';
    try{await call('set-seasonal-theme',theme);await refresh();}
    catch(error){status.textContent='SAVE FAILED: '+error.message;console.error('[SEASONAL TEST REV01]',error);save.disabled=false;select.disabled=false;}
  });
  return refresh;
}
