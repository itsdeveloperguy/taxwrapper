/* Bulk invoice import: read an Excel or CSV file, check it, save many invoices at once. */
(function(){
var btn=$('i_bulk');if(!btn)return;
var M=$('bm'),C=$('bm_c'),IN=$('bm_in'),RES=[],MAXB=5*1024*1024,MAXI=1000;
var COLS=[
['Invoice No','invoice no|invoice number|inv no|invoice','INV-001'],
['Invoice Date','invoice date|date','2026-04-01'],
['Seller Name','seller name|seller','Sunrise Traders'],
['Seller Address','seller address','12 Market Road, Bengaluru'],
['Seller GSTIN','seller gstin|seller gst','29ABCDE1234F1Z5'],
['Seller Unregistered','seller unregistered|seller unregistered (yes/no)','No'],
['Seller State','seller state','Karnataka'],
['Buyer Name','buyer name|buyer','Metro Retail'],
['Buyer Address','buyer address','45 Park Street, Mumbai'],
['Buyer GSTIN','buyer gstin|buyer gst','27ABCDE1234F1Z5'],
['Buyer Unregistered','buyer unregistered|buyer unregistered (yes/no)','No'],
['Buyer State','buyer state','Maharashtra'],
['Delivery Note','delivery note','']
,['Mode/Terms of Payment','mode/terms of payment|terms of payment|mode of payment','30 days']
,['Reference No. & Date','reference no. & date|reference no & date|reference no','']
,['Other References','other references','']
,['Buyer Order No','buyer order no|buyers order no|buyer’s order no.|buyer’s order no|order no','']
,['Buyer Order Date','buyer order date|dated','']
,['Dispatch Doc No','dispatch doc no','']
,['Delivery Note Date','delivery note date','']
,['Dispatched Through','dispatched through','']
,['Destination','destination','']
,['Terms of Delivery','terms of delivery','']
,['Item Description','item description|description|item','Cotton T-shirt']
,['HSN/SAC','hsn/sac|hsn|sac','6109']
,['Quantity','quantity|qty','10']
,['Rate','rate|price','250']
,['Discount %','discount %|discount|disc','0']
,['GST %','gst %|gst rate|gst|tax %','5']];
var RKMAP={dn:12,mp:13,rf:14,ro:15,bo:16,bd:17,dp:18,dd:19,dt:20,ds:21,td:22};
var GSTS=[0,5,12,18,28];
function norm(s){return String(s==null?'':s).trim().toLowerCase().replace(/\s+/g,' ')}
function ge(id){return document.getElementById(id)}
function yes(v){return /^(y|yes|true|1)$/i.test(String(v||'').trim())}
function num(v){if(typeof v==='number')return v;var s=String(v==null?'':v).replace(/[,₹\s]/g,'');return s===''?NaN:Number(s)}
function dateOk(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;var d=new Date(v+'T00:00:00');return !isNaN(d)&&iso(d)===v}
function toDate(v){v=String(v||'').trim();var m=v.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);if(m)v=m[3]+'-'+('0'+m[2]).slice(-2)+'-'+('0'+m[1]).slice(-2);return v}
function hidden(el,h){el.hidden=h}
function err(t){ge('bm_e').textContent=t||''}

/* Templates */
function sample(){
var r1=COLS.map(function(c){return c[2]}),r2=r1.slice();
r2[23]='Denim jeans';r2[24]='6203';r2[25]='4';r2[26]='1200';r2[27]='10';r2[28]='12';
var r3=r1.slice();r3[0]='INV-002';r3[7]='Priya Fashions';r3[8]='8 MG Road, Pune';r3[9]='';r3[10]='Yes';r3[11]='Maharashtra';r3[23]='Sling bag';r3[24]='4202';r3[25]='2';r3[26]='899.50';r3[27]='';r3[28]='18';
return [r1,r2,r3]}
var INSTR=[['Field','Required','What to enter'],
['Invoice No','Yes','Rows with the same Invoice No form one invoice. Seller, buyer and reference details are taken from the first row of each invoice.'],
['Invoice Date','Yes','YYYY-MM-DD (for example 2026-04-01) or DD/MM/YYYY.'],
['Seller Name / Buyer Name','Yes','Business or person name.'],
['Seller Address / Buyer Address','Yes','Full address.'],
['Seller GSTIN / Buyer GSTIN','If registered','15 character GSTIN, for example 29ABCDE1234F1Z5. Leave empty when unregistered.'],
['Seller Unregistered / Buyer Unregistered','No','Yes or No. Default is No.'],
['Seller State / Buyer State','If unregistered','State name as in the invoice generator, for example Karnataka. Needed only when unregistered.'],
['Delivery Note to Terms of Delivery','No','Optional reference details shown on the invoice.'],
['Item Description','Yes','One row per item.'],
['HSN/SAC','No','Product or service code.'],
['Quantity','Yes','Number greater than 0.'],
['Rate','Yes','Price per unit, 0 or more.'],
['Discount %','No','0 to 100. Default 0.'],
['GST %','Yes','One of 0, 5, 12, 18, 28.']];
function save(name,blob){return twDl(name,blob)}
function twDl(name,blob){return new Promise(function(res){
function fb(){try{var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1500)}catch(e){}res()}
try{if(window.claude&&claude.use){claude.use('downloads').then(function(d){if(!d)return fb();d.save({filename:name,data:blob}).then(res,function(e){if(e&&e.code==='declined')res();else fb()})},fb);return}}catch(e){}
fb()})}
ge('bm_tx').onclick=async function(){try{var b=await twSheet.xlsx([{name:'Invoices',rows:[COLS.map(function(c){return c[0]})].concat(sample().map(function(r){return r.map(function(v,i){return i>=25&&v!==''&&i!==29&&!isNaN(+v)?+v:v})})),widths:COLS.map(function(c,i){return i===3||i===8?30:i===23?24:16})},{name:'Instructions',rows:INSTR,widths:[38,16,90]}]);
await save('taxwrapper-bulk-invoice-template.xlsx',b);snack('Template downloaded','Excel template with example rows and instructions.')}catch(e){snack('Could not create template',e.message||'Try the CSV template.','warn')}};
ge('bm_tc').onclick=async function(){try{var t=twSheet.csv([COLS.map(function(c){return c[0]})].concat(sample()));
await save('taxwrapper-bulk-invoice-template.csv',new Blob(['﻿'+t],{type:'text/csv;charset=utf-8'}));snack('Template downloaded','CSV template with example rows.')}catch(e){snack('Could not create template',e.message||'','warn')}};

