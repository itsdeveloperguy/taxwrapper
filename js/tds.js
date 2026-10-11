/* TDS interest */
function months(a,b){if(b<=a)return 0;var m=(b.getFullYear()-a.getFullYear())*12+b.getMonth()-a.getMonth();return b.getDate()>a.getDate()?m+1:m}
function tds(){
var a=+$('t_amt').value,d1=new Date($('t_d1').value),d2=new Date($('t_d2').value),d3=new Date($('t_d3').value);
if(!a||isNaN(d1)||isNaN(d2)||isNaN(d3)){$('t_out').innerHTML='<span class="note">Enter all three dates to see the interest.</span>';return}
var m1=months(d1,d2),m2=months(d2,d3),i1=a*.01*m1,i2=a*.015*m2;
$('t_out').innerHTML='<div class="big">'+fmt(i1+i2)+'</div><table><tr><td>Late deduction: '+m1+' month(s) at 1%</td><td class="r">'+fmt(i1)+'</td></tr><tr><td>Late deposit: '+m2+' month(s) at 1.5%</td><td class="r">'+fmt(i2)+'</td></tr><tr><td>Tax plus interest to pay</td><td class="r">'+fmt(a+i1+i2)+'</td></tr></table>';}
['t_amt','t_d1','t_d2','t_d3'].forEach(function(i){$(i).oninput=tds});
$('t_d1').value=iso(new Date(today.getFullYear(),today.getMonth()-3,10));
$('t_d2').value=iso(new Date(today.getFullYear(),today.getMonth()-2,10));
$('t_d3').value=iso(new Date(today.getFullYear(),today.getMonth()-1,7));tds();
