var CONTACT="hello@taxwrapper.in";
var $=function(i){return document.getElementById(i)};
var fmt=function(n){return '₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2})};
var iso=function(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
var MN=['January','February','March','April','May','June','July','August','September','October','November','December'];
var today=new Date();
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
