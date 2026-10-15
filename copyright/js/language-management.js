import {generateAllRecoveryFiles} from "./recovery-generator.js?v=TEST-PARITY-PROD-REV10-20261014";
import {languages as registry} from './language-registry.js?v=LANGUAGES-REV07';
import {inventory} from './translation-inventory.js?v=FRENCH-PROD-REV01-20261015';
import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js';
import {getAuth,setPersistence,browserLocalPersistence,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js';
// Identical PROD Firebase project and Supabase URL to existing Genre Management page.
const firebaseConfig={apiKey:'AIzaSyAyaoxwg1-Ru821Y6ohRxwT_DL3bsO8zfQ',authDomain:'mark-lynx-admin.firebaseapp.com',projectId:'mark-lynx-admin',storageBucket:'mark-lynx-admin.firebasestorage.app',messagingSenderId:'749999035332',appId:'1:749999035332:web:52c78e6e358c1fef794a91'};
const BASE='https://igmunmyxaskizltdvvti.supabase.co';
const auth=getAuth(initializeApp(firebaseConfig));let user=null,cache={languages:[],translations:[]};let managedOptions={};
const el=id=>document.getElementById(id);
const status=(message,error=false)=>{el('status').textContent=message;el('status').className=error?'error':'success';};
async function call(action,other={}){if(!user)throw new Error('Sign in to PROD Admin first.');const token=await user.getIdToken();const r=await fetch(`${BASE}/functions/v1/translations-admin`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({action,...other}),cache:'no-store'});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||`HTTP ${r.status}`);return j;}
async function perform(task){try{await task();status('Operation completed.');}catch(e){status(e.message||String(e),true);}}
function node(tag,text){const n=document.createElement(tag);n.textContent=text;return n;}
let pending=null;
function confirmAction(title,message,action){if(pending)return;pending=action;el('confirmTitle').textContent=title;el('confirmMessage').textContent=message;el('confirmMessage').style.whiteSpace='pre-wrap';el('confirmOK').textContent=title==='Import BLOCKED'?'Close':title.startsWith('Disable')?'Disable':title.startsWith('Import')?'Import':title.startsWith('Delete')?'Delete':'Enable';el('confirmCancel').hidden=title==='Import BLOCKED';el('confirmModal').classList.add('open');el('confirmModal').setAttribute('aria-hidden','false');(title==='Import BLOCKED'?el('confirmOK'):el('confirmCancel')).focus();}
function closeConfirm(){pending=null;el('confirmModal').classList.remove('open');el('confirmModal').setAttribute('aria-hidden','true');}
el('confirmCancel').onclick=closeConfirm;
el('confirmOK').onclick=()=>{const action=pending;if(!action)return;closeConfirm();perform(action);};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&pending){e.preventDefault();e.stopImmediatePropagation();closeConfirm();}},true);
function languageFields(){const x=registry.find(x=>x.code===el('languageChoice').value);if(!x)return;el('code').value=x.code;el('english').value=x.name;el('native').value=x.native;el('direction').value=x.direction==='rtl'?'Right To Left':'Left To Right';}
for(const x of registry){const o=node('option',x.name);o.value=x.code;el('languageChoice').append(o);}el('languageChoice').value='es';el('languageChoice').onchange=languageFields;languageFields();
let editingTranslation=false;
function setEditMode(editing){editingTranslation=editing;el('value').readOnly=!editing;el('value').classList.toggle('translation-locked',!editing);el('editTranslation').hidden=editing;el('saveTranslation').hidden=!editing;el('cancelTranslation').hidden=!editing;el('translationSearch').disabled=editing;}
function setEnglish(key){el('key').value=key||'';const t=cache.translations.find(t=>t.language_code===el('translationLanguage').value&&t.translation_key===key);el('value').value=t?.translated_text||'';setEditMode(false);el('editTranslation').disabled=!key;}
function sectionItems(section){
  const sources={'Genres':['genre_options','genre.'],'Platforms':['platform_options','platform.'],'Text Guides':['text_guide_options','text_guide.'],'Completion Types':['completion_types','completion_type.']};
  if(!sources[section])return inventory[section]||{};
  const [table,prefix]=sources[section];const entries={};
  for(const row of managedOptions[table]||[])entries[prefix+row.id]=row.value;
  return entries;
}
function populateEnglish(wanted){const box=el('englishText');box.replaceChildren();for(const [key,english] of Object.entries(sectionItems(el('section').value))){const o=node('option',english);o.value=key;box.append(o);}if(wanted&&[...box.options].some(x=>x.value===wanted))box.value=wanted;setEnglish(box.value);}

