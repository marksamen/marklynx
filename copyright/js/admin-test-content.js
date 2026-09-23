export function initTestContentControl(){
  const TEST_KEY="marklynxTestContent";
  const testStatus=document.getElementById("testStatus");
  const testToggle=document.getElementById("testToggle");
  function testHidden(){return (localStorage.getItem(TEST_KEY)||"Y").toUpperCase()==="Y";}
  function drawTestControl(){
    const hidden=testHidden();
    testStatus.textContent="TEST CONTENT: "+(hidden?"OFF":"ON");
    testStatus.className=hidden?"off":"on";
    testToggle.textContent=hidden?"TURN TEST CONTENT ON":"TURN TEST CONTENT OFF";
    testToggle.className=hidden?"enable":"disable";
  }
  testToggle.addEventListener("click",()=>{
    localStorage.setItem(TEST_KEY,testHidden()?"N":"Y");
    drawTestControl();
  });
  drawTestControl();
}
