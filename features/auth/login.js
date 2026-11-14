/* Login page */
(function(){
var me=twUser();
function showIn(u){$('l_form_wrap').hidden=true;$('l_in').hidden=false;$('l_who').textContent='Signed in as '+u.u+(u.r==='admin'?' (admin).':'.');
var go=$('l_go');if(u.r==='admin'){go.href=twPage('dashboard');go.textContent='Open dashboard'}else{go.href=twPage('tools');go.textContent='Open the tools'}
$('l_out').onclick=function(){twLogout();location.reload()}}
if(me){showIn(me);return}
$('l_s').onclick=function(){var p=$('l_p'),s=p.type==='password';p.type=s?'text':'password';this.textContent=s?'Hide':'Show';this.setAttribute('aria-label',s?'Hide password':'Show password')};
$('l_f').onsubmit=function(e){e.preventDefault();
var u=$('l_u').value,p=$('l_p').value,er=$('l_e');
if(!u.trim()||!p){er.textContent='Enter your username and password.';(u.trim()?$('l_p'):$('l_u')).focus();return}
var r=twLogin(u,p);
if(!r.ok){er.textContent=r.msg;$('l_p').value='';$('l_p').focus();return}
er.textContent='';location.href=r.user.r==='admin'?twPage('dashboard'):twPage('tools')};
$('l_u').focus();
})();
