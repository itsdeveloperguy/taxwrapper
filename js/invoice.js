/* Invoice */
function addRow(d,h,q,r,g){var e=document.createElement('div');e.className='row';
e.innerHTML='<input class="d" value="'+d+'" aria-label="Item"><input class="h" value="'+h+'" aria-label="HSN"><input class="q" type="number" min="0" value="'+q+'" aria-label="Quantity"><input class="r" type="number" min="0" value="'+r+'" aria-label="Rate"><select class="g" aria-label="GST rate">'+[0,5,12,18,28].map(function(x){return '<option'+(x==g?' selected':'')+'>'+x+'</option>'}).join('')+'</select>';
e.oninput=inv;$('i_rows').appendChild(e);inv()}
function inv(){
var intra=$('i_ty').value==='intra',sub=0,tax=0,rows='';
document.querySelectorAll('#i_rows .row:not(:first-child)').forEach(function(r){
var q=+r.querySelector('.q').value,p=+r.querySelector('.r').value,g=+r.querySelector('.g').value,v=q*p,t=v*g/100;sub+=v;tax+=t;
rows+='<tr><td>'+esc(r.querySelector('.d').value)+'</td><td>'+esc(r.querySelector('.h').value)+'</td><td class="r">'+q+'</td><td class="r">'+fmt(p)+'</td><td class="r">'+g+'%</td><td class="r">'+fmt(v+t)+'</td></tr>'});
var tx=intra?'<tr><td colspan="5" class="r">CGST</td><td class="r">'+fmt(tax/2)+'</td></tr><tr><td colspan="5" class="r">SGST</td><td class="r">'+fmt(tax/2)+'</td></tr>':'<tr><td colspan="5" class="r">IGST</td><td class="r">'+fmt(tax)+'</td></tr>';
$('inv').innerHTML='<h3>Tax invoice</h3><p style="margin:8px 0 16px"><b>'+esc($('i_sn').value)+'</b><br>GSTIN: '+esc($('i_sg').value||'-')+'<br>Invoice '+esc($('i_no').value)+' dated '+esc($('i_dt').value)+'<br>Billed to: '+esc($('i_bn').value)+'</p><table><tr><th>Item</th><th>HSN</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">GST</th><th class="r">Amount</th></tr>'+rows+'<tr><td colspan="5" class="r">Taxable value</td><td class="r">'+fmt(sub)+'</td></tr>'+tx+'<tr><td colspan="5" class="r"><b>Total</b></td><td class="r"><b>'+fmt(sub+tax)+'</b></td></tr></table>';}
$('i_dt').value=iso(today);
['i_sn','i_sg','i_bn','i_no','i_dt','i_ty'].forEach(function(i){$(i).oninput=inv});
$('i_add').onclick=function(){addRow('New item','',1,0,18)};
$('i_pr').onclick=function(){window.print()};
addRow('Cotton T-shirt','6109',2,499,5);
