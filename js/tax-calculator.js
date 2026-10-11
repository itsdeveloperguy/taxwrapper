/* Income tax */
function slab(t,a){var p=0,x=0;a.forEach(function(s){if(t>p)x+=(Math.min(t,s[0])-p)*s[1];p=s[0]});return x}
function tax(){
var inc=+$('x_inc').value||0,sal=+$('x_s').value;
var nt=Math.max(0,inc-(sal?75000:0)),ot=Math.max(0,inc-(sal?50000:0)-Math.min(150000,+$('x_c').value||0)-(+$('x_d').value||0)-(+$('x_o').value||0));
var I=Infinity,n=nt<=1200000?0:slab(nt,[[4e5,0],[8e5,.05],[12e5,.1],[16e5,.15],[2e6,.2],[24e5,.25],[I,.3]]);
var o=ot<=500000?0:slab(ot,[[25e4,0],[5e5,.05],[1e6,.2],[I,.3]]);
n*=1.04;o*=1.04;
var w=n<=o;
$('x_out').innerHTML='<div class="'+(w?'win':'')+'"><h3>New regime</h3><p class="note">Taxable income '+fmt(nt)+'</p><div class="big" style="font:800 28px Bricolage Grotesque,sans-serif">'+fmt(n)+'</div></div><div class="'+(w?'':'win')+'"><h3>Old regime</h3><p class="note">Taxable income '+fmt(ot)+'</p><div class="big" style="font:800 28px Bricolage Grotesque,sans-serif">'+fmt(o)+'</div></div><p class="note" style="grid-column:1/-1;margin:0">Lower tax: '+(w?'new':'old')+' regime, saving '+fmt(Math.abs(n-o))+'. Includes 4% cess.</p>'}
['x_inc','x_c','x_d','x_o','x_s'].forEach(function(i){$(i).oninput=tax});tax();