function findKey(key){for(const section of [...Object.keys(inventory),'Genres','Platforms','Text Guides','Completion Types']){if(Object.hasOwn(sectionItems(section),key)){el('section').value=section;populateEnglish(key);return true;}}return false;}
for(const section of [...Object.keys(inventory),'Genres','Platforms','Text Guides','Completion Types']){const o=node('option',section);o.value=section;el('section').append(o);}el('section').onchange=()=>populateEnglish();el('englishText').onchange=()=>setEnglish(el('englishText').value);populateEnglish();
// REV01: read-only search of the currently loaded English inventory and selected language.
function updateTranslationSearch(){
  const query=el('translationSearch').value.trim().toLocaleLowerCase();
  const results=el('translationSearchResults');results.replaceChildren();
  if(!query){results.hidden=true;return;}
  results.hidden=false;
  const code=el('translationLanguage').value;
  const saved=new Map(cache.translations.filter(row=>row.language_code===code).map(row=>[row.translation_key,row.translated_text||'']));
  let matches=0;
  for(const section of [...Object.keys(inventory),'Genres','Platforms','Text Guides','Completion Types']){
    for(const [key,english] of Object.entries(sectionItems(section))){
      const translation=saved.get(key)||'';
      if(![key,english,translation].some(value=>String(value).toLocaleLowerCase().includes(query)))continue;
      matches++;
      const button=node('button',`${section} > ${english} — ${translation||'[MISSING TRANSLATION]'}`);
      button.type='button';button.className='translation-search-result';
      button.onclick=()=>{if(editingTranslation)return;findKey(key);results.hidden=true;el('translationSearch').value='';el('value').scrollIntoView({block:'nearest',behavior:'smooth'});};
      results.append(button);
    }
  }
  if(!matches)results.append(node('p','No matching translations.'));
  const count=node('p',`${matches} matching ${matches===1?'entry':'entries'}`);count.className='hint';results.prepend(count);
}
el('translationSearch').addEventListener('input',updateTranslationSearch);
el('translationSearchClear').onclick=()=>{el('translationSearch').value='';updateTranslationSearch();el('translationSearch').focus();};
function displayNative(value){const text=String(value||'');return text?text.charAt(0).toLocaleUpperCase()+text.slice(1):text;}
function render(){const list=el('languages');list.replaceChildren();const select=el('translationLanguage');const selected=select.value;select.replaceChildren();for(const lang of cache.languages){const row=node('div','');row.className='language';const desc=node('span',`${lang.english_name} (${displayNative(lang.native_name)})`);const state=node('span',lang.enabled?'ENABLED':'DISABLED');state.className='language-status '+(lang.enabled?'language-status-enabled':'language-status-disabled');const info=node('div','');info.className='language-info';info.append(desc,state);const controls=node('div','');const edit=node('button','Edit');edit.onclick=()=>{if(!registry.some(x=>x.code===lang.code)){status('Language not in registry; cannot edit from this selector.',true);return;}el('languageChoice').value=lang.code;languageFields();el('sort').value=lang.sort_order;};const toggle=node('button',lang.enabled?'Disable':'Enable');toggle.onclick=()=>confirmAction(`${lang.enabled?'Disable':'Enable'} ${lang.english_name}?`,lang.enabled?'Temporarily hide this language. Saved translations and visitor preferences remain intact.':'Make this language available to visitors? Confirm translations are ready.',async()=>{await call('set-enabled',{code:lang.code,enabled:!lang.enabled});await reload();status('Saved in Supabase. Export and publish recovery JSON to synchronize fallback.');});controls.append(edit,toggle);row.append(info,controls);list.append(row);const opt=node('option',`${lang.english_name} (${lang.code})`);opt.value=lang.code;select.append(opt);}if([...select.options].some(o=>o.value===selected))select.value=selected;setEnglish(el('englishText').value);}
// REV07: translation entries are accessed through Section and English Text selectors only.
// Keep existing database rows intact; never render internal keys or a crowded saved-translation list.

