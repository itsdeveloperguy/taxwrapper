/* Marketplace Image Resizer: resize, compress, validate and download product images. Runs fully in the browser. */
(function(){
'use strict';
/* ---- Presets: edit these to update the recommended sizes later ---- */
var PRESETS={
 myntra:{n:'Myntra',tag:'MYNTRA',code:'MY',w:1080,h:1440,fmt:'jpg',max:'lt1024',lo:500*1024,hi:1024*1024,
  note:'Recommended preset: 1080 × 1440 px (3:4), JPG, about 500 KB to 1 MB. These are guidelines, so check the current rules in your Myntra seller panel.'},
 flipkart:{n:'Flipkart',tag:'FLIPKART',code:'FK',w:1000,h:1000,fmt:'jpg',max:null,lo:0,hi:0,
  note:'Recommended preset: 1000 × 1000 px (1:1), JPG. File size is up to you. Check Flipkart’s current guidelines for your category.'}};
var SIZES={lt500:{b:500*1024,strict:1},lt750:{b:750*1024,strict:1},lt1024:{b:1024*1024,strict:1}};
for(var m=1;m<=10;m++)SIZES[m]={b:m*1048576,strict:0};
var MIN_Q=0.6,FLOOR_Q=0.4,MAX_DIM=8000,MAX_PIX=50e6,MAX_FILES=200;
var MIME={jpg:'image/jpeg',png:'image/png',webp:'image/webp'},EXT={jpg:'jpg',png:'png',webp:'webp'},FLAB={jpg:'JPG',png:'PNG',webp:'WEBP'};
var ST_KEY='tw-rz',PR_KEY='tw-rz-presets';
var S={mk:'myntra',w:1080,h:1440,lock:true,ratio:0.75,fit:'contain',bg:'#ffffff',ms:'lt1024',cv:750,cu:'KB',fmt:'jpg',q:90};
var items=[],seq=0,busy=false,stop=false,cropIt=null,cropState=null,cropBmp=null;
function ls(k,v){try{if(v===undefined){var r=localStorage.getItem(k);return r?JSON.parse(r):null}localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return null}}
function ss(k,v){try{if(v===undefined){var r=sessionStorage.getItem(k);return r?JSON.parse(r):null}sessionStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function fsz(b){return b<1024?b+' B':b<1048576?(b/1024).toFixed(1)+' KB':(b/1048576).toFixed(2)+' MB'}
function tick(){return new Promise(function(r){setTimeout(r,0)})}
function gcd(a,b){return b?gcd(b,a%b):a}
function clamp(v,a,b){return Math.min(b,Math.max(a,v))}
function snack(t,m,warn){var e=$('rz_sn');if(!e){e=document.createElement('div');e.id='rz_sn';e.className='snack';e.setAttribute('role','status');e.setAttribute('aria-live','polite');document.body.appendChild(e)}
e.className='snack'+(warn?' warn':'');e.innerHTML='<b>'+esc(t)+'</b>'+(m?'<span>'+esc(m)+'</span>':'');e.hidden=false;clearTimeout(snack.h);snack.h=setTimeout(function(){e.hidden=true},5000)}
/* ---- Saved presets ---- */
function myPresets(){var a=ls(PR_KEY);return Array.isArray(a)?a:[]}
function fillMk(){var sel=$('rz_mk'),p=myPresets();
sel.innerHTML='<option value="myntra">Myntra</option><option value="flipkart">Flipkart</option><option value="custom">Custom Size</option>'+(p.length?'<optgroup label="My presets">'+p.map(function(x){return '<option value="p:'+esc(x.id)+'">'+esc(x.n)+'</option>'}).join('')+'</optgroup>':'');
sel.value=S.mk}
function findPreset(id){return myPresets().filter(function(x){return 'p:'+x.id===id})[0]}
/* ---- Settings ---- */
function limit(){var v=S.ms;if(v==='custom'){var n=parseFloat(S.cv);if(!(n>0))return null;var b=Math.round(n*(S.cu==='MB'?1048576:1024));return b>=1024&&b<=200*1048576?{b:b,strict:0}:null}return SIZES[v]||null}
function limitText(l){return l.strict?'under '+fsz(l.b):'at most '+fsz(l.b)}
function ratioText(){var w=S.w,h=S.h;if(w>0&&h>0&&w===Math.round(w)&&h===Math.round(h)){var g=gcd(w,h),a=w/g,b=h/g;if(a<=50&&b<=50)return a+':'+b}return (S.ratio||1).toFixed(2)+':1'}
function dimErr(){if(!(S.w>=1&&S.h>=1&&S.w===Math.floor(S.w)&&S.h===Math.floor(S.h)))return 'Enter whole numbers for width and height.';
if(S.w>MAX_DIM||S.h>MAX_DIM)return 'Width and height can be at most '+MAX_DIM+' px.';if(S.w*S.h>MAX_PIX)return 'That size is too large to process in a browser. Try a smaller size.';return ''}
function sizeErr(){return limit()?'':'Enter a maximum size between 1 KB and 200 MB.'}
function sync(){var p=PRESETS[S.mk]||(S.mk.indexOf('p:')===0?findPreset(S.mk):null);
$('rz_mk').value=S.mk;
var t=$('rz_tag');if(PRESETS[S.mk]){t.textContent=PRESETS[S.mk].tag;t.className='chip ok';t.hidden=false}else if(p){t.textContent=p.n.toUpperCase();t.className='chip ok';t.hidden=false}else t.hidden=true;
$('rz_mn').textContent=PRESETS[S.mk]?PRESETS[S.mk].note:p?'Your saved preset.':'Custom size. The Myntra and Flipkart presets are recommendations, not official requirements.';
$('rz_w').value=S.w||'';$('rz_h').value=S.h||'';$('rz_lk').checked=S.lock;$('rz_lkt').textContent=S.lock?'(locked at '+ratioText()+')':'(width and height change independently)';
[].forEach.call(document.getElementsByName('rz_fit'),function(r){r.checked=r.value===S.fit});
$('rz_bg').value=S.bg;$('rz_ms').value=S.ms;$('rz_cu').hidden=S.ms!=='custom';$('rz_cv').value=S.cv;$('rz_cn').value=S.cu;$('rz_fm').value=S.fmt;
$('rz_ql').hidden=S.fmt==='png';$('rz_pn').hidden=S.fmt!=='png';$('rz_q').value=S.q;$('rz_qv').textContent=S.q+'%';
$('rz_qn').textContent=S.q>=100?'Maximum quality':S.q>=90?'High quality':S.q>=80?'Balanced quality':S.q>=70?'Smaller file size':'High compression';
$('rz_pd').hidden=S.mk.indexOf('p:')!==0;
$('rz_de').textContent=dimErr();$('rz_ce').textContent=sizeErr()}
function save(){ss(ST_KEY,S)}
function afterChange(){save();invalidate();sync();buttons()}
function toCustomIfDiff(){var p=PRESETS[S.mk]||(S.mk.indexOf('p:')===0?findPreset(S.mk):null);if(p&&(S.w!==p.w||S.h!==p.h))S.mk='custom'}
function setPreset(key,full){var p=PRESETS[key];S.mk=key;S.w=p.w;S.h=p.h;S.ratio=p.w/p.h;S.lock=true;S.fmt=p.fmt;if(p.max||full)S.ms=p.max||S.ms;
if(full){S.fit='contain';S.bg='#ffffff';S.q=90;S.ms=p.max||'lt1024';S.cv=750;S.cu='KB'}}
/* ---- Events: settings ---- */
$('rz_mk').onchange=function(){var v=this.value;
if(PRESETS[v])setPreset(v,false);
else if(v==='custom')S.mk='custom';
else{var p=findPreset(v);if(p){S.mk=v;S.w=p.w;S.h=p.h;S.lock=p.lock;S.ratio=p.w/p.h;S.fit=p.fit;S.bg=p.bg;S.ms=p.ms;S.cv=p.cv;S.cu=p.cu;S.fmt=p.fmt;S.q=p.q}}
afterChange()};
$('rz_rm').onclick=function(){setPreset('myntra',true);afterChange();snack('Reset','Myntra defaults restored.')};
$('rz_rf').onclick=function(){setPreset('flipkart',true);afterChange();snack('Reset','Flipkart defaults restored.')};
function dimInput(which){return function(){var v=parseInt(this.value,10);S[which]=isNaN(v)?0:v;
if(S.lock&&S.ratio&&v>0){if(which==='w'){S.h=Math.max(1,Math.round(v/S.ratio));$('rz_h').value=S.h}else{S.w=Math.max(1,Math.round(v*S.ratio));$('rz_w').value=S.w}}
toCustomIfDiff();save();invalidate();syncLight()}}
function syncLight(){var a=document.activeElement&&document.activeElement.id;var w=$('rz_w').value,h=$('rz_h').value;sync();if(a==='rz_w')$('rz_w').value=w;if(a==='rz_h')$('rz_h').value=h;buttons()}
$('rz_w').oninput=dimInput('w');$('rz_h').oninput=dimInput('h');
$('rz_lk').onchange=function(){S.lock=this.checked;if(S.lock&&S.w>0&&S.h>0)S.ratio=S.w/S.h;afterChange()};
[].forEach.call(document.getElementsByName('rz_fit'),function(r){r.onchange=function(){if(this.checked){S.fit=this.value;afterChange()}}});
$('rz_bg').oninput=function(){S.bg=this.value;save();invalidate();buttons()};
$('rz_ms').onchange=function(){S.ms=this.value;afterChange()};
$('rz_cv').oninput=function(){S.cv=this.value;save();invalidate();var e=$('rz_ce');e.textContent=sizeErr();buttons()};
$('rz_cn').onchange=function(){S.cu=this.value;afterChange()};
$('rz_fm').onchange=function(){S.fmt=this.value;afterChange()};
$('rz_q').oninput=function(){S.q=parseInt(this.value,10);afterChange()};
$('rz_ps').onclick=function(){var n=$('rz_pnm').value.trim(),pm=$('rz_pm');
if(!n){pm.textContent='Enter a name for the preset.';$('rz_pnm').focus();return}
var e=dimErr()||sizeErr();if(e){pm.textContent=e;return}
var a=myPresets(),ex=a.filter(function(x){return x.n.toLowerCase()===n.toLowerCase()})[0],id=ex?ex.id:'u'+Date.now().toString(36);
var rec={id:id,n:n,w:S.w,h:S.h,lock:S.lock,fit:S.fit,bg:S.bg,ms:S.ms,cv:S.cv,cu:S.cu,fmt:S.fmt,q:S.q};
a=a.filter(function(x){return x.id!==id});a.push(rec);
if(!ls(PR_KEY,a)){pm.textContent='Your browser blocked saving. Allow site data and try again.';return}
S.mk='p:'+id;$('rz_pnm').value='';fillMk();save();sync();pm.textContent='Saved “'+n+'”. It is now in the Select Marketplace list.';snack('Preset saved',n)};
$('rz_pd').onclick=function(){var p=findPreset(S.mk);if(!p)return;ls(PR_KEY,myPresets().filter(function(x){return x.id!==p.id}));S.mk='custom';fillMk();save();sync();$('rz_pm').textContent='Deleted “'+p.n+'”.'};
/* ---- Files ---- */
function okType(f){return /^image\/(jpeg|png|webp)$/.test(f.type)||/\.(jpe?g|png|webp)$/i.test(f.name)}
function flab(f){return /png/i.test(f.type)||/\.png$/i.test(f.name)?'PNG':/webp/i.test(f.type)||/\.webp$/i.test(f.name)?'WEBP':'JPG'}
function baseName(n){return n.replace(/\.[^.]+$/,'')}
function clean(n){n=String(n).trim().replace(/[^\w.\-]+/g,'_').replace(/^[._]+|[._]+$/g,'').slice(0,80);return n||'image'}
async function decode(file){
if(window.createImageBitmap){try{return await createImageBitmap(file,{imageOrientation:'from-image'})}catch(e){try{return await createImageBitmap(file)}catch(e2){}}}
return new Promise(function(res,rej){var u=URL.createObjectURL(file),im=new Image();im.onload=function(){URL.revokeObjectURL(u);res(im)};im.onerror=function(){URL.revokeObjectURL(u);rej(new Error('decode'))};im.src=u})}
function dim(b){return {w:b.naturalWidth||b.width,h:b.naturalHeight||b.height}}
function done(b){if(b&&b.close)b.close()}
async function addFiles(list){var bad=[],add=[];
[].forEach.call(list,function(f){if(!okType(f))bad.push(f.name);else add.push(f)});
if(items.length+add.length>MAX_FILES){bad.push((items.length+add.length-MAX_FILES)+' more over the limit of '+MAX_FILES+' images');add=add.slice(0,Math.max(0,MAX_FILES-items.length))}
$('rz_ue').textContent=bad.length?'Not added (only JPG, JPEG, PNG and WEBP work): '+bad.slice(0,5).join(', ')+(bad.length>5?' and '+(bad.length-5)+' more':''):'';
var fresh=add.map(function(f){return {id:++seq,file:f,base:clean(baseName(f.name)),url:URL.createObjectURL(f),w:0,h:0,size:f.size,fmt:flab(f),status:'loading',sel:true,pos:{x:.5,y:.5,z:1},out:null,err:''}});
items=items.concat(fresh);render();buttons();
for(var i=0;i<fresh.length;i++){var it=fresh[i];
 if(!items.some(function(x){return x===it}))continue;
 try{var b=await decode(it.file),d=dim(b);done(b);it.w=d.w;it.h=d.h;
  if(!d.w||!d.h)throw 0;
  if(d.w*d.h>100e6){it.status='error';it.err='This image is over 100 megapixels, which is too large to process in a browser.'}else it.status='idle'}
 catch(e){it.status='error';it.err='This file could not be read. It may be corrupted or not a real image.'}
 renderItem(it);buttons();await tick()}
if(fresh.length){var good=fresh.filter(function(x){return x.status==='idle'}).length,badn=fresh.length-good;
 if(good)snack('Uploaded successfully',good+' image'+(good>1?'s':'')+' added'+(badn?'. '+badn+' could not be read.':'. Choose your settings, then press Resize All.'));
 else snack('Upload failed','None of these files could be read.',true);
 var t=$('rz_h6');if(t)t.scrollIntoView({block:'start'})}}
$('rz_in').onchange=function(){addFiles(this.files);this.value=''};
var dz=$('rz_drop');
['dragenter','dragover'].forEach(function(t){dz.addEventListener(t,function(e){e.preventDefault();dz.classList.add('drag')})});
['dragleave','drop'].forEach(function(t){dz.addEventListener(t,function(e){e.preventDefault();dz.classList.remove('drag')})});
dz.addEventListener('drop',function(e){if(e.dataTransfer&&e.dataTransfer.files.length)addFiles(e.dataTransfer.files)});
['dragover','drop'].forEach(function(t){window.addEventListener(t,function(e){if(e.dataTransfer&&[].indexOf.call(e.dataTransfer.types||[],'Files')>-1)e.preventDefault()})});
function release(it){try{URL.revokeObjectURL(it.url)}catch(e){}if(it.out)try{URL.revokeObjectURL(it.out.url)}catch(e){}}
function invalidate(it1){if(busy)return;var l=it1?[it1]:items;l.forEach(function(it){if(it.out){try{URL.revokeObjectURL(it.out.url)}catch(e){}it.out=null}if(it.status==='done'||it.status==='working')it.status='idle'});render();totals()}
/* ---- Drawing ---- */
function geom(iw,ih,W,H,fit,z){if(fit==='stretch')return {dw:W,dh:H};var s=(fit==='cover'?Math.max(W/iw,H/ih):Math.min(W/iw,H/ih))*z;return {dw:iw*s,dh:ih*s}}
function drawFit(ctx,img,iw,ih,W,H,fit,pos,bg,fill){if(fill){ctx.fillStyle=bg;ctx.fillRect(0,0,W,H)}
ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';var g=geom(iw,ih,W,H,fit,pos.z||1);
ctx.drawImage(img,(W-g.dw)*pos.x,(H-g.dh)*pos.y,g.dw,g.dh)}
function enc(cv,type,q){return new Promise(function(res,rej){cv.toBlob(function(b){b?res(b):rej(new Error('encode'))},type,q)})}
function isBlank(cv){var c=document.createElement('canvas');c.width=c.height=32;var x=c.getContext('2d');x.drawImage(cv,0,0,32,32);var d=x.getImageData(0,0,32,32).data,mn=255,mx=0,al=0;
for(var i=0;i<d.length;i+=4){var l=(d[i]*3+d[i+1]*4+d[i+2])>>3;if(l<mn)mn=l;if(l>mx)mx=l;if(d[i+3]>al)al=d[i+3]}return al<5||mx-mn<=2}
/* ---- Processing ---- */
async function processOne(it,mode,cfg,prog){
it.status='working';it.prog=0;it.err='';renderItem(it);await tick();
var bmp=await decode(it.file),d=dim(bmp),tw=mode==='compress'?d.w:cfg.w,th=mode==='compress'?d.h:cfg.h;
var cv=document.createElement('canvas');cv.width=tw;cv.height=th;var ctx=cv.getContext('2d');
drawFit(ctx,bmp,d.w,d.h,tw,th,mode==='compress'?'stretch':cfg.fit,mode==='compress'?{x:.5,y:.5,z:1}:it.pos,cfg.bg,cfg.fmt==='jpg');done(bmp);
prog(it,15);await tick();
var blank=isBlank(cv),mime=MIME[cfg.fmt],blob,q=null,floorFail=false;
if(cfg.fmt==='png'){blob=await enc(cv,mime);prog(it,85)}
else{var q0=cfg.q/100;blob=await enc(cv,mime,q0);q=q0;prog(it,35);await tick();
 if(blob.size>cfg.lim){var fb=await enc(cv,mime,FLOOR_Q);prog(it,50);await tick();
  if(fb.size>cfg.lim){blob=fb;q=FLOOR_Q;floorFail=true}
  else{var lo=FLOOR_Q,hi=q0,best=fb;for(var i=0;i<7;i++){var mid=(lo+hi)/2,b=await enc(cv,mime,mid);if(b.size<=cfg.lim){lo=mid;best=b}else hi=mid;prog(it,50+Math.round((i+1)*5));await tick()}
   blob=best;q=Math.floor(lo*100)/100}}}
if(blob.type!==mime)throw new Error('Your browser cannot export '+FLAB[cfg.fmt]+'. Choose another output format.');
/* Re-open the result to confirm it is a valid image of the right size */
var okRead=true,ow=0,oh=0;try{var vb=await createImageBitmap(blob);ow=vb.width;oh=vb.height;done(vb)}catch(e){okRead=false}
prog(it,95);
var C=[],add=function(k,t){C.push({k:k,t:t})},rm=cfg.mk,rc=PRESETS[rm];
add(ow===tw?'ok':'fail',ow===tw?'Width is '+ow+' px'+(mode==='compress'?' (unchanged)':''):'Width is '+ow+' px, expected '+tw+' px');
add(oh===th?'ok':'fail',oh===th?'Height is '+oh+' px'+(mode==='compress'?' (unchanged)':''):'Height is '+oh+' px, expected '+th+' px');
var ar=tw/th,tr=mode==='compress'?d.w/d.h:cfg.w/cfg.h;
add(Math.abs(ar/tr-1)<0.005?'ok':'fail','Aspect ratio '+(mode==='compress'?'unchanged':'matches the setting')+' ('+(ar).toFixed(3)+')');
if(rc){var rr=rm==='myntra'?0.75:1;if(Math.abs(ar/rr-1)>0.005)add('warn','Recommended '+rc.n+' ratio is '+(rm==='myntra'?'3:4':'1:1')+'. This image is '+ar.toFixed(2)+':1.')}
if(mode!=='compress'&&cfg.fit==='stretch'&&Math.abs((d.w/d.h)/ar-1)>0.02)add('warn','Stretched to fit, so the image may look distorted.');
var over=blob.size>cfg.lim;
add(over?'fail':'ok',over?'File size '+fsz(blob.size)+' is over the limit ('+cfg.limText+')':'File size '+fsz(blob.size)+' is within the limit ('+cfg.limText+')');
if(over&&cfg.fmt==='png')add('warn','PNG cannot be compressed further. Use JPG or WEBP to reach this limit.');
if(over&&floorFail)add('warn','Quality was lowered to '+Math.round(FLOOR_Q*100)+'% and the file is still too large. Try a larger limit or a smaller size.');
else if(q!==null&&q<MIN_Q-1e-9)add('warn','Quality was lowered to '+Math.round(q*100)+'% (below '+Math.round(MIN_Q*100)+'%) to fit the size limit. Check the result for visible softness.');
else if(q!==null&&q<cfg.q/100-1e-9)add('ok','Quality adjusted to '+Math.round(q*100)+'% to fit the size limit');
if(rm==='myntra'&&!over&&(blob.size<rc.lo||blob.size>rc.hi))add('warn',(blob.size<rc.lo?'Smaller':'Larger')+' than Myntra’s recommended 500 KB to 1 MB (a guideline, not a rule)');
add(blob.type===mime?'ok':'fail','Format is '+FLAB[cfg.fmt]);
if(rc&&cfg.fmt!=='jpg')add('warn',rc.n+' recommends JPG');
add(okRead?'ok':'fail',okRead?'Image opens correctly (not corrupted)':'Result could not be opened');
add(blank?'fail':'ok',blank?'Image looks blank (one flat colour)':'Image is not blank');
var fin=C.some(function(c){return c.k==='fail'})?'fail':C.some(function(c){return c.k==='warn'})?'warn':'ok';
it.out={blob:blob,url:URL.createObjectURL(blob),w:ow||tw,h:oh||th,size:blob.size,fmt:cfg.fmt,q:q,checks:C,fin:fin,code:mode==='compress'?'CMP':(rc?rc.code:'CU')};
it.status='done';prog(it,100)}
function progress(it,p){it.prog=p;var e=$('pg'+it.id);if(e)e.style.width=p+'%';var l=$('pl'+it.id);if(l)l.textContent=p+'%'}
async function runAll(mode){if(busy)return;
var de=mode==='compress'?'':dimErr(),se=sizeErr();$('rz_de').textContent=de;$('rz_ce').textContent=se;
if(de||se){snack('Check your settings',de||se,true);return}
var list=items.filter(function(i){return i.status!=='error'&&i.status!=='loading'});
if(!list.length){snack('No images to process','Add at least one readable image first.',true);return}
var cfg={w:S.w,h:S.h,fit:S.fit,bg:S.bg,fmt:S.fmt,q:S.q,mk:S.mk,lim:0,limText:''},L=limit();cfg.lim=L.strict?L.b-1:L.b;cfg.limText=limitText(L);
items.forEach(function(i){if(i.out){try{URL.revokeObjectURL(i.out.url)}catch(e){}i.out=null}if(i.status==='done')i.status='idle'});
busy=true;stop=false;setBusy(true);render();
var pb=$('rz_pb');pb.hidden=false;var n=0;
for(var k=0;k<list.length&&!stop;k++){var it=list[k];
 $('rz_pt').textContent='Processing '+(k+1)+' of '+list.length+': '+it.file.name;$('rz_pf').style.width=Math.round(k/list.length*100)+'%';
 try{await processOne(it,mode,cfg,function(x,p){progress(x,p);$('rz_pf').style.width=Math.round((k+p/100)/list.length*100)+'%'})}
 catch(e){it.status='error';it.err=(e&&e.message&&e.message!=='encode'&&e.message!=='decode')?e.message:'This image could not be processed.'}
 n++;renderItem(it);totals();await tick()}
busy=false;setBusy(false);
$('rz_pf').style.width='100%';$('rz_pt').textContent=stop?'Stopped after '+n+' of '+list.length+' images.':'Finished '+n+' image'+(n>1?'s':'')+'.';
render();totals();buttons();snack(stop?'Stopped':'Done',stop?n+' of '+list.length+' processed':n+' image'+(n>1?'s':'')+' processed')}
$('rz_go').onclick=function(){runAll('resize')};$('rz_cm').onclick=function(){runAll('compress')};$('rz_st').onclick=function(){stop=true;this.disabled=true};
function setBusy(b){[].forEach.call(document.querySelectorAll('.rz input,.rz select,.rz button'),function(e){e.disabled=b&&e.id!=='rz_st'});$('rz_st').disabled=false;$('rz_st').hidden=!b;if(!b)buttons()}
/* ---- Rendering ---- */
var LAB={ok:'Passed',warn:'Warning',fail:'Failed'},FIN={ok:'Ready for upload',warn:'Ready with warnings',fail:'Needs correction'};
function fname(it){var o=it.out;return o?clean(it.base)+'_'+o.code+'_'+o.w+'x'+o.h+'.'+EXT[o.fmt]:clean(it.base)}
function itemHtml(it){var o=it.out,id=it.id,h='';
var chip=it.status==='loading'?'<span class="chip">Reading…</span>':it.status==='error'?'<span class="chip rz-f">Failed</span>':it.status==='working'?'<span class="chip">Processing <span id="pl'+id+'">'+(it.prog||0)+'%</span></span>':o?'<span class="chip rz-'+o.fin+'">'+FIN[o.fin]+'</span>':'<span class="chip">Not processed</span>';
h+='<div class="rz-ih"><label class="rz-chk"><input type="checkbox" data-a="sel"'+(it.sel?' checked':'')+'> <span class="rz-fn">'+esc(it.file.name)+'</span></label>'+chip+'<button class="sb dng" type="button" data-a="rm">Remove</button></div>';
if(it.status==='error'){return h+'<p class="note lerr" style="margin:8px 0 0">'+esc(it.err)+'</p>'}
h+='<div class="rz-cmp"><figure><div class="rz-im"><img src="'+esc(it.url)+'" alt="Original '+esc(it.file.name)+'"></div><figcaption>Original</figcaption></figure>'
+'<figure><div class="rz-im">'+(o?'<img src="'+esc(o.url)+'" alt="Processed '+esc(it.file.name)+'">':'<span class="rz-mute">'+(it.status==='working'?'Working…':'Not processed yet')+'</span>')+'</div><figcaption>Processed</figcaption></figure></div>';
if(it.status==='working')h+='<div class="rz-pg" aria-hidden="true"><i id="pg'+id+'" style="width:'+(it.prog||0)+'%"></i></div>';
h+='<table class="rz-tb"><thead><tr><th scope="col"><span class="sr">Property</span></th><th scope="col">Original</th><th scope="col">Processed</th></tr></thead><tbody>'
+'<tr><th scope="row">Width</th><td>'+(it.w||'–')+' px</td><td>'+(o?o.w+' px':'–')+'</td></tr>'
+'<tr><th scope="row">Height</th><td>'+(it.h||'–')+' px</td><td>'+(o?o.h+' px':'–')+'</td></tr>'
+'<tr><th scope="row">File size</th><td>'+fsz(it.size)+'</td><td>'+(o?fsz(o.size):'–')+'</td></tr>'
+'<tr><th scope="row">Format</th><td>'+it.fmt+'</td><td>'+(o?FLAB[o.fmt]:'–')+'</td></tr></tbody></table>';
if(o){var sv=it.size-o.size,pc=it.size?Math.round(sv/it.size*1000)/10:0;
h+='<p class="rz-sv"><b>'+(sv>=0?'Space saved: '+fsz(sv):'Larger by '+fsz(-sv))+'</b> · '+(sv>=0?'Compression: '+pc+'%':'Size change: +'+Math.abs(pc)+'%')+' · Final: '+o.w+' × '+o.h+' px, '+fsz(o.size)+'</p>';
h+='<ul class="rz-vl">'+o.checks.map(function(c){return '<li class="rz-'+c.k+'"><b>'+LAB[c.k]+'</b> '+esc(c.t)+'</li>'}).join('')+'</ul>'}
h+='<div class="rz-ac"><label class="rz-nm">File name<span class="rz-nmr"><input data-a="name" value="'+esc(it.base)+'" maxlength="80" aria-label="File name for '+esc(it.file.name)+'"><span class="rz-mute" id="fp'+id+'">'+esc(o?fname(it).slice(clean(it.base).length):'_'+(PRESETS[S.mk]?PRESETS[S.mk].code:'CU')+'_'+S.w+'x'+S.h+'.'+EXT[S.fmt])+'</span></span></label>'
+'<div class="cta"><button class="sb" type="button" data-a="crop"'+(it.status==='loading'?' disabled':'')+'>Adjust crop</button>'+(o?'<button class="sb" type="button" data-a="dl">Download</button>':'')+'</div></div>';
return h}
function renderItem(it){var e=document.querySelector('.rz-it[data-id="'+it.id+'"]');if(!e)return;e.innerHTML=itemHtml(it);e.className='rz-it'+(it.status==='working'?' work':'')}
function render(){var l=$('rz_ls');
l.innerHTML=items.map(function(it){return '<article class="rz-it'+(it.status==='working'?' work':'')+'" data-id="'+it.id+'">'+itemHtml(it)+'</article>'}).join('');
$('rz_em').hidden=items.length>0;$('rz_tl').hidden=!items.length}
$('rz_ls').addEventListener('click',function(e){var b=e.target.closest('[data-a]');if(!b||busy)return;var a=b.getAttribute('data-a');if(a==='sel'||a==='name')return;
var art=b.closest('.rz-it'),it=items.filter(function(x){return x.id==art.getAttribute('data-id')})[0];if(!it)return;
if(a==='rm'){release(it);items=items.filter(function(x){return x!==it});render();totals();buttons()}
else if(a==='dl')downloadFile(fname(it),it.out.blob);
else if(a==='crop')openCrop(it)});
$('rz_ls').addEventListener('change',function(e){var b=e.target;if(b.getAttribute('data-a')!=='sel')return;var it=items.filter(function(x){return x.id==b.closest('.rz-it').getAttribute('data-id')})[0];if(it){it.sel=b.checked;$('rz_sa').checked=items.every(function(x){return x.sel});buttons()}});
$('rz_ls').addEventListener('input',function(e){var b=e.target;if(b.getAttribute('data-a')!=='name')return;var it=items.filter(function(x){return x.id==b.closest('.rz-it').getAttribute('data-id')})[0];if(!it)return;it.base=b.value;var p=$('fp'+it.id);if(p&&it.out)p.textContent=fname(it).slice(clean(it.base).length)});
$('rz_sa').onchange=function(){var v=this.checked;items.forEach(function(i){i.sel=v});[].forEach.call(document.querySelectorAll('[data-a=sel]'),function(c){c.checked=v});buttons()};
function totals(){var d=items.filter(function(i){return i.out}),o=0,p=0;d.forEach(function(i){o+=i.size;p+=i.out.size});
$('rz_sm').hidden=!d.length;$('rz_fs').hidden=!d.length;if(!d.length)return;
$('t_o').textContent=fsz(o);$('t_p').textContent=fsz(p);var gain=o>=p;$('t_s').textContent=fsz(Math.abs(o-p));$('t_s').nextElementSibling.textContent=gain?'Space saved':'Size increase';$('t_c').textContent=(o?Math.abs(Math.round((o-p)/o*1000)/10):0)+'%';$('t_c').nextElementSibling.textContent=gain?'Compression':'Larger than original';
var c={ok:0,warn:0,fail:0};d.forEach(function(i){c[i.out.fin]++});
var w=c.fail?'fail':c.warn?'warn':'ok';$('rz_fs').className='rz-fin rz-'+w;
$('rz_fs').innerHTML='<b>'+(c.fail?'Needs correction':c.warn?'Ready with warnings':'Ready for upload')+'</b> · '+c.ok+' ready, '+c.warn+' with warnings, '+c.fail+' need correction (of '+d.length+' processed). Not an official Myntra or Flipkart approval.'}
function buttons(){if(busy)return;var ok=!dimErr()&&!sizeErr(),ready=items.some(function(i){return i.status!=='error'&&i.status!=='loading'}),dn=items.filter(function(i){return i.out}),sel=dn.filter(function(i){return i.sel});
$('rz_go').disabled=!ready||!ok;$('rz_cm').disabled=!ready||!!sizeErr();$('rz_ds').disabled=!sel.length;$('rz_da').disabled=!dn.length;$('rz_cl').disabled=!items.length;$('rz_st').disabled=true;$('rz_st').hidden=true}
/* ---- Downloads and ZIP ---- */
function downloadFile(name,blob){return new Promise(function(res){
function fb(){try{var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},2000);res(1)}catch(e){snack('Download failed','Your browser blocked the download.',true);res(0)}}
try{if(window.claude&&claude.use){claude.use('downloads').then(function(d){if(!d)return fb();d.save({filename:name,data:blob}).then(function(){res(1)},function(e){if(e&&e.code==='declined')res(0);else fb()})},fb);return}}catch(e){}
fb()})}
var CT=null;function crc(u8){if(!CT){CT=[];for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;CT[n]=c>>>0}}
var c=-1;for(var i=0;i<u8.length;i++)c=CT[(c^u8[i])&255]^(c>>>8);return (c^-1)>>>0}
async function makeZip(files){var parts=[],cd=[],off=0,now=new Date(),dt=((now.getFullYear()-1980)<<9)|((now.getMonth()+1)<<5)|now.getDate(),tm=(now.getHours()<<11)|(now.getMinutes()<<5)|(now.getSeconds()>>1),enc=new TextEncoder();
for(var i=0;i<files.length;i++){var f=files[i],nm=enc.encode(f.name),u8=new Uint8Array(await f.blob.arrayBuffer()),cr=crc(u8),sz=u8.length;
var lh=new DataView(new ArrayBuffer(30));lh.setUint32(0,0x04034b50,true);lh.setUint16(4,20,true);lh.setUint16(6,0x0800,true);lh.setUint16(8,0,true);lh.setUint16(10,tm,true);lh.setUint16(12,dt,true);lh.setUint32(14,cr,true);lh.setUint32(18,sz,true);lh.setUint32(22,sz,true);lh.setUint16(26,nm.length,true);lh.setUint16(28,0,true);
parts.push(lh.buffer,nm,u8);
var ch=new DataView(new ArrayBuffer(46));ch.setUint32(0,0x02014b50,true);ch.setUint16(4,20,true);ch.setUint16(6,20,true);ch.setUint16(8,0x0800,true);ch.setUint16(10,0,true);ch.setUint16(12,tm,true);ch.setUint16(14,dt,true);ch.setUint32(16,cr,true);ch.setUint32(20,sz,true);ch.setUint32(24,sz,true);ch.setUint16(28,nm.length,true);ch.setUint32(42,off,true);
cd.push(ch.buffer,nm);off+=30+nm.length+sz;await tick()}
var cs=0;cd.forEach(function(b){cs+=b.byteLength||b.length});
var ed=new DataView(new ArrayBuffer(22));ed.setUint32(0,0x06054b50,true);ed.setUint16(8,files.length,true);ed.setUint16(10,files.length,true);ed.setUint32(12,cs,true);ed.setUint32(16,off,true);
return new Blob(parts.concat(cd,[ed.buffer]),{type:'application/zip'})}
async function zipDownload(list,label){var used={},files=list.map(function(it){var n=fname(it),b=n,k=1,dot=n.lastIndexOf('.');while(used[n.toLowerCase()]){k++;n=n.slice(0,dot)+'_'+k+n.slice(dot)}used[n.toLowerCase()]=1;return {name:n,blob:it.out.blob}});
var z=await makeZip(files),d=new Date();
var nm='tax-wrapper-images-'+d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0')+'.zip';
if(await downloadFile(nm,z))snack('ZIP ready',files.length+' image'+(files.length>1?'s':'')+' in '+nm)}
$('rz_ds').onclick=function(){var l=items.filter(function(i){return i.out&&i.sel});if(!l.length)return;if(l.length===1)downloadFile(fname(l[0]),l[0].out.blob);else zipDownload(l)};
$('rz_da').onclick=function(){var l=items.filter(function(i){return i.out});if(!l.length)return;zipDownload(l)};
/* ---- Clear all ---- */
$('rz_cl').onclick=function(){if(busy)return;$('rz_cld').textContent='This removes all '+items.length+' image'+(items.length>1?'s':'')+' and any processed results. Download what you need first.';$('rz_cl_m').hidden=false;$('rz_cln').focus()};
$('rz_cln').onclick=function(){$('rz_cl_m').hidden=true;$('rz_cl').focus()};
$('rz_cly').onclick=function(){items.forEach(release);items=[];$('rz_cl_m').hidden=true;$('rz_pb').hidden=true;$('rz_ue').textContent='';render();totals();buttons();snack('Cleared','All images removed.')};
/* ---- Crop and position ---- */
var CV=$('rz_cv2'),CM=$('rz_cm_m');
function cropDraw(){if(!cropBmp)return;var d=dim(cropBmp),x=CV.getContext('2d');x.clearRect(0,0,CV.width,CV.height);drawFit(x,cropBmp,d.w,d.h,CV.width,CV.height,S.fit,cropState,S.bg,true)}
async function openCrop(it){var e=dimErr();if(e){snack('Check the dimensions',e,true);return}
if(S.fit==='stretch'){snack('Crop is not used with Stretch','Choose Fit / Contain or Fill / Cover to adjust the visible area.',true);return}
try{cropBmp=await decode(it.file)}catch(x){snack('Could not open this image','',true);return}
cropIt=it;cropState={x:it.pos.x,y:it.pos.y,z:it.pos.z};var k=Math.min(1,420/Math.max(S.w,S.h));CV.width=Math.max(1,Math.round(S.w*k));CV.height=Math.max(1,Math.round(S.h*k));
$('rz_z').value=Math.round(cropState.z*100);$('rz_zv').textContent=Math.round(cropState.z*100)+'%';$('rz_cd').textContent=it.file.name+' · output '+S.w+' × '+S.h+' px. Drag the image (or use the arrow keys) to choose the visible area.';
CM.hidden=false;cropDraw();$('rz_z').focus()}
function closeCrop(){CM.hidden=true;done(cropBmp);cropBmp=null;cropIt=null}
$('rz_z').oninput=function(){cropState.z=this.value/100;$('rz_zv').textContent=this.value+'%';cropDraw()};
$('rz_cok').onclick=function(){if(cropIt){cropIt.pos={x:cropState.x,y:cropState.y,z:cropState.z};var i=cropIt;closeCrop();invalidate(i);buttons()}};
$('rz_cre').onclick=function(){cropState={x:.5,y:.5,z:1};$('rz_z').value=100;$('rz_zv').textContent='100%';cropDraw()};
$('rz_cca').onclick=closeCrop;CM.addEventListener('mousedown',function(e){if(e.target===CM)closeCrop()});
document.addEventListener('keydown',function(e){if(e.key!=='Escape')return;if(!CM.hidden)closeCrop();else if(!$('rz_cl_m').hidden)$('rz_cln').click()});
function pan(dx,dy){if(!cropBmp)return;var d=dim(cropBmp),g=geom(d.w,d.h,CV.width,CV.height,S.fit,cropState.z),fx=CV.width-g.dw,fy=CV.height-g.dh;
if(Math.abs(fx)>0.5)cropState.x=clamp((fx*cropState.x+dx)/fx,0,1);if(Math.abs(fy)>0.5)cropState.y=clamp((fy*cropState.y+dy)/fy,0,1);cropDraw()}
var drag=null;
CV.addEventListener('pointerdown',function(e){drag={x:e.clientX,y:e.clientY};CV.setPointerCapture(e.pointerId);e.preventDefault()});
CV.addEventListener('pointermove',function(e){if(!drag)return;var r=CV.getBoundingClientRect(),k=CV.width/r.width;pan((e.clientX-drag.x)*k,(e.clientY-drag.y)*k);drag={x:e.clientX,y:e.clientY}});
['pointerup','pointercancel'].forEach(function(t){CV.addEventListener(t,function(){drag=null})});
CV.tabIndex=0;CV.addEventListener('keydown',function(e){var s=6,m={ArrowLeft:[-s,0],ArrowRight:[s,0],ArrowUp:[0,-s],ArrowDown:[0,s]}[e.key];if(m){e.preventDefault();pan(m[0],m[1])}});
/* ---- Start ---- */
var saved=ss(ST_KEY);
if(saved&&typeof saved==='object'){['w','h','ratio','q','cv'].forEach(function(k){if(typeof saved[k]==='number'||k==='cv')S[k]=saved[k]});
if(typeof saved.lock==='boolean')S.lock=saved.lock;if(/^(contain|cover|stretch)$/.test(saved.fit))S.fit=saved.fit;if(/^#[0-9a-f]{6}$/i.test(saved.bg))S.bg=saved.bg;
if(saved.ms==='custom'||SIZES[saved.ms])S.ms=saved.ms;if(saved.cu==='KB'||saved.cu==='MB')S.cu=saved.cu;if(MIME[saved.fmt])S.fmt=saved.fmt;
if(PRESETS[saved.mk]||saved.mk==='custom'||(typeof saved.mk==='string'&&findPreset(saved.mk)))S.mk=saved.mk}
S.q=clamp(Math.round(S.q/5)*5,60,100);if(!(S.ratio>0))S.ratio=(S.w>0&&S.h>0)?S.w/S.h:0.75;
fillMk();sync();render();totals();buttons();
window.addEventListener('pagehide',function(){items.forEach(release)});
window.__rz={S:S,get items(){return items}};
})();