/* Open / close */
function open_(){err('');M.hidden=false;snack('Bulk import opened','Download the template, fill it and choose the file.');ge('bm_tx').focus()}
function close_(){M.hidden=true;C.hidden=true}
btn.onclick=open_;ge('bm_close').onclick=close_;ge('bm_close2').onclick=close_;
M.addEventListener('mousedown',function(e){if(e.target===M)close_()});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){if(!C.hidden)C.hidden=true;else if(!M.hidden)close_()}});
['dragenter','dragover'].forEach(function(t){ge('bm_drop').addEventListener(t,function(){this.classList.add('drag')})});
['dragleave','drop'].forEach(function(t){ge('bm_drop').addEventListener(t,function(){this.classList.remove('drag')})});

/* Parse and validate */
function parse(rows){
if(!rows.length)throw new Error('The file is empty.');
var hi=0;for(var i=0;i<Math.min(rows.length,10);i++){if(rows[i].some(function(c){return norm(c)==='invoice no'||norm(c)==='invoice number'})){hi=i;break}}
var head=rows[hi].map(norm),idx=[];
COLS.forEach(function(c,k){var al=c[1].split('|').concat([norm(c[0])]);idx[k]=-1;for(var j=0;j<head.length;j++)if(al.indexOf(head[j])>-1){idx[k]=j;break}});
var must=[0,1,2,3,7,8,23,25,26,28],miss=must.filter(function(k){return idx[k]<0}).map(function(k){return COLS[k][0]});
if(miss.length)throw new Error('Missing column'+(miss.length>1?'s':'')+': '+miss.join(', ')+'. Please use the template.');
var groups=[],map={};
rows.slice(hi+1).forEach(function(r,ri){if(!r.some(function(c){return String(c==null?'':c).trim()!==''}))return;
var g=function(k){return idx[k]<0?'':(r[idx[k]]==null?'':r[idx[k]])},no=String(g(0)).trim(),key=no||('__row'+ri);
var o=map[key];if(!o){o={no:no,rows:[],first:g,line:hi+ri+2,errs:[]};map[key]=o;groups.push(o)}
o.rows.push({g:g,line:hi+ri+2})});
if(groups.length>MAXI)throw new Error('The file has '+groups.length+' invoices. The limit is '+MAXI+' per file.');
return groups.map(function(o){return build(o)})}
function build(o){var g=o.first,e=[],s=function(k){return String(g(k)==null?'':g(k)).trim()};
var no=o.no,dt=toDate(s(1));
if(!no)e.push('Invoice No is missing (row '+o.line+').');else if(no.length>40)e.push('Invoice No is too long.');
if(!dateOk(dt))e.push('Invoice Date must be YYYY-MM-DD or DD/MM/YYYY.');
var S={sn:s(2),sa:s(3),sg:s(4).toUpperCase().replace(/\s/g,''),su:yes(s(5)),ss:s(6),bn:s(7),ba:s(8),bg:s(9).toUpperCase().replace(/\s/g,''),bu:yes(s(10)),bs:s(11)};
if(!S.sn)e.push('Seller Name is missing.');if(!S.sa)e.push('Seller Address is missing.');
if(!S.bn)e.push('Buyer Name is missing.');if(!S.ba)e.push('Buyer Address is missing.');
[['s','Seller'],['b','Buyer']].forEach(function(x){var u=S[x[0]+'u'];
if(u){var c=codeOf(S[x[0]+'s']);if(!c)e.push(x[1]+' State is required and must be a valid state name when '+x[1].toLowerCase()+' is unregistered.');else S[x[0]+'s']=ST[c];S[x[0]+'g']=''}
else{if(!GST.test(S[x[0]+'g']))e.push(x[1]+' GSTIN must be a valid 15 character GSTIN (or mark '+x[1]+' Unregistered as Yes).');S[x[0]+'s']=''}});
var ref={};Object.keys(RKMAP).forEach(function(k){ref[k]=s(RKMAP[k]).slice(0,200)});
var items=[];
o.rows.forEach(function(r){var d=String(r.g(23)).trim(),q=num(r.g(25)),p=num(r.g(26)),dc=String(r.g(27)).trim()===''?0:num(r.g(27)),gs=num(r.g(28));
if(!d){e.push('Item Description is missing (row '+r.line+').');return}
if(!(q>0)){e.push('Quantity must be more than 0 (row '+r.line+').');return}
if(!(p>=0)){e.push('Rate must be 0 or more (row '+r.line+').');return}
if(!(dc>=0&&dc<=100)){e.push('Discount % must be 0 to 100 (row '+r.line+').');return}
if(GSTS.indexOf(gs)<0){e.push('GST % must be 0, 5, 12, 18 or 28 (row '+r.line+').');return}
items.push({d:d,h:String(r.g(24)).trim(),q:q,r:p,dc:dc,g:gs})});
var dup=0;
var data={s:S,no:no,dt:dt,ref:ref,items:items};
var tot=items.length&&!e.length?invCalc(data).rd:null;
return {no:no,data:data,errs:e,total:tot,n:o.rows.length,exists:!!no&&twInvHas(no),line:o.line,bn:S.bn}}
function markDup(list){var seen={};list.forEach(function(r){if(!r.no)return;if(seen[r.no]){r.errs.push('Invoice No appears again in a separate block of rows. Keep rows of one invoice together.');r.dupe=1}seen[r.no]=1})}

