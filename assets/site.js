
(()=>{
/* ====== SETTINGS: edit these at launch ====== */
const CONFIG={
  ENDPOINT:"https://script.google.com/macros/s/AKfycbzjohpJ9nFGDLFu-7U92GwPEHphglaP7LWfcTB-hGuo9bseA5duYijw40GzPbJmhPTQ/exec",  // Google Apps Script web app (campaign forms Sheet)
  PHONE_DISPLAY:"778-998-4736",      // Campaign phone or text number
  PHONE_TEL:"17789984736",           // Same number, digits only
  LINKS:{
    pledge:"/pledge",   // the campaign's own pledge page
    donate:"https://www.virenderdass.ca/donate",
    video:""                                // Launch video URL (YouTube). Leave empty to hide the "Watch the launch video" button
  },
  SHOW_SAMPLE_NOTES:false             // Set to false at launch so only real, approved notes appear
};
/* ============================================ */

const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const loadedAt=Date.now();

/* links */
$$("[data-link]").forEach(a=>{const u=CONFIG.LINKS[a.dataset.link];if(u){a.href=u}else if(a.hasAttribute("data-optional")){a.hidden=true}else{a.href="#"}});
const pl=$("#phone-link");
if(pl){pl.textContent=CONFIG.PHONE_DISPLAY;if(CONFIG.PHONE_TEL){pl.href="tel:+"+CONFIG.PHONE_TEL.replace(/\D/g,"")}else{pl.removeAttribute("href")}}

/* menu */
const menuBtn=$(".menu-btn"),nav=$("#nav");
menuBtn.addEventListener("click",()=>{const o=menuBtn.getAttribute("aria-expanded")!=="true";menuBtn.setAttribute("aria-expanded",String(o));nav.classList.toggle("open",o)});
$$("#nav a, #nav button").forEach(el=>el.addEventListener("click",()=>{nav.classList.remove("open");menuBtn.setAttribute("aria-expanded","false")}));

/* form definitions */
const TOPICS=["Health care","Roads and highways","Flood protection","Cost of living","Housing","Public safety","Something else"];
const FORMS={
  yoursay:{title:"Share your say",submit:"Send my note",
    ok:"Thank you. A person on the team will read your note. If you left contact details, you will hear back within 48 hours.",
    fields:[
      {n:"topic",l:"What is this about?",t:"select",o:TOPICS,req:1},
      {n:"message",l:"Your message",t:"textarea",req:1,max:600},
      {n:"postal_code",l:"Postal code",t:"text",req:1,ac:"postal-code",pat:"postal",h:"So we know which part of the riding you are in."},
      {n:"first_name",l:"First name",opt:1,t:"text",ac:"given-name"},
      {n:"contact",l:"Email or mobile",opt:1,t:"text",pat:"contact",ac:"email",h:"Only if you want a reply."},
      {n:"consent_reply",t:"check",l:"The team may contact me about this note."},
      {n:"consent_publish",t:"check",l:"The team may show my message on the wall, with my first name only."},
      {n:"privacy",t:"check",req:1,priv:1}
    ]},
  volunteer:{title:"Volunteer",intro:"Tell us how you would like to help. A volunteer coordinator will be in touch.",submit:"Sign me up",
    ok:"Thank you for volunteering. A coordinator will contact you shortly.",
    fields:[
      {n:"first_name",l:"First name",t:"text",req:1,ac:"given-name"},
      {n:"last_name",l:"Last name",t:"text",req:1,ac:"family-name"},
      {n:"mobile",l:"Mobile number",t:"tel",req:1,ac:"tel",pat:"phone"},
      {n:"email",l:"Email",t:"email",req:1,ac:"email",pat:"email"},
      {n:"postal_code",l:"Postal code",t:"text",req:1,ac:"postal-code",pat:"postal"},
      {n:"help",l:"How would you like to help?",t:"checks",o:["Knocking on doors","Making phone calls","Data entry and office help","Events and community fairs","Delivering lawn signs","Social media and video"]},
      {n:"availability",l:"When are you usually free?",t:"select",o:["Weekday daytime","Weekday evenings","Weekends","Flexible"]},
      {n:"consent_contact",t:"check",req:1,l:"The campaign may contact me by phone, text and email about volunteering."},
      {n:"privacy",t:"check",req:1,priv:1}
    ]},
  lawnsign:{title:"Get a lawn sign",intro:"We will confirm your address and arrange delivery.",submit:"Request a sign",
    ok:"Thank you. We will contact you to arrange delivery.",
    fields:[
      {n:"first_name",l:"First name",t:"text",req:1,ac:"given-name"},
      {n:"last_name",l:"Last name",t:"text",req:1,ac:"family-name"},
      {n:"mobile",l:"Mobile number",t:"tel",req:1,ac:"tel",pat:"phone"},
      {n:"email",l:"Email",opt:1,t:"email",ac:"email",pat:"email"},
      {n:"street",l:"Street address",t:"text",req:1,ac:"street-address"},
      {n:"city",l:"City",t:"select",o:["Abbotsford","Mission","Other"],req:1},
      {n:"postal_code",l:"Postal code",t:"text",req:1,ac:"postal-code",pat:"postal"},
      {n:"owner_ok",t:"check",req:1,l:"I own this property or have the owner's permission to put up a sign."},
      {n:"consent_contact",t:"check",req:1,l:"The campaign may contact me about my sign."},
      {n:"privacy",t:"check",req:1,priv:1}
    ]},
  invite:{title:"Invite Virender",intro:"A coffee, a club meeting, a business visit. Tell us what you have in mind.",submit:"Send invitation",
    ok:"Thank you. The team will check Virender's schedule and reply.",
    fields:[
      {n:"first_name",l:"Your name",t:"text",req:1,ac:"name"},
      {n:"organization",l:"Group or business",opt:1,t:"text",ac:"organization"},
      {n:"email",l:"Email",t:"email",req:1,ac:"email",pat:"email"},
      {n:"mobile",l:"Mobile number",opt:1,t:"tel",ac:"tel",pat:"phone"},
      {n:"event_type",l:"What kind of event?",t:"select",o:["Coffee or small gathering","Community group or club","Business visit","Public event","Something else"]},
      {n:"date",l:"Preferred date and time",opt:1,t:"text"},
      {n:"location",l:"Where?",opt:1,t:"text"},
      {n:"details",l:"Anything else we should know?",opt:1,t:"textarea",max:500},
      {n:"consent_contact",t:"check",req:1,l:"The campaign may contact me about this invitation."},
      {n:"privacy",t:"check",req:1,priv:1}
    ]},
  updates:{title:"Get updates",intro:"Campaign news and events. You can unsubscribe at any time.",submit:"Join the list",
    ok:"Thank you. You are on the list.",
    fields:[
      {n:"first_name",l:"First name",t:"text",req:1,ac:"given-name"},
      {n:"email",l:"Email",t:"email",req:1,ac:"email",pat:"email"},
      {n:"postal_code",l:"Postal code",t:"text",req:1,ac:"postal-code",pat:"postal"},
      {n:"mobile",l:"Mobile number",opt:1,t:"tel",ac:"tel",pat:"phone"},
      {n:"consent_email",t:"check",req:1,l:"Send me campaign updates by email."},
      {n:"consent_sms",t:"check",l:"Send me campaign updates by text. Message and data rates may apply."},
      {n:"privacy",t:"check",req:1,priv:1}
    ]},
  pledge:{title:"Pledge your support",submit:"Add my pledge",
    ok:"Thank you. Your pledge is in. We will be in touch with voting dates and places.",
    fields:[
      {n:"first_name",l:"First name",t:"text",req:1,ac:"given-name"},
      {n:"last_name",l:"Last name",t:"text",req:1,ac:"family-name"},
      {n:"email",l:"Email",t:"email",req:1,ac:"email",pat:"email"},
      {n:"mobile",l:"Mobile number",opt:1,t:"tel",ac:"tel",pat:"phone"},
      {n:"postal_code",l:"Postal code",t:"text",req:1,ac:"postal-code",pat:"postal"},
      {n:"pledge",t:"check",req:1,l:"I plan to vote for Virender Dass in Abbotsford-Mission."},
      {n:"consent_email",t:"check",l:"Send me campaign updates and voting reminders by email, and by text if I add a mobile number. Message and data rates may apply."},
      {n:"privacy",t:"check",req:1,priv:1}
    ]}
};

/* validation */
const RX={postal:/^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i,email:/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,phone:/^\+?1?[\s().-]*\d{3}[\s().-]*\d{3}[\s.-]*\d{4}$/};
function check(f,v){
  if(f.t==="check"){return (f.req&&!v)?(f.priv?"Please confirm you have read the privacy notice.":"Please tick this box to continue."):""}
  const val=String(v||"").trim();
  if(f.req&&!val)return "This field is required.";
  if(!val)return "";
  if(f.pat==="postal"&&!RX.postal.test(val))return "Enter a Canadian postal code, like V2S 1A1.";
  if(f.pat==="email"&&!RX.email.test(val))return "Enter a valid email address.";
  if(f.pat==="phone"&&!RX.phone.test(val))return "Enter a 10-digit phone number.";
  if(f.pat==="contact"&&!(RX.email.test(val)||RX.phone.test(val)))return "Enter a valid email address or phone number.";
  return "";
}

/* send a form to the Google Sheet: read the reply, retry on Google error pages, never fail silently */
async function sendToSheet(url,payload){
  const opts={method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload)};
  for(let i=0;i<3;i++){
    try{
      const r=await fetch(url,opts),t=await r.text();let j=null;try{j=JSON.parse(t)}catch(e){}
      if(j&&j.ok)return true;
    }catch(e){
      try{await fetch(url,Object.assign({},opts,{mode:"no-cors"}));return true}catch(e2){}
    }
    await new Promise(res=>setTimeout(res,1000*(i+1)));
  }
  return false;
}

/* build a form */
function el(tag,attrs={},html){const e=document.createElement(tag);for(const k in attrs){if(k==="class")e.className=attrs[k];else e.setAttribute(k,attrs[k])}if(html!==undefined)e.innerHTML=html;return e}
function buildForm(key,mount,onDone){
  const def=FORMS[key];const form=el("form",{novalidate:"",autocomplete:"on"});
  const uid=key+"-"+Math.random().toString(36).slice(2,6);
  def.fields.forEach(f=>{
    const id=uid+"-"+f.n;
    if(f.t==="check"){
      const row=el("div",{class:"field"});
      const lab=el("label",{class:"check",for:id});
      const cb=el("input",{type:"checkbox",id:id,name:f.n});
      lab.appendChild(cb);
      const sp=el("span");
      if(f.priv){sp.innerHTML='I have read the <a href="#" data-privacy>privacy notice</a>.'}else{sp.textContent=f.l}
      lab.appendChild(sp);row.appendChild(lab);
      row.appendChild(el("p",{class:"err",id:id+"-e",role:"alert"}));
      form.appendChild(row);return;
    }
    const row=el("div",{class:"field"});
    if(f.t==="checks"){
      row.appendChild(el("span",{class:"lab",id:id+"-l"},f.l+' <span class="opt">(optional)</span>'));
      const g=el("div",{class:"checks",role:"group","aria-labelledby":id+"-l"});
      f.o.forEach((o,i)=>{const l=el("label",{class:"check",for:id+i});l.appendChild(el("input",{type:"checkbox",id:id+i,name:f.n,value:o}));l.appendChild(el("span",{},o));g.appendChild(l)});
      row.appendChild(g);form.appendChild(row);return;
    }
    row.appendChild(el("label",{for:id},f.l+(f.opt?' <span class="opt">(optional)</span>':"")));
    let inp;
    if(f.t==="textarea"){inp=el("textarea",{id:id,name:f.n});if(f.max)inp.setAttribute("maxlength",f.max)}
    else if(f.t==="select"){inp=el("select",{id:id,name:f.n});inp.appendChild(el("option",{value:""},"Choose one"));f.o.forEach(o=>inp.appendChild(el("option",{value:o},o)))}
    else{inp=el("input",{id:id,name:f.n,type:f.t==="tel"?"tel":(f.t==="email"?"email":"text")});if(f.t==="tel")inp.setAttribute("inputmode","tel");if(f.t==="email")inp.setAttribute("inputmode","email")}
    if(f.ac)inp.setAttribute("autocomplete",f.ac);
    if(f.req)inp.setAttribute("aria-required","true");
    row.appendChild(inp);
    if(f.h)row.appendChild(el("p",{class:"help",id:id+"-h"},f.h));
    if(f.max&&f.t==="textarea"){const c=el("p",{class:"count","aria-hidden":"true"},"0 / "+f.max);inp.addEventListener("input",()=>{c.textContent=inp.value.length+" / "+f.max});row.appendChild(c)}
    row.appendChild(el("p",{class:"err",id:id+"-e",role:"alert"}));
    form.appendChild(row);
  });
  /* honeypot */
  form.appendChild(el("div",{class:"hp","aria-hidden":"true"},'<label>Leave this empty<input type="text" name="website" tabindex="-1" autocomplete="off"></label>'));
  const sub=el("div",{class:"submit-row"});
  const btn=el("button",{class:"btn btn-navy",type:"submit"},def.submit);
  sub.appendChild(btn);form.appendChild(sub);
  form.appendChild(el("p",{class:"fine"},"We use what you send to run the campaign and to reply to you. See the privacy notice."));

  const dep=def.fields.filter(f=>f.showIf);
  if(dep.length){const src=form.elements[dep[0].showIf];const sync=()=>dep.forEach(f=>{form.elements[f.n].closest(".field").hidden=!src.checked});src.addEventListener("change",sync);sync()}
  form.addEventListener("submit",async e=>{
    e.preventDefault();
    let bad=null;const data={};
    def.fields.forEach(f=>{
      const id=uid+"-"+f.n;const row=document.getElementById(id)?.closest(".field")||form.querySelector('[name="'+f.n+'"]')?.closest(".field");
      if(f.showIf&&row&&row.hidden){data[f.n]=(f.t==="check")?"no":"";return}
      let v;
      if(f.t==="check"){v=form.elements[f.n].checked;data[f.n]=v?"yes":"no"}
      else if(f.t==="checks"){v=$$('input[name="'+f.n+'"]:checked',form).map(x=>x.value).join(", ");data[f.n]=v;return}
      else{v=form.elements[f.n].value;data[f.n]=v.trim()}
      const msg=check(f,v);const eEl=document.getElementById(id+"-e");
      if(row)row.classList.toggle("invalid",!!msg);
      if(eEl)eEl.textContent=msg;
      const ctl=form.elements[f.n];if(ctl&&ctl.setAttribute){msg?ctl.setAttribute("aria-invalid","true"):ctl.removeAttribute("aria-invalid")}
      if(msg&&!bad)bad=ctl;
    });
    if(bad){bad.focus();return}
    if(key==="pledge")data.consent_sms=(data.consent_email==="yes"&&data.mobile)?"yes":"no";
    if(key==="updates"&&data.consent_email!=="yes"&&data.consent_sms!=="yes"){return}
    btn.disabled=true;btn.textContent="Sending";
    const spam=form.elements.website.value||(Date.now()-loadedAt<2500);
    const ref=String(Math.floor(100000+Math.random()*900000));
    let demo=!CONFIG.ENDPOINT;
    try{
      if(!spam&&!demo){
        const okSent=await sendToSheet(CONFIG.ENDPOINT,Object.assign({type:key,ref:ref,submitted_at:new Date().toISOString(),page:location.href},data));
        if(!okSent)throw new Error("send failed");
      }else{await new Promise(r=>setTimeout(r,500))}
    }catch(err){
      btn.disabled=false;btn.textContent=def.submit;
      const m=el("p",{class:"err",role:"alert",style:"display:block"},"Something went wrong and your message was not sent. Please try again, or call or text the campaign.");
      sub.after(m);setTimeout(()=>m.remove(),8000);return;
    }
    const done=el("div",{class:"done",tabindex:"-1"});
    done.appendChild(el("h3",{},"Thank you."));
    done.appendChild(el("p",{},def.ok));
    if(key==="yoursay")done.appendChild(el("p",{class:"ref"},"Your reference code: <strong>"+ref+"</strong>"));
    if(key==="pledge"){
      const pre={first_name:data.first_name,last_name:data.last_name,email:data.email,mobile:data.mobile,postal_code:data.postal_code};
      const nx=el("div",{class:"next"}),row=el("div",{class:"next-btns"});
      nx.appendChild(el("h4",{},"Two more ways to help"));
      const b1=el("button",{class:"btn btn-navy",type:"button"},"Request a lawn sign"),b2=el("button",{class:"btn btn-line",type:"button"},"Volunteer");
      b1.addEventListener("click",()=>openForm("lawnsign",pre));b2.addEventListener("click",()=>openForm("volunteer",pre));
      row.append(b1,b2);nx.appendChild(row);done.appendChild(nx);
    }
    if(demo)done.appendChild(el("p",{class:"demo-note"},"Demo mode: nothing was sent or saved."));
    mount.replaceChildren(done);done.focus();
    if(onDone)onDone();
  });
  mount.replaceChildren(form);
}

/* dialogs */
const dlg=$("#dlg");
function openForm(key,pre){
  const d=FORMS[key];$("#dlg-title").textContent=d.title;$("#dlg-intro").textContent=d.intro||"";
  buildForm(key,$("#dlg-body"));
  if(pre){const fm=$("#dlg-body form");for(const k in pre){if(pre[k]&&fm.elements[k])fm.elements[k].value=pre[k]}}
  dlg.showModal();
}
function openPrivacy(){
  $("#dlg-title").textContent="Privacy notice";$("#dlg-intro").textContent="Draft for review. Replace with the approved notice before launch.";
  $("#dlg-body").innerHTML='<div class="priv">'+
  '<h3>What we collect</h3><p>What you type into our forms: your message, postal code and any contact details, name or address you choose to give. If you pledge your support, we also keep that you plan to vote for Virender.</p>'+
  '<h3>Why</h3><ul><li>To read and reply to your note.</li><li>To arrange volunteering, lawn signs and invitations.</li><li>To send campaign updates if you asked for them.</li></ul>'+
  '<h3>The wall</h3><p>We only show your message if you ticked the box, with your first name only. A person checks every note first.</p>'+
  '<h3>Who sees it</h3><p>The campaign team, OneBC, and the service providers that run our forms and email. Your details may be added to the OneBC supporter list.</p>'+
  '<h3>Your choices</h3><p>You can ask us to correct or delete your information, or stop messages, at any time at virender.dass@1bc.ca.</p></div>';
  dlg.showModal();
}
$$("[data-form]").forEach(b=>b.addEventListener("click",()=>openForm(b.dataset.form)));
$$("[data-privacy-open]").forEach(b=>b.addEventListener("click",openPrivacy));
document.addEventListener("click",e=>{const a=e.target.closest("[data-privacy]");if(a){e.preventDefault();openPrivacy()}});
$("#dlg-x").addEventListener("click",()=>dlg.close());
dlg.addEventListener("click",e=>{if(e.target===dlg)dlg.close()});

/* inline Your Say form */
if($("#say-form"))buildForm("yoursay",$("#say-form"));
if($("#pledge-form"))buildForm("pledge",$("#pledge-form"));

/* share buttons on the pledge page */
(function(){
  const url="https://virenderdass.ca/pledge",text="I am pledging my vote for Virender Dass in Abbotsford-Mission. Join me:",enc=encodeURIComponent;
  const map={facebook:"https://www.facebook.com/sharer/sharer.php?u="+enc(url),
    x:"https://twitter.com/intent/tweet?text="+enc(text)+"&url="+enc(url),
    whatsapp:"https://wa.me/?text="+enc(text+" "+url),
    email:"mailto:?subject="+enc("Pledge your vote for Virender Dass")+"&body="+enc(text+"\n\n"+url)};
  $$("[data-share]").forEach(a=>{a.href=map[a.dataset.share]||"#"});
  const c=$("[data-copy]");
  if(c)c.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(url);c.textContent="Link copied"}catch(err){window.prompt("Copy this link",url)}setTimeout(()=>{c.textContent="Copy link"},2500)});
})();

