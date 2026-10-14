var $=function(i){return document.getElementById(i)};
var products=[{id:"SKU-1001",n:"Olive Oil 500ml",p:8.5},{id:"SKU-1002",n:"Basmati Rice 1kg",p:4.25},{id:"SKU-1003",n:"Green Tea Box",p:3.9},{id:"SKU-1004",n:"Dark Chocolate",p:2.75}];
var list=[];
try{list=JSON.parse(localStorage.getItem("scanlist")||"[]")}catch(e){}
function save(){try{localStorage.setItem("scanlist",JSON.stringify(list))}catch(e){}}
function money(x){return "$"+x.toFixed(2)}
function payload(p){return JSON.stringify({id:p.id,n:p.n,p:p.p})}

/* tabs */
function tab(n){["scan","list","prod"].forEach(function(k){$("v-"+k).style.display=k==n?"":"none";$("t-"+k).className=k==n?"on":""});if(n!="scan")stop();if(n=="list")renderList();if(n=="prod")renderProd()}
["scan","list","prod"].forEach(function(k){$("t-"+k).onclick=function(){tab(k)}});

/* add scanned data to list */
var last={code:"",t:0};
function ingest(raw){
  var now=Date.now();if(raw===last.code&&now-last.t<2500)return;last={code:raw,t:now};
  var o;try{o=JSON.parse(raw)}catch(e){}
  if(!o||typeof o!=="object"||!o.n)o={id:raw.slice(0,40),n:raw.slice(0,40),p:0};
  var f=list.filter(function(i){return i.id==o.id})[0];
  if(f)f.q++;else list.push({id:String(o.id),n:String(o.n),p:Number(o.p)||0,q:1});
  save();updCount();
  show("flash","✓ Added: "+o.n+(o.p?" · "+money(Number(o.p)):""),false);
  try{navigator.vibrate&&navigator.vibrate(60)}catch(e){}
  beep();
}
function beep(){try{var a=new (window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator();o.frequency.value=880;o.connect(a.destination);o.start();setTimeout(function(){o.stop();a.close()},90)}catch(e){}}
function show(id,msg,err){var f=$(id);f.textContent=msg;f.className="flash"+(err?" err":"");f.style.display="block"}
function updCount(){$("cnt").textContent=list.reduce(function(a,i){return a+i.q},0)}

/* camera scanner */
var stream=null,raf=0,v=$("vid"),cv=$("cv"),ctx=cv.getContext("2d",{willReadFrequently:true});
function stop(){cancelAnimationFrame(raf);if(stream){stream.getTracks().forEach(function(t){t.stop()});stream=null}v.style.display="none";$("cam").className="cam";$("camMsg").style.display="";$("camMsg").textContent="Camera is off";$("start").textContent="Start camera scanner"}
function tick(){
  if(!stream)return;
  if(v.readyState===v.HAVE_ENOUGH_DATA&&v.videoWidth){
    cv.width=v.videoWidth;cv.height=v.videoHeight;ctx.drawImage(v,0,0,cv.width,cv.height);
    var d=ctx.getImageData(0,0,cv.width,cv.height),c=window.jsQR&&jsQR(d.data,d.width,d.height,{inversionAttempts:"dontInvert"});
    if(c&&c.data)ingest(c.data);
  }
  raf=requestAnimationFrame(tick);
}
$("start").onclick=function(){
  if(stream){stop();return}
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){show("flash","Camera not supported here. Upload a QR photo instead.",true);return}
  navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false}).then(function(s){
    stream=s;v.srcObject=s;v.style.display="block";v.play();$("camMsg").style.display="none";$("cam").className="cam live";$("start").textContent="Stop scanner";$("flash").style.display="none";tick();
  }).catch(function(){show("flash","Camera blocked. Allow camera access (or open this page in its own browser tab), or upload a QR photo below.",true)});
};
$("file").onchange=function(e){
  var f=e.target.files[0];if(!f)return;var img=new Image();
  img.onload=function(){cv.width=img.width;cv.height=img.height;ctx.drawImage(img,0,0);var d=ctx.getImageData(0,0,cv.width,cv.height),c=jsQR(d.data,d.width,d.height);
    if(c&&c.data){last={code:"",t:0};ingest(c.data)}else show("flash","No QR code found in that image.",true);e.target.value=""};
  img.src=URL.createObjectURL(f);
};

/* simulate */
function renderSim(){$("sim").innerHTML=products.map(function(p,k){return '<button class="btn ghost sm" data-s="'+k+'">'+p.n+'</button>'}).join("")}
$("sim").onclick=function(e){var k=e.target.dataset.s;if(k==null)return;last={code:"",t:0};ingest(payload(products[k]))};

/* list */
function renderList(){
  $("items").innerHTML=list.length?list.map(function(i,k){return '<div class="row"><div><div class="nm">'+esc(i.n)+'</div><div class="sm">'+esc(i.id)+' · '+money(i.p)+'</div></div><div class="q"><button data-k="'+k+'" data-d="-1">−</button><b>'+i.q+'</b><button data-k="'+k+'" data-d="1">+</button></div></div>'}).join(""):'<div class="empty">Nothing scanned yet.<br>Scan a product QR to start your list.</div>';
  $("total").textContent=money(list.reduce(function(a,i){return a+i.p*i.q},0));updCount();
}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
$("items").onclick=function(e){var k=e.target.dataset.k;if(k==null)return;list[k].q+=+e.target.dataset.d;if(list[k].q<1)list.splice(k,1);save();renderList()};
$("clear").onclick=function(){list=[];save();renderList()};
$("copy").onclick=function(){
  var t=list.map(function(i){return i.q+" x "+i.n+" ("+i.id+") - "+money(i.p*i.q)}).join("\n")+"\nTOTAL: "+$("total").textContent;
  try{navigator.clipboard.writeText(t).then(function(){show("flash2","List copied.",false)},function(){show("flash2","Copy blocked by browser.",true)})}catch(e){show("flash2","Copy blocked by browser.",true)}
};

/* product QR generator */
function renderProd(){
  $("pgrid").innerHTML=products.map(function(p,k){return '<div class="pc"><div class="qr" id="q'+k+'"></div><div class="nm">'+esc(p.n)+'</div><div class="sm">'+esc(p.id)+' · '+money(p.p)+'</div></div>'}).join("");
  products.forEach(function(p,k){try{new QRCode($("q"+k),{text:payload(p),width:110,height:110,colorDark:"#000",colorLight:"#fff"})}catch(e){}});
}
$("add").onclick=function(){
  var n=$("pn").value.trim(),p=parseFloat($("pp").value);if(!n||isNaN(p))return;
  products.push({id:$("pk").value.trim()||"SKU-"+(1001+products.length),n:n,p:p});
  $("pn").value=$("pp").value=$("pk").value="";renderProd();renderSim();
};
renderSim();updCount();
