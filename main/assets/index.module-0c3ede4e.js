var S=Object.defineProperty;var c=(e,n)=>S(e,"name",{value:n,configurable:!0});import{r}from"./index-b4738ec8.js";import{r as P}from"./index-65e90d17.js";function B(e,n,{checkForDefaultPrevented:t=!0}={}){return c(function(s){if(e==null||e(s),t===!1||!s.defaultPrevented)return n==null?void 0:n(s)},"handleEvent")}c(B,"$e42e1063c40fb3ef$export$b9ecd428b558ff10");function w(e,n){typeof e=="function"?e(n):e!=null&&(e.current=n)}c(w,"$6ed0406888f73fc4$var$setRef");function C(...e){return n=>e.forEach(t=>w(t,n))}c(C,"$6ed0406888f73fc4$export$43e446d32b3d21af");function T(...e){return r.useCallback(C(...e),e)}c(T,"$6ed0406888f73fc4$export$c7b2cbe3552a0d05");function F(e,n=[]){let t=[];function o(i,l){const f=r.createContext(l),a=t.length;t=[...t,l];function $(d){const{scope:u,children:b,...p}=d,g=(u==null?void 0:u[e][a])||f,y=r.useMemo(()=>p,Object.values(p));return r.createElement(g.Provider,{value:y},b)}c($,"Provider");function x(d,u){const b=(u==null?void 0:u[e][a])||f,p=r.useContext(b);if(p)return p;if(l!==void 0)return l;throw new Error(`\`${d}\` must be used within \`${i}\``)}return c(x,"useContext"),$.displayName=i+"Provider",[$,x]}c(o,"$c512c27ab02ef895$export$fd42f52fd3ae1109");const s=c(()=>{const i=t.map(l=>r.createContext(l));return c(function(f){const a=(f==null?void 0:f[e])||i;return r.useMemo(()=>({[`__scope${e}`]:{...f,[e]:a}}),[f,a])},"useScope")},"createScope");return s.scopeName=e,[o,O(s,...n)]}c(F,"$c512c27ab02ef895$export$50c7b4e9d9f19c1");function O(...e){const n=e[0];if(e.length===1)return n;const t=c(()=>{const o=e.map(s=>({useScope:s(),scopeName:s.scopeName}));return c(function(i){const l=o.reduce((f,{useScope:a,scopeName:$})=>{const d=a(i)[`__scope${$}`];return{...f,...d}},{});return r.useMemo(()=>({[`__scope${n.scopeName}`]:l}),[l])},"useComposedScopes")},"createScope1");return t.scopeName=n.scopeName,t}c(O,"$c512c27ab02ef895$var$composeContextScopes");const L=Boolean(globalThis==null?void 0:globalThis.document)?r.useLayoutEffect:()=>{};function Z(e){const n=r.useRef(e);return r.useEffect(()=>{n.current=e}),r.useMemo(()=>(...t)=>{var o;return(o=n.current)===null||o===void 0?void 0:o.call(n,...t)},[])}c(Z,"$b1b2314f5f9a1d84$export$25bec8c6f54ee79a");function h(){return h=Object.assign?Object.assign.bind():function(e){for(var n=1;n<arguments.length;n++){var t=arguments[n];for(var o in t)Object.prototype.hasOwnProperty.call(t,o)&&(e[o]=t[o])}return e},h.apply(this,arguments)}c(h,"_extends$1");function m(){return m=Object.assign?Object.assign.bind():function(e){for(var n=1;n<arguments.length;n++){var t=arguments[n];for(var o in t)Object.prototype.hasOwnProperty.call(t,o)&&(e[o]=t[o])}return e},m.apply(this,arguments)}c(m,"_extends");const E=r.forwardRef((e,n)=>{const{children:t,...o}=e,s=r.Children.toArray(t),i=s.find(_);if(i){const l=i.props.children,f=s.map(a=>a===i?r.Children.count(l)>1?r.Children.only(null):r.isValidElement(l)?l.props.children:null:a);return r.createElement(v,m({},o,{ref:n}),r.isValidElement(l)?r.cloneElement(l,void 0,f):null)}return r.createElement(v,m({},o,{ref:n}),t)});E.displayName="Slot";const v=r.forwardRef((e,n)=>{const{children:t,...o}=e;return r.isValidElement(t)?r.cloneElement(t,{...j(o,t.props),ref:C(n,t.ref)}):r.Children.count(t)>1?r.Children.only(null):null});v.displayName="SlotClone";const N=c(({children:e})=>r.createElement(r.Fragment,null,e),"$5e63c961fc1ce211$export$d9f1ccf0bdb05d45");function _(e){return r.isValidElement(e)&&e.type===N}c(_,"$5e63c961fc1ce211$var$isSlottable");function j(e,n){const t={...n};for(const o in n){const s=e[o],i=n[o];/^on[A-Z]/.test(o)?s&&i?t[o]=(...f)=>{i(...f),s(...f)}:s&&(t[o]=s):o==="style"?t[o]={...s,...i}:o==="className"&&(t[o]=[s,i].filter(Boolean).join(" "))}return{...e,...t}}c(j,"$5e63c961fc1ce211$var$mergeProps");const R=["a","button","div","form","h2","h3","img","input","label","li","nav","ol","p","span","svg","ul"],k=R.reduce((e,n)=>{const t=r.forwardRef((o,s)=>{const{asChild:i,...l}=o,f=i?E:n;return r.useEffect(()=>{window[Symbol.for("radix-ui")]=!0},[]),r.createElement(f,h({},l,{ref:s}))});return t.displayName=`Primitive.${n}`,{...e,[n]:t}},{});function q(e,n){e&&P.flushSync(()=>e.dispatchEvent(n))}c(q,"$8927f6f2acc4f386$export$6d1a0317bde7de7f");const V=r.createContext(void 0);function z(e){const n=r.useContext(V);return e||n||"ltr"}c(z,"$f631663db3294ace$export$b39126d51d94e6f3");export{Z as $,T as a,k as b,B as c,q as d,F as e,E as f,L as g,z as h};
//# sourceMappingURL=index.module-0c3ede4e.js.map
