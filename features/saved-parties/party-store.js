/* Saved parties (masters): saved buyers and sellers, private to each user */
var TW_MK='tw-masters';
function twMasterAll(){var a=twRead(TW_MK,[]);return Array.isArray(a)?a:[]}
function twMasters(cat){var u=twUser();if(!u)return [];return twMasterAll().filter(function(m){return m.o===u.u&&(!cat||m.c===cat)}).sort(function(a,b){return a.n.toLowerCase()<b.n.toLowerCase()?-1:1})}
function twMasterSave(m){var u=twUser();if(!u)return '';var all=twMasterAll(),i=-1;
if(m.id)all.forEach(function(x,k){if(x.id===m.id&&x.o===u.u)i=k});
var rec=JSON.parse(JSON.stringify(m));rec.o=u.u;
if(i>-1)all[i]=rec;else{rec.id='m'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);all.push(rec)}
return twWrite(TW_MK,all)?rec.id:''}
function twMasterDel(id){var u=twUser();if(!u)return false;return twWrite(TW_MK,twMasterAll().filter(function(x){return !(x.id===id&&x.o===u.u)}))}
function twMasterAddr(m){return m.a+(m.p?' - '+m.p:'')}
function twBank(m){var b=m.b||{},p=[];if(b.h)p.push('A/c Holder: '+b.h);if(b.n)p.push('Bank: '+b.n);if(b.a)p.push('A/c No.: '+b.a);if(b.i)p.push('IFSC: '+b.i);if(b.r)p.push('Branch: '+b.r);return p.join('  |  ')}
