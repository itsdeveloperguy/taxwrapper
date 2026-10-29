/* Invoice helpers shared by the tools page and the preview page */
var ST={'01':'Jammu & Kashmir','02':'Himachal Pradesh','03':'Punjab','04':'Chandigarh','05':'Uttarakhand','06':'Haryana','07':'Delhi','08':'Rajasthan','09':'Uttar Pradesh','10':'Bihar','11':'Sikkim','12':'Arunachal Pradesh','13':'Nagaland','14':'Manipur','15':'Mizoram','16':'Tripura','17':'Meghalaya','18':'Assam','19':'West Bengal','20':'Jharkhand','21':'Odisha','22':'Chhattisgarh','23':'Madhya Pradesh','24':'Gujarat','26':'Dadra & Nagar Haveli and Daman & Diu','27':'Maharashtra','29':'Karnataka','30':'Goa','31':'Lakshadweep','32':'Kerala','33':'Tamil Nadu','34':'Puducherry','35':'Andaman & Nicobar Islands','36':'Telangana','37':'Andhra Pradesh','38':'Ladakh'};
var ON=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
var TN=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
function w2(n){return n<20?ON[n]:TN[Math.floor(n/10)]+(n%10?' '+ON[n%10]:'')}
function w3(n){var h=Math.floor(n/100),r=n%100;return (h?ON[h]+' Hundred'+(r?' ':''):'')+(r?w2(r):'')}
function words(n){n=Math.floor(n);if(!n)return 'Zero';var o=[],c=Math.floor(n/1e7),l=Math.floor(n/1e5)%100,t=Math.floor(n/1e3)%100,h=n%1000;if(c)o.push(words(c)+' Crore');if(l)o.push(w2(l)+' Lakh');if(t)o.push(w2(t)+' Thousand');if(h)o.push(w3(h));return o.join(' ')}
function inrWords(x){var r=Math.floor(x+1e-9),p=Math.round((x-r)*100);return 'INR '+words(r)+(p?' and '+words(p)+' paise':'')+' Only'}
function n2(n){return Number(n).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}
function dmy(v){var d=new Date(v+'T00:00:00');return isNaN(d)?'':d.getDate()+'-'+MN[d.getMonth()].slice(0,3)+'-'+String(d.getFullYear()).slice(2)}
function br(s){return esc(s).replace(/\n/g,'<br>')}
function stline(c){return 'State Name : '+(ST[c]||'-')+', Code : '+c}
function codeOf(n){n=(n||'').trim().toLowerCase();var k=Object.keys(ST);for(var i=0;i<k.length;i++)if(ST[k[i]].toLowerCase()===n)return k[i];return ''}
function pc(u,g,s){return u?codeOf(s):g.slice(0,2)}

function trow(l,v){return '<tr class="nb"><td></td><td class="r"><i>'+l+'</i></td><td></td><td></td><td></td><td></td><td></td><td class="r"><b>'+v+'</b></td></tr>'}
function cell(l,v,f){return '<div'+(f?' class="full"':'')+'><small>'+l+'</small>'+(v?'<b>'+esc(v)+'</b>':'')+'</div>'}

