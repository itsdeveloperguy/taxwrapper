/* Invoice preview page */
(function(){
var d=twLoad();
if(!d||!d.s||!d.s.sn||!d.items||!d.items.length){$('pv').hidden=true;$('pv_bar').hidden=true;$('pv_e').hidden=false;return}
$('inv').innerHTML=renderInvoice(d);
document.title='Invoice '+(d.no||'').replace(/[\\/:*?"<>|]/g,'-')+' - Tax Wrapper';
$('pv_p').onclick=function(){window.print()};
function fit(){var iv=$('inv').firstChild;if(!iv)return;iv.style.zoom='';var cs=getComputedStyle($('inv')),w=$('inv').clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);if(w<660)iv.style.zoom=(w/660).toFixed(3)}
fit();window.addEventListener('resize',fit);
})();