/* wall of notes */
const SAMPLE=[
  {id:"000001",topic:"Health care",text:"The ER in Mission keeps closing overnight. Where are we supposed to go at 2 a.m.?",name:"Sample",c:"n-gold"},
  {id:"000002",topic:"Roads and highways",text:"Highway 1 at 5 p.m. is a parking lot. We were promised widening years ago.",name:"Sample",c:"n-white"},
  {id:"000003",topic:"Cost of living",text:"Groceries and gas take most of my paycheque before rent is even paid.",name:"Sample",c:"n-lilac"},
  {id:"000004",topic:"Flood protection",text:"Please fix the dikes before the next flood. We cannot keep doing this.",name:"Sample",c:"n-blush"},
  {id:"000005",topic:"Public safety",text:"Break-ins on our street keep happening and nothing seems to change.",name:"Sample",c:"n-white"},
  {id:"000006",topic:"Something else",text:"Just show up. Knock on my door and listen.",name:"Sample",c:"n-gold"}
];
const COLORS=["n-gold","n-white","n-lilac","n-blush"];
function renderWall(notes,sample){
  const wall=$("#wall");wall.replaceChildren();
  $("#wall-flag").hidden=!sample;
  if(!notes.length){wall.appendChild(el("div",{class:"wall-empty"},"<strong>No notes on the wall yet.</strong><br>Be the first to share your say above."));return}
  notes.forEach((n,i)=>{
    const c=n.c||COLORS[i%COLORS.length];
    const card=el("article",{class:"note "+c});
    if(sample)card.appendChild(el("span",{class:"sample"},"Sample"));
    const t=el("span",{class:"topic"});t.textContent=n.topic||"Your say";
    const p=el("p",{class:"text"});p.textContent=n.text;
    const m=el("div",{class:"meta"});const a=el("span");a.textContent=n.name||"A neighbour";const b=el("span");b.textContent="#"+(n.id||"");
    m.append(a,b);card.append(t,p,m);wall.appendChild(card);
  });
}
async function loadWall(){
  let notes=[];
  if(CONFIG.ENDPOINT){$("#wall").replaceChildren(el("div",{class:"wall-empty"},"Loading notes..."))}
  if(CONFIG.ENDPOINT){
    for(let i=0;i<2&&!notes.length;i++){try{const r=await fetch(CONFIG.ENDPOINT+"?action=notes");const j=await r.json();notes=(j&&j.notes)||[];break}catch(e){await new Promise(res=>setTimeout(res,1200))}}
  }
  if(notes.length)return renderWall(notes,false);
  if(CONFIG.SHOW_SAMPLE_NOTES)return renderWall(SAMPLE,true);
  renderWall([],false);
}
if($("#wall"))loadWall();

