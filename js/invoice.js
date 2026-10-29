/* Invoice (tools page): collects the details, then opens the preview page */
var S={sn:'',sa:'',sg:'',bn:'',ba:'',bg:'',su:false,bu:false,ss:'',bs:''};
var RK=['dn','mp','rf','ro','bo','bd','dp','dd','dt','ds','td'];

function addRow(d,h,q,r,g,dc){var e=document.createElement('div');e.className='row';
e.innerHTML='<input class="d" value="'+esc(d)+'" aria-label="Item"><input class="h" value="'+esc(h)+'" aria-label="HSN"><input class="q" type="number" min="0" value="'+q+'" aria-label="Quantity"><input class="r" type="number" min="0" value="'+r+'" aria-label="Rate"><input class="dc" type="number" min="0" max="100" value="'+(dc||0)+'" aria-label="Discount percent"><select class="g" aria-label="GST rate">'+[0,5,12,18,28].map(function(x){return '<option'+(x==g?' selected':'')+'>'+x+'</option>'}).join('')+'</select>';
$('i_rows').appendChild(e)}


function collect(){var items=[];
document.querySelectorAll('#i_rows .row:not(:first-child)').forEach(function(r){items.push({d:r.querySelector('.d').value,h:r.querySelector('.h').value,q:+r.querySelector('.q').value,r:+r.querySelector('.r').value,dc:+r.querySelector('.dc').value||0,g:+r.querySelector('.g').value})});
var ref={};RK.forEach(function(k){ref[k]=$('r_'+k).value});
return {s:S,no:$('i_no').value,dt:$('i_dt').value,ref:ref,items:items}}
function preview(){if(!S.sn){openM();return}location.href='invoice.html'+twSave(collect())}

