var w=Object.defineProperty;var l=(n,i)=>w(n,"name",{value:i,configurable:!0});import{j as e,a as p}from"./jsx-runtime-63255f68.js";import{v as c}from"./base.css-05c6c12e.js";/* empty css                              */import{S as u}from"./index-ce0b001c.js";import"./index-2e0ef46d.js";import"./iframe-28b35100.js";import"./index-9b21b1fe.js";import"./index-1e6a67dc.js";var s=l(function(i){for(var r=arguments.length,t=new Array(r>1?r-1:0),a=1;a<r;a++)t[a-1]=arguments[a];return t.map(f=>"".concat(f)).join(" ".concat(i," ")).replace(/calc/g,"")},"toExpression"),g=l(function(){for(var i=arguments.length,r=new Array(i),t=0;t<i;t++)r[t]=arguments[t];return"calc(".concat(s("+",...r),")")},"add"),m=l(function(){for(var i=arguments.length,r=new Array(i),t=0;t<i;t++)r[t]=arguments[t];return"calc(".concat(s("-",...r),")")},"subtract"),d=l(function(){for(var i=arguments.length,r=new Array(i),t=0;t<i;t++)r[t]=arguments[t];return"calc(".concat(s("*",...r),")")},"multiply"),h=l(function(){for(var i=arguments.length,r=new Array(i),t=0;t<i;t++)r[t]=arguments[t];return"calc(".concat(s("/",...r),")")},"divide"),v=l(n=>d(n,-1),"_negate"),o=Object.assign(n=>({add:l(function(){for(var r=arguments.length,t=new Array(r),a=0;a<r;a++)t[a]=arguments[a];return o(g(n,...t))},"add"),subtract:l(function(){for(var r=arguments.length,t=new Array(r),a=0;a<r;a++)t[a]=arguments[a];return o(m(n,...t))},"subtract"),multiply:l(function(){for(var r=arguments.length,t=new Array(r),a=0;a<r;a++)t[a]=arguments[a];return o(d(n,...t))},"multiply"),divide:l(function(){for(var r=arguments.length,t=new Array(r),a=0;a<r;a++)t[a]=arguments[a];return o(h(n,...t))},"divide"),negate:()=>o(v(n)),toString:()=>n.toString()}),{add:g,subtract:m,multiply:d,divide:h,negate:v});const O={title:"components/ScrollArea",component:u},V=l(()=>e("div",{style:{width:500},children:e(u,{orientation:"horizontal",children:p("div",{style:{display:"flex",gap:c.space.md},children:[e("div",{style:{width:160,height:160,background:c.pallets.text.main}}),e("div",{style:{width:160,height:160,background:c.pallets.text.main}}),e("div",{style:{width:160,height:160,background:c.pallets.text.main}}),e("div",{style:{width:160,height:160,background:c.pallets.text.main}}),e("div",{style:{width:160,height:160,background:c.pallets.text.main}})]})})}),"Horizontal"),D=l(()=>e("div",{style:{height:500,width:o.add("160px",o.multiply(c.space.sm,2))},children:e(u,{orientation:"vertical",children:p("div",{style:{display:"flex",flexDirection:"column",gap:c.space.md},children:[e("div",{style:{width:160,height:160,background:c.pallets.text.main}}),e("div",{style:{width:160,height:160,background:c.pallets.text.main}}),e("div",{style:{width:160,height:160,background:c.pallets.text.main}}),e("div",{style:{width:160,height:160,background:c.pallets.text.main}}),e("div",{style:{width:160,height:160,background:c.pallets.text.main}})]})})}),"Vertical"),q=["Horizontal","Vertical"];export{V as Horizontal,D as Vertical,q as __namedExportsOrder,O as default};
//# sourceMappingURL=scroll-area.stories-09200f54.js.map
