/* Saved parties (masters): each user's own list of sellers, buyers and others */
(function(){
var me=twUser(),G=$('ms_gate');
if(!me){G.innerHTML='<div class="pv-e"><h2>Log in to continue</h2><p>Log in to save sellers and buyers.</p><a class="btn" href="'+twPage('login')+'">Log in</a></div>';G.hidden=false;return}
$('ms').hidden=false;
var M=$('ms_m'),RM=$('r_m'),cur=null,pend=null,last=null,CAT={seller:'Seller',buyer:'Buyer',other:'Other'};
var GST=/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/;
$('ms_s').innerHTML='<option value="">Choose…</option>'+Object.keys(ST).map(function(k){return {c:k,n:ST[k]}}).sort(function(a,b){return a.n<b.n?-1:1}).map(function(o){return '<option>'+esc(o.n)+'</option>'}).join('');
function flash(t){var e=$('d_t');e.textContent=t;e.hidden=false;clearTimeout(flash.h);flash.h=setTimeout(function(){e.hidden=true},4500)}
function render(){var q=$('ms_q').value.trim().toLowerCase(),c=$('ms_f1').value,all=twMasters(),l=all.filter(function(m){return (!c||m.c===c)&&(!q||m.n.toLowerCase().indexOf(q)>-1||(m.g||'').toLowerCase().indexOf(q)>-1)});
$('ms_none').hidden=l.length>0;$('ms_none').textContent=all.length?'No saved party matches your search.':'Nothing saved yet. Choose Add party to save your first seller or buyer.';
$('ms_body').innerHTML=l.map(function(m){return '<tr><td data-l="Name"><b>'+esc(m.n)+'</b><span class="un">'+esc(m.a.split('\n')[0])+'</span></td><td data-l="Category"><span class="chip">'+CAT[m.c]+'</span></td><td data-l="GST number">'+(m.g?esc(m.g):'<span class="chip">Unregistered</span>')+'</td><td data-l="State">'+esc(m.s)+(m.p?' – '+esc(m.p):'')+'</td>'
+'<td class="act"><button class="sb" type="button" data-a="edit" data-i="'+esc(m.id)+'">Edit</button> <button class="sb dng" type="button" data-a="del" data-i="'+esc(m.id)+'">Delete</button></td></tr>'}).join('')}
function find(id){return twMasters().filter(function(m){return m.id===id})[0]}
$('ms_body').addEventListener('click',function(e){var b=e.target.closest('button[data-a]');if(!b)return;last=b;var m=find(b.getAttribute('data-i'));if(!m)return;
if(b.getAttribute('data-a')==='edit')openForm(m);else{pend=m;$('r_d').textContent=m.n+' will be removed from your saved parties. Invoices you already made are not changed.';RM.hidden=false;$('r_n').focus()}});
$('ms_q').oninput=render;$('ms_f1').onchange=render;
function openForm(m){cur=m||null;var b=(m&&m.b)||{};
$('ms_h').textContent=m?'Edit party':'Add party';
$('ms_n').value=m?m.n:'';$('ms_c').value=m?m.c:'';$('ms_a').value=m?m.a:'';$('ms_s').value=m?m.s:'';$('ms_p').value=m?m.p:'';$('ms_g').value=m?m.g||'':'';
$('ms_bh').value=b.h||'';$('ms_bn').value=b.n||'';$('ms_ba').value=b.a||'';$('ms_bi').value=b.i||'';$('ms_br').value=b.r||'';
$('ms_e').textContent='';M.hidden=false;$('ms_n').focus()}
function closeForm(){M.hidden=true;if(last&&document.body.contains(last))last.focus()}
$('ms_add').onclick=function(){last=this;openForm(null)};
$('ms_c2').onclick=closeForm;
M.addEventListener('mousedown',function(e){if(e.target===M)closeForm()});
$('ms_f').onsubmit=function(ev){ev.preventDefault();
var er=$('ms_e'),v={n:$('ms_n').value.trim(),c:$('ms_c').value,a:$('ms_a').value.trim(),s:$('ms_s').value,p:$('ms_p').value.trim(),g:$('ms_g').value.trim().toUpperCase(),
b:{h:$('ms_bh').value.trim(),n:$('ms_bn').value.trim(),a:$('ms_ba').value.replace(/\s/g,''),i:$('ms_bi').value.trim().toUpperCase(),r:$('ms_br').value.trim()}};
function bad(m,id){er.textContent=m;$(id).focus()}
if(!v.n)return bad('Enter the name.','ms_n');
if(!v.c)return bad('Choose a category: seller, buyer or other.','ms_c');
if(!v.a)return bad('Enter the address.','ms_a');
if(!v.s)return bad('Choose the state.','ms_s');
if(!/^[1-9]\d{5}$/.test(v.p))return bad('Pincode should be 6 digits.','ms_p');
if(v.g){if(!GST.test(v.g))return bad('GST number should be 15 characters, like 03AAAAA0000A1Z5.','ms_g');
if(ST[v.g.slice(0,2)]!==v.s)return bad('This GST number starts with '+v.g.slice(0,2)+' ('+(ST[v.g.slice(0,2)]||'unknown state')+'), which does not match the state '+v.s+'.','ms_g')}
if(v.b.a&&!/^\d{9,18}$/.test(v.b.a))return bad('Account number should be 9 to 18 digits.','ms_ba');
if(v.b.i&&!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(v.b.i))return bad('IFSC code should be 11 characters, like HDFC0001234.','ms_bi');
if((v.b.a||v.b.i)&&!(v.b.a&&v.b.i))return bad('Enter both the account number and the IFSC code, or leave both blank.',v.b.a?'ms_bi':'ms_ba');
if(twMasters(v.c).some(function(m){return m.n.toLowerCase()===v.n.toLowerCase()&&(!cur||m.id!==cur.id)}))return bad('You already have a '+CAT[v.c].toLowerCase()+' with this name.','ms_n');
if(cur)v.id=cur.id;
var id=twMasterSave(v);
if(!id){er.textContent='Your browser blocked saving. Allow site data and try again.';return}
M.hidden=true;last=null;render();snack('Saved',v.n+' · '+CAT[v.c])};
function closeRm(){RM.hidden=true;pend=null;if(last&&document.body.contains(last))last.focus()}
$('r_n').onclick=closeRm;RM.addEventListener('mousedown',function(e){if(e.target===RM)closeRm()});
$('r_y').onclick=function(){if(!pend)return;var n=pend.n,ok=twMasterDel(pend.id);RM.hidden=true;pend=null;last=null;if(ok)snack('Deleted',n);else flash('Could not delete. Allow site data and try again.');render()};
document.addEventListener('keydown',function(e){if(e.key!=='Escape')return;if(!RM.hidden)closeRm();else if(!M.hidden)closeForm()});
render();
})();
