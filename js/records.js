/* Saved invoices and CSV export.
   Records live in this browser (localStorage). Each record has an owner; a normal user only ever
   sees their own, an admin sees everyone's. This is app-level privacy, not real security (no server). */
var TW_IK='tw-invoices';
function twInvAll(){var a=twRead(TW_IK,[]);return Array.isArray(a)?a:[]}
function twInvList(){var u=twUser();if(!u)return [];var a=twInvAll();return u.r==='admin'?a:a.filter(function(r){return r.o===u.u})}
function twInvPut(a){return twWrite(TW_IK,a)}
function invCalc(d){var S=d.s,sc=pc(S.su,S.sg,S.ss),bc=pc(S.bu,S.bg,S.bs),intra=sc===bc,sub=0,tax=0,qt=0,lines=[];
(d.items||[]).forEach(function(it){var q=+it.q||0,p=+it.r||0,g=+it.g||0,dc=Math.min(100,Math.max(0,+it.dc||0)),v=Math.round(q*p*(100-dc))/100,t=Math.round(v*g)/100;
sub+=v;tax+=t;qt+=q;lines.push({d:it.d||'',h:it.h||'',q:q,r:p,dc:dc,g:g,v:v,t:t})});
sub=Math.round(sub*100)/100;tax=Math.round(tax*100)/100;
var tot=sub+tax,rd=Math.round(tot),ro=Math.round((rd-tot)*100)/100,c=intra?Math.round(tax*50)/100:0;
return {sub:sub,tax:tax,qt:qt,rd:rd,ro:ro,cgst:c,sgst:intra?Math.round((tax-c)*100)/100:0,igst:intra?0:tax,sc:sc,bc:bc,lines:lines}}
/* Save (or update) the signed-in user's copy. Returns the record id, or '' when nobody is logged in. */
function twInvSave(d){var u=twUser();if(!u)return '';
var all=twInvAll(),old=d.id?all.filter(function(r){return r.id===d.id})[0]:null,owner=u.u;
if(old&&old.o!==u.u&&u.r!=='admin')old=null;
if(!old&&d.no)old=all.filter(function(r){return r.o===u.u&&r.no===d.no})[0]||null;
if(old&&!(d.ed||old.no===d.no))old=null;
if(old)owner=old.o;
var c=JSON.parse(JSON.stringify(d));delete c.id;delete c.ed;delete c.by;
var rec={id:old?old.id:'i'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),o:owner,t:Date.now(),no:d.no||'',dt:d.dt||'',d:c};
if(old)all[all.indexOf(old)]=rec;else all.push(rec);
return twInvPut(all)?rec.id:''}
function twInvDel(id){var u=twUser();if(!u)return false;
var all=twInvAll(),r=all.filter(function(x){return x.id===id})[0];
if(!r||(r.o!==u.u&&u.r!=='admin'))return false;
return twInvPut(all.filter(function(x){return x.id!==id}))}
function twInvDate(r){return r.dt||iso(new Date(r.t))}
function twInvRange(list,from,to){return list.filter(function(r){var x=twInvDate(r);return(!from||x>=from)&&(!to||x<=to)})}
/* CSV */
function csvCell(v){if(typeof v==='number')return String(v);v=String(v==null?'':v);
if(/^[=+\-@\t\r]/.test(v))v="'"+v; /* stops spreadsheets running a cell as a formula */
return /[",\r\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
function csvText(rows){return rows.map(function(r){return r.map(csvCell).join(',')}).join('\r\n')+'\r\n'}
function stamp(t){var d=new Date(t);return iso(d)+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}
function twInvCsv(list,withUser){
var h=['Invoice No','Invoice Date','Saved On'].concat(withUser?['User']:[],['Seller','Seller GSTIN','Seller State','Buyer','Buyer GSTIN','Buyer State','Items','Total Qty','Taxable Value','CGST','SGST','IGST','Round Off','Invoice Total']),rows=[h];
list.forEach(function(r){var d=r.d,S=d.s,c=invCalc(d);
rows.push([r.no,twInvDate(r),stamp(r.t)].concat(withUser?[r.o]:[],[S.sn,S.su?'Unregistered':S.sg,S.su?S.ss:ST[c.sc]||'',S.bn,S.bu?'Unregistered':S.bg,S.bu?S.bs:ST[c.bc]||'',c.lines.length,c.qt,c.sub,c.cgst,c.sgst,c.igst,c.ro,c.rd]))});
return csvText(rows)}
function twInvLinesCsv(list,withUser){
var rows=[['Invoice No','Invoice Date'].concat(withUser?['User']:[],['Buyer','Line','Description','HSN/SAC','Quantity','Rate','Discount %','GST %','Taxable Value','Tax Amount','Line Total'])];
list.forEach(function(r){var c=invCalc(r.d);c.lines.forEach(function(l,i){
rows.push([r.no,twInvDate(r)].concat(withUser?[r.o]:[],[r.d.s.bn,i+1,l.d,l.h,l.q,l.r,l.dc,l.g,l.v,l.t,Math.round((l.v+l.t)*100)/100]))})});
return csvText(rows)}
/* Offers the file through the viewer's save prompt when the host provides one, else a normal browser download */
function twDownload(name,text){return new Promise(function(res,rej){var data='﻿'+text;
function fb(){try{var b=new Blob([data],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1500);res('saved')}catch(e){rej(e)}}
try{if(window.claude&&claude.use){claude.use('downloads').then(function(d){if(!d)return fb();d.save({filename:name,data:data}).then(function(){res('saved')},function(e){if(e&&e.code==='declined')res('declined');else fb()})},fb);return}}catch(e){}
fb()})}

/* Side notification */
function snack(title,msg,kind,link){var e=document.getElementById('snack');if(!e){e=document.createElement('div');e.id='snack';e.className='snack';e.setAttribute('role','status');e.setAttribute('aria-live','polite');document.body.appendChild(e)}
e.className='snack'+(kind==='warn'?' warn':'');
e.innerHTML='<b>'+esc(title)+'</b>'+(msg?'<span>'+esc(msg)+'</span>':'')+(link?'<a href="'+esc(link.href)+'">'+esc(link.text)+'</a>':'');
e.hidden=false;clearTimeout(snack.h);snack.h=setTimeout(function(){e.hidden=true},5000)}

/* Masters: saved buyers and sellers, private to each user */
var TW_MK='tw-masters';
function twMasterAll(){var a=twRead(TW_MK,[]);return Array.isArray(a)?a:[]}
function twMasters(cat){var u=twUser();if(!u)return [];return twMasterAll().filter(function(m){return m.o===u.u&&(!cat||m.c===cat)}).sort(function(a,b){return a.n.toLowerCase()<b.n.toLowerCase()?-1:1})}
function twMasterSave(m){var u=twUser();if(!u)return '';var all=twMasterAll(),i=-1;
if(m.id)all.forEach(function(x,k){if(x.id===m.id&&x.o===u.u)i=k});
var rec=JSON.parse(JSON.stringify(m));rec.o=u.u;
if(i>-1)all[i]=rec;else{rec.id='m'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);all.push(rec)}
return twWrite(TW_MK,all)?rec.id:''}
function twMasterDel(id){var u=twUser();if(!u)return false;return twWrite(TW_MK,twMasterAll().filter(function(x){return !(x.id===id&&x.o===u.u)}))}
function twMasterAddr(m){return m.a+(m.p?' - '+m.p:'')}
function twBank(m){var b=m.b||{},p=[];if(b.h)p.push('A/c Holder: '+b.h);if(b.n)p.push('Bank: '+b.n);if(b.a)p.push('A/c No.: '+b.a);if(b.i)p.push('IFSC: '+b.i);if(b.r)p.push('Branch: '+b.r);return p.join('  |  ')}
