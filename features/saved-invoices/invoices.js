/* Saved invoices: date range, CSV download, and (for admins) every user's invoices */
(function(){
var me=twUser(),G=$('iv_g');
if(!me){G.innerHTML='<div class="pv-e"><h2>Log in to continue</h2><p>Log in to see your saved invoices.</p><a class="btn" href="'+twPage('login')+'">Log in</a></div>';G.hidden=false;return}
var adm=me.r==='admin',RM=$('r_m'),pend=null,last=null;
$('iv').hidden=false;
$('iv_h').textContent=adm?'All invoices':'My invoices';
$('iv_p').textContent=adm?'Every user’s saved invoices. Open, edit, delete or download them.':'Only you can see these. Download them as a CSV for any date range.';
if(adm){document.querySelector('.au').hidden=false;$('f_ul').hidden=false}
function flash(t){var e=$('d_t');e.textContent=t;e.hidden=false;clearTimeout(flash.h);flash.h=setTimeout(function(){e.hidden=true},4500)}
function fill(){if(!adm)return;var cur=$('f_u').value,names={};twInvAll().forEach(function(r){names[r.o]=1});
var h='<option value="">All users</option>'+Object.keys(names).sort().map(function(u){var x=twUsers().filter(function(a){return a.u===u})[0];return '<option value="'+esc(u)+'">'+esc(x?(x.n||u)+' (@'+u+')':'@'+u+' (removed)')+'</option>'}).join('');
$('f_u').innerHTML=h;$('f_u').value=cur}
function rows(){var a=$('f_a').value,b=$('f_b').value,u=adm?$('f_u').value:'';
var l=twInvList().filter(function(r){return !u||r.o===u});
return twInvRange(l,a,b).sort(function(x,y){var p=twInvDate(x),q=twInvDate(y);return p===q?y.t-x.t:(p<q?1:-1)})}
function render(){var l=rows(),sub=0,tax=0;
l.forEach(function(r){var c=invCalc(r.d);sub+=c.rd;tax+=c.tax});
$('s_n').textContent=l.length;$('s_v').textContent=fmt(sub);$('s_x').textContent=fmt(tax);
$('i_none').hidden=l.length>0;
$('i_body').innerHTML=l.map(function(r){var c=invCalc(r.d),own=adm||r.o===me.u;
return '<tr><td data-l="Invoice"><b>'+esc(r.no||'(no number)')+'</b></td><td data-l="Date">'+esc(dmy(twInvDate(r)))+'</td>'
+(adm?'<td data-l="User">@'+esc(r.o)+'</td>':'')
+'<td data-l="Buyer">'+esc(r.d.s.bn)+'</td><td class="rt" data-l="Total">'+fmt(c.rd)+'</td>'
+'<td class="act"><button class="sb" type="button" data-a="view" data-i="'+esc(r.id)+'">View</button> <button class="sb" type="button" data-a="edit" data-i="'+esc(r.id)+'">Edit</button> <button class="sb dng" type="button" data-a="del" data-i="'+esc(r.id)+'">Delete</button></td></tr>'}).join('')}
function find(id){return twInvAll().filter(function(r){return r.id===id})[0]}
function payload(r){var d=JSON.parse(JSON.stringify(r.d));d.id=r.id;d.by=r.o;return d}
$('i_body').addEventListener('click',function(e){var b=e.target.closest('button[data-a]');if(!b)return;last=b;var r=find(b.getAttribute('data-i'));if(!r)return;var a=b.getAttribute('data-a');
if(a==='view')location.href=twPage('invoice')+twSave(payload(r));
else if(a==='edit'){var d=payload(r);d.ed=1;twSave(d);location.href=twPage('tools')+'#invoice-items'}
else{pend=r;$('r_d').textContent='Invoice '+(r.no||'(no number)')+' will be removed from '+(adm&&r.o!==me.u?'@'+r.o+'’s':'your')+' saved invoices. This can’t be undone.';RM.hidden=false;$('r_n').focus()}});
function closeRm(){RM.hidden=true;pend=null;if(last&&document.body.contains(last))last.focus()}
$('r_n').onclick=closeRm;RM.addEventListener('mousedown',function(e){if(e.target===RM)closeRm()});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!RM.hidden)closeRm()});
$('r_y').onclick=function(){if(!pend)return;var ok=twInvDel(pend.id);RM.hidden=true;pend=null;last=null;flash(ok?'Invoice deleted.':'Could not delete it. Allow site data and try again.');fill();render()};
/* filters */
function pre(p){var n=new Date(),y=n.getFullYear(),m=n.getMonth(),a='',b='';
if(p==='m0'){a=iso(new Date(y,m,1));b=iso(new Date(y,m+1,0))}
else if(p==='m1'){a=iso(new Date(y,m-1,1));b=iso(new Date(y,m,0))}
else if(p==='fy'){var s=m>=3?y:y-1;a=s+'-04-01';b=(s+1)+'-03-31'}
$('f_a').value=a;$('f_b').value=b;chk();render()}
[].forEach.call(document.querySelectorAll('.pre button'),function(b){b.onclick=function(){pre(b.getAttribute('data-p'))}});
function chk(){var a=$('f_a').value,b=$('f_b').value,er=$('f_e');
if(a&&b&&a>b){er.textContent='The From date must be on or before the To date.';return false}er.textContent='';return true}
['f_a','f_b'].forEach(function(i){$(i).onchange=function(){if(chk())render()}});
$('f_u').onchange=render;
function go(btn,lines){if(!chk())return;var l=rows();
if(!l.length){$('f_e').textContent='There are no invoices in this range to download.';return}
var a=$('f_a').value,b=$('f_b').value,u=adm&&$('f_u').value?$('f_u').value:(adm?'all-users':me.u);
var nm='invoices-'+(lines?'line-items-':'')+u.replace(/[^a-z0-9._-]/gi,'_')+'-'+(a||'start')+'-to-'+(b||iso(new Date()))+'.csv';
btn.disabled=true;
twDownload(nm,lines?twInvLinesCsv(l,adm):twInvCsv(l,adm)).then(function(s){if(s==='saved')flash('CSV ready: '+l.length+' invoice'+(l.length>1?'s':'')+'.')},function(){$('f_e').textContent='Your browser blocked the download.'}).then(function(){btn.disabled=false})}
$('b_c').onclick=function(){go(this,false)};
$('b_l').onclick=function(){go(this,true)};
fill();render();
})();
