var D=Object.defineProperty;var a=(e,t)=>D(e,"name",{value:t,configurable:!0});import{g as T}from"./iframe-f9e8c9ab.js";function V(e,t){for(var n=0;n<t.length;n++){const u=t[n];if(typeof u!="string"&&!Array.isArray(u)){for(const o in u)if(o!=="default"&&!(o in e)){const c=Object.getOwnPropertyDescriptor(u,o);c&&Object.defineProperty(e,o,c.get?c:{enumerable:!0,get:()=>u[o]})}}}return Object.freeze(Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}))}a(V,"_mergeNamespaces");var v={},F={get exports(){return v},set exports(e){v=e}},r={};/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var d=Symbol.for("react.element"),U=Symbol.for("react.portal"),q=Symbol.for("react.fragment"),L=Symbol.for("react.strict_mode"),M=Symbol.for("react.profiler"),N=Symbol.for("react.provider"),z=Symbol.for("react.context"),B=Symbol.for("react.forward_ref"),H=Symbol.for("react.suspense"),W=Symbol.for("react.memo"),G=Symbol.for("react.lazy"),g=Symbol.iterator;function J(e){return e===null||typeof e!="object"?null:(e=g&&e[g]||e["@@iterator"],typeof e=="function"?e:null)}a(J,"A");var j={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},C=Object.assign,O={};function y(e,t,n){this.props=e,this.context=t,this.refs=O,this.updater=n||j}a(y,"E");y.prototype.isReactComponent={};y.prototype.setState=function(e,t){if(typeof e!="object"&&typeof e!="function"&&e!=null)throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,e,t,"setState")};y.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,"forceUpdate")};function x(){}a(x,"F");x.prototype=y.prototype;function E(e,t,n){this.props=e,this.context=t,this.refs=O,this.updater=n||j}a(E,"G");var b=E.prototype=new x;b.constructor=E;C(b,y.prototype);b.isPureReactComponent=!0;var w=Array.isArray,P=Object.prototype.hasOwnProperty,R={current:null},I={key:!0,ref:!0,__self:!0,__source:!0};function A(e,t,n){var u,o={},c=null,s=null;if(t!=null)for(u in t.ref!==void 0&&(s=t.ref),t.key!==void 0&&(c=""+t.key),t)P.call(t,u)&&!I.hasOwnProperty(u)&&(o[u]=t[u]);var f=arguments.length-2;if(f===1)o.children=n;else if(1<f){for(var i=Array(f),p=0;p<f;p++)i[p]=arguments[p+2];o.children=i}if(e&&e.defaultProps)for(u in f=e.defaultProps,f)o[u]===void 0&&(o[u]=f[u]);return{$$typeof:d,type:e,key:c,ref:s,props:o,_owner:R.current}}a(A,"M");function K(e,t){return{$$typeof:d,type:e.type,key:t,ref:e.ref,props:e.props,_owner:e._owner}}a(K,"N");function k(e){return typeof e=="object"&&e!==null&&e.$$typeof===d}a(k,"O");function Q(e){var t={"=":"=0",":":"=2"};return"$"+e.replace(/[=:]/g,function(n){return t[n]})}a(Q,"escape");var $=/\/+/g;function S(e,t){return typeof e=="object"&&e!==null&&e.key!=null?Q(""+e.key):t.toString(36)}a(S,"Q");function h(e,t,n,u,o){var c=typeof e;(c==="undefined"||c==="boolean")&&(e=null);var s=!1;if(e===null)s=!0;else switch(c){case"string":case"number":s=!0;break;case"object":switch(e.$$typeof){case d:case U:s=!0}}if(s)return s=e,o=o(s),e=u===""?"."+S(s,0):u,w(o)?(n="",e!=null&&(n=e.replace($,"$&/")+"/"),h(o,t,n,"",function(p){return p})):o!=null&&(k(o)&&(o=K(o,n+(!o.key||s&&s.key===o.key?"":(""+o.key).replace($,"$&/")+"/")+e)),t.push(o)),1;if(s=0,u=u===""?".":u+":",w(e))for(var f=0;f<e.length;f++){c=e[f];var i=u+S(c,f);s+=h(c,t,n,i,o)}else if(i=J(e),typeof i=="function")for(e=i.call(e),f=0;!(c=e.next()).done;)c=c.value,i=u+S(c,f++),s+=h(c,t,n,i,o);else if(c==="object")throw t=String(e),Error("Objects are not valid as a React child (found: "+(t==="[object Object]"?"object with keys {"+Object.keys(e).join(", ")+"}":t)+"). If you meant to render a collection of children, use an array instead.");return s}a(h,"R");function _(e,t,n){if(e==null)return e;var u=[],o=0;return h(e,u,"","",function(c){return t.call(n,c,o++)}),u}a(_,"S");function Y(e){if(e._status===-1){var t=e._result;t=t(),t.then(function(n){(e._status===0||e._status===-1)&&(e._status=1,e._result=n)},function(n){(e._status===0||e._status===-1)&&(e._status=2,e._result=n)}),e._status===-1&&(e._status=0,e._result=t)}if(e._status===1)return e._result.default;throw e._result}a(Y,"T");var l={current:null},m={transition:null},X={ReactCurrentDispatcher:l,ReactCurrentBatchConfig:m,ReactCurrentOwner:R};r.Children={map:_,forEach:function(e,t,n){_(e,function(){t.apply(this,arguments)},n)},count:function(e){var t=0;return _(e,function(){t++}),t},toArray:function(e){return _(e,function(t){return t})||[]},only:function(e){if(!k(e))throw Error("React.Children.only expected to receive a single React element child.");return e}};r.Component=y;r.Fragment=q;r.Profiler=M;r.PureComponent=E;r.StrictMode=L;r.Suspense=H;r.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=X;r.cloneElement=function(e,t,n){if(e==null)throw Error("React.cloneElement(...): The argument must be a React element, but you passed "+e+".");var u=C({},e.props),o=e.key,c=e.ref,s=e._owner;if(t!=null){if(t.ref!==void 0&&(c=t.ref,s=R.current),t.key!==void 0&&(o=""+t.key),e.type&&e.type.defaultProps)var f=e.type.defaultProps;for(i in t)P.call(t,i)&&!I.hasOwnProperty(i)&&(u[i]=t[i]===void 0&&f!==void 0?f[i]:t[i])}var i=arguments.length-2;if(i===1)u.children=n;else if(1<i){f=Array(i);for(var p=0;p<i;p++)f[p]=arguments[p+2];u.children=f}return{$$typeof:d,type:e.type,key:o,ref:c,props:u,_owner:s}};r.createContext=function(e){return e={$$typeof:z,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null},e.Provider={$$typeof:N,_context:e},e.Consumer=e};r.createElement=A;r.createFactory=function(e){var t=A.bind(null,e);return t.type=e,t};r.createRef=function(){return{current:null}};r.forwardRef=function(e){return{$$typeof:B,render:e}};r.isValidElement=k;r.lazy=function(e){return{$$typeof:G,_payload:{_status:-1,_result:e},_init:Y}};r.memo=function(e,t){return{$$typeof:W,type:e,compare:t===void 0?null:t}};r.startTransition=function(e){var t=m.transition;m.transition={};try{e()}finally{m.transition=t}};r.unstable_act=function(){throw Error("act(...) is not supported in production builds of React.")};r.useCallback=function(e,t){return l.current.useCallback(e,t)};r.useContext=function(e){return l.current.useContext(e)};r.useDebugValue=function(){};r.useDeferredValue=function(e){return l.current.useDeferredValue(e)};r.useEffect=function(e,t){return l.current.useEffect(e,t)};r.useId=function(){return l.current.useId()};r.useImperativeHandle=function(e,t,n){return l.current.useImperativeHandle(e,t,n)};r.useInsertionEffect=function(e,t){return l.current.useInsertionEffect(e,t)};r.useLayoutEffect=function(e,t){return l.current.useLayoutEffect(e,t)};r.useMemo=function(e,t){return l.current.useMemo(e,t)};r.useReducer=function(e,t,n){return l.current.useReducer(e,t,n)};r.useRef=function(e){return l.current.useRef(e)};r.useState=function(e){return l.current.useState(e)};r.useSyncExternalStore=function(e,t,n){return l.current.useSyncExternalStore(e,t,n)};r.useTransition=function(){return l.current.useTransition()};r.version="18.2.0";(function(e){e.exports=r})(F);const Z=T(v),re=V({__proto__:null,default:Z},[v]);export{Z as R,re as a,v as r};
//# sourceMappingURL=index-f93331fb.js.map