/* Render */
function render(){var ok=RES.filter(function(r){return !r.errs.length}),bad=RES.length-ok.length,rep=ok.filter(function(r){return r.exists}).length;
ge('bm_sum').innerHTML='<span>'+RES.length+' invoice'+(RES.length===1?'':'s')+' found</span><span class="ok">'+ok.length+' ready</span>'+(rep?'<span class="wn">'+rep+' will replace saved</span>':'')+(bad?'<span class="er">'+bad+' with errors</span>':'');
ge('bm_body').innerHTML=RES.map(function(r,i){var st=r.errs.length?'<span class="st-er">Error</span>'+r.errs.slice(0,3).map(function(m){return '<span class="em">'+esc(m)+'</span>'}).join('')+(r.errs.length>3?'<span class="em">and '+(r.errs.length-3)+' more</span>':''):r.exists?'<span class="st-wn">Replaces saved</span><span class="em">Same invoice no is already saved</span>':'<span class="st-ok">Ready</span>';
return '<tr><td>'+esc(r.no||'(none)')+'</td><td>'+esc(r.bn)+'</td><td class="rt">'+r.data.items.length+'</td><td class="rt">'+(r.total==null?'-':'₹ '+n2(r.total))+'</td><td>'+st+'</td><td>'+(r.errs.length?'':'<button class="sb" type="button" data-a="load" data-i="'+i+'">Load in form</button>')+'</td></tr>'}).join('');
ge('bm_note').textContent=ok.length?'Only invoices marked Ready or Replaces saved are saved. Fix the errors in your file and choose it again for the rest.':'No valid invoices yet. Fix the errors in your file and choose it again.';
ge('bm_save').disabled=!ok.length;ge('bm_save').textContent=ok.length?'Save '+ok.length+' valid invoice'+(ok.length===1?'':'s'):'Save valid invoices';
hidden(ge('bm_res'),false);ge('bm_res').scrollIntoView({behavior:'smooth',block:'nearest'})}
ge('bm_body').addEventListener('click',function(e){var b=e.target.closest('[data-a="load"]');if(!b)return;var r=RES[+b.dataset.i];if(!r)return;
loadInvoice(JSON.parse(JSON.stringify(r.data)));close_();snack('Invoice loaded in form','Invoice '+r.no+' is ready to edit, save or preview.');var f=ge('i_no');if(f&&f.scrollIntoView)f.scrollIntoView({behavior:'smooth',block:'center'})});

