/* Site-wide helpers. Every page sets <html data-root="..."> to the path back to the site root, so scripts can link to any page. */
var TW_ROOT=document.documentElement.getAttribute('data-root')||'';
/* Add new pages here so scripts can link to them with twPage('key'). */
var TW_PAGES={home:'index.html',tools:'features/tools/tools.html',invoice:'features/invoice/invoice.html',invoices:'features/saved-invoices/invoices.html',masters:'features/saved-parties/masters.html',login:'features/auth/login.html',dashboard:'features/admin-dashboard/dashboard.html',resizer:'features/image-resizer/image-resizer.html','hsn-lookup':'features/hsn-lookup/hsn-lookup.html'};
function twPage(k){return TW_ROOT+TW_PAGES[k]}
var CONTACT="hello@taxwrapper.in";
var $=function(i){return document.getElementById(i)};
var fmt=function(n){return '₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2})};
var iso=function(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
var MN=['January','February','March','April','May','June','July','August','September','October','November','December'];
var today=new Date();
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
