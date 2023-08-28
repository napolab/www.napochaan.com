var m=Object.defineProperty;var a=(t,r)=>m(t,"name",{value:r,configurable:!0});import{r as l}from"./index-9aab58ca.js";var x={exports:{}},s={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var u=l,c=Symbol.for("react.element"),y=Symbol.for("react.fragment"),j=Object.prototype.hasOwnProperty,v=u.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,d={key:!0,ref:!0,__self:!0,__source:!0};function i(t,r,_){var e,o={},n=null,f=null;_!==void 0&&(n=""+_),r.key!==void 0&&(n=""+r.key),r.ref!==void 0&&(f=r.ref);for(e in r)j.call(r,e)&&!d.hasOwnProperty(e)&&(o[e]=r[e]);if(t&&t.defaultProps)for(e in r=t.defaultProps,r)o[e]===void 0&&(o[e]=r[e]);return{$$typeof:c,type:t,key:n,ref:f,props:o,_owner:v.current}}a(i,"q");s.Fragment=y;s.jsx=i;s.jsxs=i;x.exports=s;var p=x.exports;const R=p.Fragment,k=p.jsx,F=p.jsxs;export{R as F,F as a,k as j};
//# sourceMappingURL=jsx-runtime-4ceca8ef.js.map
