var O=Object.defineProperty;var f=(a,i)=>O(a,"name",{value:i,configurable:!0});import{aI as R,aH as S,ai as m,X as E,a2 as F,ao as N,aL as T}from"./iframe-aec2f093.js";var j=m,C=R,q=S,D=RangeError,V=f(function(i){var r=C(q(this)),e="",t=j(i);if(t<0||t==1/0)throw D("Wrong number of repetitions");for(;t>0;(t>>>=1)&&(r+=r))t&1&&(e+=r);return e},"repeat"),k=E,d=F,z=m,H=T,L=V,w=N,M=RangeError,x=String,y=Math.floor,p=d(L),b=d("".slice),g=d(1 .toFixed),s=f(function(a,i,r){return i===0?r:i%2===1?s(a,i-1,r*a):s(a*a,i/2,r)},"pow"),U=f(function(a){for(var i=0,r=a;r>=4096;)i+=12,r/=4096;for(;r>=2;)i+=1,r/=2;return i},"log"),u=f(function(a,i,r){for(var e=-1,t=r;++e<6;)t+=i*a[e],a[e]=t%1e7,t=y(t/1e7)},"multiply"),$=f(function(a,i){for(var r=6,e=0;--r>=0;)e+=a[r],a[r]=y(e/i),e=e%i*1e7},"divide"),I=f(function(a){for(var i=6,r="";--i>=0;)if(r!==""||i===0||a[i]!==0){var e=x(a[i]);r=r===""?e:r+p("0",7-e.length)+e}return r},"dataToString"),W=w(function(){return g(8e-5,3)!=="0.000"||g(.9,0)!=="1"||g(1.255,2)!=="1.25"||g(0xde0b6b3a7640080,0)!=="1000000000000000128"})||!w(function(){g({})});k({target:"Number",proto:!0,forced:W},{toFixed:f(function(i){var r=H(this),e=z(i),t=[0,0,0,0,0,0],h="",n="0",o,c,v,l;if(e<0||e>20)throw M("Incorrect fraction digits");if(r!=r)return"NaN";if(r<=-1e21||r>=1e21)return x(r);if(r<0&&(h="-",r=-r),r>1e-21)if(o=U(r*s(2,69,1))-69,c=o<0?r*s(2,-o,1):r/s(2,o,1),c*=4503599627370496,o=52-o,o>0){for(u(t,0,c),v=e;v>=7;)u(t,1e7,0),v-=7;for(u(t,s(10,v,1),0),v=o-1;v>=23;)$(t,1<<23),v-=23;$(t,1<<v),u(t,1,1),$(t,2),n=I(t)}else u(t,0,c),u(t,1<<-o,0),n=I(t)+p("0",e);return e>0?(l=n.length,n=h+(l<=e?"0."+p("0",e-l)+n:b(n,0,l-e)+"."+b(n,l-e))):n=h+n,n},"toFixed")});export{V as s};
//# sourceMappingURL=es.number.to-fixed-d78ab5d2.js.map
