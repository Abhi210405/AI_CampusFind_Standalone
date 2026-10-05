const KEY = "campusFindPrototype";
let data = JSON.parse(localStorage.getItem(KEY) || '{"items":[],"returns":[]}');
let selectedMatch = null;

const $ = id => document.getElementById(id);
$("date").valueAsDate = new Date();

function save(){ localStorage.setItem(KEY, JSON.stringify(data)); updateStats(); renderMatches(); renderRecords(); }
function updateStats(){
  $("itemCount").textContent = data.items.length;
  $("matchCount").textContent = data.items.filter(x=>x.matches && x.matches.length).length;
  $("returnCount").textContent = data.returns.length;
}
function toast(msg){ const t=$("toast"); t.textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),2200); }

document.querySelectorAll(".tab").forEach(btn=>{
  btn.onclick=()=>showTab(btn.dataset.tab);
});
function showTab(id){
  document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x.dataset.tab===id));
  document.querySelectorAll(".panel").forEach(x=>x.classList.remove("active-panel"));
  $(id).classList.add("active-panel");
  if(id==="matches") renderMatches();
  if(id==="records") renderRecords();
}

$("photo").onchange = e => {
  const f=e.target.files[0]; if(!f) return;
  const reader=new FileReader();
  reader.onload=ev=>{ $("preview").src=ev.target.result; $("preview").style.display="block"; $("uploadContent").style.display="none"; };
  reader.readAsDataURL(f);
};

function normalize(s){return String(s||"").trim().toLowerCase()}
function extractAttributes(item){
  const text = `${item.itemName} ${item.category} ${item.color} ${item.brand} ${item.details}`.toLowerCase();
  const colors=["black","white","blue","red","green","yellow","grey","gray","brown","silver","gold"];
  const brands=["lenovo","hp","dell","apple","iphone","samsung","boat","nike","adidas","asus","acer","mi","oneplus"];
  const detectedColors=colors.filter(x=>text.includes(x));
  const detectedBrands=brands.filter(x=>text.includes(x));
  return {
    category:item.category,
    color:item.color || detectedColors[0] || "unknown",
    brand:item.brand || detectedBrands[0] || "unknown",
    visibleMarks:item.details || "not provided",
    context:item.location
  };
}

function score(a,b){
  let s=0, reasons=[];
  if(normalize(a.category)===normalize(b.category)){s+=35;reasons.push("same category")}
  if(normalize(a.color) && normalize(a.color)!=="unknown" && normalize(a.color)===normalize(b.color)){s+=20;reasons.push("same color")}
  if(normalize(a.brand) && normalize(a.brand)!=="unknown" && normalize(a.brand)===normalize(b.brand)){s+=15;reasons.push("same brand")}
  if(normalize(a.location)===normalize(b.location)){s+=15;reasons.push("same location")}
  const d1=new Date(a.date), d2=new Date(b.date), days=Math.abs((d1-d2)/86400000);
  if(days<=2){s+=10;reasons.push("close date")}
  else if(days<=7)s+=5;
  const tokens=normalize(a.itemName+" "+a.details).split(/\W+/).filter(x=>x.length>2);
  const bt=normalize(b.itemName+" "+b.details);
  const overlap=[...new Set(tokens.filter(t=>bt.includes(t)))];
  s+=Math.min(5,overlap.length);
  if(overlap.length)reasons.push("matching details");
  return {score:Math.min(99,s),reasons};
}
function getMatches(item){
  return data.items.filter(x=>x.id!==item.id && x.type!==item.type).map(x=>{
    const r=score(item,x); return {...x, matchScore:r.score, reasons:r.reasons};
  }).filter(x=>x.matchScore>=25).sort((a,b)=>b.matchScore-a.matchScore).slice(0,6);
}

$("reportForm").onsubmit=e=>{
  e.preventDefault();
  const item={
    id:Date.now(), type:$("reportType").value, category:$("category").value,
    itemName:$("itemName").value, location:$("location").value,
    color:$("color").value, brand:$("brand").value, date:$("date").value,
    details:$("details").value, status:"Open", created:new Date().toISOString()
  };
  item.attributes=extractAttributes(item);
  item.matches=getMatches(item);
  data.items.push(item); save();

  $("analysisResult").classList.remove("hidden");
  $("analysisResult").innerHTML=`<h4>✓ AI-style attribute extraction complete</h4>
  <p style="color:#8ea5bd;margin-top:0">Prototype extraction generated these searchable attributes from your input:</p>
  <div class="chips">
    <span class="chip">Category: ${item.attributes.category}</span>
    <span class="chip">Color: ${item.attributes.color}</span>
    <span class="chip">Brand: ${item.attributes.brand}</span>
    <span class="chip">Context: ${item.attributes.context}</span>
  </div>`;
  $("reportForm").reset(); $("date").valueAsDate=new Date();
  $("preview").style.display="none"; $("uploadContent").style.display="block";
  toast("Report created and candidate matches ranked");
  showTab("matches");
};

