/* Home FAQ: one open at a time; first one opens by default. */
(function(){
"use strict";
var items=[].slice.call(document.querySelectorAll('.fq-i'));if(!items.length)return;
function set(it,open){
  it.classList.toggle('is-open',open);
  var b=it.querySelector('.fq-q');b.setAttribute('aria-expanded',open?'true':'false');
  it.querySelector('.fq-a').setAttribute('aria-hidden',open?'false':'true');
}
items.forEach(function(it){
  it.querySelector('.fq-q').addEventListener('click',function(){
    var open=!it.classList.contains('is-open');
    items.forEach(function(o){set(o,false)});set(it,open);
  });
});
items.forEach(function(it,k){set(it,k===0)});
})();
