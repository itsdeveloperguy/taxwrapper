/* Accounts, login session and permissions.
   NOTE: this site has no server, so accounts are kept in this browser only (localStorage).
   It is a front-end feature, not real security. To protect real data, move these functions to a server. */
var TW_PERMS=[['tds','TDS Interest Calculator'],['inv','Invoice Generator'],['cal','Tax Calendar'],['tax','Tax Calculator']];
var TW_SEED={u:'admin',n:'Administrator',r:'admin',p:{tds:1,inv:1,cal:1,tax:1},a:true,s:'a7f3c19e5b42d086',h:'90004bc90dbfcb56efc70b5edeb3bc1642a3f6bd7ac3028c027229ed842e42ba'};

/* SHA-256 */
function twSha(s){
s=unescape(encodeURIComponent(s));
var K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2],H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19],w=[],l=s.length,i,t,n;
for(i=0;i<l;i++)w[i>>2]|=s.charCodeAt(i)<<(24-(i%4)*8);
w[l>>2]|=0x80<<(24-(l%4)*8);
n=(((l+8)>>6)+1)*16;
for(i=0;i<n;i++)w[i]=w[i]|0;
w[n-1]=l*8;
function R(x,c){return (x>>>c)|(x<<(32-c))}
for(var o=0;o<n;o+=16){
var W=[],a=H.slice();
for(t=0;t<64;t++){
if(t<16)W[t]=w[o+t];
else{var s0=R(W[t-15],7)^R(W[t-15],18)^(W[t-15]>>>3),s1=R(W[t-2],17)^R(W[t-2],19)^(W[t-2]>>>10);W[t]=(W[t-16]+s0+W[t-7]+s1)|0}
var S1=R(a[4],6)^R(a[4],11)^R(a[4],25),ch=(a[4]&a[5])^(~a[4]&a[6]),t1=(a[7]+S1+ch+K[t]+W[t])|0,S0=R(a[0],2)^R(a[0],13)^R(a[0],22),mj=(a[0]&a[1])^(a[0]&a[2])^(a[1]&a[2]),t2=(S0+mj)|0;
a=[(t1+t2)|0,a[0],a[1],a[2],(a[3]+t1)|0,a[4],a[5],a[6]]}
for(i=0;i<8;i++)H[i]=(H[i]+a[i])|0}
return H.map(function(x){return ('00000000'+(x>>>0).toString(16)).slice(-8)}).join('')}
function twSalt(){var a=new Uint8Array(8);try{crypto.getRandomValues(a)}catch(e){for(var i=0;i<8;i++)a[i]=Math.floor(Math.random()*256)}return [].map.call(a,function(x){return ('0'+x.toString(16)).slice(-2)}).join('')}
function twHash(salt,pw){return twSha(salt+':'+pw)}

/* Storage */
function twRead(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}
function twWrite(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function twUsers(){var u=twRead('tw-users',null);
if(!u||!u.length){u=[JSON.parse(JSON.stringify(TW_SEED))];twWrite('tw-users',u)}
if(!u.some(function(x){return x.u==='admin'})){u.unshift(JSON.parse(JSON.stringify(TW_SEED)));twWrite('tw-users',u)}
return u}
function twCfg(){var c=twRead('tw-config',{});return {requireLogin:!!c.requireLogin}}

/* Session (8 hours) */
function twUser(){var s=twRead('tw-session',null);if(!s||!s.u||Date.now()-s.t>8*3600*1000){if(s)try{localStorage.removeItem('tw-session')}catch(e){}return null}
var x=twUsers().filter(function(a){return a.u===s.u})[0];
if(!x||!x.a){try{localStorage.removeItem('tw-session')}catch(e){}return null}return x}
function twLogin(u,p){u=(u||'').trim().toLowerCase();
var x=twUsers().filter(function(a){return a.u===u})[0];
if(!x||twHash(x.s,p||'')!==x.h)return {ok:false,msg:'Wrong username or password.'};
if(!x.a)return {ok:false,msg:'This account is turned off. Ask an admin to turn it on.'};
try{sessionStorage.removeItem('tw-invoice')}catch(e){}
if(!twWrite('tw-session',{u:x.u,t:Date.now()}))return {ok:false,msg:'Your browser is blocking site data, so login cannot be saved. Allow site data and try again.'};
return {ok:true,user:x}}
function twLogout(){try{localStorage.removeItem('tw-session');sessionStorage.removeItem('tw-invoice')}catch(e){}}
function twCan(k){var u=twUser();if(!u)return !twCfg().requireLogin;if(u.r==='admin')return true;return !!(u.p&&u.p[k])}

/* Header account control */
(function(){
var u=twUser(),box=$('acct'),mrows=$('acctm');if(!box||!mrows)return;
function outBtns(){[].forEach.call(document.querySelectorAll('.lo'),function(b){b.onclick=function(){twLogout();location.href=twPage('home')}})}
if(!u){
box.innerHTML='<a class="lg" href="'+twPage('login')+'">Log in</a>';
mrows.innerHTML='<a class="mrow" href="'+twPage('login')+'">Log in</a>';
return}
var nm=u.n||u.u,adm=u.r==='admin';
[].forEach.call(document.querySelectorAll('li[data-perm]'),function(li){if(!twCan(li.getAttribute('data-perm')))li.hidden=true});
box.innerHTML='<div class="dd"><button class="dt av" type="button" aria-expanded="false" aria-controls="dp-acct" aria-label="Account menu for '+esc(nm)+'"><span class="avc" aria-hidden="true">'+esc(nm.charAt(0).toUpperCase())+'</span><span class="avn">'+esc(nm)+'</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>'
+'<div class="dp r" id="dp-acct" hidden><p class="dh">Account</p><p class="who">Signed in as <b>'+esc(u.u)+'</b></p><ul>'
+(adm?'<li><a class="di" href="'+twPage('dashboard')+'"><span class="ic2" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="7" height="8" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="5" rx="1.5"/><rect x="13.5" y="11.5" width="7" height="9" rx="1.5"/><rect x="3.5" y="14.5" width="7" height="6" rx="1.5"/></svg></span>Dashboard</a></li>':'')
+'<li><a class="di" href="'+twPage('invoices')+'"><span class="ic2" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h8l4 4v14H7z"/><path d="M14 3v5h5M10 12h6M10 16h6"/></svg></span>'+(adm?'All invoices':'My invoices')+'</a></li>'
+'<li><a class="di" href="'+twPage('masters')+'"><span class="ic2" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9" r="2.3"/><path d="M16.5 14.2a4.5 4.5 0 0 1 4 4.3"/></svg></span>Saved parties</a></li>'
+'<li><button class="di lo" type="button"><span class="ic2" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20H10M15 8l4 4-4 4M19 12H9"/></svg></span>Log out</button></li></ul></div></div>';
mrows.innerHTML='<p class="mrow who">Signed in as <b>'+esc(u.u)+'</b></p>'+(adm?'<a class="mrow" href="'+twPage('dashboard')+'">Dashboard</a>':'')+'<a class="mrow" href="'+twPage('invoices')+'">'+(adm?'All invoices':'My invoices')+'</a><a class="mrow" href="'+twPage('masters')+'">Saved parties</a><button class="mrow lo" type="button">Log out</button>';
outBtns();
})();
