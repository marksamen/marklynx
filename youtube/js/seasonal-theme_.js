/* SEASONAL PUBLIC TEST REV01. Public read-only; never modifies visitor theme preference. */
(function(){
  'use strict';
  var root=document.documentElement;
  root.setAttribute('data-seasonal-theme','none');
  var url='https://aikifibkcjibubqegvmb.supabase.co/rest/v1/site_control?id=eq.seasonal_theme&select=value';
  fetch(url,{headers:{apikey:'sb_publishable_AMeGQySg9vDaKqkZRz_7HQ_yveiHHV_'},cache:'no-store'})
    .then(function(response){if(!response.ok)throw new Error('Seasonal theme HTTP '+response.status);return response.json();})
    .then(function(rows){
      var value=rows.length ? rows[0].value : 'none';
      if(value!=='none' && value!=='halloween')throw new Error('Unsupported seasonal theme');
      root.setAttribute('data-seasonal-theme',value);
      console.info('[SEASONAL PUBLIC TEST REV01] '+value);
    })
    .catch(function(error){console.error('[SEASONAL PUBLIC TEST REV01] Seasonal setting unavailable; original theme retained',error);});
})();
