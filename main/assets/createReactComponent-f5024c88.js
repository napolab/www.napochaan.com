var w=Object.defineProperty;var n=(e,r)=>w(e,"name",{value:r,configurable:!0});import{r as c,a as y}from"./index-9aab58ca.js";import{g as C,$ as _}from"./index-a0393411.js";import{P as f}from"./index-6765c009.js";const k=y["useId".toString()]||(()=>{});let S=0;function A(e){const[r,o]=c.useState(k());return C(()=>{e||o(t=>t??String(S++))},[e]),e||(r?`radix-${r}`:"")}n(A,"$1746a345f3d73bb7$export$f680877a34711e37");function B({prop:e,defaultProp:r,onChange:o=n(()=>{},"onChange")}){const[t,a]=x({defaultProp:r,onChange:o}),s=e!==void 0,i=s?e:t,u=_(o),p=c.useCallback(l=>{if(s){const d=typeof l=="function"?l(e):l;d!==e&&u(d)}else a(l)},[s,e,a,u]);return[i,p]}n(B,"$71cd76cc60e0454e$export$6f32135080cb4c3");function x({defaultProp:e,onChange:r}){const o=c.useState(e),[t]=o,a=c.useRef(t),s=_(r);return c.useEffect(()=>{a.current!==t&&(s(t),a.current=t)},[t,a,s]),o}n(x,"$71cd76cc60e0454e$var$useUncontrolledState");var R={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"},j=Object.defineProperty,E=Object.defineProperties,T=Object.getOwnPropertyDescriptors,v=Object.getOwnPropertySymbols,m=Object.prototype.hasOwnProperty,h=Object.prototype.propertyIsEnumerable,b=n((e,r,o)=>r in e?j(e,r,{enumerable:!0,configurable:!0,writable:!0,value:o}):e[r]=o,"__defNormalProp"),g=n((e,r)=>{for(var o in r||(r={}))m.call(r,o)&&b(e,o,r[o]);if(v)for(var o of v(r))h.call(r,o)&&b(e,o,r[o]);return e},"__spreadValues"),z=n((e,r)=>E(e,T(r)),"__spreadProps"),N=n((e,r)=>{var o={};for(var t in e)m.call(e,t)&&r.indexOf(t)<0&&(o[t]=e[t]);if(e!=null&&v)for(var t of v(e))r.indexOf(t)<0&&h.call(e,t)&&(o[t]=e[t]);return o},"__objRest"),I=n((e,r,o)=>{const t=c.forwardRef((a,s)=>{var i=a,{color:u="currentColor",size:p=24,stroke:l=2,children:$}=i,d=N(i,["color","size","stroke","children"]);return c.createElement("svg",g(z(g({ref:s},R),{width:p,height:p,stroke:u,strokeWidth:l,className:`tabler-icon tabler-icon-${e}`}),d),[...o.map(([P,O])=>c.createElement(P,O)),...$||[]])});return t.propTypes={color:f.string,size:f.oneOfType([f.string,f.number]),stroke:f.oneOfType([f.string,f.number])},t.displayName=`${r}`,t},"createReactComponent");export{B as $,A as a,I as c};
//# sourceMappingURL=createReactComponent-f5024c88.js.map
