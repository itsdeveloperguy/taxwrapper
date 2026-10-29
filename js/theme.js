/* Theme toggle and sticky header */
(function(){
var root=document.documentElement,btn=$('tg'),hd=document.querySelector('header');
var mq=window.matchMedia?window.matchMedia('(prefers-color-scheme: dark)'):null;
function eff(){return root.getAttribute('data-theme')||(mq&&mq.matches?'dark':'light')}
function paint(){var m=eff();btn.setAttribute('data-mode',m);btn.setAttribute('aria-label','Switch to '+(m==='dark'?'light':'dark')+' mode')}
btn.onclick=function(){var n=eff()==='dark'?'light':'dark';root.setAttribute('data-theme',n);try{localStorage.setItem('tw-theme',n)}catch(e){}paint()};
if(mq&&mq.addEventListener)mq.addEventListener('change',paint);
function stuck(){hd.classList.toggle('stuck',window.scrollY>6)}
window.addEventListener('scroll',stuck,{passive:true});
stuck();paint();
})();
