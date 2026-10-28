/* SEASONAL PROD REV02. Public read-only; never modifies visitor theme preference. */
(function(){
  'use strict';
  var root=document.documentElement;
  root.setAttribute('data-seasonal-theme','none');
  var url='https://igmunmyxaskizltdvvti.supabase.co/rest/v1/site_control?id=eq.seasonal_theme&select=value';
  fetch(url,{headers:{apikey:'sb_publishable_FwiOj7IyowVx1pvzwXx-Rw_QN_QFRdE'},cache:'no-store'})
    .then(function(response){if(!response.ok)throw new Error('Seasonal theme HTTP '+response.status);return response.json();})
    .then(function(rows){
      var value=rows.length ? rows[0].value : 'none';
      if(value!=='none' && value!=='halloween')throw new Error('Unsupported seasonal theme');
      root.setAttribute('data-seasonal-theme',value);
    })
    .catch(function(){/* Fail closed: preserve normal theme when setting is unavailable. */});
})();
