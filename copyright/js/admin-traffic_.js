// Traffic Analytics module — extracted from admin-core_.js without behavior changes.
function drawTrafficValue(elementId,data){
  const el=document.getElementById(elementId);
  el.textContent=`${data?.activeUsers ?? 0} active users · ${data?.pageViews ?? 0} page views`;
}

export async function loadTrafficAnalytics({db,getDoc,doc}){
  const trafficError=document.getElementById("trafficError");
  const trafficUpdated=document.getElementById("trafficUpdated");
  trafficError.textContent="";
  try{
    const snap=await getDoc(doc(db,"trafficAnalytics","current"));
    if(!snap.exists()) throw new Error("Traffic analytics snapshot not found.");
    const data=snap.data();
    drawTrafficValue("trafficToday",data.today);
    drawTrafficValue("traffic7",data.last7Days);
    drawTrafficValue("traffic30",data.last30Days);
    drawTrafficValue("trafficAll",data.allTime);
    const updated=data.updatedAt?.toDate?.();
    trafficUpdated.textContent=updated?`Last updated: ${updated.toLocaleString()}`:"";
  }catch(e){
    trafficError.textContent="Traffic analytics unavailable.";
    console.error(e);
  }
}
