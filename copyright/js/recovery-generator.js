// REV14 TEST: one recovery generator for main Admin and Language Management.
const SUPABASE_PROD_URL="https://igmunmyxaskizltdvvti.supabase.co";
const SUPABASE_PROD_PUBLISHABLE_KEY="sb_publishable_FwiOj7IyowVx1pvzwXx-Rw_QN_QFRdE";
const GAME_EXPORT_FIELDS=["id","n","p","g","t","ty","tx","q","df","u","v","pl","kinect","adult","testContent","always_show_recent","developer_1","developer_2","developer_3","developer_4","developer_5","publisher_1","publisher_2","publisher_3"];
async function fetchAllSupabaseTestGames(){
  const pageSize=1000;
  const all=[];
  for(let from=0;;from+=pageSize){
    const to=from+pageSize-1;
    const response=await fetch(`${SUPABASE_PROD_URL}/rest/v1/games?select=*&order=id.asc`,{
      headers:{
        apikey:SUPABASE_PROD_PUBLISHABLE_KEY,
        Range:`${from}-${to}`
      }
    });
    if(!response.ok)throw new Error(`Supabase PROD read failed (${response.status}).`);
    const page=await response.json();
    all.push(...page);
    if(page.length<pageSize)break;
  }
  return all;
}

function cleanGameForJson(game){
  const clean={};
  for(const field of GAME_EXPORT_FIELDS)clean[field]=game[field]??null;
  return clean;
}

async function fetchQualityBadgeRecoveryData(){
  const response=await fetch(`${SUPABASE_PROD_URL}/rest/v1/quality_badges?select=code,display_name,asset_key,sort_order&order=sort_order.asc`,{
    headers:{apikey:SUPABASE_PROD_PUBLISHABLE_KEY},
    cache:"no-store"
  });
  if(!response.ok)throw new Error(`Quality Badge recovery read failed (${response.status}).`);
  const rows=await response.json();
  if(!Array.isArray(rows))throw new Error("Quality Badge recovery data returned an invalid response.");
  return rows.map(row=>{
    const code=String(row?.code||"").trim();
    const assetKey=String(row?.asset_key||"").trim();
    return {
      code,
      display_name:String(row?.display_name||code).trim()||code,
      image_path:assetKey?`${assetKey}_.png`:"",
      sort_order:row?.sort_order??null
    };
  }).filter(row=>row.code&&row.image_path);
}

async function fetchPublicDeveloperRecoveryData(){
  const headers={apikey:SUPABASE_PROD_PUBLISHABLE_KEY};
  const showcaseSelect="company_id,public_display_name,public_description,public_display_order,game_id,game_name,gamerscore,completion_time,quality,youtube_url,video_id,playlist_id";
  const [showcaseResponse,providedResponse,railSettingsResponse,providedRecencyResponse]=await Promise.all([
    fetch(`${SUPABASE_PROD_URL}/rest/v1/public_developer_showcase?select=${showcaseSelect}`,{headers,cache:"no-store"}),
    fetch(`${SUPABASE_PROD_URL}/rest/v1/public_developer_provided_games?select=game_id,provided_by&order=game_id.asc`,{headers,cache:"no-store"}),
    fetch(`${SUPABASE_PROD_URL}/rest/v1/developer_public_settings?id=eq.1&select=video_limit,video_sort`,{headers,cache:"no-store"}),
    fetch(`${SUPABASE_PROD_URL}/rest/v1/public_developer_provided_recency?select=game_id,provided_at`,{headers,cache:"no-store"})
  ]);
  if(!showcaseResponse.ok)throw new Error(`Public Developer Showcase read failed (${showcaseResponse.status}).`);
  if(!providedResponse.ok)throw new Error(`Developer Provided read failed (${providedResponse.status}).`);
  if(!railSettingsResponse.ok)throw new Error(`Developer rail settings read failed (${railSettingsResponse.status}).`);
  if(!providedRecencyResponse.ok)throw new Error(`Developer provided recency read failed (${providedRecencyResponse.status}).`);
  const showcase=await showcaseResponse.json();
  const providedRows=await providedResponse.json();
  const railSettingRows=await railSettingsResponse.json();
  const providedRecencyRows=await providedRecencyResponse.json();
  const providedAtByGame=new Map((Array.isArray(providedRecencyRows)?providedRecencyRows:[]).map(row=>[Number(row.game_id),String(row.provided_at||"")]));
  if(!Array.isArray(showcase)||!Array.isArray(providedRows))throw new Error("Public developer recovery data returned an invalid response.");
  const railSetting=Array.isArray(railSettingRows)&&railSettingRows.length?railSettingRows[0]:{};
  const railLimit=Number(railSetting.video_limit);
  return {
    showcase,
    railSettings:{sort:["RECENT","GAME_NAME","DEVELOPER"].includes(String(railSetting.video_sort||"").toUpperCase())?String(railSetting.video_sort).toUpperCase():"RECENT",limit:Number.isInteger(railLimit)&&railLimit>0?railLimit:null},
    providedGameIds:providedRows.map(row=>Number(row.game_id)).filter(Number.isInteger),
    providedGames:providedRows
      .map(row=>({game_id:Number(row.game_id),provided_by:String(row.provided_by||"").trim(),provided_at:providedAtByGame.get(Number(row.game_id))||""}))
      .filter(row=>Number.isInteger(row.game_id)&&row.provided_by)
  };
}

function downloadJsonFile(filename,data){
  const blob=new Blob([JSON.stringify(data,null,2)+"\n"],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download=filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}


async function fetchLanguageRecoveryData(user){
  if(!user)throw Error('Sign in to PROD Admin before generating recovery files.');
  const token=await user.getIdToken();
  const response=await fetch(`${SUPABASE_PROD_URL}/functions/v1/translations-admin`,{
    method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
    body:JSON.stringify({action:'list'}),cache:'no-store'
  });
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(result.error||`Language recovery HTTP ${response.status}`);
  if(!Array.isArray(result.languages)||!Array.isArray(result.translations))throw Error('Language recovery returned invalid data.');
  const languages=result.languages.map(row=>({code:row.code,native_name:row.native_name,english_name:row.english_name,enabled:row.enabled,sort_order:row.sort_order}));
  const translations={};
  for(const row of result.translations){
    if(!row.language_code||!row.translation_key)continue;
    (translations[row.language_code]??={})[row.translation_key]=row.translated_text||'';
  }
  return {languages,translations};
}
export async function generateAllRecoveryFiles(user){
  // Fetch and validate EVERYTHING before starting any download.
  const [games,publicDeveloperData,qualityBadgeData,languageData]=await Promise.all([
    fetchAllSupabaseTestGames(),fetchPublicDeveloperRecoveryData(),fetchQualityBadgeRecoveryData(),fetchLanguageRecoveryData(user)
  ]);
  if(!games.length)throw Error('Supabase PROD returned zero games.');
  if(!languageData.languages.length)throw Error('Language registry returned no rows.');
  const files=[
    ['games.json',games.map(cleanGameForJson)],
    ['public-developer-data.json',publicDeveloperData],
    ['quality-badges.json',qualityBadgeData],
    ['languages.json',languageData.languages],
    ['translations.json',languageData.translations]
  ];
  for(const [name,data] of files)downloadJsonFile(name,data);
  return files.map(([name])=>name);
}
