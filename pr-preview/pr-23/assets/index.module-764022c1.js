var S=Object.defineProperty;var s=(e,n)=>S(e,"name",{value:n,configurable:!0});import{r as o}from"./index-3534c567.js";import{r as P}from"./index-491e85f6.js";function B(e,n,{checkForDefaultPrevented:t=!0}={}){return s(function(c){if(e==null||e(c),t===!1||!c.defaultPrevented)return n==null?void 0:n(c)},"handleEvent")}s(B,"$e42e1063c40fb3ef$export$b9ecd428b558ff10");function w(e,n){typeof e=="function"?e(n):e!=null&&(e.current=n)}s(w,"$6ed0406888f73fc4$var$setRef");function C(...e){return n=>e.forEach(t=>w(t,n))}s(C,"$6ed0406888f73fc4$export$43e446d32b3d21af");function D(...e){return o.useCallback(C(...e),e)}s(D,"$6ed0406888f73fc4$export$c7b2cbe3552a0d05");function T(e,n=[]){let t=[];function r(i,l){const f=o.createContext(l),a=t.length;t=[...t,l];function $(d){const{scope:u,children:b,...p}=d,g=(u==null?void 0:u[e][a])||f,y=o.useMemo(()=>p,Object.values(p));return o.createElement(g.Provider,{value:y},b)}s($,"Provider");function x(d,u){const b=(u==null?void 0:u[e][a])||f,p=o.useContext(b);if(p)return p;if(l!==void 0)return l;throw new Error(`\`${d}\` must be used within \`${i}\``)}return s(x,"useContext"),$.displayName=i+"Provider",[$,x]}s(r,"$c512c27ab02ef895$export$fd42f52fd3ae1109");const c=s(()=>{const i=t.map(l=>o.createContext(l));return s(function(f){const a=(f==null?void 0:f[e])||i;return o.useMemo(()=>({[`__scope${e}`]:{...f,[e]:a}}),[f,a])},"useScope")},"createScope");return c.scopeName=e,[r,O(c,...n)]}s(T,"$c512c27ab02ef895$export$50c7b4e9d9f19c1");function O(...e){const n=e[0];if(e.length===1)return n;const t=s(()=>{const r=e.map(c=>({useScope:c(),scopeName:c.scopeName}));return s(function(i){const l=r.reduce((f,{useScope:a,scopeName:$})=>{const d=a(i)[`__scope${$}`];return{...f,...d}},{});return o.useMemo(()=>({[`__scope${n.scopeName}`]:l}),[l])},"useComposedScopes")},"createScope1");return t.scopeName=n.scopeName,t}s(O,"$c512c27ab02ef895$var$composeContextScopes");const F=Boolean(globalThis==null?void 0:globalThis.document)?o.useLayoutEffect:()=>{};function L(e){const n=o.useRef(e);return o.useEffect(()=>{n.current=e}),o.useMemo(()=>(...t)=>{var r;return(r=n.current)===null||r===void 0?void 0:r.call(n,...t)},[])}s(L,"$b1b2314f5f9a1d84$export$25bec8c6f54ee79a");function h(){return h=Object.assign?Object.assign.bind():function(e){for(var n=1;n<arguments.length;n++){var t=arguments[n];for(var r in t)Object.prototype.hasOwnProperty.call(t,r)&&(e[r]=t[r])}return e},h.apply(this,arguments)}s(h,"_extends$1");function m(){return m=Object.assign?Object.assign.bind():function(e){for(var n=1;n<arguments.length;n++){var t=arguments[n];for(var r in t)Object.prototype.hasOwnProperty.call(t,r)&&(e[r]=t[r])}return e},m.apply(this,arguments)}s(m,"_extends");const E=o.forwardRef((e,n)=>{const{children:t,...r}=e,c=o.Children.toArray(t),i=c.find(_);if(i){const l=i.props.children,f=c.map(a=>a===i?o.Children.count(l)>1?o.Children.only(null):o.isValidElement(l)?l.props.children:null:a);return o.createElement(v,m({},r,{ref:n}),o.isValidElement(l)?o.cloneElement(l,void 0,f):null)}return o.createElement(v,m({},r,{ref:n}),t)});E.displayName="Slot";const v=o.forwardRef((e,n)=>{const{children:t,...r}=e;return o.isValidElement(t)?o.cloneElement(t,{...j(r,t.props),ref:C(n,t.ref)}):o.Children.count(t)>1?o.Children.only(null):null});v.displayName="SlotClone";const N=s(({children:e})=>o.createElement(o.Fragment,null,e),"$5e63c961fc1ce211$export$d9f1ccf0bdb05d45");function _(e){return o.isValidElement(e)&&e.type===N}s(_,"$5e63c961fc1ce211$var$isSlottable");function j(e,n){const t={...n};for(const r in n){const c=e[r],i=n[r];/^on[A-Z]/.test(r)?c&&i?t[r]=(...f)=>{i(...f),c(...f)}:c&&(t[r]=c):r==="style"?t[r]={...c,...i}:r==="className"&&(t[r]=[c,i].filter(Boolean).join(" "))}return{...e,...t}}s(j,"$5e63c961fc1ce211$var$mergeProps");const R=["a","button","div","form","h2","h3","img","input","label","li","nav","ol","p","span","svg","ul"],Z=R.reduce((e,n)=>{const t=o.forwardRef((r,c)=>{const{asChild:i,...l}=r,f=i?E:n;return o.useEffect(()=>{window[Symbol.for("radix-ui")]=!0},[]),o.createElement(f,h({},l,{ref:c}))});return t.displayName=`Primitive.${n}`,{...e,[n]:t}},{});function k(e,n){e&&P.flushSync(()=>e.dispatchEvent(n))}s(k,"$8927f6f2acc4f386$export$6d1a0317bde7de7f");export{L as $,D as a,Z as b,B as c,k as d,T as e,E as f,F as g};
//# sourceMappingURL=index.module-764022c1.js.map
