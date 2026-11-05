/* Apply login rules and permissions to the tools page and the invoice preview page */
(function(){
var u=twUser();
function gate(anchor,hide){
hide.forEach(function(e){if(e)e.hidden=true});
var d=document.createElement('div');d.className='pv-e';
d.innerHTML=u?'<h2>No access yet</h2><p>Your account can\u2019t use this tool yet. Ask an admin to turn it on.</p><a class="btn" href="index.html">Back to home</a>'
:'<h2>Log in to continue</h2><p>You need to log in to use the tools.</p><a class="btn" href="login.html">Log in</a>';
anchor.appendChild(d)}
var tabs=document.querySelector('.tabs');
if(tabs){
var first=null,any=false;
[].forEach.call(tabs.querySelectorAll('button'),function(b){var k=b.dataset.t,ok=twCan(k),p=$('p-'+k);b.hidden=!ok;if(p)p.hidden=!ok;if(ok){any=true;if(!first)first=b}});
if(!any){gate(tabs.parentNode,[tabs])}
else{var cur=tabs.querySelector('button[aria-selected="true"]');if(cur&&cur.hidden&&typeof sel==='function')sel(first.dataset.t)}}
var need=document.body.getAttribute('data-need');
if(need&&!twCan(need))gate($('pv').parentNode,[$('pv'),$('pv_bar'),$('pv_e')]);
})();
