/* HSN Code Lookup. Uses HSN_CHAPTERS / HSN_HEADINGS from hsn-data.js and esc() from assets/js/utils.js */
(function(){
"use strict";
var KEY='tw-hsn-recent';
function g(id){return document.getElementById(id)}
function norm(v){return String(v||'').replace(/[\s.\-_,]/g,'')}

/* Returns {state:'ok'|'warn'|'bad', title, lines[], code, level} */
function validate(raw){
  var c=norm(raw);
  if(!c)return{state:'bad',code:'',title:'Nothing entered',lines:['Enter an HSN code.']};
  if(!/^\d+$/.test(c))return{state:'bad',code:c,title:'Not a valid HSN code',lines:['HSN codes contain digits only (no letters or symbols).']};
  if([2,4,6,8].indexOf(c.length)<0)return{state:'bad',code:c,title:'Wrong number of digits',lines:['You entered '+c.length+' digit'+(c.length===1?'':'s')+'. A valid HSN has 2, 4, 6 or 8 digits.']};
  var ch=c.slice(0,2);
  if(ch==='00'||ch==='77'||!HSN_CHAPTERS[ch])return{state:'bad',code:c,title:'Invalid chapter '+ch,lines:[ch==='77'?'Chapter 77 is reserved and has no goods.':'There is no chapter '+ch+'. Valid chapters are 01 to 99 (except 77).']};
  var r={code:c,level:c.length,chapter:ch,chapterTitle:HSN_CHAPTERS[ch],lines:[]};
  if(ch==='99'){
    r.title='Looks like a SAC (service) code';
    if(c.length!==6){r.state='warn';r.lines.push('Service accounting codes (SAC) have 6 digits and start with 99. Yours has '+c.length+'.');}
    else{r.state='warn';r.lines.push('Codes starting with 99 are SAC codes for services, not HSN for goods. Confirm the exact service on the GST portal.');}
    return r;
  }
  if(ch==='98'){r.state='warn';r.title='Customs-only chapter';r.lines.push('Chapter 98 is used for imports under special schemes. It is not normally used on domestic sale invoices.');return r;}
  var h=c.slice(0,4),d=HSN_HEADINGS[h];
  if(d){r.state='ok';r.heading=h;r.headingText=d;r.title=c+' is a valid HSN format';
    if(c.length>4)r.lines.push('Heading '+h+' is recognised. The exact '+c.length+'-digit description must be confirmed in the sources below.');}
  else if(c.length>=4){r.state='warn';r.title=c+' has a valid format';r.lines.push('Chapter '+ch+' exists, but heading '+h+' is not in this page\'s built-in list. It may still be a real heading, so confirm it in the sources below.');}
  else{r.state='ok';r.title=c+' is a valid chapter';r.lines.push('This is only a 2-digit chapter. Invoices normally need at least 4 digits.');}
  return r;
}

function sources(c){
  var q=encodeURIComponent('HSN '+c+' GST rate India');
  return [
    ['Google','Search HSN '+c+' with GST rate','https://www.google.com/search?q='+q],
    ['GST portal HSN search','Official. Paste the code on the page','https://services.gst.gov.in/services/searchhsnsac']
  ];
}

function row(k,v){return v?'<div><b>'+esc(k)+'</b><span>'+v+'</span></div>':''}
function render(r){
  var icon=r.state==='ok'?'✓ ':r.state==='warn'?'! ':'✗ ';
  var h='<div class="hsn-v '+r.state+'"><h4>'+icon+esc(r.title)+'</h4>';
  r.lines.forEach(function(l){h+='<p>'+esc(l)+'</p>'});
  if(r.chapter){
    h+='<div class="hsn-tr">'+row('Code','<span class="hsn-code">'+esc(spaced(r.code))+'</span>')+row('Chapter',esc(r.chapter+' - '+r.chapterTitle))+(r.heading?row('Heading',esc(r.heading+' - '+r.headingText)):'')+row('Digits',esc(r.level+(r.level===2?' (chapter)':r.level===4?' (heading)':r.level===6?' (sub-heading)':' (tariff item)')))+'</div>';
    h+='<p style="margin-top:10px"><button class="btn o" id="hsn-copy" type="button" data-c="'+esc(r.code)+'">Copy code</button></p>';
  }
  return h+'</div>';
}
function spaced(c){return c.length>4?c.slice(0,4)+' '+c.slice(4).replace(/(\d{2})(?=\d)/g,'$1 '):c}

function search(w){
  w=w.toLowerCase().trim();
  var words=w.split(/\s+/).filter(function(x){return x.length>1}),hits=[];
  if(!words.length)return hits;
  Object.keys(HSN_HEADINGS).forEach(function(k){
    var t=(HSN_HEADINGS[k]+' '+HSN_CHAPTERS[k.slice(0,2)]).toLowerCase();
    if(words.every(function(x){return t.indexOf(x)>=0}))hits.push([k,HSN_HEADINGS[k]]);
  });
  return hits.slice(0,12);
}

function recent(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return[]}}
function addRecent(c,st){
  var a=recent().filter(function(x){return x.c!==c});a.unshift({c:c,s:st});
  try{localStorage.setItem(KEY,JSON.stringify(a.slice(0,10)))}catch(e){}
  showRecent();
}
function showRecent(){
  var a=recent();g('hsn-rc').hidden=!a.length;
  g('hsn-recent').innerHTML='<div class="hsn-rl">'+a.map(function(x){return '<button type="button" class="hsn-ex" data-q="'+esc(x.c)+'">'+(x.s==='ok'?'✓ ':x.s==='warn'?'! ':'✗ ')+esc(x.c)+'</button>'}).join('')+'</div>';
}

function run(v){
  var q=String(v||g('hsn-q').value).trim(),err=g('hsn-err'),res=g('hsn-res'),sc=g('hsn-srcc');
  err.textContent='';g('hsn-q').value=q;
  if(!q){err.textContent='Enter an HSN code or a product name.';res.innerHTML='';sc.hidden=true;return}
  if(/[a-z]/i.test(q)){
    var hits=search(q);sc.hidden=true;
    if(!hits.length){res.innerHTML='<div class="hsn-v warn"><h4>No match in the built-in list</h4><p>Try a simpler word (for example "shirt", "phone" or "toy"), or search the product on these sources.</p></div>';
      g('hsn-src').innerHTML=srcHtml([['Google','Search "'+q+'" HSN code','https://www.google.com/search?q='+encodeURIComponent(q+' HSN code India')],sources('')[1]]);
      sc.hidden=false;return}
    res.innerHTML='<div class="hsn-v ok"><h4>'+hits.length+' matching heading'+(hits.length===1?'':'s')+'</h4><p>Tap one to check it and see sources.</p></div><div class="hsn-hits">'+hits.map(function(h){return '<button type="button" class="hsn-hit" data-q="'+h[0]+'"><b class="hsn-code">'+h[0]+'</b><span>'+esc(h[1])+'</span></button>'}).join('')+'</div>';
    return;
  }
  var r=validate(q);res.innerHTML=render(r);
  if(/^\d+$/.test(r.code||''))addRecent(r.code,r.state);
  if(r.state==='bad'){sc.hidden=true}else{g('hsn-src').innerHTML=srcHtml(sources(r.code));sc.hidden=false}
  if(window.snack)try{snack(r.state==='bad'?'Invalid HSN code':r.state==='ok'?'Valid HSN format':'Format is valid, please confirm',r.code)}catch(e){}
  res.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function srcHtml(a){return a.map(function(s){return '<a href="'+esc(s[2])+'" target="_blank" rel="noopener noreferrer"><b>'+esc(s[0])+' &#8599;</b><span>'+esc(s[1])+'</span></a>'}).join('')}

function bulk(){
  var parts=g('hsn-many').value.split(/[\s,;]+/).filter(Boolean),seen={},out=[];
  parts.forEach(function(p){var c=norm(p);if(!seen[c]){seen[c]=1;out.push(validate(p))}});
  var box=g('hsn-bres');
  if(!out.length){box.innerHTML='<p class="note lerr" role="alert">Paste at least one code.</p>';return}
  var ok=out.filter(function(r){return r.state==='ok'}).length,bad=out.filter(function(r){return r.state==='bad'}).length;
  box.innerHTML='<p class="note" style="margin-top:12px">'+out.length+' unique code'+(out.length===1?'':'s')+': '+ok+' valid, '+(out.length-ok-bad)+' to confirm, '+bad+' invalid.</p><div class="hsn-tw"><table><thead><tr><th>Code</th><th>Result</th><th>Details</th></tr></thead><tbody>'+
   out.map(function(r){var d=r.headingText||r.chapterTitle||r.lines[0]||'';return '<tr><td class="hsn-code">'+esc(r.code)+'</td><td>'+(r.state==='ok'?'✓ Valid':r.state==='warn'?'! Confirm':'✗ Invalid')+'</td><td>'+esc(d)+'</td></tr>'}).join('')+'</tbody></table></div>';
}

document.addEventListener('DOMContentLoaded',function(){
  g('hsn-f').addEventListener('submit',function(e){e.preventDefault();run()});
  document.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('[data-q]');
    if(b){g('hsn-q').value=b.getAttribute('data-q');run();return}
    var cp=e.target.closest&&e.target.closest('#hsn-copy');
    if(cp){var c=cp.getAttribute('data-c');
      try{navigator.clipboard.writeText(c).then(function(){if(window.snack)snack('Copied',c)},function(){})}catch(x){}}
  });
  g('hsn-bulk').addEventListener('click',bulk);
  g('hsn-clr').addEventListener('click',function(){try{localStorage.removeItem(KEY)}catch(e){}showRecent()});
  showRecent();
  var m=/[?&]code=([^&]+)/.exec(location.search);if(m){run(decodeURIComponent(m[1]))}
});
})();
