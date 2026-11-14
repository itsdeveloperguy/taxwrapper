/* Admin dashboard: add, edit and remove users and choose what each can use */
(function(){
var me=twUser();
if(!me||me.r!=='admin'){location.replace(twPage('login'));return}
$('dash').hidden=false;
var body=$('u_body'),M=$('u_m'),RM=$('r_m'),mode='add',cur=null,last=null,pend=null;
var PN={tds:'TDS',inv:'Invoice',cal:'Calendar',tax:'Tax calc'};
function flash(t){var e=$('d_t');e.textContent=t;e.hidden=false;clearTimeout(flash.h);flash.h=setTimeout(function(){e.hidden=true},4500)}
function put(list,msg){if(!twWrite('tw-users',list)){flash('Your browser blocked saving. Allow site data and try again.');return false}if(msg)flash(msg);render();return true}
function render(){
var list=twUsers();
$('s_t').textContent=list.length;$('s_a').textContent=list.filter(function(x){return x.a}).length;$('s_m').textContent=list.filter(function(x){return x.r==='admin'}).length;
body.innerHTML=list.map(function(x){
var self=x.u===me.u,lock=x.u==='admin'||self;
var access=x.r==='admin'?'<span class="chip ok">Everything</span>':(Object.keys(PN).filter(function(k){return x.p&&x.p[k]}).map(function(k){return '<span class="chip ok">'+PN[k]+'</span>'}).join('')||'<span class="chip">Nothing yet</span>');
return '<tr><td data-l="User"><b>'+esc(x.n||x.u)+(self?' <span class="chip">You</span>':'')+'</b><span class="un">@'+esc(x.u)+'</span></td>'
+'<td data-l="Role"><span class="chip">'+(x.r==='admin'?'Admin':'User')+'</span></td>'
+'<td data-l="Can use">'+access+'</td>'
+'<td data-l="Status"><span class="chip'+(x.a?' ok':'')+'">'+(x.a?'Active':'Off')+'</span></td>'
+'<td class="act"><button class="sb" type="button" data-a="edit" data-u="'+esc(x.u)+'">Edit</button>'+(lock?'':' <button class="sb dng" type="button" data-a="del" data-u="'+esc(x.u)+'">Remove</button>')+'</td></tr>'}).join('')}
function find(u){return twUsers().filter(function(x){return x.u===u})[0]}
body.addEventListener('click',function(e){var b=e.target.closest('button[data-a]');if(!b)return;last=b;var x=find(b.getAttribute('data-u'));if(!x)return;if(b.getAttribute('data-a')==='edit')openForm('edit',x);else askRemove(x)});
function permBoxes(){return [].slice.call(M.querySelectorAll('.pk'))}
function syncRole(){var adm=$('u_r').value==='admin';permBoxes().forEach(function(c){if(adm)c.checked=true;c.disabled=adm});$('u_an').hidden=!adm}
$('u_r').onchange=syncRole;
function openForm(m,x){mode=m;cur=x||null;
$('u_h').textContent=m==='add'?'Add user':'Edit user';$('u_s').textContent=m==='add'?'Add user':'Save changes';
$('u_n').value=x?x.n||'':'';$('u_u').value=x?x.u:'';$('u_u').readOnly=m==='edit';
$('u_p').value='';$('u_p').placeholder=m==='edit'?'Leave blank to keep it':'At least 4 characters';
$('u_pn').textContent=m==='edit'?'Leave the password blank to keep the current one.':'';
$('u_r').value=x?x.r:'user';$('u_a').checked=x?!!x.a:true;
permBoxes().forEach(function(c){c.checked=x?!!(x.p&&x.p[c.getAttribute('data-k')]):false});
var locked=x&&(x.u==='admin'||x.u===me.u);
$('u_r').disabled=!!locked;$('u_a').disabled=!!locked;
syncRole();$('u_e').textContent='';M.hidden=false;(m==='add'?$('u_n'):$('u_p')).focus()}
function closeForm(){M.hidden=true;if(last&&document.body.contains(last))last.focus()}
$('d_add').onclick=function(){last=this;openForm('add')};
$('u_c').onclick=closeForm;
M.addEventListener('mousedown',function(e){if(e.target===M)closeForm()});
$('u_f').onsubmit=function(ev){ev.preventDefault();
var n=$('u_n').value.trim(),u=$('u_u').value.trim().toLowerCase(),pw=$('u_p').value,role=$('u_r').value,act=$('u_a').checked,er=$('u_e');
if(!n){er.textContent='Enter the person\u2019s full name.';$('u_n').focus();return}
if(mode==='add'){
if(!/^[a-z0-9._-]{3,24}$/.test(u)){er.textContent='Username must be 3 to 24 characters: letters, numbers, dot, dash or underscore.';$('u_u').focus();return}
if(find(u)){er.textContent='That username is already taken.';$('u_u').focus();return}
if(pw.length<4){er.textContent='Password must be at least 4 characters.';$('u_p').focus();return}}
else if(pw&&pw.length<4){er.textContent='Password must be at least 4 characters.';$('u_p').focus();return}
var p={};permBoxes().forEach(function(c){p[c.getAttribute('data-k')]=role==='admin'?1:(c.checked?1:0)});
var list=twUsers();
if(mode==='add'){var s=twSalt();list.push({u:u,n:n,r:role,p:p,a:act,s:s,h:twHash(s,pw)});
if(put(list,'Added '+n+'.'))closeForm()}
else{var x=list.filter(function(a){return a.u===cur.u})[0];if(!x){closeForm();return}
var lock=x.u==='admin'||x.u===me.u;
x.n=n;x.p=p;if(!lock){x.r=role;x.a=act}
if(pw){x.s=twSalt();x.h=twHash(x.s,pw)}
if(put(list,'Saved changes for '+n+'.'))closeForm()}};
function askRemove(x){pend=x;$('r_d').textContent=(x.n||x.u)+' (@'+x.u+') will no longer be able to log in. Their saved invoices stay available to admins. This can\u2019t be undone.';RM.hidden=false;$('r_n').focus()}
function closeRm(){RM.hidden=true;pend=null;if(last&&document.body.contains(last))last.focus()}
$('r_n').onclick=closeRm;
RM.addEventListener('mousedown',function(e){if(e.target===RM)closeRm()});
$('r_y').onclick=function(){if(!pend)return;var u=pend.u,nm=pend.n||pend.u;
if(u==='admin'||u===me.u){closeRm();return}
var list=twUsers().filter(function(a){return a.u!==u});
RM.hidden=true;pend=null;if(put(list,'Removed '+nm+'.')){last=null}};
document.addEventListener('keydown',function(e){if(e.key!=='Escape')return;if(!RM.hidden)closeRm();else if(!M.hidden)closeForm()});
$('c_req').checked=twCfg().requireLogin;
$('c_req').onchange=function(){if(twWrite('tw-config',{requireLogin:this.checked}))flash(this.checked?'Login is now required to use the tools.':'The tools are open to everyone again.');else flash('Your browser blocked saving. Allow site data and try again.')};
render();
})();