function renderTranslationStatistics(){
  const root=new Map();
  for(const section of [...Object.keys(inventory),'Genres','Platforms','Text Guides','Completion Types']){
    for(const [key,english] of Object.entries(sectionItems(section)))root.set(key,english);
  }
  const expected=[...root.keys()].sort();
  const expectedSet=new Set(expected);
  const host=el('translationStatistics');
  host.replaceChildren();
  const summary=node('p',`Expected translation keys: ${expected.length} (English source inventory + live managed options).`);
  host.append(summary);
  for(const lang of cache.languages){
    if(lang.code==='en')continue;
    const rows=cache.translations.filter(x=>x.language_code===lang.code);
    const present=new Set(rows.filter(x=>typeof x.translated_text==='string'&&x.translated_text.trim()).map(x=>x.translation_key));
    const missing=expected.filter(key=>!present.has(key));
    const extra=[...present].filter(key=>!expectedSet.has(key)).sort();
    const line=node('div','');line.className='language';
    const heading=node('strong',`${lang.english_name} (${lang.code}): ${expected.length-missing.length}/${expected.length} — ${missing.length} missing, ${extra.length} extra — ${lang.enabled?'ENABLED':'DISABLED'}`);
    line.append(heading);
    if(missing.length||extra.length){
      const details=document.createElement('details');
      details.append(node('summary','Show missing / extra keys'));
      if(missing.length){
        details.append(node('p','Missing ('+missing.length+'):'));
        const ul=document.createElement('ul');
        for(const key of missing){
          const li=document.createElement('li');
          li.append(node('span',`${key} — ${root.get(key)} `));
          const edit=node('button','Open in editor');
          edit.type='button';
          edit.onclick=()=>{
            el('translationLanguage').value=lang.code;
            if(!findKey(key)){status('English key no longer exists; refresh statistics.',true);return;}
            setEnglish(key);
            el('section').closest('section').scrollIntoView({block:'center',behavior:'smooth'});
            status('Selected '+key+' for '+lang.english_name+'. Click Edit to enter the translation.');
          };
          li.append(edit);ul.append(li);
        }
        details.append(ul);
      }
      if(extra.length){
        details.append(node('p','Extra / unregistered ('+extra.length+'):'));
        const ul=document.createElement('ul');
        for(const key of extra){
          const row=rows.find(x=>x.translation_key===key);
          const li=document.createElement('li');
          li.append(node('span',`${key} — saved text: ${row?.translated_text||'(empty)'} `));
          const managed=/^(genre|platform|text_guide|completion_type)\.([1-9]\d*)$/.test(key);
          if(managed){
            const remove=node('button','Delete orphan');remove.type='button';
            remove.onclick=()=>confirmAction('Delete orphan translation?',
              'PROD Supabase only. Language: '+lang.code+'. Key: '+key+'. Saved text: '+row.translated_text+'. Delete this translation record? This cannot be undone.',
              async()=>{
                await call('delete-translation',{code:lang.code,key,expected_text:row.translated_text});
                await reload();
                status('Deleted orphan '+key+' for '+lang.code+'. Export updated PROD recovery JSON before testing fallback.');
              });
            li.append(remove);
          }else{
            li.append(node('span',' (Review source inventory; deletion disabled)'));
          }
          ul.append(li);
        }
        details.append(ul);
      }
      line.append(details);
    }
    host.append(line);
  }
}
let statsRefreshCount=0;
el('refreshTranslationStatistics').onclick=async()=>{
  const button=el('refreshTranslationStatistics');
  if(button.disabled)return;
  button.disabled=true;
  button.textContent='Refreshing statistics…';
  try{
    await reload();
    statsRefreshCount++;
    const stamp=new Date().toLocaleString();
    el('statisticsLastRefreshed').textContent=`Last refreshed: ${stamp} (refresh #${statsRefreshCount})`;
    status('Translation statistics refreshed from PROD Supabase.');
  }catch(e){
    status(e.message||String(e),true);
    el('statisticsLastRefreshed').textContent='Refresh failed. Existing figures may be outdated.';
  }finally{
    button.disabled=false;
    button.textContent='Refresh translation statistics';
  }
};
async function reload(){const [saved,managed]=await Promise.all([call('list'),call('list-options')]);cache=saved;managedOptions=managed.options||{};render();populateEnglish(el('englishText').value);renderTranslationStatistics();updateTranslationSearch();}
el('translationLanguage').onchange=()=>{setEnglish(el('englishText').value);updateTranslationSearch();};
el('saveLanguage').onclick=()=>perform(async()=>{const code=el('code').value.trim();if(code.toLowerCase()==='en')throw Error('English cannot be managed.');await call('save-language',{code,english_name:el('english').value,native_name:displayNative(el('native').value),direction:el('direction').value==='Right To Left'?'rtl':'ltr',sort_order:Number(el('sort').value)});await reload();});
el('editTranslation').onclick=()=>{if(!el('key').value)return;setEditMode(true);el('value').focus();};
el('cancelTranslation').onclick=()=>setEnglish(el('englishText').value);
el('saveTranslation').onclick=()=>perform(async()=>{const code=el('translationLanguage').value;if(!code)throw Error('Add a language first.');const key=el('key').value.trim();if(!key)throw Error('Select English text first.');await call('save-translation',{code,key,text:el('value').value});await reload();findKey(key);setEnglish(key);});

