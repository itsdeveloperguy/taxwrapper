/* Side notification used by several features: snack(title, message, kind, {href,text}) */
function snack(title,msg,kind,link){var e=document.getElementById('snack');if(!e){e=document.createElement('div');e.id='snack';e.className='snack';e.setAttribute('role','status');e.setAttribute('aria-live','polite');document.body.appendChild(e)}
e.className='snack'+(kind==='warn'?' warn':'');
e.innerHTML='<b>'+esc(title)+'</b>'+(msg?'<span>'+esc(msg)+'</span>':'')+(link?'<a href="'+esc(link.href)+'">'+esc(link.text)+'</a>':'');
e.hidden=false;clearTimeout(snack.h);snack.h=setTimeout(function(){e.hidden=true},5000)}
