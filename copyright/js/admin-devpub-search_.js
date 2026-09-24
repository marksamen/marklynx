const DEVELOPER_FIELDS=["developer_1","developer_2","developer_3","developer_4","developer_5"];
const PUBLISHER_FIELDS=["publisher_1","publisher_2","publisher_3"];

function norm(value){return String(value??"").trim().toLowerCase();}

function rolesForGame(game,query){
  const q=norm(query);
  const developer=DEVELOPER_FIELDS.some(field=>norm(game[field]).includes(q));
  const publisher=PUBLISHER_FIELDS.some(field=>norm(game[field]).includes(q));
  return {developer,publisher};
}

function openGame(gameId){
  const search=document.getElementById("gameDevSearch");
  const list=document.getElementById("gameDevList");
  search.value="";
  search.dispatchEvent(new Event("input",{bubbles:true}));
  if(![...list.options].some(option=>option.value===gameId)) return;
  list.value=gameId;
  document.getElementById("gameDevEditLauncher").click();
}

function renderDeveloperPublisherSearch(){
  const input=document.getElementById("devPubSearch");
  const summary=document.getElementById("devPubSearchSummary");
  const results=document.getElementById("devPubSearchResults");
  const query=input.value.trim();
  results.innerHTML="";

  if(!query){
    summary.textContent="Type a developer or publisher name to find matching games.";
    return;
  }

  const games=(window.GAMEDEV_RAW||[]).filter(game=>{
    const roles=rolesForGame(game,query);
    return roles.developer||roles.publisher;
  });

  summary.textContent=games.length
    ?`${games.length} matching game${games.length===1?"":"s"}.`
    :"No matching games.";

  for(const game of games){
    const roles=rolesForGame(game,query);
    const roleText=roles.developer&&roles.publisher?"Developer + Publisher":roles.developer?"Developer":"Publisher";
    const button=document.createElement("button");
    button.type="button";
    button.className="devpub-result";
    button.innerHTML=`<span class="devpub-result-title"></span><span class="devpub-result-role"></span>`;
    button.querySelector(".devpub-result-title").textContent=`${game.id} — ${game.n||"(unnamed)"}`;
    button.querySelector(".devpub-result-role").textContent=roleText;
    button.addEventListener("click",()=>openGame(game.id));
    results.appendChild(button);
  }
}

export function initDeveloperPublisherSearch(){
  const input=document.getElementById("devPubSearch");
  if(!input) return;
  input.addEventListener("input",renderDeveloperPublisherSearch);
}
