/* Calendar */
function events(y,m){
var e=[[7,'Deposit TDS and TCS for last month'],[10,'GSTR-8 for e-commerce operators'],[11,'GSTR-1 sales return (monthly filers)'],[20,'GSTR-3B summary return and payment']];
if([2,5,8,11].indexOf(m)>-1)e.push([15,'Advance tax instalment']);
if([0,3,6,9].indexOf(m)>-1)e.push([m===3?30:15,'TCS return Form 27EQ for the quarter just ended']);
if(m===6)e.push([31,'TDS return for Q1; ITR for non-audit taxpayers']);
if(m===9)e.push([31,'TDS return for Q2; ITR for audit cases']);
if(m===0)e.push([31,'TDS return for Q3']);
if(m===4)e.push([31,'TDS return for Q4']);
if(m===11)e.push([31,'GSTR-9 annual GST return']);
return e.sort(function(a,b){return a[0]-b[0]})}
var cm=new Date(today.getFullYear(),today.getMonth(),1);
function cal(){
$('c_t').textContent=MN[cm.getMonth()]+' '+cm.getFullYear();
var cur=cm.getMonth()===today.getMonth()&&cm.getFullYear()===today.getFullYear(),n=false;
$('c_l').innerHTML=events(cm.getFullYear(),cm.getMonth()).map(function(e){
var past=cur?e[0]<today.getDate():cm<new Date(today.getFullYear(),today.getMonth(),1),c='ev';
if(past)c+=' past';else if(cur&&!n){c+=' next';n=true}
return '<div class="'+c+'"><b>'+e[0]+' '+MN[cm.getMonth()].slice(0,3)+'</b><span>'+e[1]+'</span></div>'}).join('')}
if($('c_l')){$('c_p').onclick=function(){cm.setMonth(cm.getMonth()-1);cal()};
$('c_n').onclick=function(){cm.setMonth(cm.getMonth()+1);cal()};cal()}
/* hero deadlines: next three dates */
(function(){var out=[],d=new Date(today.getFullYear(),today.getMonth(),1);
for(var k=0;k<3&&out.length<4;k++){events(d.getFullYear(),d.getMonth()).forEach(function(e){
var dt=new Date(d.getFullYear(),d.getMonth(),e[0]);if(dt>=new Date(today.getFullYear(),today.getMonth(),today.getDate())&&out.length<4)out.push([dt,e[1]])});d.setMonth(d.getMonth()+1)}
if($('soon'))$('soon').innerHTML=out.map(function(o){return '<div><b>'+o[0].getDate()+' '+MN[o[0].getMonth()].slice(0,3)+'</b><span>'+o[1]+'</span></div>'}).join('')})();
