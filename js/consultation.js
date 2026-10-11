/* Consultation */
$('f_s').onclick=function(){
if(!$('f_n').value||!$('f_p').value){$('f_o').textContent='Add your name and phone number so we can reach you.';return}
var b='Name: '+$('f_n').value+'\nPhone: '+$('f_p').value+'\nPlatform: '+$('f_m').value+'\nTopic: '+$('f_t').value+'\n\n'+$('f_g').value;
location.href='mailto:'+CONTACT+'?subject='+encodeURIComponent('Consultation request')+'&body='+encodeURIComponent(b);
$('f_o').textContent='Your email app should open with the request filled in. Press send there to complete it.'};
