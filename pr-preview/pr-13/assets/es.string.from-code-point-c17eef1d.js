var s=Object.defineProperty;var n=(t,a)=>s(t,"name",{value:a,configurable:!0});import{X as f,a2 as g,ah as m}from"./iframe-63656d98.js";var u=f,C=g,h=m,x=RangeError,i=String.fromCharCode,v=String.fromCodePoint,l=C([].join),c=!!v&&v.length!=1;u({target:"String",stat:!0,arity:1,forced:c},{fromCodePoint:n(function(a){for(var e=[],d=arguments.length,o=0,r;d>o;){if(r=+arguments[o++],h(r,1114111)!==r)throw x(r+" is not a valid code point");e[o]=r<65536?i(r):i(((r-=65536)>>10)+55296,r%1024+56320)}return l(e,"")},"fromCodePoint")});
//# sourceMappingURL=es.string.from-code-point-c17eef1d.js.map
