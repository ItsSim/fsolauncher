const fs = require('fs');

var JSZip=function(f,l){this.files={};this.root="";f&&this.load(f,l)};JSZip.signature={LOCAL_FILE_HEADER:"PK\u0003\u0004",CENTRAL_FILE_HEADER:"PK\u0001\u0002",CENTRAL_DIRECTORY_END:"PK\u0005\u0006",ZIP64_CENTRAL_DIRECTORY_LOCATOR:"PK\u0006\u0007",ZIP64_CENTRAL_DIRECTORY_END:"PK\u0006\u0006",DATA_DESCRIPTOR:"PK\u0007\b"};JSZip.defaults={base64:!1,binary:!1,dir:!1,date:null,compression:null};
JSZip.prototype=function(){var f=function(a,b,c){this.name=a;this.data=b;this.options=c};f.prototype={asText:function(){var a=this.data;if(null===a||"undefined"===typeof a)return"";this.options.base64&&(a=JSZipBase64.decode(a));this.options.binary&&(a=JSZip.prototype.utf8decode(a));return a},asBinary:function(){var a=this.data;if(null===a||"undefined"===typeof a)return"";this.options.base64&&(a=JSZipBase64.decode(a));this.options.binary||(a=JSZip.prototype.utf8encode(a));return a},asUint8Array:function(){return JSZip.utils.string2Uint8Array(this.asBinary())},
asArrayBuffer:function(){return JSZip.utils.string2Uint8Array(this.asBinary()).buffer}};var l=function(a,b){var c="",d;for(d=0;d<b;d++)c+=String.fromCharCode(a&255),a>>>=8;return c},m=function(){var a={},b,c;for(b=0;b<arguments.length;b++)for(c in arguments[b])arguments[b].hasOwnProperty(c)&&"undefined"===typeof a[c]&&(a[c]=arguments[b][c]);return a},h=function(a,b,c){var d=p(a);d&&n.call(this,d);c=c||{};!0===c.base64&&null==c.binary&&(c.binary=!0);c=m(c,JSZip.defaults);c.date=c.date||new Date;null!==
c.compression&&(c.compression=c.compression.toUpperCase());c.dir||null===b||"undefined"===typeof b?(c.base64=!1,c.binary=!1,b=null):JSZip.support.uint8array&&b instanceof Uint8Array?(c.base64=!1,c.binary=!0,b=JSZip.utils.uint8Array2String(b)):JSZip.support.arraybuffer&&b instanceof ArrayBuffer?(c.base64=!1,c.binary=!0,b=new Uint8Array(b),b=JSZip.utils.uint8Array2String(b)):c.binary&&!c.base64&&(!0!==c.optimizedBinaryString&&(b=JSZip.utils.string2binary(b)),delete c.optimizedBinaryString);return this.files[a]=
new f(a,b,c)},p=function(a){"/"==a.slice(-1)&&(a=a.substring(0,a.length-1));var b=a.lastIndexOf("/");return 0<b?a.substring(0,b):""},n=function(a){"/"!=a.slice(-1)&&(a+="/");if(!this.files[a]){var b=p(a);b&&n.call(this,b);h.call(this,a,null,{dir:!0})}return this.files[a]};return{load:function(a,b){throw Error("Load method is not defined. Is the file jszip-load.js included ?");},filter:function(a){var b=[],c;for(c in this.files)if(this.files.hasOwnProperty(c)){var d=this.files[c];var l=new f(d.name,
d.data,m(d.options));d=c.slice(this.root.length,c.length);c.slice(0,this.root.length)===this.root&&a(d,l)&&b.push(l)}return b},file:function(a,b,c){if(1===arguments.length){if(a instanceof RegExp){var d=a;return this.filter(function(a,b){return!b.options.dir&&d.test(a)})}return this.filter(function(b,c){return!c.options.dir&&b===a})[0]||null}a=this.root+a;h.call(this,a,b,c);return this},folder:function(a){if(!a)return this;if(a instanceof RegExp)return this.filter(function(b,c){return c.options.dir&&
a.test(b)});var b=n.call(this,this.root+a),c=this.clone();c.root=b.name;return c},remove:function(a){a=this.root+a;var b=this.files[a];b||("/"!=a.slice(-1)&&(a+="/"),b=this.files[a]);if(b)if(b.options.dir){b=this.filter(function(b,c){return c.name.slice(0,a.length)===a});for(var c=0;c<b.length;c++)delete this.files[b[c].name]}else delete this.files[a];return this},generate:function(a){a=m(a||{},{base64:!0,compression:"STORE",type:"base64"});var b=a.compression.toUpperCase();if(!JSZip.compressions[b])throw b+
" is not a valid compression method !";var c=[],d=[],f=0,n;for(n in this.files)if(this.files.hasOwnProperty(n)){var h=this.files[n];var p=this.utf8encode(h.name);var A=h;h=p;var w=b;var y=h!==A.name;var u=A.asBinary();var v=A.options;var F=v.date.getHours();F=F<<6|v.date.getMinutes();F=F<<5|v.date.getSeconds()/2;A=v.date.getFullYear()-1980;A=A<<4|v.date.getMonth()+1;A=A<<5|v.date.getDate();var t=null!==u&&0!==u.length;w=v.compression||w;if(!JSZip.compressions[w])throw w+" is not a valid compression method !";
v=JSZip.compressions[w];w=t?v.compress(u):"";y="\n\x00"+(y?"\x00\b":"\x00\x00")+(t?v.magic:JSZip.compressions.STORE.magic);y+=l(F,2);y+=l(A,2);y+=t?l(this.crc32(u),4):"\x00\x00\x00\x00";y+=t?l(w.length,4):"\x00\x00\x00\x00";y+=t?l(u.length,4):"\x00\x00\x00\x00";y+=l(h.length,2);h=y+="\x00\x00";u=w;u=JSZip.signature.LOCAL_FILE_HEADER+h+p+u;p=JSZip.signature.CENTRAL_FILE_HEADER+"\u0014\x00"+h+"\x00\x00\x00\x00\x00\x00"+(!0===this.files[n].options.dir?"\u0010\x00\x00\x00":"\x00\x00\x00\x00")+l(f,4)+
p;f+=u.length;d.push(u);c.push(p)}b=d.join("");c=c.join("");d=JSZip.signature.CENTRAL_DIRECTORY_END+"\x00\x00\x00\x00"+l(d.length,2)+l(d.length,2)+l(c.length,4)+l(b.length,4)+"\x00\x00";d=b+c+d;switch(a.type.toLowerCase()){case "uint8array":return JSZip.utils.string2Uint8Array(d);case "arraybuffer":return JSZip.utils.string2Uint8Array(d).buffer;case "blob":return JSZip.utils.string2Blob(d);case "base64":return a.base64?JSZipBase64.encode(d):d;default:return d}},crc32:function(a,b){if(""===a||"undefined"===
typeof a)return 0;var c=[0,1996959894,3993919788,2567524794,124634137,1886057615,3915621685,2657392035,249268274,2044508324,3772115230,2547177864,162941995,2125561021,3887607047,2428444049,498536548,1789927666,4089016648,2227061214,450548861,1843258603,4107580753,2211677639,325883990,1684777152,4251122042,2321926636,335633487,1661365465,4195302755,2366115317,997073096,1281953886,3579855332,2724688242,1006888145,1258607687,3524101629,2768942443,901097722,1119000684,3686517206,2898065728,853044451,
1172266101,3705015759,2882616665,651767980,1373503546,3369554304,3218104598,565507253,1454621731,3485111705,3099436303,671266974,1594198024,3322730930,2970347812,795835527,1483230225,3244367275,3060149565,1994146192,31158534,2563907772,4023717930,1907459465,112637215,2680153253,3904427059,2013776290,251722036,2517215374,3775830040,2137656763,141376813,2439277719,3865271297,1802195444,476864866,2238001368,4066508878,1812370925,453092731,2181625025,4111451223,1706088902,314042704,2344532202,4240017532,
1658658271,366619977,2362670323,4224994405,1303535960,984961486,2747007092,3569037538,1256170817,1037604311,2765210733,3554079995,1131014506,879679996,2909243462,3663771856,1141124467,855842277,2852801631,3708648649,1342533948,654459306,3188396048,3373015174,1466479909,544179635,3110523913,3462522015,1591671054,702138776,2966460450,3352799412,1504918807,783551873,3082640443,3233442989,3988292384,2596254646,62317068,1957810842,3939845945,2647816111,81470997,1943803523,3814918930,2489596804,225274430,
2053790376,3826175755,2466906013,167816743,2097651377,4027552580,2265490386,503444072,1762050814,4150417245,2154129355,426522225,1852507879,4275313526,2312317920,282753626,1742555852,4189708143,2394877945,397917763,1622183637,3604390888,2714866558,953729732,1340076626,3518719985,2797360999,1068828381,1219638859,3624741850,2936675148,906185462,1090812512,3747672003,2825379669,829329135,1181335161,3412177804,3160834842,628085408,1382605366,3423369109,3138078467,570562233,1426400815,3317316542,2998733608,
733239954,1555261956,3268935591,3050360625,752459403,1541320221,2607071920,3965973030,1969922972,40735498,2617837225,3943577151,1913087877,83908371,2512341634,3803740692,2075208622,213261112,2463272603,3855990285,2094854071,198958881,2262029012,4057260610,1759359992,534414190,2176718541,4139329115,1873836001,414664567,2282248934,4279200368,1711684554,285281116,2405801727,4167216745,1634467795,376229701,2685067896,3608007406,1308918612,956543938,2808555105,3495958263,1231636301,1047427035,2932959818,
3654703836,1088359270,936918E3,2847714899,3736837829,1202900863,817233897,3183342108,3401237130,1404277552,615818150,3134207493,3453421203,1423857449,601450431,3009837614,3294710456,1567103746,711928724,3020668471,3272380065,1510334235,755167117];"undefined"==typeof b&&(b=0);b^=-1;for(var d=0,f=a.length;d<f;d++){var h=(b^a.charCodeAt(d))&255;h=c[h];b=b>>>8^h}return b^-1},clone:function(){var a=new JSZip,b;for(b in this)"function"!==typeof this[b]&&(a[b]=this[b]);return a},utf8encode:function(a){for(var b=
"",c=0;c<a.length;c++){var d=a.charCodeAt(c);128>d?b+=String.fromCharCode(d):(127<d&&2048>d?b+=String.fromCharCode(d>>6|192):(b+=String.fromCharCode(d>>12|224),b+=String.fromCharCode(d>>6&63|128)),b+=String.fromCharCode(d&63|128))}return b},utf8decode:function(a){for(var b="",c=0,d,f,h;c<a.length;)d=a.charCodeAt(c),128>d?(b+=String.fromCharCode(d),c++):191<d&&224>d?(f=a.charCodeAt(c+1),b+=String.fromCharCode((d&31)<<6|f&63),c+=2):(f=a.charCodeAt(c+1),h=a.charCodeAt(c+2),b+=String.fromCharCode((d&
15)<<12|(f&63)<<6|h&63),c+=3);return b}}}();JSZip.compressions={STORE:{magic:"\x00\x00",compress:function(f){return f},uncompress:function(f){return f}}};
JSZip.support={arraybuffer:function(){return"undefined"!==typeof ArrayBuffer&&"undefined"!==typeof Uint8Array}(),uint8array:function(){return"undefined"!==typeof Uint8Array}(),blob:function(){if("undefined"===typeof ArrayBuffer)return!1;var f=new ArrayBuffer(0);try{return 0===(new Blob([f],{type:"application/zip"})).size}catch(m){}try{var l=new (window.BlobBuilder||window.WebKitBlobBuilder||window.MozBlobBuilder||window.MSBlobBuilder);l.append(f);return 0===l.getBlob("application/zip").size}catch(m){}return!1}()};
JSZip.utils={string2binary:function(f){for(var l="",m=0;m<f.length;m++)l+=String.fromCharCode(f.charCodeAt(m)&255);return l},string2Uint8Array:function(f){if(!JSZip.support.uint8array)throw Error("Uint8Array is not supported by this browser");var l=new ArrayBuffer(f.length);l=new Uint8Array(l);for(var m=0;m<f.length;m++)l[m]=f.charCodeAt(m);return l},uint8Array2String:function(f){if(!JSZip.support.uint8array)throw Error("Uint8Array is not supported by this browser");for(var l="",m=0;m<f.length;m++)l+=
String.fromCharCode(f[m]);return l},string2Blob:function(f){if(!JSZip.support.blob)throw Error("Blob is not supported by this browser");f=JSZip.utils.string2Uint8Array(f).buffer;try{return new Blob([f],{type:"application/zip"})}catch(m){}try{var l=new (window.BlobBuilder||window.WebKitBlobBuilder||window.MozBlobBuilder||window.MSBlobBuilder);l.append(f);return l.getBlob("application/zip")}catch(m){}throw Error("Bug : can't construct the Blob.");}};
var JSZipBase64=function(){return{encode:function(f,l){for(var m="",h,p,n,a,b,c,d=0;d<f.length;)h=f.charCodeAt(d++),p=f.charCodeAt(d++),n=f.charCodeAt(d++),a=h>>2,h=(h&3)<<4|p>>4,b=(p&15)<<2|n>>6,c=n&63,isNaN(p)?b=c=64:isNaN(n)&&(c=64),m=m+"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(a)+"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(h)+"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(b)+"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(c);
return m},decode:function(f,l){var m="",h=0;for(f=f.replace(/[^A-Za-z0-9\+\/=]/g,"");h<f.length;){var p="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(f.charAt(h++));var n="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(f.charAt(h++));var a="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(f.charAt(h++));var b="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(f.charAt(h++));p=p<<2|n>>4;n=(n&
15)<<4|a>>2;var c=(a&3)<<6|b;m+=String.fromCharCode(p);64!=a&&(m+=String.fromCharCode(n));64!=b&&(m+=String.fromCharCode(c))}return m}}}();if(!JSZip)throw"JSZip not defined";
(function(){function f(){this.list=this.next=null}function l(){this.n=this.b=this.e=0;this.t=null}function m(a,b,c,g,d,h){this.BMAX=16;this.N_MAX=288;this.status=0;this.root=null;this.m=0;var k=Array(this.BMAX+1),n,e,q,p=Array(this.BMAX+1),m,B=new l,I=Array(this.BMAX);var r=Array(this.N_MAX);var t=Array(this.BMAX+1),v,u;var L=this.root=null;for(e=0;e<k.length;e++)k[e]=0;for(e=0;e<p.length;e++)p[e]=0;for(e=0;e<I.length;e++)I[e]=null;for(e=0;e<r.length;e++)r[e]=0;for(e=0;e<t.length;e++)t[e]=0;var y=
256<b?a[256]:this.BMAX;var w=a;var D=0;e=b;do k[w[D]]++,D++;while(0<--e);if(k[0]==b)this.root=null,this.status=this.m=0;else{for(q=1;q<=this.BMAX&&0==k[q];q++);var x=q;h<q&&(h=q);for(e=this.BMAX;0!=e&&0==k[e];e--);var A=e;h>e&&(h=e);for(v=1<<q;q<e;q++,v<<=1)if(0>(v-=k[q])){this.status=2;this.m=h;return}if(0>(v-=k[e]))this.status=2,this.m=h;else{k[e]+=v;t[1]=q=0;w=k;D=1;for(m=2;0<--e;)t[m++]=q+=w[D++];w=a;e=D=0;do 0!=(q=w[D++])&&(r[t[q]++]=e);while(++e<b);b=t[A];t[0]=e=0;w=r;D=0;r=-1;var C=p[0]=0;
m=null;for(u=0;x<=A;x++)for(a=k[x];0<a--;){for(;x>C+p[1+r];){C+=p[1+r];r++;u=(u=A-C)>h?h:u;if((n=1<<(q=x-C))>a+1)for(n-=a+1,m=x;++q<u&&!((n<<=1)<=k[++m]);)n-=k[m];C+q>y&&C<y&&(q=y-C);u=1<<q;p[1+r]=q;m=Array(u);for(n=0;n<u;n++)m[n]=new l;L=null==L?this.root=new f:L.next=new f;L.next=null;L.list=m;I[r]=m;0<r&&(t[r]=e,B.b=p[r],B.e=16+q,B.t=m,q=(e&(1<<C)-1)>>C-p[r],I[r-1][q].e=B.e,I[r-1][q].b=B.b,I[r-1][q].n=B.n,I[r-1][q].t=B.t)}B.b=x-C;D>=b?B.e=99:w[D]<c?(B.e=256>w[D]?16:15,B.n=w[D++]):(B.e=d[w[D]-c],
B.n=g[w[D++]-c]);n=1<<x-C;for(q=e>>C;q<u;q+=n)m[q].e=B.e,m[q].b=B.b,m[q].n=B.n,m[q].t=B.t;for(q=1<<x-1;0!=(e&q);q>>=1)e^=q;for(e^=q;(e&(1<<C)-1)!=t[r];)C-=p[r],r--}this.m=p[1];this.status=0!=v&&1!=A?1:0}}}function h(a){for(;u<a;){var b=y;var c=O.length==P?-1:O[P++]&255;y=b|c<<u;u+=8}}function p(a){return y&W[a]}function n(a){y>>=a;u-=a}function a(a,b,c){var g,k;if(0==c)return 0;for(k=0;;){h(E);var d=H.list[p(E)];for(g=d.e;16<g;){if(99==g)return-1;n(d.b);g-=16;h(g);d=d.t[p(g)];g=d.e}n(d.b);if(16==
g)x&=32767,a[b+k++]=G[x++]=d.n;else{if(15==g)break;h(g);t=d.n+p(g);n(g);h(J);d=Q.list[p(J)];for(g=d.e;16<g;){if(99==g)return-1;n(d.b);g-=16;h(g);d=d.t[p(g)];g=d.e}n(d.b);h(g);K=x-d.n-p(g);for(n(g);0<t&&k<c;)t--,K&=32767,x&=32767,a[b+k++]=G[x++]=G[K++]}if(k==c)return c}v=-1;return k}function b(b,c,d){var g,k,f,l=Array(316);for(g=0;g<l.length;g++)l[g]=0;h(5);var r=257+p(5);n(5);h(5);var e=1+p(5);n(5);h(4);g=4+p(4);n(4);if(286<r||30<e)return-1;for(k=0;k<g;k++)h(3),l[R[k]]=p(3),n(3);for(;19>k;k++)l[R[k]]=
0;E=7;k=new m(l,19,19,null,null,E);if(0!=k.status)return-1;H=k.root;E=k.m;var q=r+e;for(g=f=0;g<q;){h(E);var t=H.list[p(E)];k=t.b;n(k);k=t.n;if(16>k)l[g++]=f=k;else if(16==k){h(2);k=3+p(2);n(2);if(g+k>q)return-1;for(;0<k--;)l[g++]=f}else{17==k?(h(3),k=3+p(3),n(3)):(h(7),k=11+p(7),n(7));if(g+k>q)return-1;for(;0<k--;)l[g++]=0;f=0}}E=9;k=new m(l,r,257,S,T,E);0==E&&(k.status=1);if(0!=k.status)return-1;H=k.root;E=k.m;for(g=0;g<e;g++)l[g]=l[g+r];J=6;k=new m(l,e,0,U,V,J);Q=k.root;J=k.m;return 0==J&&257<
r||0!=k.status?-1:a(b,c,d)}function c(c,d,f){var g;for(g=0;g<f&&(!F||-1!=v);){if(0<t){if(0!=v)for(;0<t&&g<f;)t--,K&=32767,x&=32767,c[d+g++]=G[x++]=G[K++];else{for(;0<t&&g<f;)t--,x&=32767,h(8),c[d+g++]=G[x++]=p(8),n(8);0==t&&(v=-1)}if(g==f)break}if(-1==v){if(F)break;h(1);0!=p(1)&&(F=!0);n(1);h(2);v=p(2);n(2);H=null;t=0}switch(v){case 0:var k=c,l=d+g,r=f-g;var z=u&7;n(z);h(16);z=p(16);n(16);h(16);if(z!=(~y&65535))z=-1;else{n(16);t=z;for(z=0;0<t&&z<r;)t--,x&=32767,h(8),k[l+z++]=G[x++]=p(8),n(8);0==t&&
(v=-1)}break;case 1:if(null!=H)z=a(c,d+g,f-g);else a:{var e;z=c;k=d+g;l=f-g;if(null==N){r=Array(288);for(e=0;144>e;e++)r[e]=8;for(;256>e;e++)r[e]=9;for(;280>e;e++)r[e]=7;for(;288>e;e++)r[e]=8;w=7;e=new m(r,288,257,S,T,w);if(0!=e.status){alert("HufBuild error: "+e.status);z=-1;break a}N=e.root;w=e.m;for(e=0;30>e;e++)r[e]=5;M=5;e=new m(r,30,0,U,V,M);if(1<e.status){N=null;alert("HufBuild error: "+e.status);z=-1;break a}A=e.root;M=e.m}H=N;Q=A;E=w;J=M;z=a(z,k,l)}break;case 2:z=null!=H?a(c,d+g,f-g):b(c,
d+g,f-g);break;default:z=-1}if(-1==z)return F?0:-1;g+=z}return g}function d(a){var b,d;null==G&&(G=Array(65536));u=y=x=0;v=-1;F=!1;t=K=0;H=null;O=a;P=0;var f=Array(1024);for(a=[];0<(b=c(f,0,f.length));)for(d=0;d<b;d++)a.push(f[d]);O=null;return a}var M,G,x,N=null,A,w,y,u,v,F,t,K,H,Q,E,J,O,P,W=[0,1,3,7,15,31,63,127,255,511,1023,2047,4095,8191,16383,32767,65535],S=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0],T=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,
4,4,4,5,5,5,5,0,99,99],U=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577],V=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],R=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];JSZip.compressions.DEFLATE?JSZip.compressions.DEFLATE.uncompress=d:JSZip.compressions.DEFLATE={magic:"\b\x00",uncompress:d}})();

