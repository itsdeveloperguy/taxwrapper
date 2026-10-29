/* tabs */
document.querySelectorAll('.tabs button').forEach(function(b){b.onclick=function(){
document.querySelectorAll('.tabs button').forEach(function(x){x.setAttribute('aria-selected',x===b)});
document.querySelectorAll('.panel[id^=p-]').forEach(function(p){p.classList.toggle('on',p.id==='p-'+b.dataset.t)});}});
/* Links like tools.html#invoice open that tool */
var TH={tds:'tds-interest',inv:'invoice',cal:'tax-calendar',tax:'tax-calculator'};
function sel(k){document.querySelectorAll('.tabs button').forEach(function(x){x.setAttribute('aria-selected',x.dataset.t===k)});document.querySelectorAll('.panel[id^=p-]').forEach(function(p){p.classList.toggle('on',p.id==='p-'+k)})}
window.twOpenTab=function(h){h=(h||'').replace('#','');if(h==='invoice-items'){sel('inv');return true}for(var k in TH){if(TH[k]===h){var b=document.querySelector('.tabs button[data-t="'+k+'"]');if(b){b.click();return true}}}return false};
document.addEventListener('DOMContentLoaded',function(){window.twOpenTab(location.hash)});
window.addEventListener('hashchange',function(){window.twOpenTab(location.hash)});
