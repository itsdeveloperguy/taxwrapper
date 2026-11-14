/* Small ZIP reader and writer with no libraries.
   twZip.make([{name, blob | data}]) -> Promise<Blob>      (files are stored, not compressed)
   twZip.read(arrayBuffer) -> Promise<[{name, size, bytes()}]>  (reads stored and deflated entries) */
var twZip=(function(){
var CT=null;
function crc(u8){if(!CT){CT=[];for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;CT[n]=c>>>0}}
var c=-1;for(var i=0;i<u8.length;i++)c=CT[(c^u8[i])&255]^(c>>>8);return (c^-1)>>>0}
function pause(){return new Promise(function(r){setTimeout(r,0)})}
async function make(files){var parts=[],cd=[],off=0,now=new Date(),enc=new TextEncoder(),
dt=((now.getFullYear()-1980)<<9)|((now.getMonth()+1)<<5)|now.getDate(),tm=(now.getHours()<<11)|(now.getMinutes()<<5)|(now.getSeconds()>>1);
for(var i=0;i<files.length;i++){var f=files[i],nm=enc.encode(f.name),
u8=f.blob?new Uint8Array(await f.blob.arrayBuffer()):typeof f.data==='string'?enc.encode(f.data):f.data,cr=crc(u8),sz=u8.length;
var lh=new DataView(new ArrayBuffer(30));lh.setUint32(0,0x04034b50,true);lh.setUint16(4,20,true);lh.setUint16(6,0x0800,true);lh.setUint16(10,tm,true);lh.setUint16(12,dt,true);lh.setUint32(14,cr,true);lh.setUint32(18,sz,true);lh.setUint32(22,sz,true);lh.setUint16(26,nm.length,true);
parts.push(lh.buffer,nm,u8);
var ch=new DataView(new ArrayBuffer(46));ch.setUint32(0,0x02014b50,true);ch.setUint16(4,20,true);ch.setUint16(6,20,true);ch.setUint16(8,0x0800,true);ch.setUint16(12,tm,true);ch.setUint16(14,dt,true);ch.setUint32(16,cr,true);ch.setUint32(20,sz,true);ch.setUint32(24,sz,true);ch.setUint16(28,nm.length,true);ch.setUint32(42,off,true);
cd.push(ch.buffer,nm);off+=30+nm.length+sz;await pause()}
var cs=0;cd.forEach(function(b){cs+=b.byteLength||b.length});
var ed=new DataView(new ArrayBuffer(22));ed.setUint32(0,0x06054b50,true);ed.setUint16(8,files.length,true);ed.setUint16(10,files.length,true);ed.setUint32(12,cs,true);ed.setUint32(16,off,true);
return new Blob(parts.concat(cd,[ed.buffer]),{type:'application/zip'})}
var MAX_ENTRY=40*1024*1024;
async function inflate(u8){if(typeof DecompressionStream==='undefined')throw new Error('This browser cannot open compressed Excel files. Save the sheet as CSV instead.');
return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer())}
async function read(buf){var u8=new Uint8Array(buf),v=new DataView(buf),e=-1;
for(var i=u8.length-22;i>=Math.max(0,u8.length-65558);i--){if(v.getUint32(i,true)===0x06054b50){e=i;break}}
if(e<0)throw new Error('This is not a valid Excel (.xlsx) file.');
var n=v.getUint16(e+10,true),p=v.getUint32(e+16,true),dec=new TextDecoder(),out=[];
for(var k=0;k<n;k++){if(v.getUint32(p,true)!==0x02014b50)throw new Error('This Excel file looks damaged.');
var meth=v.getUint16(p+10,true),cs=v.getUint32(p+20,true),us=v.getUint32(p+24,true),nl=v.getUint16(p+28,true),xl=v.getUint16(p+30,true),cl=v.getUint16(p+32,true),lo=v.getUint32(p+42,true),
name=dec.decode(u8.subarray(p+46,p+46+nl));p+=46+nl+xl+cl;
(function(name,meth,cs,us,lo){out.push({name:name,size:us,bytes:async function(){if(us>MAX_ENTRY)throw new Error('This Excel file is too large to read.');
var ln=v.getUint16(lo+26,true),lx=v.getUint16(lo+28,true),s=lo+30+ln+lx,d=u8.subarray(s,s+cs);
return meth===0?d:meth===8?await inflate(d):(function(){throw new Error('Unsupported Excel compression.')})()}})})(name,meth,cs,us,lo)}
return out}
return {make:make,read:read}})();