/**
 * Extracts a MSFT Cabinet file.
 * 
 * @author Rhys Simpson
 */
class CabinetReader {
    constructor(startFile, outDir, onProgress, onEnd) {
        this.onProgress = onProgress;
        this.onEnd = onEnd;
        this.outDir = outDir;
        this.foldersMade = [];
        this.fileBuffer = null;
        this.fileIndex = 0;
        this.fileOffset = 0;
        this.dataLeftToFill = 0;
        this.prevData = null;
        this.continued = false;
        this.dc = [];
        this.ucp = [];
        this.dir = startFile.substring(0, startFile.lastIndexOf("/")+1);
        console.log(this.dir);
        this.uncompressed = null;
        this.cabsRead = 0;

        this.readCab(startFile);
    }

    /**
     * Converts to UINT8Array.
     * 
     * @param buf The buffer to convert.
     * @returns {ArrayBuffer}
     */
    static toArrayBuffer(buf) {
        const ab = new ArrayBuffer(buf.length);
        const view = new Uint8Array(ab);
        for (let i = 0; i < buf.length; ++i) {
            view[i] = buf[i];
        }
        return ab;
    }

    /**
     * Reads a cabinet file.
     *
     * @param file
     */
    readCab(file) {
        this.cabsRead++;

        let cab = {};

        cab.name = file;

        this.fileIndex = 0;
        this.dc = [];
        fs.readFile(file, (err, data) => {
            if(err) console.log(err);

            try {
                let read = 0;
                data = CabinetReader.toArrayBuffer(data);
                let view = new DataView(data);
                read += 4;
                cab.reserved1 = view.getUint32(read, true);
                read += 4;
                cab.size = view.getUint32(read, true);
                read += 4;
                cab.reserved2 = view.getUint32(read, true);
                read += 4;
                cab.offsetFiles = view.getUint32(read, true);
                read += 4;
                cab.reserved3 = view.getUint32(read, true);
                read += 4;
                cab.verMajor = view.getUint8(read++);
                cab.verMinor = view.getUint8(read++);
                cab.folderN = view.getUint16(read, true);
                read += 2;
                cab.fileN = view.getUint16(read, true);
                read += 2;
                cab.flags = view.getUint16(read, true);
                read += 2;
                cab.setID = view.getUint16(read, true);
                read += 2;
                cab.iCabinet = view.getUint16(read, true);
                read += 2;
                if (cab.flags & 0x0004) {
                    cab.cabResBytes = view.getUint16(read, true);
                    read += 2;
                    cab.folResBytes = view.getUint8(read++);
                    cab.dataResBytes = view.getUint8(read++);
                    let string = "";
                    for (let i=0; i<cab.cabResBytes; i++) {
                        string += String.fromCharCode(view.getUint8(read++));
                    }
                    cab.cabReserve = string;
                }
                if (cab.flags & 0x0001) {
                    let string = "";
                    while (view.getUint8(read) !== 0) {
                        string += String.fromCharCode(view.getUint8(read++));
                    }
                    cab.prevCab = string;
                    read++;
                    string = "";
                    while (view.getUint8(read) !== 0) {
                        string += String.fromCharCode(view.getUint8(read++));
                    }
                    cab.prevDisk = string;
                    read++
                }

                if (cab.flags & 0x0002) {
                    let string = "";
                    while (view.getUint8(read) !== 0) {
                        string += String.fromCharCode(view.getUint8(read++));
                    }
                    cab.nextCab = string;
                    read++;
                    string = "";
                    while (view.getUint8(read) !== 0) {
                        string += String.fromCharCode(view.getUint8(read++));
                    }
                    cab.nextDisk = string;
                    read++
                }

                cab.folders = [];

                for (let i=0; i<cab.folderN; i++) {
                    if (!(this.continued) || (i !== 0)) this.ucp[i] = 0;
                    this.dc[i] = 0;
                    let f = {};
                    f.cfOffset = view.getUint32(read, true);
                    read += 4;
                    f.cfBlocks = view.getUint16(read, true);
                    read += 2;
                    f.typeCompress = view.getUint16(read, true);
                    read += 2;

                    if (cab.flags & 0x0004) {
                        let string = "";
                        for (let i=0; i<cab.folResBytes; i++) {
                            string += String.fromCharCode(view.getUint8(read++));
                        }
                        cab.folReserve = string;
                    }
                    cab.folders.push(f);
                    const tempread = read;
                    read = f.cfOffset;
                    f.chunks = [];
                    const uncompData = [];
                    const totalBytes = 0;
                    for (let j=0; j<f.cfBlocks; j++) {
                        const c = {};
                        read += 4;
                        c.cBytes = view.getUint16(read, true);
                        read += 2;
                        c.ucBytes = view.getUint16(read, true);
                        read += 2;
                        c.offset = read;
                        read += c.cBytes;
                        f.chunks.push(c)
                    }
                    const buf = new ArrayBuffer(totalBytes);
                    const offset = 0;
                    for (let j=0; j<uncompData.length; j++) {
                        const temp = new Uint8Array(buf, offset, uncompData[j].length);
                        temp.set(uncompData[j])

                    }
                    f.uncompData = new Uint8Array(buf);
                    read = tempread;
                }

                read = cab.offsetFiles;
                cab.files = [];
                for (let i=0; i<cab.fileN; i++) {
                    let f = {};
                    f.uSize = view.getUint32(read, true);
                    read += 4;
                    f.uOff = view.getUint32(read, true);
                    read += 4;
                    f.iFolder = view.getUint16(read, true);
                    read += 2;
                    read += 6;
                    let string = "";
                    while (view.getUint8(read) !== 0) {
                        string += String.fromCharCode(view.getUint8(read++));
                    }
                    read++;
                    f.name = string;
                    f.name = f.name.replace(/\\/g, "/");
                    cab.files.push(f);
                }
                this.extractNextFile(cab, data);
            } catch(err) {
                this.onEnd(file)
            }
        })
    }

