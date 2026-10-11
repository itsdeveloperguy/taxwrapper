/* tabs */
document.querySelectorAll('.tabs button').forEach(function(b){b.onclick=function(){
document.querySelectorAll('.tabs button').forEach(function(x){x.setAttribute('aria-selected',x===b)});
document.querySelectorAll('.panel[id^=p-]').forEach(function(p){p.classList.toggle('on',p.id==='p-'+b.dataset.t)});}});
