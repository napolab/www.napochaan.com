var p=Object.defineProperty;var u=(t,e)=>p(t,"name",{value:e,configurable:!0});import{r as o,R as s}from"./index-b39dbb65.js";const a={prefix:String(Math.round(Math.random()*1e10)),current:0},i=s.createContext(a);function b(t){let e=o.useContext(i),r=$(e===a),c=o.useMemo(()=>({prefix:e===a?"":`${e.prefix}-${r}`,current:0}),[e,r]);return s.createElement(i.Provider,{value:c},t.children)}u(b,"$704cf1d3b684cc5c$export$9f8ac96af4b1b2ae");let v=Boolean(typeof window<"u"&&window.document&&window.document.createElement),f=new WeakMap;function $(t=!1){let e=o.useContext(i),r=o.useRef(null);if(r.current===null&&!t){var c,l;let n=(c=s.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED)===null||c===void 0||(l=c.ReactCurrentOwner)===null||l===void 0?void 0:l.current;if(n){let d=f.get(n);d==null?f.set(n,{id:e.current,state:n.memoizedState}):n.memoizedState!==d.state&&(e.current=d.id,f.delete(n))}r.current=++e.current}return r.current}u($,"$704cf1d3b684cc5c$var$useCounter");function w(t){let e=o.useContext(i);e===a&&!v&&console.warn("When server rendering, you must wrap your application in an <SSRProvider> to ensure consistent ids are generated between the client and server.");let r=$(!!t);return t||`react-aria${e.prefix}-${r}`}u(w,"$704cf1d3b684cc5c$export$619500959fc48b26");export{b as $,w as a};
//# sourceMappingURL=import-aaac4dde.js.map
