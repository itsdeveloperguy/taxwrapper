/* Read and write simple spreadsheets in the browser (no libraries). Needs zip.js.
   twSheet.read(file)      -> Promise<string[][]>  first sheet of an .xlsx or a .csv file, every cell as trimmed text (dates become YYYY-MM-DD)
   twSheet.xlsx(sheets)    -> Promise<Blob>        sheets: [{name, rows: (string|number)[][], widths?: number[]}]
   twSheet.csv(rows)       -> string */
var twSheet=(function(){
function parseCsv(t){t=t.replace(/^﻿/,'');var first=t.split(/\r?\n/,1)[0]||'',cnt=function(c){return first.split(c).length-1},
dl=cnt('\t')>cnt(',')&&cnt('\t')>cnt(';')?'\t':cnt(';')>cnt(',')?';':',',rows=[],row=[],cell='',q=false;
for(var i=0;i<t.length;i++){var c=t[i];
 if(q){if(c==='"'){if(t[i+1]==='"'){cell+='"';i++}else q=false}else cell+=c}
 else if(c==='"'&&!cell)q=true;
 else if(c===dl){row.push(cell);cell=''}
 else if(c==='\n'||c==='\r'){if(c==='\r'&&t[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell=''}
 else cell+=c}
if(cell||row.length){row.push(cell);rows.push(row)}
return rows.map(function(r){return r.map(function(x){return x.trim()})})}
function colIdx(ref){var m=/^([A-Z]+)/.exec(ref||''),n=0;if(!m)return -1;for(var i=0;i<m[1].length;i++)n=n*26+m[1].charCodeAt(i)-64;return n-1}
function xml(s){return new DOMParser().parseFromString(s,'application/xml')}
function all(d,n){return [].slice.call(d.getElementsByTagNameNS('*',n))}
function txt(el){return all(el,'t').map(function(t){return t.textContent}).join('')}
function isoSerial(v){var d=new Date(Date.UTC(1899,11,30)+Math.floor(v)*864e5);return d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0')}
function dateFmt(id,code){if(id>=14&&id<=22||id>=27&&id<=36||id>=45&&id<=47||id>=50&&id<=58)return true;if(!code)return false;
var c=code.replace(/"[^"]*"|\[[^\]]*\]|\\./g,'').toLowerCase();return /[dmy]/.test(c)&&!/^general/.test(c)}
async function readXlsx(buf){var z=await twZip.read(buf),by={};z.forEach(function(e){by[e.name]=e});
var dec=new TextDecoder();async function get(n){return by[n]?dec.decode(await by[n].bytes()):null}
var wb=await get('xl/workbook.xml');if(!wb)throw new Error('This is not a valid Excel (.xlsx) file.');
var sh=all(xml(wb),'sheet')[0],path='xl/worksheets/sheet1.xml';
if(sh){var rid=sh.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id')||sh.getAttribute('r:id'),rel=await get('xl/_rels/workbook.xml.rels');
 if(rel&&rid){var r=all(xml(rel),'Relationship').filter(function(x){return x.getAttribute('Id')===rid})[0];if(r){var t=r.getAttribute('Target');path=t.charAt(0)==='/'?t.slice(1):'xl/'+t.replace(/^\.\//,'')}}}
var sx=await get(path);if(!sx)throw new Error('Could not find a sheet in this Excel file.');
var ss=[],sst=await get('xl/sharedStrings.xml');if(sst)all(xml(sst),'si').forEach(function(s){ss.push(txt(s))});
var dateX=[],sty=await get('xl/styles.xml');
if(sty){var sd=xml(sty),fm={};all(sd,'numFmt').forEach(function(n){fm[n.getAttribute('numFmtId')]=n.getAttribute('formatCode')});
 var xfs=all(sd,'cellXfs')[0];if(xfs)[].slice.call(xfs.children).forEach(function(x,i){var id=+x.getAttribute('numFmtId');dateX[i]=dateFmt(id,fm[id])})}
var rows=[];
all(xml(sx),'row').forEach(function(rw){var r=[],ri=+rw.getAttribute('r')-1;
 all(rw,'c').forEach(function(c,k){var ci=colIdx(c.getAttribute('r')),t=c.getAttribute('t'),v=c.getElementsByTagNameNS('*','v')[0],val='';ci=ci<0?k:ci;
  if(t==='s')val=v?(ss[+v.textContent]||''):'';
  else if(t==='inlineStr')val=txt(c);
  else if(t==='b')val=v&&v.textContent==='1'?'TRUE':'FALSE';
  else if(t==='e')val='';
  else if(v){val=v.textContent;var n=parseFloat(val);if(t!=='str'&&!isNaN(n)&&dateX[+c.getAttribute('s')])val=isoSerial(n)}
  r[ci]=String(val).trim()});
 for(var i=0;i<r.length;i++)if(r[i]===undefined)r[i]='';
 if(ri>=0&&ri<100000)rows[ri]=r});
for(var j=0;j<rows.length;j++)if(!rows[j])rows[j]=[];
return rows}
async function read(file){var buf=await file.arrayBuffer(),u=new Uint8Array(buf);
if(u[0]===0x50&&u[1]===0x4B)return readXlsx(buf);
if(u[0]===0xD0&&u[1]===0xCF)throw new Error('Old .xls files are not supported. Save the file as .xlsx or .csv and try again.');
return parseCsv(new TextDecoder('utf-8').decode(u))}
/* ---- writing ---- */
function ex(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'')}
function cn(i){var s='';i++;while(i>0){var m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26)}return s}
function sheetXml(sh){var h='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>';
if(sh.widths)h+='<cols>'+sh.widths.map(function(w,i){return '<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+w+'" customWidth="1"/>'}).join('')+'</cols>';
h+='<sheetData>'+sh.rows.map(function(r,ri){return '<row r="'+(ri+1)+'">'+r.map(function(v,ci){var ref=cn(ci)+(ri+1),st=ri===0?' s="1"':' s="2"';
 if(v===''||v==null)return '';
 return typeof v==='number'?'<c r="'+ref+'"'+(ri===0?st:'')+'><v>'+v+'</v></c>':'<c r="'+ref+'"'+st+' t="inlineStr"><is><t xml:space="preserve">'+ex(v)+'</t></is></c>'}).join('')+'</row>'}).join('')+'</sheetData></worksheet>';return h}
async function xlsx(sheets){var f=[
{name:'[Content_Types].xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+sheets.map(function(s,i){return '<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'}).join('')+'</Types>'},
{name:'_rels/.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'},
{name:'xl/workbook.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+sheets.map(function(s,i){return '<sheet name="'+ex(s.name)+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>'}).join('')+'</sheets></workbook>'},
{name:'xl/_rels/workbook.xml.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+sheets.map(function(s,i){return '<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>'}).join('')+'<Relationship Id="rId'+(sheets.length+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'},
{name:'xl/styles.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFE3CC"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment wrapText="1" vertical="top"/></xf><xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs></styleSheet>'}];
sheets.forEach(function(s,i){f.push({name:'xl/worksheets/sheet'+(i+1)+'.xml',data:sheetXml(s)})});
var b=await twZip.make(f);return new Blob([b],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})}
function csvCell(v){v=String(v==null?'':v);return /[",\r\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
function csv(rows){return rows.map(function(r){return r.map(csvCell).join(',')}).join('\r\n')+'\r\n'}
return {read:read,xlsx:xlsx,csv:csv,parseCsv:parseCsv}})();
