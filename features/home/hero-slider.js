/* Home "Why choose" slider: centred active card, neighbours peek, dots, swipe, arrow keys, auto-advance. */
(function(){
"use strict";
var view=document.getElementById('ws-view');if(!view)return;
var track=view.querySelector('.ws-track'),slides=[].slice.call(track.children),dots=[].slice.call(document.querySelectorAll('#ws-dots button'));
var i=0,timer=null,drag=null,reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function place(){
  var s=slides[i];track.style.transform='translateX('+(view.clientWidth/2-(s.offsetLeft+s.offsetWidth/2))+'px)';
}
function go(n,user){
  i=(n+slides.length)%slides.length;place();
  slides.forEach(function(s,k){var on=k===i;s.classList.toggle('is-on',on);s.setAttribute('aria-hidden',on?'false':'true')});
  dots.forEach(function(d,k){if(k===i)d.setAttribute('aria-current','true');else d.removeAttribute('aria-current')});
  if(user)restart();
}
function stop(){clearInterval(timer);timer=null}
function restart(){stop();if(!reduce)timer=setInterval(function(){if(!document.hidden)go(i+1)},5500)}
dots.forEach(function(d,k){d.addEventListener('click',function(){go(k,true)})});
slides.forEach(function(s,k){s.addEventListener('click',function(){if(k!==i&&!moved)go(k,true)})});
var moved=false;
view.addEventListener('pointerdown',function(e){drag={x:e.clientX};moved=false});
view.addEventListener('pointerup',function(e){
  if(!drag)return;var dx=e.clientX-drag.x;drag=null;
  if(Math.abs(dx)>50){moved=true;go(i+(dx<0?1:-1),true);setTimeout(function(){moved=false},0)}
});
view.addEventListener('pointercancel',function(){drag=null});
view.addEventListener('mouseenter',stop);view.addEventListener('mouseleave',restart);
view.addEventListener('focusin',stop);view.addEventListener('focusout',restart);
view.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){go(i+1,true)}else if(e.key==='ArrowLeft'){go(i-1,true)}});
var rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(place,80)});
window.addEventListener('load',place);
track.style.transition='none';go(0);requestAnimationFrame(function(){requestAnimationFrame(function(){track.style.transition=''})});
restart();
})();