    /**
     * Extracts the next cabinet file.
     * 
     * @param {any} cab 
     * @param {any} data 
     * @returns 
     * @memberof CabinetReader
     */
    extractNextFile(cab, data)
    {
        const file = cab.files[this.fileIndex];
        this.onProgress({read: this.cabsRead, curFile: file.name});
        const ofi = this.fileIndex;
        this.fileIndex = (this.fileIndex + 1)%cab.fileN;
        let folder = file.iFolder;
        if (folder === 0xFFFD || folder === 0xFFFF) folder = 0;
        else if (folder === 0xFFFE) folder = cab.folderN-1;
        const chunks = cab.folders[folder].chunks;
        if ((!(file.iFolder === 0xFFFD || file.iFolder === 0xFFFF)) || (ofi !== 0)) {
            this.fileOffset = 0;
            this.fileBuffer = new ArrayBuffer(file.uSize);
            this.dataLeftToFill = file.uSize;

            if (file.uOff < this.ucp[folder]) {
                const pos = this.uncompressed.length - (this.ucp[folder] - file.uOff);
                let toCopy = Math.min(this.ucp[folder]-file.uOff, this.dataLeftToFill);
                new Uint8Array(this.fileBuffer, this.fileOffset, toCopy).set(this.uncompressed.subarray(pos, pos+toCopy));
                this.fileOffset += toCopy;

                this.dataLeftToFill -= toCopy;
            } else if (file.uOff > this.ucp[folder]) {
                console.log('Not implemented')
            }

        } else {

            let chunk = chunks[0];
            let view = new Uint8Array(data, chunk.offset, chunk.cBytes);
            const comb = new Uint8Array(view.length + this.prevData.length);
            comb.set(this.prevData);
            comb.subarray(this.prevData.length).set(view);
            this.uncompressed = CabinetReader.MSZipDecomp(comb, chunk.ucBytes);
            let toCopy = Math.min(this.uncompressed.length, this.dataLeftToFill);
            new Uint8Array(this.fileBuffer, this.fileOffset, toCopy).set(this.uncompressed.subarray(0, toCopy));
            this.ucp[folder] += this.uncompressed.length;
            this.fileOffset += toCopy;
            this.dataLeftToFill -= toCopy;
            this.dc[folder] = 1;
        }

        while (this.dc[folder] < chunks.length && this.dataLeftToFill !== 0) {
            let chunk = chunks[this.dc[folder]++];
            let view = new Uint8Array(data, chunk.offset, chunk.cBytes);
            if (chunk.ucBytes !== 0)	{
                this.uncompressed = CabinetReader.MSZipDecomp(view, chunk.ucBytes);
                let toCopy = Math.min(this.uncompressed.length, this.dataLeftToFill);
                new Uint8Array(this.fileBuffer, this.fileOffset, toCopy).set(this.uncompressed.subarray(0, toCopy));
                this.ucp[folder] += this.uncompressed.length;
                this.fileOffset += toCopy;
                this.dataLeftToFill -= toCopy;
            } else {
                this.prevData = view;
                this.continued = true;
                this.ucp[0] = this.ucp[folder];
                if(this.cabsRead-1!==0)
                    fs.unlink(this.dir + 'Data' + (this.cabsRead-1) + '.cab', () => {});
                this.readCab(this.dir+cab.nextCab);
                return;
            }
        }

        if (this.dataLeftToFill === 0) {
            this.setupDir(file.name, err => {
            	if(err) console.log(err);
                fs.writeFile(this.outDir + '/' + file.name, new Buffer(this.fileBuffer), () => {
                    console.log("wrote "+file.name);
                    if (this.fileIndex !== 0) this.extractNextFile(cab, data);
                    else {
                        if (cab.nextCab) {
                            this.continued = false;
                            console.log(this.dir+cab.nextCab);
                            if(this.cabsRead-1!==0)
                                fs.unlink(this.dir + 'Data' + (this.cabsRead-1) + '.cab', () => {});

                            this.readCab(this.dir+cab.nextCab);
                        } else {
                            if(this.cabsRead===1114) {
                                fs.unlink(this.dir + 'Data1113.cab', () => {});
                                fs.unlink(this.dir + 'Data1114.cab', () => {});
                            }
                            this.onEnd();
                        }
                    }
                })
            });
        } else {
            this.continued = false;
            console.log(this.dir+cab.nextCab);
            console.log(this.dc[folder]);
            if(this.cabsRead-1!==0)
                fs.unlink(this.dir + 'Data' + (this.cabsRead-1) + '.cab', () => {});
            this.readCab(this.dir+cab.nextCab);
        }
    }

    /**
     * Decompresses data using JSZip.
     * 
     * @deprecated Should use another library.
     * @static
     * @param {any} data 
     * @param {any} uncompSize 
     * @returns 
     * @memberof CabinetReader
     */
    static MSZipDecomp(data, uncompSize) {
        if (!((data[0] === 0x43) && (data[1] === 0x4B))) console.log("MSZIP fail");
        const temp = JSZip.compressions["DEFLATE"].uncompress(data.subarray(2));
        const buf = new ArrayBuffer(temp.length);
        const view = new Uint8Array(buf);
        view.set(temp);
        return view;
    }

    /**
     * Sets up the directory where the files will be extracted to.
     * 
     * @param {any} file The file to create the folder of.
     * @param {any} callback What to do after.
     * @returns 
     * @memberof CabinetReader
     */
    setupDir(file, callback) {
        const mkdirp = require('mkdirp');
        let dir = file.substring(0, file.lastIndexOf("/")+1);
        dir = this.outDir + '/' + dir;
        if (this.foldersMade.indexOf(dir) === -1) {
            this.foldersMade.push(dir);
            console.log("making dir "+dir);
            mkdirp(dir, callback);
            return;
        }

        callback();
    }
}

module.exports = CabinetReader;