// REV04: Download a source-verified import file for the selected language.
// This is separate from public recovery JSON; recovery format remains unchanged.
const verifiedExport=node('button','Download verified import JSON');
verifiedExport.type='button';
verifiedExport.onclick=()=>perform(async()=>{
  const code=el('translationLanguage').value;
  if(!code)throw Error('Select a language first.');
  const strings={};const english_sources={};
  for(const row of cache.translations.filter(row=>row.language_code===code&&typeof row.translated_text==='string'&&row.translated_text.trim()))strings[row.translation_key]=row.translated_text;
  for(const section of ['Genres','Platforms','Text Guides','Completion Types'])Object.assign(english_sources,sectionItems(section));
  const blob=new Blob([JSON.stringify({version:2,language:code,strings,english_sources},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${code}-verified-import.json`;a.click();URL.revokeObjectURL(url);
  status('Verified import JSON downloaded for '+code+'. This is not a recovery JSON file.');
});
el('importTranslations').insertAdjacentElement('afterend',verifiedExport);
// REV07: Read-only English-to-selected-language text review export.
// English is drawn from the same live PROD inventory as the editor and statistics.
const reviewExport=node('button','Download English → Translation TXT');
reviewExport.type='button';
reviewExport.onclick=()=>perform(async()=>{
  const code=el('translationLanguage').value;
  const lang=cache.languages.find(item=>item.code===code);
  if(!lang)throw Error('Select a language first.');
  const translations=new Map(cache.translations.filter(row=>row.language_code===code).map(row=>[row.translation_key,row.translated_text]));
  const sections=[...Object.keys(inventory),'Genres','Platforms','Text Guides','Completion Types'];
  const lines=[
    'MARK LYNX GAMING NETWORK — TRANSLATION REVIEW',
    'Environment: PROD',
    `Language: ${lang.english_name} (${code})`,
    'English source: PROD Admin inventory and live PROD Supabase managed options',
    'This file is for review only. It cannot be imported.',
    ''
  ];
  let total=0,missing=0;
  for(const section of sections){
    const entries=Object.entries(sectionItems(section));
    if(!entries.length)continue;
    lines.push('='.repeat(72),section.toUpperCase(),'='.repeat(72),'');
    for(const [key,english] of entries){
      const translated=translations.get(key);
      const present=typeof translated==='string'&&!!translated.trim();
      lines.push(`Key: ${key}`,`English: ${english}`,`${lang.english_name}: ${present?translated:'[MISSING TRANSLATION]'}`,'');
      total++;
      if(!present)missing++;
    }
  }
  lines.push('='.repeat(72),`SUMMARY: ${total-missing}/${total} translated; ${missing} missing.`,'');
  const blob=new Blob(['\uFEFF'+lines.join('\r\n')],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=`${code}-english-translation-review.txt`;a.click();URL.revokeObjectURL(url);
  status(`Downloaded PROD English → ${lang.english_name} review TXT (${total-missing}/${total}).`);
});
verifiedExport.insertAdjacentElement('afterend',reviewExport);




// REV04: Validate the complete import against this environment before any writes.
const importInput=el('translationImportFile');
el('importTranslations').onclick=()=>perform(async()=>{
  const file=importInput.files?.[0];
  if(!file)throw Error('Choose a translation JSON file first.');
  const payload=JSON.parse(await file.text());
  const code=String(payload?.language||'');
  const strings=payload?.strings;
  if(!code||!strings||Array.isArray(strings)||typeof strings!=='object')throw Error('Invalid translation file.');
  if(!cache.languages.some(x=>x.code===code))throw Error('Add '+code+' in Language Management before importing.');
  const expected={};
  for(const section of [...Object.keys(inventory),'Genres','Platforms','Text Guides','Completion Types'])Object.assign(expected,sectionItems(section));
  const keys=Object.keys(strings);
  const extra=keys.filter(key=>!Object.hasOwn(expected,key));
  const missing=Object.keys(expected).filter(key=>!Object.hasOwn(strings,key));
  const invalid=keys.filter(key=>typeof strings[key]!=='string'||!strings[key].trim()||strings[key].length>5000);
  const managed=/^(genre|platform|text_guide|completion_type)\.[1-9]\d*$/;
  const source=payload?.english_sources;
  const mismatched=keys.filter(key=>managed.test(key)&&Object.hasOwn(expected,key)&&(!source||typeof source[key]!=='string'||source[key]!==expected[key]));
  const lines=[`Environment: PROD Supabase`,`Language: ${code}`,`Expected: ${Object.keys(expected).length} | JSON: ${keys.length}`];
  if(extra.length)lines.push(`Unknown keys (${extra.length}): ${extra.join(', ')}`);
  if(invalid.length)lines.push(`Invalid text (${invalid.length}): ${invalid.join(', ')}`);
  if(mismatched.length)lines.push(`Unverified/mismatched English sources (${mismatched.length}): ${mismatched.join(', ')}`);
  if(missing.length)lines.push(`Missing (${missing.length}): ${missing.map(key=>key+' — '+expected[key]).join('; ')}`);
  const blocked=extra.length||invalid.length||mismatched.length;
  if(blocked){confirmAction('Import BLOCKED',lines.join('\n')+'\nNo changes made.',async()=>{});return;}
  lines.push(missing.length?'WARNING: incomplete import. Continue only if intended.':'PASS: All expected keys present.');
  lines.push('Existing matching translations will be overwritten. Language enablement will not change.');
  confirmAction(missing.length?'Import WARNING':'Import validated',lines.join('\n'),async()=>{
    el('importTranslations').disabled=true;
    try{
      const result=await call('import-translations',{code,strings,english_sources:source||{},expected_keys:Object.keys(expected)});
      await reload();
      status(`Imported ${result.imported} translations for ${code}. Language enablement unchanged.`);
    }finally{el('importTranslations').disabled=false;}
  });
});

el('export').onclick=()=>perform(async()=>{
  el('export').disabled=true;
  try{
    const files=await generateAllRecoveryFiles(user);
    status('Complete PROD recovery downloaded: '+files.join(', ')+'. Upload to youtube/data/.');
  }finally{el('export').disabled=false;}
});
await setPersistence(auth,browserLocalPersistence);onAuthStateChanged(auth,u=>{user=u;if(u)perform(reload);else status('Sign in to the main PROD Admin first.',true);});