function renderInvoice(d){
var S=d.s,R=d.ref||{},sc=pc(S.su,S.sg,S.ss),bc=pc(S.bu,S.bg,S.bs),intra=sc===bc,sub=0,tax=0,qt=0,rows='',hs={},i=0;
d.items.forEach(function(it){
var q=+it.q||0,p=+it.r||0,g=+it.g||0,h=it.h||'',dc=Math.min(100,Math.max(0,+it.dc||0)),v=Math.round(q*p*(100-dc))/100,t=Math.round(v*g)/100;
i++;sub+=v;tax+=t;qt+=q;
rows+='<tr><td class="c">'+i+'</td><td>'+esc(it.d||'')+'</td><td>'+esc(h)+'</td><td class="r"><b>'+q+' PCS</b></td><td class="r">'+n2(p)+'</td><td class="c">PCS</td><td class="c">'+(dc?dc+'%':'')+'</td><td class="r"><b>'+n2(v)+'</b></td></tr>';
var k=h+'|'+g;hs[k]=hs[k]||{h:h,g:g,v:0,t:0};hs[k].v+=v;hs[k].t+=t});
sub=Math.round(sub*100)/100;tax=Math.round(tax*100)/100;
var tot=sub+tax,rd=Math.round(tot),ro=Math.round((rd-tot)*100)/100,c1=Math.round(tax*50)/100,c2=Math.round((tax-c1)*100)/100;
var tl=intra?trow('GST-OUTPUT CGST',n2(c1))+trow('GST-OUTPUT SGST',n2(c2)):trow('GST-OUTPUT IGST',n2(tax));
var hr='',tv=0;
Object.keys(hs).forEach(function(k){var o=hs[k];tv+=o.v;
hr+='<tr><td>'+esc(o.h)+'</td><td class="r">'+n2(o.v)+'</td>'+(intra?'<td class="r">'+o.g/2+'%</td><td class="r">'+n2(o.t/2)+'</td><td class="r">'+o.g/2+'%</td><td class="r">'+n2(o.t/2)+'</td>':'<td class="r">'+o.g+'%</td><td class="r">'+n2(o.t)+'</td>')+'<td class="r">'+n2(o.t)+'</td></tr>'});
var hh=['HSN/SAC','Taxable Value'].concat(intra?['CGST Rate','CGST Amount','SGST Rate','SGST Amount']:['IGST Rate','IGST Amount'],['Total Tax Amount']).map(function(x){return '<th>'+x+'</th>'}).join('');
var ht='<tr><td class="r"><b>Total</b></td><td class="r"><b>'+n2(tv)+'</b></td>'+(intra?'<td></td><td class="r"><b>'+n2(tax/2)+'</b></td><td></td><td class="r"><b>'+n2(tax/2)+'</b></td>':'<td></td><td class="r"><b>'+n2(tax)+'</b></td>')+'<td class="r"><b>'+n2(tax)+'</b></td></tr>';
var bb='<b>'+esc(S.bn)+'</b><br>'+br(S.ba)+(S.bu?'':'<br>GSTIN/UIN : '+esc(S.bg))+'<br>'+stline(bc);
var cells=cell('Invoice No.',d.no||'')+cell('Dated',dmy(d.dt||''))+cell('Delivery Note',R.dn||'')+cell('Mode/Terms of Payment',R.mp||'')+cell('Reference No. &amp; Date.',R.rf||'')+cell('Other References',R.ro||'')+cell('Buyer’s Order No.',R.bo||'')+cell('Dated',dmy(R.bd||''))+cell('Dispatch Doc No.',R.dp||'')+cell('Delivery Note Date',dmy(R.dd||''))+cell('Dispatched through',R.dt||'')+cell('Destination',R.ds||'')+cell('Terms of Delivery',R.td||'',1);
return '<div class="iv"><h3>Tax Invoice</h3>'
+'<div class="top"><div><div class="bx"><b>'+esc(S.sn)+'</b><br>'+br(S.sa)+(S.su?'':'<br>GSTIN/UIN: '+esc(S.sg))+'<br>'+stline(sc)+'</div>'
+'<div class="bx"><small>Consignee (Ship to)</small>'+bb+'</div><div class="bx"><small>Buyer (Bill to)</small>'+bb+'</div></div><div class="rf">'+cells+'</div></div>'
+'<table><tr><th>Sl No.</th><th>Description of Goods</th><th>HSN/SAC</th><th>Quantity</th><th>Rate</th><th>per</th><th>Disc. %</th><th>Amount</th></tr>'+rows
+trow('',n2(sub))+tl+trow('ROUND OFF',(ro<0?'-':'')+n2(Math.abs(ro)))
+'<tr><td></td><td class="r">Total</td><td></td><td class="r"><b>'+qt+' PCS</b></td><td></td><td></td><td></td><td class="r"><b>₹ '+n2(rd)+'</b></td></tr></table>'
+'<div class="bd"><small>Amount Chargeable (in words)</small><b>'+inrWords(rd)+'</b></div>'
+'<table><tr>'+hh+'</tr>'+hr+ht+'</table>'
+'<div class="bd">Tax Amount (in words) : <b>'+inrWords(tax)+'</b></div>'
+'<div class="ft"><div><small>Declaration</small>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</div><div><span>for <b>'+esc(S.sn)+'</b></span><span>Authorised Signatory</span></div></div>'
+'<p class="cg">This is a Computer Generated Invoice</p></div>'}

/* Invoice data is passed to the preview page through the tab's session storage (kept only in this browser tab) */
function twSave(d){var s=JSON.stringify(d);try{sessionStorage.setItem('tw-invoice',s);return ''}catch(e){return '#'+btoa(unescape(encodeURIComponent(s)))}}
function twLoad(){try{var s=sessionStorage.getItem('tw-invoice');if(s)return JSON.parse(s)}catch(e){}
try{if(location.hash.length>1)return JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(1)))))}catch(e){}return null}
