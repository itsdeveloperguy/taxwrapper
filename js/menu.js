/* Header dropdown menus and mobile menu */
(function(){
var nav=$('mn'),mb=$('mb'),dts=[].slice.call(document.querySelectorAll('.dt'));
function panel(b){return $(b.getAttribute('aria-controls'))}
function isOpen(b){return b.getAttribute('aria-expanded')==='true'}
function shut(b){b.setAttribute('aria-expanded','false');panel(b).hidden=true}
function closeAll(except){dts.forEach(function(b){if(b!==except)shut(b)})}
function place(b){var p=panel(b);if(window.innerWidth<=760){p.style.left='';return}
var base=b.parentElement.getBoundingClientRect().left,x=Math.max(12,Math.min(base,window.innerWidth-12-p.offsetWidth));p.style.left=(x-base)+'px'}
function show(b){closeAll(b);panel(b).hidden=false;b.setAttribute('aria-expanded','true');place(b)}
function setMenu(on){nav.classList.toggle('open',on);mb.setAttribute('aria-expanded',String(on));mb.setAttribute('aria-label',on?'Close menu':'Open menu');if(!on)closeAll()}
dts.forEach(function(b){
b.addEventListener('click',function(){if(isOpen(b))shut(b);else show(b)});
b.addEventListener('keydown',function(e){if(e.key==='ArrowDown'){e.preventDefault();if(!isOpen(b))show(b);var a=panel(b).querySelector('a.di');if(a)a.focus()}})});
mb.addEventListener('click',function(){setMenu(!nav.classList.contains('open'))});
nav.addEventListener('click',function(e){var a=e.target.closest('a.di');if(!a)return;
if(window.twOpenTab&&a.pathname===location.pathname&&a.hash&&window.twOpenTab(a.hash)){e.preventDefault();try{history.replaceState(null,'',a.hash)}catch(x){}}
setMenu(false);closeAll()});
document.addEventListener('click',function(e){if(e.target.closest('.dd')||e.target.closest('#mb'))return;closeAll();if(nav.classList.contains('open'))setMenu(false)});
document.addEventListener('keydown',function(e){if(e.key!=='Escape')return;
var o=dts.filter(isOpen)[0];
if(o){closeAll();o.focus()}else if(nav.classList.contains('open')){setMenu(false);mb.focus()}});
window.addEventListener('resize',function(){if(window.innerWidth>760&&nav.classList.contains('open'))nav.classList.remove('open');dts.forEach(function(b){if(isOpen(b))place(b)})});
})();