function renderMatches(){
  const list=$("matchList");
  if(!data.items.length){list.innerHTML=`<div class="empty"><div>⌕</div><h4>No reports yet</h4><p>Create a report to generate ranked candidate matches.</p></div>`;return}
  const latest=data.items[data.items.length-1];
  const matches=getMatches(latest);
  if(!matches.length){list.innerHTML=`<div class="empty"><div>⌕</div><h4>No strong matches yet</h4><p>Try adding more details such as brand, color, location and a private mark.</p></div>`;return}
  list.innerHTML=matches.map(m=>`
    <article class="match-card">
      <div>
        <div class="match-title">${escapeHtml(m.itemName)}</div>
        <div class="meta"><span>${escapeHtml(m.category)}</span><span>•</span><span>${escapeHtml(m.color||"Unknown")}</span><span>•</span><span>${escapeHtml(m.brand||"Unknown")}</span><span>•</span><span>${escapeHtml(m.location)}</span></div>
        <p><b>Why it matched:</b> ${m.reasons.join(", ")}</p>
        <div class="actions"><button class="primary verify-btn" data-id="${m.id}">Start verification →</button></div>
      </div>
      <div class="score">${m.matchScore}%<small>match</small></div>
    </article>`).join("");
  document.querySelectorAll(".verify-btn").forEach(b=>b.onclick=()=>startVerify(Number(b.dataset.id)));
}
function startVerify(id){
  selectedMatch=data.items.find(x=>x.id===id);
  if(!selectedMatch)return;
  $("verifyEmpty").classList.add("hidden"); $("verifyForm").classList.remove("hidden");
  $("verifyTitle").textContent=`Verify: ${selectedMatch.itemName}`;
  $("verifyPrompt").innerHTML=`For security, tell us one private detail associated with this item. <b>Hint:</b> the report contains a private detail that should not be publicly visible.`;
  $("verifyAnswer").value=""; $("verifyResult").innerHTML=""; $("handoverCard").classList.add("hidden"); $("handoverResult").innerHTML="";
  showTab("verify");
}
$("verifyForm").onsubmit=e=>{
  e.preventDefault();
  if(!selectedMatch)return;

  const answer=normalize($("verifyAnswer").value);
  const expected=normalize(selectedMatch.details);
  const keywords=expected.split(/\W+/).filter(x=>x.length>=4);
  const ok=answer && (answer===expected || keywords.some(k=>answer.includes(k)));

  if(ok){
    const sourceItem=data.items.find(x=>x.id===selectedMatch.id);
    if(!sourceItem)return;

    sourceItem.status="Verified — Awaiting Handover";
    sourceItem.verifiedAt=new Date().toISOString();

    const passId="CF-"+Math.floor(100000+Math.random()*900000);
    sourceItem.handoverPass={
      id:passId,
      location:"Campus Security Desk",
      status:"AUTHORIZED",
      createdAt:new Date().toISOString()
    };
    save();

    $("verifyResult").innerHTML=`<div class="success">✓ Ownership verified. A Safe Handover Pass has been generated.</div>`;
    $("handoverCard").classList.remove("hidden");
    $("passId").textContent=passId;
    $("passItem").textContent=sourceItem.itemName;
    $("passLocation").textContent=sourceItem.handoverPass.location;
    $("handoverResult").innerHTML="";
    toast("Ownership verified — handover pass created");
  }else{
    $("verifyResult").innerHTML=`<div class="error">✕ Verification failed. The private detail did not match. No handover pass was created.</div>`;
  }
};

$("cancelVerify").onclick=()=>{selectedMatch=null;$("verifyForm").classList.add("hidden");$("handoverCard").classList.add("hidden");$("verifyEmpty").classList.remove("hidden");showTab("matches");};
$("refreshMatches").onclick=()=>{renderMatches();toast("Matches refreshed")};