IN.addEventListener('change',async function(){var f=IN.files&&IN.files[0];IN.value='';if(!f)return;err('');hidden(ge('bm_res'),true);RES=[];
if(f.size>MAXB){err('This file is larger than 5 MB. Split it into smaller files.');snack('File too large','Please use a file under 5 MB.','warn');return}
if(!/\.(xlsx|csv|txt)$/i.test(f.name)){err('Please choose an .xlsx or .csv file.');snack('Unsupported file','Choose an .xlsx or .csv file.','warn');return}
ge('bm_fn').textContent='Reading '+f.name+'…';
try{var rows=await twSheet.read(f);RES=parse(rows);markDup(RES);RES.forEach(function(r){if(r.errs.length)r.total=null});
ge('bm_fn').textContent=f.name;render();
var ok=RES.filter(function(r){return !r.errs.length}).length;
snack('File checked',ok+' of '+RES.length+' invoice'+(RES.length===1?'':'s')+' ready'+(ok<RES.length?'. Review the errors.':'.'),ok<RES.length?'warn':undefined)}
catch(ex){ge('bm_fn').textContent='Up to 5 MB and 1,000 invoices.';err(ex.message||'Could not read this file.');snack('Could not read the file',ex.message||'Check the file and try again.','warn')}});

/* Save */
ge('bm_save').onclick=function(){if(!twUser()){snack('Log in to save invoices','Bulk invoices are saved to your account.','warn',{href:twPage('login'),text:'Log in'});return}
var ok=RES.filter(function(r){return !r.errs.length}),rep=ok.filter(function(r){return twInvHas(r.no)}).length;if(!ok.length)return;
ge('bm_cd').textContent=ok.length+' invoice'+(ok.length===1?'':'s')+' will be saved to your account.'+(rep?' '+rep+' with an existing invoice number will replace the saved copy.':'');C.hidden=false;ge('bm_cy').focus()};
ge('bm_cn').onclick=function(){C.hidden=true;snack('Save cancelled','No invoices were saved.')};
C.addEventListener('mousedown',function(e){if(e.target===C)C.hidden=true});
ge('bm_cy').onclick=function(){C.hidden=true;var ok=RES.filter(function(r){return !r.errs.length}),res=twInvSaveMany(ok.map(function(r){return r.data}));
if(!res){snack('Could not save','Your browser blocked site data or you are logged out.','warn');return}
snack(res.saved+' invoice'+(res.saved===1?'':'s')+' saved',(res.replaced?res.replaced+' replaced. ':'')+'Find them in Saved invoices.','',{href:twPage('invoices'),text:'View'});
RES=RES.filter(function(r){return r.errs.length});RES.forEach(function(r){r.exists=false});
if(RES.length)render();else{hidden(ge('bm_res'),true);ge('bm_fn').textContent='Done. Choose another file to import more.'}};
})();
