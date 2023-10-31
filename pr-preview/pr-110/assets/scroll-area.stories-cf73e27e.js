import{a as e,j as S}from"./jsx-runtime-03b4ddbf.js";import{v as l}from"./base.css-05c6c12e.js";/* empty css                              */import{S as g}from"./index-65924874.js";import"./index-76fb7be0.js";import"./_commonjsHelpers-de833af9.js";import"./extends-98964cd2.js";import"./index-b86e5f49.js";import"./index-d3ea75b5.js";var o=function(r){for(var n=arguments.length,t=new Array(n>1?n-1:0),a=1;a<n;a++)t[a-1]=arguments[a];return t.map(j=>"".concat(j)).join(" ".concat(r," ")).replace(/calc/g,"")},u=function(){for(var r=arguments.length,n=new Array(r),t=0;t<r;t++)n[t]=arguments[t];return"calc(".concat(o("+",...n),")")},m=function(){for(var r=arguments.length,n=new Array(r),t=0;t<r;t++)n[t]=arguments[t];return"calc(".concat(o("-",...n),")")},h=function(){for(var r=arguments.length,n=new Array(r),t=0;t<r;t++)n[t]=arguments[t];return"calc(".concat(o("*",...n),")")},v=function(){for(var r=arguments.length,n=new Array(r),t=0;t<r;t++)n[t]=arguments[t];return"calc(".concat(o("/",...n),")")},p=i=>h(i,-1),s=Object.assign(i=>({add:function(){for(var n=arguments.length,t=new Array(n),a=0;a<n;a++)t[a]=arguments[a];return s(u(i,...t))},subtract:function(){for(var n=arguments.length,t=new Array(n),a=0;a<n;a++)t[a]=arguments[a];return s(m(i,...t))},multiply:function(){for(var n=arguments.length,t=new Array(n),a=0;a<n;a++)t[a]=arguments[a];return s(h(i,...t))},divide:function(){for(var n=arguments.length,t=new Array(n),a=0;a<n;a++)t[a]=arguments[a];return s(v(i,...t))},negate:()=>s(p(i)),toString:()=>i.toString()}),{add:u,subtract:m,multiply:h,divide:v,negate:p});const F={title:"components/ScrollArea",component:g},d=()=>e("div",{style:{width:500},children:e(g,{orientation:"horizontal",children:S("div",{style:{display:"flex",gap:l.space.md},children:[e("div",{style:{width:160,height:160,background:l.pallets.text.main}}),e("div",{style:{width:160,height:160,background:l.pallets.text.main}}),e("div",{style:{width:160,height:160,background:l.pallets.text.main}}),e("div",{style:{width:160,height:160,background:l.pallets.text.main}}),e("div",{style:{width:160,height:160,background:l.pallets.text.main}})]})})}),c=()=>e("div",{style:{height:500,width:s.add("160px",s.multiply(l.space.sm,2))},children:e(g,{orientation:"vertical",children:S("div",{style:{display:"flex",flexDirection:"column",gap:l.space.md},children:[e("div",{style:{width:160,height:160,background:l.pallets.text.main}}),e("div",{style:{width:160,height:160,background:l.pallets.text.main}}),e("div",{style:{width:160,height:160,background:l.pallets.text.main}}),e("div",{style:{width:160,height:160,background:l.pallets.text.main}}),e("div",{style:{width:160,height:160,background:l.pallets.text.main}})]})})});var w,x,f;d.parameters={...d.parameters,docs:{...(w=d.parameters)==null?void 0:w.docs,source:{originalSource:`() => {
  return <div style={{
    width: 500
  }}>
      <ScrollArea orientation="horizontal">
        <div style={{
        display: "flex",
        gap: vars.space.md
      }}>
          <div style={{
          width: 160,
          height: 160,
          background: vars.pallets.text.main
        }} />
          <div style={{
          width: 160,
          height: 160,
          background: vars.pallets.text.main
        }} />
          <div style={{
          width: 160,
          height: 160,
          background: vars.pallets.text.main
        }} />
          <div style={{
          width: 160,
          height: 160,
          background: vars.pallets.text.main
        }} />
          <div style={{
          width: 160,
          height: 160,
          background: vars.pallets.text.main
        }} />
        </div>
      </ScrollArea>
    </div>;
}`,...(f=(x=d.parameters)==null?void 0:x.docs)==null?void 0:f.source}}};var b,y,A;c.parameters={...c.parameters,docs:{...(b=c.parameters)==null?void 0:b.docs,source:{originalSource:`() => {
  return <div style={{
    height: 500,
    width: calc.add("160px", calc.multiply(vars.space.sm, 2))
  }}>
      <ScrollArea orientation="vertical">
        <div style={{
        display: "flex",
        flexDirection: "column",
        gap: vars.space.md
      }}>
          <div style={{
          width: 160,
          height: 160,
          background: vars.pallets.text.main
        }} />
          <div style={{
          width: 160,
          height: 160,
          background: vars.pallets.text.main
        }} />
          <div style={{
          width: 160,
          height: 160,
          background: vars.pallets.text.main
        }} />
          <div style={{
          width: 160,
          height: 160,
          background: vars.pallets.text.main
        }} />
          <div style={{
          width: 160,
          height: 160,
          background: vars.pallets.text.main
        }} />
        </div>
      </ScrollArea>
    </div>;
}`,...(A=(y=c.parameters)==null?void 0:y.docs)==null?void 0:A.source}}};const G=["Horizontal","Vertical"];export{d as Horizontal,c as Vertical,G as __namedExportsOrder,F as default};
//# sourceMappingURL=scroll-area.stories-cf73e27e.js.map
