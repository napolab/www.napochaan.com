var w=Object.defineProperty;var n=(e,r)=>w(e,"name",{value:r,configurable:!0});import{r as c,a as y}from"./index-b7196990.js";import{g as C,$ as _}from"./index.module-4753c99f.js";import{p as f}from"./index-50ee27ec.js";const k=y["useId".toString()]||(()=>{});let x=0;function A(e){const[r,o]=c.useState(k());return C(()=>{e||o(t=>t??String(x++))},[e]),e||(r?`radix-${r}`:"")}n(A,"$1746a345f3d73bb7$export$f680877a34711e37");function B({prop:e,defaultProp:r,onChange:o=n(()=>{},"onChange")}){const[t,a]=S({defaultProp:r,onChange:o}),s=e!==void 0,i=s?e:t,p=_(o),u=c.useCallback(l=>{if(s){const d=typeof l=="function"?l(e):l;d!==e&&p(d)}else a(l)},[s,e,a,p]);return[i,u]}n(B,"$71cd76cc60e0454e$export$6f32135080cb4c3");function S({defaultProp:e,onChange:r}){const o=c.useState(e),[t]=o,a=c.useRef(t),s=_(r);return c.useEffect(()=>{a.current!==t&&(s(t),a.current=t)},[t,a,s]),o}n(S,"$71cd76cc60e0454e$var$useUncontrolledState");var E={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"},R=Object.defineProperty,j=Object.defineProperties,T=Object.getOwnPropertyDescriptors,v=Object.getOwnPropertySymbols,m=Object.prototype.hasOwnProperty,h=Object.prototype.propertyIsEnumerable,b=n((e,r,o)=>r in e?R(e,r,{enumerable:!0,configurable:!0,writable:!0,value:o}):e[r]=o,"__defNormalProp"),g=n((e,r)=>{for(var o in r||(r={}))m.call(r,o)&&b(e,o,r[o]);if(v)for(var o of v(r))h.call(r,o)&&b(e,o,r[o]);return e},"__spreadValues"),z=n((e,r)=>j(e,T(r)),"__spreadProps"),N=n((e,r)=>{var o={};for(var t in e)m.call(e,t)&&r.indexOf(t)<0&&(o[t]=e[t]);if(e!=null&&v)for(var t of v(e))r.indexOf(t)<0&&h.call(e,t)&&(o[t]=e[t]);return o},"__objRest"),I=n((e,r,o)=>{const t=c.forwardRef((a,s)=>{var i=a,{color:p="currentColor",size:u=24,stroke:l=2,children:$}=i,d=N(i,["color","size","stroke","children"]);return c.createElement("svg",g(z(g({ref:s},E),{width:u,height:u,stroke:p,strokeWidth:l,className:`tabler-icon tabler-icon-${e}`}),d),[...o.map(([P,O])=>c.createElement(P,O)),...$||[]])});return t.propTypes={color:f.string,size:f.oneOfType([f.string,f.number]),stroke:f.oneOfType([f.string,f.number])},t.displayName=`${r}`,t},"createReactComponent");export{B as $,A as a,I as c};
//# sourceMappingURL=createReactComponent-ee2a1a5e.js.map