/* Pop-up for seller and buyer details */
var M=$('m'),K=['sn','sa','sg','bn','ba','bg'],GST=/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/;
function openM(){K.forEach(function(k){$('m_'+k).value=S[k]});$('m_su').checked=S.su;$('m_bu').checked=S.bu;$('m_ss').value=S.ss;$('m_bs').value=S.bs;syncU();$('m_e').textContent='';M.hidden=false;$('m_sn').focus()}
function closeM(){M.hidden=true}
function syncU(){['s','b'].forEach(function(x){var u=$('m_'+x+'u').checked;$('m_'+x+'gl').hidden=u;$('m_'+x+'sw').hidden=!u})}
['m_su','m_bu'].forEach(function(i){$(i).onchange=syncU});
function cbInit(id){var inp=$(id),ul=$(id+'l'),act=-1;
function items(){return ul.querySelectorAll('li[data-n]')}
function mark(){var it=items();it.forEach(function(li,i){li.classList.toggle('on',i===act)});if(it[act]&&it[act].scrollIntoView)it[act].scrollIntoView({block:'nearest'})}
function shut(){ul.hidden=true;inp.setAttribute('aria-expanded','false');act=-1}
function pick(n){inp.value=n;shut();$('m_e').textContent=''}
function show(all){var q=all?'':inp.value.trim().toLowerCase(),r=Object.keys(ST).map(function(k){return{c:k,n:ST[k]}}).filter(function(o){return !q||o.n.toLowerCase().indexOf(q)>-1||o.c===q}).sort(function(a,b){return a.n<b.n?-1:1});
ul.innerHTML=r.length?r.map(function(o){return '<li role="option" data-n="'+esc(o.n)+'">'+esc(o.n)+'<span>'+o.c+'</span></li>'}).join(''):'<li class="none">No state found</li>';
ul.style.pointerEvents=r.length?'':'none';ul.hidden=false;inp.setAttribute('aria-expanded','true');act=r.length&&q?0:-1;mark()}
inp.addEventListener('focus',function(){show(true)});
inp.addEventListener('click',function(){if(ul.hidden)show(true)});
inp.addEventListener('input',function(){if(codeOf(inp.value))shut();else show(false)});
inp.addEventListener('blur',function(){var c=codeOf(inp.value);if(c)inp.value=ST[c];setTimeout(shut,120)});
inp.addEventListener('keydown',function(e){var it=items();
if(e.key==='ArrowDown'){e.preventDefault();if(ul.hidden)show(true);else{act=Math.min(it.length-1,act+1);mark()}}
else if(e.key==='ArrowUp'){e.preventDefault();act=Math.max(0,act-1);mark()}
else if(e.key==='Enter'&&!ul.hidden&&it[act]){e.preventDefault();pick(it[act].getAttribute('data-n'))}
else if(e.key==='Escape'&&!ul.hidden){e.preventDefault();e.stopPropagation();shut()}});
ul.addEventListener('mousedown',function(e){var li=e.target.closest('li[data-n]');if(li){e.preventDefault();pick(li.getAttribute('data-n'))}})}
cbInit('m_ss');cbInit('m_bs');
$('m_f').onsubmit=function(ev){ev.preventDefault();
var v={su:$('m_su').checked,bu:$('m_bu').checked};
K.forEach(function(k){v[k]=$('m_'+k).value.trim()});
v.ss=$('m_ss').value.trim();v.bs=$('m_bs').value.trim();
v.sg=v.su?'':v.sg.toUpperCase();v.bg=v.bu?'':v.bg.toUpperCase();
if(!v.su)v.ss='';if(!v.bu)v.bs='';
var req=['sn','sa'].concat(v.su?[]:['sg'],['bn','ba'],v.bu?[]:['bg']);
var bad=req.filter(function(k){return !v[k]})[0];
if(bad){$('m_e').textContent='Please fill in all the fields.';$('m_'+bad).focus();return}
if(!v.su&&!GST.test(v.sg)){$('m_e').textContent='Seller GST number should be 15 characters, like 03AAAAA0000A1Z5.';$('m_sg').focus();return}
if(v.su&&!codeOf(v.ss)){$('m_e').textContent='Please choose the seller state from the list.';$('m_ss').focus();return}
if(!v.bu&&!GST.test(v.bg)){$('m_e').textContent='Buyer GST number should be 15 characters, like 09AAAAA0000A1Z5.';$('m_bg').focus();return}
if(v.bu&&!codeOf(v.bs)){$('m_e').textContent='Please choose the buyer state from the list.';$('m_bs').focus();return}
if(v.su)v.ss=ST[codeOf(v.ss)];if(v.bu)v.bs=ST[codeOf(v.bs)];
S=v;closeM();openM2()};
$('m_c').onclick=closeM;
M.onclick=function(e){if(e.target===M)closeM()};
var M2=$('m2');
function openM2(){M2.hidden=false;$('r_dn').focus()}
function closeM2(){M2.hidden=true;if($('p-inv').scrollIntoView)$('p-inv').scrollIntoView({behavior:'smooth',block:'start'})}
$('m2_f').onsubmit=function(ev){ev.preventDefault();closeM2()};
$('m2_b').onclick=function(){M2.hidden=true;openM()};
M2.onclick=function(e){if(e.target===M2)closeM2()};
document.addEventListener('keydown',function(e){if(e.key!=='Escape')return;if(!M.hidden)closeM();else if(!M2.hidden)closeM2()});
document.querySelector('.tabs button[data-t=inv]').addEventListener('click',openM);


$('i_add').onclick=function(){addRow('New item','',1,0,18)};
$('i_pr').onclick=preview;
var sv=twLoad();
if(sv&&sv.s&&sv.s.sn&&sv.items&&sv.items.length){
S=sv.s;$('i_no').value=sv.no||'';$('i_dt').value=sv.dt||'';RK.forEach(function(k){$('r_'+k).value=(sv.ref||{})[k]||''});
sv.items.forEach(function(it){addRow(it.d,it.h,it.q,it.r,it.g,it.dc)})
}else{$('i_dt').value=iso(today);addRow('Cotton T-shirt','6109',2,499,5)}
