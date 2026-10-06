
var NAME="Joe",TARGET=2500,PT=150,S={days:{},w:{},c:{}},sel,ref=null,ref2=null,sref=null,myid=null,LB=[],ready=false,entered=false,editing=false,lastPush='',PH=[],tab="t",open=new Set();
var Q=["Show up today. Your future self is watching.","Small reps, repeated, build big results.","You don't need a perfect day. You need a done day.","Strong is built one ordinary session at a time.","Tired and still showing up counts.","Progress is quiet until it isn't.","Do the work now. Thank yourself later.","Eat well, lift heavy, sleep deep, repeat.","Be a little better than yesterday's you.","Discipline is a promise you keep to yourself.","The only rep that doesn't count is the one you skip.","Trust the process. Track the process.","Consistency beats intensity.","Every meal and every rep is a vote for who you're becoming."];
var MEALS=[["Breakfast","3 eggs, 80 g oats",515,29],["Protein shake","Whey, 300 ml milk",260,34],["Lunch","Pasta, chicken, veg",720,43],["Dinner","Same as lunch",720,43],["Snack","Banana, 30 g peanuts",275,8]];
var WO=[["Upper A",[["Bench press","3 x 6-8"],["Seated cable row","3 x 8-10"],["Dumbbell shoulder press","3 x 8-10"],["Lat pulldown","3 x 10-12"],["Triceps pushdown","2 x 12"],["Dumbbell curl","2 x 12"]]],
["Lower A",[["Squat or leg press","3 x 6-10"],["Romanian deadlift","3 x 8-10"],["Leg curl","3 x 10-12"],["Calf raise","3 x 12-15"],["Plank","3 x 30-45 s"]]],
["Upper B",[["Incline dumbbell press","3 x 8-10"],["Pull-up or pulldown","3 x 6-10"],["Lateral raise","3 x 12-15"],["Chest-supported row","3 x 10-12"],["Overhead triceps extension","2 x 12"],["Hammer curl","2 x 12"]]],
["Lower B",[["Leg press","3 x 10-12"],["Bulgarian split squat","3 x 8-10"],["Hip thrust","3 x 8-10"],["Leg extension","2 x 12"],["Calf raise","3 x 12-15"]]]];
var DEF={k:2500,p:150,meals:MEALS,wo:WO};
var DN=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
function $(s){return document.querySelector(s)}
function pad(n){return String(n).padStart(2,"0")}
function fmt(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())}
function parse(s){var a=s.split("-").map(Number);return new Date(a[0],a[1]-1,a[2])}
function add(s,n){var d=parse(s);d.setDate(d.getDate()+n);return fmt(d)}
function esc(t){return String(t).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function nd(d){d=d||{};return{m:d.m||[],x:d.x||[],e:d.e||[]}}
function D(s){return nd(S.days[s])}
function W(s){var d=S.days[s]=nd(S.days[s]);return d}
function tot(s){var d=D(s),k=0,p=0;d.m.forEach(function(i){var m=MEALS[i];if(m){k+=m[2];p+=m[3]}});d.x.forEach(function(x){k+=x.k;p+=x.p});return[k,p]}
function done(s){var e=D(s).e;return WO.filter(function(w,i){return w[1].every(function(_,j){return e.indexOf(i+"-"+j)>-1})}).length}
var st=null;function save(){clearTimeout(st);st=setTimeout(function(){if(user)api('PUT','/api/data',pay()).catch(function(){})},400)}
function quote(s){var a=s.split("-").map(Number);return Q[Math.floor(Date.UTC(a[0],a[1]-1,a[2])/864e5)%Q.length]}
function render(){applyCfg();
var today=fmt(new Date()),d=D(sel),t=tot(sel),k=t[0],p=t[1],left=TARGET-k,C=2*Math.PI*52,pc=Math.min(k/TARGET,1);
var ws=add(sel,-((parse(sel).getDay()+6)%7)),wk="",wc=0;
for(var i=0;i<7;i++){var s=add(ws,i),n=done(s);wc+=n;wk+='<button class="wd'+(s===sel?" on":"")+'" data-d="'+s+'" aria-label="'+DN[i]+' '+parse(s).getDate()+'"><span>'+DN[i]+'</span><b>'+parse(s).getDate()+'</b><span class="dots"><i class="dot g'+(n?" f":"")+'"></i><i class="dot b'+(tot(s)[0]?" f":"")+'"></i></span></button>'}
var title=sel===today?"Today":parse(sel).toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"short"});
var av=S.pic?'<img src="'+S.pic+'" alt="Your profile photo">':NAME[0];
$("#hd").innerHTML='<header class="hero"><div><h1>Welcome, '+NAME+'</h1><p class="q">&ldquo;'+quote(sel)+'&rdquo;</p></div><button class="av" id="avb" aria-label="Change profile photo">'+av+'<span class="cam" aria-hidden="true">+</span></button></header><div class="seg"><button data-tab="t"'+(tab==="t"?' class="on"':'')+'>Today</button><button data-tab="p"'+(tab==="p"?' class="on"':'')+'>Progress</button><button data-tab="f"'+(tab==="f"?' class="on"':'')+'>Friends</button></div>';
$("#wkb").innerHTML='<div class="wkh"><h2>'+title+'</h2>'+(sel!==today?'<button class="lnk" data-d="'+today+'">Back to today</button>':'')+'<span class="chip">'+wc+' of '+WO.length+' workouts</span></div><div class="wk">'+wk+'</div>';
$("#cal").innerHTML='<div class="top"><svg viewBox="0 0 120 120" width="128" height="128" role="img" aria-label="'+Math.abs(left)+(left>=0?" calories left":" calories over")+'"><circle cx="60" cy="60" r="52" fill="none" stroke="var(--soft)" stroke-width="9"/><circle cx="60" cy="60" r="52" fill="none" stroke="var(--blue)" stroke-width="9" stroke-linecap="round" stroke-dasharray="'+C*pc+' '+C+'" transform="rotate(-90 60 60)"/><text x="60" y="62" text-anchor="middle" class="rn">'+Math.abs(left)+'</text><text x="60" y="80" text-anchor="middle" class="rl">'+(left>=0?"kcal left":"kcal over")+'</text></svg><div style="flex:1"><div class="lbl"><b>'+k+'</b> of '+TARGET+' kcal</div><div class="lbl" style="margin-top:16px">Protein <b>'+p+'</b> of '+PT+' g</div><div class="bar"><i style="width:'+Math.min(p/PT,1)*100+'%"></i></div><div class="lbl" style="margin-top:12px">Points today <b>'+dp(sel)+'</b></div></div></div>';
$("#ml").innerHTML=MEALS.map(function(m,i){return'<label class="row"><input type="checkbox" data-m="'+i+'"'+(d.m.indexOf(i)>-1?" checked":"")+'><span class="t"><b>'+m[0]+'</b><small>'+m[1]+'</small></span><span class="v">'+m[2]+' kcal</span></label>'}).join("")+d.x.map(function(x,i){return'<div class="row"><span class="t"><b>'+esc(x.n)+'</b><small>'+x.p+' g protein</small></span><span class="v">'+x.k+' kcal</span><button class="x" data-rx="'+i+'" aria-label="Remove '+esc(x.n)+'">&times;</button></div>'}).join("");
$("#wo").innerHTML=WO.map(function(w,i){var c=w[1].filter(function(_,j){return d.e.indexOf(i+"-"+j)>-1}).length;return'<details data-w="'+i+'"'+(open.has(i)?" open":"")+'><summary>'+w[0]+'<span class="pill'+(c===w[1].length?" ok":"")+'">'+c+'/'+w[1].length+'</span></summary>'+w[1].map(function(e,j){return'<label class="row"><input type="checkbox" data-e="'+i+'-'+j+'"'+(d.e.indexOf(i+"-"+j)>-1?" checked":"")+'><span class="t"><b>'+e[0]+'</b></span><span class="v">'+e[1]+'</span></label>'}).join("")+'</details>'}).join("");
var au=!user;$("#auth").hidden=!(ready&&au);$("#wel").hidden=au||entered;$("#ob").hidden=!(!au&&entered&&(editing||!S.cfg));$("#app").hidden=!(!au&&entered&&S.cfg&&!editing);$("#today").hidden=tab!=="t";$("#prog").hidden=tab!=="p";$("#fr").hidden=tab!=="f";renderProg();renderFr();
$("#wel").innerHTML='<div class="av">'+av+'</div><h1>Welcome back, '+NAME+'</h1><p class="q">&ldquo;'+quote(today)+'&rdquo;</p><p class="ws">'+Math.max(TARGET-tot(today)[0],0)+' kcal left today. '+wc+' of '+WO.length+' workouts this week.</p><button class="go" id="go">Continue</button>';
$("#ft").innerHTML=(S.pic?'<button class="lnk" id="rp">Remove profile photo</button> ':"")+'<button class="lnk" id="ep">Edit my plan</button> <button class="lnk" id="lo">Log out</button> <button class="lnk" id="da">Delete account</button><p class="lbl" style="margin-top:8px">Signed in as '+esc(user||"")+'</p>';push()}
function wkStart(s){return add(s,-((parse(s).getDay()+6)%7))}
function applyCfg(){var c=S.cfg||null;NAME=c?c.name||"friend":"friend";TARGET=c?c.k:DEF.k;PT=c?c.p:DEF.p;MEALS=c?c.meals:DEF.meals;WO=c?c.wo:DEF.wo}
function pay(){var o={days:S.days,w:S.w,c:S.c};if(S.pic)o.pic=S.pic;if(S.cfg)o.cfg=JSON.stringify(S.cfg);return o}
function cleanCfg(c){try{var m=c.meals.map(function(x){return[String(x[0]).slice(0,40),String(x[1]||"").slice(0,40),big(x[2]),big(x[3])]}).filter(function(x){return x[0]&&x[2]}),w=c.wo.map(function(x){return[String(x[0]).slice(0,30),x[1].map(function(e){return[String(e[0]).slice(0,40),String(e[1]||"").slice(0,20)]}).filter(function(e){return e[0]})]}).filter(function(x){return x[0]&&x[1].length});if(m.length&&w.length&&big(c.k)&&big(c.p))return{name:String(c.name||"").slice(0,20),k:big(c.k),p:big(c.p),meals:m,wo:w}}catch(e){}return null}
function dp(s){var t=tot(s),p=0;if(t[0]>=TARGET*.9&&t[0]<=TARGET*1.05&&t[1]>=PT*.9)p=10;return p+done(s)*20}
function pts(){var tt=0,wp=0,ws=wkStart(fmt(new Date())),we=add(ws,6);Object.keys(S.days).forEach(function(k){var v=dp(k);tt+=v;if(k>=ws&&k<=we)wp+=v});return[tt,wp,ws]}
function push(){if(!user||!ready||!S.cfg)return;var a=pts(),o={t:a[0],w:a[2],p:a[1]},j=JSON.stringify(o);if(j===lastPush)return;lastPush=j;api('PUT','/api/score',o).then(loadLb).catch(function(){lastPush=''})}
function STM(){return DEF.meals.map(function(m){return m[0]+", "+m[2]+", "+m[3]}).join("\n")}
function STW(){return DEF.wo.map(function(w){return w[0]+": "+w[1].map(function(e){return e[0]+" "+e[1]}).join(", ")}).join("\n")}
function fillOb(){var c=S.cfg;$("#on").value=c?c.name:"";$("#ok").value=c?c.k:"";$("#op").value=c?c.p:"";$("#om").value=c?c.meals.map(function(m){return m[0]+", "+m[2]+", "+m[3]}).join("\n"):"";$("#ow").value=c?c.wo.map(function(w){return w[0]+": "+w[1].map(function(e){return e[0]+(e[1]?" "+e[1]:"")}).join(", ")}).join("\n"):"";$("#oc").hidden=!c;$("#oe").textContent=""}
function parseOb(){var n=$("#on").value.trim(),k=big($("#ok").value),p=big($("#op").value);
var m=$("#om").value.split("\n").map(function(l){var a=l.split(",");return[a[0].trim().slice(0,40),big(a[2])?big(a[2])+" g protein":"",big(a[1]),big(a[2])]}).filter(function(x){return x[0]&&x[2]});
var w=$("#ow").value.split("\n").map(function(l){var i=l.indexOf(":");if(i<1)return null;return[l.slice(0,i).trim().slice(0,30),l.slice(i+1).split(",").map(function(e){var q=e.trim(),x=q.match(/^(.*?)\s+(\d+\s*x\s*[\d-]+.*)$/);return x?[x[1],x[2]]:[q,""]}).filter(function(e){return e[0]})]}).filter(function(x){return x&&x[0]&&x[1].length});
if(!n)return"Add your name.";if(!k||!p)return"Add your daily calories and protein.";if(!m.length)return"Add at least one meal, like: Breakfast, 500, 30";if(!w.length)return"Add at least one workout, like: Push: Bench press 3x8, Dips 3x10";
return{name:n.slice(0,20),k:k,p:p,meals:m,wo:w}}
function renderFr(){var ws=wkStart(fmt(new Date())),rows=LB.map(function(r){return{u:r.username,t:r.t||0,wp:r.w===ws?r.p||0:0}});rows.sort(function(a,b){return b.wp-a.wp||b.t-a.t});
document.querySelectorAll("[data-sc]").forEach(function(b){b.classList.toggle("on",b.dataset.sc===scope)});
$("#lbl").innerHTML=rows.length?rows.map(function(r,i){return'<div class="row"><b style="width:22px">'+(i+1)+'</b><span class="t"><b>'+esc(r.u)+(r.u===user?" (you)":"")+'</b><small>'+r.t+' points all time</small></span><span class="v"><b style="color:var(--ink);font-size:18px">'+r.wp+'</b> this week</span></div>'}).join(""):'<p class="lbl">No scores yet. Log your food or finish a workout to get on the board.</p>';
$("#fls").innerHTML=FR.incoming.map(function(n){return'<div class="row"><span class="t"><b>'+esc(n)+'</b><small>Wants to be friends</small></span><button class="sm" data-fac="'+esc(n)+'">Accept</button><button class="x" data-frm="'+esc(n)+'" aria-label="Decline">&times;</button></div>'}).join("")+FR.outgoing.map(function(n){return'<div class="row"><span class="t"><b>'+esc(n)+'</b><small>Request sent</small></span><button class="x" data-frm="'+esc(n)+'" aria-label="Cancel request">&times;</button></div>'}).join("")+FR.friends.map(function(n){return'<div class="row"><span class="t"><b>'+esc(n)+'</b><small>Friend</small></span><button class="x" data-frm="'+esc(n)+'" aria-label="Remove friend">&times;</button></div>'}).join("")}
function big(v){v=Math.round(+v);return v>0&&v<10000?v:0}
function num(v){v=+v;return v>0&&v<1000?Math.round(v*10)/10:0}
function nums(o){var r={};Object.keys(o||{}).forEach(function(k){var v=num(o[k]);if(v)r[k]=v});return r}
function cleanPh(a){return(Array.isArray(a)?a:[]).filter(function(p){return p&&typeof p.d==="string"&&typeof p.img==="string"&&p.img.indexOf("data:image/jpeg")===0}).slice(0,15)}
function savePh(){if(user)api('PUT','/api/photos',{list:PH}).catch(function(){})}
function fd(k,y){return parse(k).toLocaleDateString(undefined,y?{day:"numeric",month:"short",year:"numeric"}:{day:"numeric",month:"short"})}
function sg(n){return(n>0?"+":"")+n.toFixed(1)}
function tl(a,b){return'<div class="tile"><span class="lbl">'+a+'</span><b>'+b+'</b></div>'}
function sum(a){return a.reduce(function(x,y){return x+y},0)}
function chart(ks){if(ks.length<2)return'<p class="lbl">Log two weigh-ins to see your trend.</p>';
var pts=ks.slice(-60),t0=parse(pts[0]).getTime(),t1=parse(pts[pts.length-1]).getTime(),v=pts.map(function(k){return S.w[k]}),lo=Math.min.apply(0,v)-.5,hi=Math.max.apply(0,v)+.5;
function X(k){return 10+(parse(k).getTime()-t0)/((t1-t0)||1)*300}
function Y(w){return 120-(w-lo)/(hi-lo)*105}
var tr=pts.map(function(k){var c=add(k,-6),a=pts.filter(function(j){return j<=k&&j>=c}).map(function(j){return S.w[j]});return X(k).toFixed(1)+","+Y(sum(a)/a.length).toFixed(1)}).join(" ");
return'<svg viewBox="0 0 320 140" width="100%" role="img" aria-label="Weight trend">'+pts.map(function(k){return'<circle cx="'+X(k).toFixed(1)+'" cy="'+Y(S.w[k]).toFixed(1)+'" r="3" fill="var(--mut)" opacity=".5"/>'}).join("")+'<polyline points="'+tr+'" fill="none" stroke="var(--blue)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><text x="10" y="10" class="rl">'+hi.toFixed(1)+' kg</text><text x="10" y="136" class="rl">'+fd(pts[0])+'</text><text x="310" y="136" text-anchor="end" class="rl">'+fd(pts[pts.length-1])+'</text></svg><p class="lbl" style="margin:4px 0 0">Dots are weigh-ins. The line is your 7-day trend.</p>'}
function renderProg(){
var today=fmt(new Date()),ks=Object.keys(S.w).sort(),cs=Object.keys(S.c).sort();
var lw=ks.length?S.w[ks[ks.length-1]]:0,fw=ks.length?S.w[ks[0]]:0,lc=cs.length?S.c[cs[cs.length-1]]:0,fc=cs.length?S.c[cs[0]]:0,a7="-";
if(ks.length){var cut=add(ks[ks.length-1],-6),vv=ks.filter(function(k){return k>=cut}).map(function(k){return S.w[k]});a7=(sum(vv)/vv.length).toFixed(1)+" kg"}
$("#pst").innerHTML='<h2>Weight</h2>'+chart(ks)+'<div class="tiles">'+tl("Latest",lw?lw+" kg":"-")+tl("Since start",ks.length>1?sg(lw-fw)+" kg":"-")+tl("7-day average",a7)+tl("Waist",lc?lc+" cm"+(cs.length>1?" ("+sg(lc-fc)+")":""):"-")+'</div>';
var cmp=PH.length>1?'<div class="cmp">'+[PH[0],PH[PH.length-1]].map(function(p,i){return'<figure><img src="'+p.img+'" alt="'+(i?"Latest":"First")+' progress photo"><figcaption>'+(i?"Latest":"First")+', '+fd(p.d)+'</figcaption></figure>'}).join("")+'</div>':"";
var grid=PH.map(function(p,i){return'<figure class="th"><img src="'+p.img+'" alt="Progress photo, '+fd(p.d)+'"><figcaption>'+fd(p.d)+'</figcaption><button class="rm" data-rp="'+i+'" aria-label="Remove photo">&times;</button></figure>'}).join("");
$("#pph").innerHTML=PH.length?cmp+'<div class="grid">'+grid+'</div>':'<p class="lbl">No photos yet. Add your first one to see how far you come.</p>';
var wk=0,lg=0,kc=0,pr=0;for(var i=0;i<28;i++){var d=add(today,-i),t=tot(d);wk+=done(d);if(t[0]>0){lg++;kc+=t[0];pr+=t[1]}}
var all=ks.concat(cs.filter(function(k){return!S.w[k]})).sort().reverse().slice(0,10);
$("#pco").innerHTML='<h2>Last 28 days</h2><div class="tiles">'+tl("Workouts done",wk)+tl("Days food logged",lg+" of 28")+tl("Avg calories",lg?Math.round(kc/lg):"-")+tl("Avg protein",lg?Math.round(pr/lg)+" g":"-")+'</div>'+(all.length?'<h2 style="margin-top:20px">History</h2>'+all.map(function(k){return'<div class="row"><span class="t"><b>'+fd(k,1)+'</b><small>'+[S.w[k]?S.w[k]+" kg":"",S.c[k]?S.c[k]+" cm waist":""].filter(Boolean).join(", ")+'</small></span><button class="x" data-rc="'+k+'" aria-label="Remove entry">&times;</button></div>'}).join(""):"")}
function ph(f){if(!f)return;var r=new FileReader();r.onload=function(){var im=new Image();im.onload=function(){var z=Math.min(1,360/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.round(im.width*z);c.height=Math.round(im.height*z);c.getContext("2d").drawImage(im,0,0,c.width,c.height);PH.push({d:$("#cd").value||fmt(new Date()),img:c.toDataURL("image/jpeg",.72)});PH.sort(function(a,b){return a.d<b.d?-1:a.d>b.d?1:0});savePh();render()};im.src=r.result};r.readAsDataURL(f)}
function pic(f){if(!f)return;var r=new FileReader();r.onload=function(){var im=new Image();im.onload=function(){var c=document.createElement("canvas"),z=200,m=Math.min(im.width,im.height);c.width=c.height=z;c.getContext("2d").drawImage(im,(im.width-m)/2,(im.height-m)/2,m,m,0,0,z,z);S.pic=c.toDataURL("image/jpeg",.8);save();render()};im.src=r.result};r.readAsDataURL(f)}
document.addEventListener("change",function(ev){var el=ev.target,d,v;
if(el.id==="pf"){pic(el.files[0]);el.value="";return}
if(el.id==="pp"){ph(el.files[0]);el.value="";return}
if(el.dataset.m!==undefined){d=W(sel);v=+el.dataset.m;d.m=d.m.filter(function(x){return x!==v});if(el.checked)d.m.push(v)}
else if(el.dataset.e!==undefined){d=W(sel);d.e=d.e.filter(function(x){return x!==el.dataset.e});if(el.checked)d.e.push(el.dataset.e)}
else return;save();render()});
document.addEventListener("click",function(ev){var b=ev.target.closest("button");if(!b)return;
if(b.id==="asb"){$("#aer").textContent="";api("POST",authMode==="up"?"/api/signup":"/api/login",{username:$("#aun").value.trim().toLowerCase(),password:$("#apw").value}).then(function(me){$("#apw").value="";enter(me)}).catch(function(e){$("#aer").textContent=e.message});return}
if(b.id==="amd"){authMode=authMode==="in"?"up":"in";$("#asb").textContent=authMode==="in"?"Log in":"Create account";$("#amd").textContent=authMode==="in"?"Create an account instead":"I already have an account";$("#apw").autocomplete=authMode==="in"?"current-password":"new-password";$("#aer").textContent="";return}
if(b.id==="lo"){api("POST","/api/logout",{}).catch(function(){}).then(resetUser);return}
if(b.id==="da"){if(confirm("Delete your account and all your data? This can't be undone.")){api("DELETE","/api/me").then(resetUser).catch(function(){})}return}
if(b.dataset.sc){scope=b.dataset.sc;renderFr();loadLb();return}
if(b.id==="fa"){var fu=$("#fu").value.trim().toLowerCase();if(!fu)return;api("POST","/api/friends",{username:fu}).then(function(r){$("#fm").textContent=r.message;$("#fu").value="";loadFr();loadLb()}).catch(function(e){$("#fm").textContent=e.message});return}
if(b.dataset.fac){api("POST","/api/friends/accept",{username:b.dataset.fac}).then(function(){loadFr();loadLb()}).catch(function(){});return}
if(b.dataset.frm){api("DELETE","/api/friends/"+encodeURIComponent(b.dataset.frm)).then(function(){loadFr();loadLb()}).catch(function(){});return}
if(b.id==="go"){entered=true;render();window.scrollTo(0,0);return}
if(b.id==="ep"){editing=true;fillOb();render();window.scrollTo(0,0);return}
if(b.id==="oc"){editing=false;render();return}
if(b.id==="ost"){$("#om").value=STM();$("#ow").value=STW();if(!$("#ok").value)$("#ok").value=DEF.k;if(!$("#op").value)$("#op").value=DEF.p;return}
if(b.id==="os"){var r=parseOb();if(typeof r==="string"){$("#oe").textContent=r;return}S.cfg=r;editing=false;save();render();window.scrollTo(0,0);return}
if(b.id==="avb"){$("#pf").click();return}
if(b.dataset.tab){tab=b.dataset.tab;render();if(tab==="f"){loadLb();loadFr()}window.scrollTo(0,0);return}
if(b.id==="pa"){if(PH.length>=15){$("#pm").textContent="Photo limit reached. Remove one to add another.";return}$("#pp").click();return}
if(b.dataset.rp!==undefined){PH.splice(+b.dataset.rp,1);savePh();render();return}
if(b.dataset.rc){delete S.w[b.dataset.rc];delete S.c[b.dataset.rc];save();render();return}
if(b.id==="cs"){var cd=$("#cd").value,cw=num($("#cw").value),cc=num($("#cc").value);if(!cd||!(cw||cc)){$("#cw").focus();return}if(cw)S.w[cd]=cw;if(cc)S.c[cd]=cc;$("#cw").value=$("#cc").value="";save();render();return}
if(b.id==="rp"){delete S.pic}
else if(b.dataset.d){sel=b.dataset.d}
else if(b.dataset.n){sel=add(sel,+b.dataset.n)}
else if(b.dataset.rx!==undefined){W(sel).x.splice(+b.dataset.rx,1)}
else if(b.id==="ad"){var n=$("#an").value.trim(),k=Math.round(+$("#ak").value),p=Math.round(+$("#ap").value)||0;
if(!n||!(k>0)){$("#an").focus();return}
W(sel).x.push({n:n.slice(0,40),k:k,p:Math.max(p,0)});$("#an").value=$("#ak").value=$("#ap").value="";$("#af").open=false}
else return;save();render()});
document.addEventListener("toggle",function(ev){var w=ev.target.dataset&&ev.target.dataset.w;if(w===undefined)return;ev.target.open?open.add(+w):open.delete(+w)},true);
function clean(r){var o={days:{}};Object.keys(r.days||{}).forEach(function(k){o.days[k]=nd(r.days[k])});if(typeof r.pic==="string"&&r.pic.indexOf("data:image/jpeg")===0)o.pic=r.pic;o.w=nums(r.w);o.c=nums(r.c);var cf=r.cfg;if(typeof cf==="string"){try{cf=JSON.parse(cf)}catch(e){cf=null}}o.cfg=cf?cleanCfg(cf):null;return o}
var user=null,FR={friends:[],incoming:[],outgoing:[]},scope="friends",authMode="in";
function api(m,u,b){return fetch(u,{method:m,headers:b?{"Content-Type":"application/json"}:{},body:b?JSON.stringify(b):undefined,credentials:"same-origin"}).then(function(r){return r.json().catch(function(){return{}}).then(function(j){if(!r.ok)throw Object.assign(new Error(j.error||"Something went wrong."),{status:r.status});return j})})}
function loadLb(){if(!user)return;api("GET","/api/leaderboard?scope="+scope).then(function(r){LB=r.rows||[];renderFr()}).catch(function(){})}
function loadFr(){if(!user)return;api("GET","/api/friends").then(function(r){FR=r;renderFr()}).catch(function(){})}
function enter(me){user=me.username;S=clean(me.data||{});PH=cleanPh(me.photos);ready=true;lastPush="";entered=false;editing=false;tab="t";if(!S.cfg)fillOb();render();loadLb();loadFr()}
function resetUser(){user=null;S={days:{},w:{},c:{}};PH=[];LB=[];FR={friends:[],incoming:[],outgoing:[]};entered=false;editing=false;lastPush="";tab="t";ready=true;render()}
function boot(){api("GET","/api/me").then(enter).catch(function(){resetUser()})}
document.addEventListener("keydown",function(e){if(e.key==="Enter"&&(e.target.id==="apw"||e.target.id==="aun")){e.preventDefault();$("#asb").click()}});
sel=fmt(new Date());$("#cd").value=sel;
setInterval(function(){if(user&&tab==="f"&&!document.hidden)loadLb()},30000);
boot();