/* countdown to Final Voting Day (Oct 24, 2026, Pacific Daylight Time) */
(function(){
  const box=document.getElementById("countdown");if(!box)return;
  const T_ADV=new Date("2026-10-16T00:00:00-07:00").getTime();
  const T_ADV_END=new Date("2026-10-22T00:00:00-07:00").getTime();
  const T_DAY=new Date("2026-10-24T00:00:00-07:00").getTime();
  const T_CLOSE=new Date("2026-10-24T20:00:00-07:00").getTime();
  const els={d:$("#cd-d"),h:$("#cd-h"),m:$("#cd-m"),s:$("#cd-s")},label=$("#cd-label"),status=$("#cd-status"),sr=$("#cd-sr"),grid=$(".cd-grid",box);
  const two=n=>String(n).padStart(2,"0");let lastSr="";
  function tick(){
    const now=Date.now();
    if(now>=T_CLOSE){grid.hidden=true;label.textContent="Voting is closed. Thank you.";status.textContent="Results are published by Elections BC.";return}
    if(now>=T_DAY){grid.hidden=true;label.textContent="Election day is today.";status.textContent="Voting places are open until 8 p.m. Find yours at wheretovote.elections.bc.ca.";return}
    const diff=T_DAY-now,d=Math.floor(diff/864e5),h=Math.floor(diff%864e5/36e5),m=Math.floor(diff%36e5/6e4),s=Math.floor(diff%6e4/1e3);
    els.d.textContent=d;els.h.textContent=two(h);els.m.textContent=two(m);els.s.textContent=two(s);
    label.textContent="Until election day, Saturday, October 24";
    status.textContent= now<T_ADV ? "Advance voting opens Friday, October 16." : now<T_ADV_END ? "Advance voting is open now, until Wednesday, October 21." : "Advance voting has closed. Election day is Saturday, October 24.";
    const t=d+" days until election day";if(t!==lastSr){sr.textContent=t;lastSr=t}
  }
  tick();
  const reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  setInterval(tick,reduce?60000:1000);
})();
/* deep links: /#volunteer, /#lawn-sign and /#invite scroll to Get involved and open the matching pop-up */
(function(){
  const map={"volunteer":"volunteer","lawn-sign":"lawnsign","invite":"invite"};
  function go(){
    const k=map[location.hash.slice(1)],sec=$("#involved");
    if(!k||!sec)return;
    sec.scrollIntoView();
    if(!dlg.open)openForm(k);
  }
  dlg.addEventListener("close",()=>{if(map[location.hash.slice(1)])history.replaceState(null,"",location.pathname+location.search+"#involved")});
  window.addEventListener("hashchange",go);
  go();
})();
})();