function renderRecords(){
  const list=$("recordList");
  if(!data.items.length){list.innerHTML=`<div class="empty"><div>▣</div><h4>No records</h4><p>Your reports will appear here.</p></div>`;return}
  list.innerHTML=[...data.items].reverse().map(x=>`
    <div class="record">
      <div>
        <b>${escapeHtml(x.itemName)}</b>
        <p>${escapeHtml(x.type)} • ${escapeHtml(x.category)} • ${escapeHtml(x.location)} • ${escapeHtml(x.date)}</p>
        ${x.handoverPass ? `<p class="record-action">Pass: <b>${escapeHtml(x.handoverPass.id)}</b> • ${escapeHtml(x.handoverPass.location)} • ${escapeHtml(x.handoverPass.status)}</p>` : ""}
      </div>
      <div><span class="tag ${x.status==="Returned"?"returned":""}">${x.status}</span></div>
    </div>`).join("");
}
$("confirmHandover").onclick=()=>{
  if(!selectedMatch)return;
  const item=data.items.find(x=>x.id===selectedMatch.id);
  if(!item || !item.handoverPass)return;

  item.status="Returned";
  item.returnedAt=new Date().toISOString();
  item.handoverPass.status="COMPLETED";

  data.returns.push({
    itemId:item.id,
    itemName:item.itemName,
    passId:item.handoverPass.id,
    time:item.returnedAt,
    location:item.handoverPass.location
  });
  save();

  $("handoverResult").innerHTML=`<div class="handover-success"><b>✓ ITEM RETURNED SUCCESSFULLY</b><br>Security handover recorded against pass <b>${item.handoverPass.id}</b>. The recovery lifecycle is now complete.</div>`;
  $("confirmHandover").disabled=true;
  $("confirmHandover").textContent="✓ Handover Completed";
  toast("Physical handover recorded");
};

$("copyPass").onclick=async()=>{
  const id=$("passId").textContent;
  try{
    await navigator.clipboard.writeText(id);
    toast("Pass ID copied: "+id);
  }catch(e){
    toast("Pass ID: "+id);
  }
};

$("clearData").onclick=()=>{
  if(confirm("Clear all local prototype records?")){data={items:[],returns:[]};save();toast("Local records cleared")}
};
$("demoBtn").onclick=()=>{
  const today=new Date().toISOString().slice(0,10);
  data.items=[
    {id:101,type:"lost",category:"Laptop",itemName:"Black Lenovo laptop",location:"Library Block B",color:"Black",brand:"Lenovo",date:today,details:"small scratch near the hinge",status:"Open"},
    {id:102,type:"found",category:"Laptop",itemName:"Lenovo ThinkPad black laptop",location:"Library Block B",color:"Black",brand:"Lenovo",date:today,details:"small scratch near the hinge",status:"Open"},
    {id:103,type:"found",category:"Wallet",itemName:"Brown leather wallet",location:"Cafeteria",color:"Brown",brand:"",date:today,details:"blue card sleeve inside",status:"Open"}
  ];
  data.items.forEach(x=>x.attributes=extractAttributes(x)); save();
  toast("Demo reports loaded");
  showTab("matches");
};
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
updateStats();renderMatches();renderRecords();

function renderRadar(){
  const stats=$("radarStats"), hotspots=$("hotspotList");
  if(!data.items.length){
    stats.innerHTML=`<div class="radar-stat"><b>0</b><span>Reports analyzed</span></div><div class="radar-stat"><b>—</b><span>Top hotspot</span></div><div class="radar-stat"><b>—</b><span>Top category</span></div>`;
    hotspots.innerHTML=`<div class="empty"><div>◉</div><h4>Not enough data</h4><p>Create a few lost/found reports to activate Recovery Radar.</p></div>`;
    return;
  }
  const locations={}, cats={};
  data.items.forEach(x=>{locations[x.location]=(locations[x.location]||0)+1; cats[x.category]=(cats[x.category]||0)+1});
  const locs=Object.entries(locations).sort((a,b)=>b[1]-a[1]);
  const cat=Object.entries(cats).sort((a,b)=>b[1]-a[1])[0];
  stats.innerHTML=`<div class="radar-stat"><b>${data.items.length}</b><span>Reports analyzed</span></div>
    <div class="radar-stat"><b>${escapeHtml(locs[0][0])}</b><span>Top recovery hotspot</span></div>
    <div class="radar-stat"><b>${escapeHtml(cat[0])}</b><span>Most reported category</span></div>`;
  const max=locs[0][1];
  hotspots.innerHTML=locs.slice(0,6).map(([location,count])=>{
    const risk=count>=3?"HIGH":count===2?"MEDIUM":"WATCH";
    return `<article class="hotspot">
      <div class="hotspot-head"><h4>${escapeHtml(location)}</h4><span class="risk">${risk} RISK</span></div>
      <p>${count} report${count>1?"s":""} detected here. ${count>=2?"CampusFind recommends extra awareness / security attention at this location.":"Continue monitoring this location as more reports arrive."}</p>
      <div class="bar"><i style="width:${Math.max(15,Math.round(count/max*100))}%"></i></div>
    </article>`;
  }).join("");
}
$("refreshRadar").onclick=()=>{renderRadar();toast("Recovery patterns analyzed")};
const oldShowTab=showTab;
showTab=function(id){oldShowTab(id);if(id==="radar")renderRadar();};
renderRadar();
