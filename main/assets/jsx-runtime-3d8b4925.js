var x=Object.defineProperty;var i=(e,r)=>x(e,"name",{value:r,configurable:!0});import{r as l}from"./index-88517ad3.js";var s={},a={get exports(){return s},set exports(e){s=e}},n={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var m=l,c=Symbol.for("react.element"),y=Symbol.for("react.fragment"),j=Object.prototype.hasOwnProperty,v=m.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,d={key:!0,ref:!0,__self:!0,__source:!0};function u(e,r,f){var t,o={},p=null,_=null;f!==void 0&&(p=""+f),r.key!==void 0&&(p=""+r.key),r.ref!==void 0&&(_=r.ref);for(t in r)j.call(r,t)&&!d.hasOwnProperty(t)&&(o[t]=r[t]);if(e&&e.defaultProps)for(t in r=e.defaultProps,r)o[t]===void 0&&(o[t]=r[t]);return{$$typeof:c,type:e,key:p,ref:_,props:o,_owner:v.current}}i(u,"q");n.Fragment=y;n.jsx=u;n.jsxs=u;(function(e){e.exports=n})(a);const R=s.jsx,k=s.jsxs;export{k as a,R as j};
//# sourceMappingURL=jsx-runtime-3d8b4925.js.map
