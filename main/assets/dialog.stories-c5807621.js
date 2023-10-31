import{a as _,j as L,F as lt}from"./jsx-runtime-03b4ddbf.js";import{r as a}from"./index-76fb7be0.js";import{_ as w}from"./extends-98964cd2.js";import{a as B,b as U,e as R,f as P,h as ut,c as dt,g as ft}from"./index-b86e5f49.js";import{c as vt,$ as pt,a as re}from"./createReactComponent-097bd1e5.js";import{R as mt}from"./index-d3ea75b5.js";import{$ as he,S as ht}from"./index-b95884eb.js";import{d as gt,a as bt}from"./react-spring_web.modern-317a0c13.js";/* empty css                              */import{c as $t}from"./clsx-58cdbad4.js";import"./_commonjsHelpers-de833af9.js";import"./index-8d47fad6.js";var yt=vt("x","IconX",[["path",{d:"M18 6l-12 12",key:"svg-0"}],["path",{d:"M6 6l12 12",key:"svg-1"}]]);const Ce=1440,_e=1024,we=700,H={xl:`screen and (min-width: ${Ce}px)`,lg:`screen and (min-width: ${_e}px) and (max-width: ${Ce-1}px)`,md:`screen and (min-width: ${we}px) and (max-width: ${_e-1}px)`,sm:`screen and (max-width: ${we-1}px)`};function Et(e,t=globalThis==null?void 0:globalThis.document){const n=B(e);a.useEffect(()=>{const r=o=>{o.key==="Escape"&&n(o)};return t.addEventListener("keydown",r),()=>t.removeEventListener("keydown",r)},[n,t])}const ue="dismissableLayer.update",Ct="dismissableLayer.pointerDownOutside",_t="dismissableLayer.focusOutside";let De;const wt=a.createContext({layers:new Set,layersWithOutsidePointerEventsDisabled:new Set,branches:new Set}),Dt=a.forwardRef((e,t)=>{var n;const{disableOutsidePointerEvents:r=!1,onEscapeKeyDown:o,onPointerDownOutside:c,onFocusOutside:s,onInteractOutside:i,onDismiss:f,...m}=e,d=a.useContext(wt),[u,p]=a.useState(null),h=(n=u==null?void 0:u.ownerDocument)!==null&&n!==void 0?n:globalThis==null?void 0:globalThis.document,[,D]=a.useState({}),l=U(t,y=>p(y)),v=Array.from(d.layers),[g]=[...d.layersWithOutsidePointerEventsDisabled].slice(-1),C=v.indexOf(g),b=u?v.indexOf(u):-1,$=d.layersWithOutsidePointerEventsDisabled.size>0,E=b>=C,F=Ot(y=>{const M=y.target,Ee=[...d.branches].some(ne=>ne.contains(M));!E||Ee||(c==null||c(y),i==null||i(y),y.defaultPrevented||f==null||f())},h),T=St(y=>{const M=y.target;[...d.branches].some(ne=>ne.contains(M))||(s==null||s(y),i==null||i(y),y.defaultPrevented||f==null||f())},h);return Et(y=>{b===d.layers.size-1&&(o==null||o(y),!y.defaultPrevented&&f&&(y.preventDefault(),f()))},h),a.useEffect(()=>{if(u)return r&&(d.layersWithOutsidePointerEventsDisabled.size===0&&(De=h.body.style.pointerEvents,h.body.style.pointerEvents="none"),d.layersWithOutsidePointerEventsDisabled.add(u)),d.layers.add(u),Oe(),()=>{r&&d.layersWithOutsidePointerEventsDisabled.size===1&&(h.body.style.pointerEvents=De)}},[u,h,r,d]),a.useEffect(()=>()=>{u&&(d.layers.delete(u),d.layersWithOutsidePointerEventsDisabled.delete(u),Oe())},[u,d]),a.useEffect(()=>{const y=()=>D({});return document.addEventListener(ue,y),()=>document.removeEventListener(ue,y)},[]),a.createElement(R.div,w({},m,{ref:l,style:{pointerEvents:$?E?"auto":"none":void 0,...e.style},onFocusCapture:P(e.onFocusCapture,T.onFocusCapture),onBlurCapture:P(e.onBlurCapture,T.onBlurCapture),onPointerDownCapture:P(e.onPointerDownCapture,F.onPointerDownCapture)}))});function Ot(e,t=globalThis==null?void 0:globalThis.document){const n=B(e),r=a.useRef(!1),o=a.useRef(()=>{});return a.useEffect(()=>{const c=i=>{if(i.target&&!r.current){let m=function(){Ue(Ct,n,f,{discrete:!0})};const f={originalEvent:i};i.pointerType==="touch"?(t.removeEventListener("click",o.current),o.current=m,t.addEventListener("click",o.current,{once:!0})):m()}r.current=!1},s=window.setTimeout(()=>{t.addEventListener("pointerdown",c)},0);return()=>{window.clearTimeout(s),t.removeEventListener("pointerdown",c),t.removeEventListener("click",o.current)}},[t,n]),{onPointerDownCapture:()=>r.current=!0}}function St(e,t=globalThis==null?void 0:globalThis.document){const n=B(e),r=a.useRef(!1);return a.useEffect(()=>{const o=c=>{c.target&&!r.current&&Ue(_t,n,{originalEvent:c},{discrete:!1})};return t.addEventListener("focusin",o),()=>t.removeEventListener("focusin",o)},[t,n]),{onFocusCapture:()=>r.current=!0,onBlurCapture:()=>r.current=!1}}function Oe(){const e=new CustomEvent(ue);document.dispatchEvent(e)}function Ue(e,t,n,{discrete:r}){const o=n.originalEvent.target,c=new CustomEvent(e,{bubbles:!1,cancelable:!0,detail:n});t&&o.addEventListener(e,t,{once:!0}),r?ut(o,c):o.dispatchEvent(c)}const oe="focusScope.autoFocusOnMount",ae="focusScope.autoFocusOnUnmount",Se={bubbles:!1,cancelable:!0},Rt=a.forwardRef((e,t)=>{const{loop:n=!1,trapped:r=!1,onMountAutoFocus:o,onUnmountAutoFocus:c,...s}=e,[i,f]=a.useState(null),m=B(o),d=B(c),u=a.useRef(null),p=U(t,l=>f(l)),h=a.useRef({paused:!1,pause(){this.paused=!0},resume(){this.paused=!1}}).current;a.useEffect(()=>{if(r){let l=function(b){if(h.paused||!i)return;const $=b.target;i.contains($)?u.current=$:x(u.current,{select:!0})},v=function(b){if(h.paused||!i)return;const $=b.relatedTarget;$!==null&&(i.contains($)||x(u.current,{select:!0}))},g=function(b){const $=document.activeElement;for(const E of b)E.removedNodes.length>0&&(i!=null&&i.contains($)||x(i))};document.addEventListener("focusin",l),document.addEventListener("focusout",v);const C=new MutationObserver(g);return i&&C.observe(i,{childList:!0,subtree:!0}),()=>{document.removeEventListener("focusin",l),document.removeEventListener("focusout",v),C.disconnect()}}},[r,i,h.paused]),a.useEffect(()=>{if(i){Te.add(h);const l=document.activeElement;if(!i.contains(l)){const g=new CustomEvent(oe,Se);i.addEventListener(oe,m),i.dispatchEvent(g),g.defaultPrevented||(Tt(It(qe(i)),{select:!0}),document.activeElement===l&&x(i))}return()=>{i.removeEventListener(oe,m),setTimeout(()=>{const g=new CustomEvent(ae,Se);i.addEventListener(ae,d),i.dispatchEvent(g),g.defaultPrevented||x(l??document.body,{select:!0}),i.removeEventListener(ae,d),Te.remove(h)},0)}}},[i,m,d,h]);const D=a.useCallback(l=>{if(!n&&!r||h.paused)return;const v=l.key==="Tab"&&!l.altKey&&!l.ctrlKey&&!l.metaKey,g=document.activeElement;if(v&&g){const C=l.currentTarget,[b,$]=xt(C);b&&$?!l.shiftKey&&g===$?(l.preventDefault(),n&&x(b,{select:!0})):l.shiftKey&&g===b&&(l.preventDefault(),n&&x($,{select:!0})):g===C&&l.preventDefault()}},[n,r,h.paused]);return a.createElement(R.div,w({tabIndex:-1},s,{ref:p,onKeyDown:D}))});function Tt(e,{select:t=!1}={}){const n=document.activeElement;for(const r of e)if(x(r,{select:t}),document.activeElement!==n)return}function xt(e){const t=qe(e),n=Re(t,e),r=Re(t.reverse(),e);return[n,r]}function qe(e){const t=[],n=document.createTreeWalker(e,NodeFilter.SHOW_ELEMENT,{acceptNode:r=>{const o=r.tagName==="INPUT"&&r.type==="hidden";return r.disabled||r.hidden||o?NodeFilter.FILTER_SKIP:r.tabIndex>=0?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP}});for(;n.nextNode();)t.push(n.currentNode);return t}function Re(e,t){for(const n of e)if(!Pt(n,{upTo:t}))return n}function Pt(e,{upTo:t}){if(getComputedStyle(e).visibility==="hidden")return!0;for(;e;){if(t!==void 0&&e===t)return!1;if(getComputedStyle(e).display==="none")return!0;e=e.parentElement}return!1}function Mt(e){return e instanceof HTMLInputElement&&"select"in e}function x(e,{select:t=!1}={}){if(e&&e.focus){const n=document.activeElement;e.focus({preventScroll:!0}),e!==n&&Mt(e)&&t&&e.select()}}const Te=Lt();function Lt(){let e=[];return{add(t){const n=e[0];t!==n&&(n==null||n.pause()),e=xe(e,t),e.unshift(t)},remove(t){var n;e=xe(e,t),(n=e[0])===null||n===void 0||n.resume()}}}function xe(e,t){const n=[...e],r=n.indexOf(t);return r!==-1&&n.splice(r,1),n}function It(e){return e.filter(t=>t.tagName!=="A")}const Nt=a.forwardRef((e,t)=>{var n;const{container:r=globalThis==null||(n=globalThis.document)===null||n===void 0?void 0:n.body,...o}=e;return r?mt.createPortal(a.createElement(R.div,w({},o,{ref:t})),r):null});let ce=0;function At(){a.useEffect(()=>{var e,t;const n=document.querySelectorAll("[data-radix-focus-guard]");return document.body.insertAdjacentElement("afterbegin",(e=n[0])!==null&&e!==void 0?e:Pe()),document.body.insertAdjacentElement("beforeend",(t=n[1])!==null&&t!==void 0?t:Pe()),ce++,()=>{ce===1&&document.querySelectorAll("[data-radix-focus-guard]").forEach(r=>r.remove()),ce--}},[])}function Pe(){const e=document.createElement("span");return e.setAttribute("data-radix-focus-guard",""),e.tabIndex=0,e.style.cssText="outline: none; opacity: 0; position: fixed; pointer-events: none",e}var S=function(){return S=Object.assign||function(t){for(var n,r=1,o=arguments.length;r<o;r++){n=arguments[r];for(var c in n)Object.prototype.hasOwnProperty.call(n,c)&&(t[c]=n[c])}return t},S.apply(this,arguments)};function He(e,t){var n={};for(var r in e)Object.prototype.hasOwnProperty.call(e,r)&&t.indexOf(r)<0&&(n[r]=e[r]);if(e!=null&&typeof Object.getOwnPropertySymbols=="function")for(var o=0,r=Object.getOwnPropertySymbols(e);o<r.length;o++)t.indexOf(r[o])<0&&Object.prototype.propertyIsEnumerable.call(e,r[o])&&(n[r[o]]=e[r[o]]);return n}function Ft(e,t,n){if(n||arguments.length===2)for(var r=0,o=t.length,c;r<o;r++)(c||!(r in t))&&(c||(c=Array.prototype.slice.call(t,0,r)),c[r]=t[r]);return e.concat(c||Array.prototype.slice.call(t))}var G="right-scroll-bar-position",Q="width-before-scroll-bar",kt="with-scroll-bars-hidden",Wt="--removed-body-scroll-bar-size";function Bt(e,t){return typeof e=="function"?e(t):e&&(e.current=t),e}function jt(e,t){var n=a.useState(function(){return{value:e,callback:t,facade:{get current(){return n.value},set current(r){var o=n.value;o!==r&&(n.value=r,n.callback(r,o))}}}})[0];return n.callback=t,n.facade}function Ut(e,t){return jt(t||null,function(n){return e.forEach(function(r){return Bt(r,n)})})}function qt(e){return e}function Ht(e,t){t===void 0&&(t=qt);var n=[],r=!1,o={read:function(){if(r)throw new Error("Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.");return n.length?n[n.length-1]:e},useMedium:function(c){var s=t(c,r);return n.push(s),function(){n=n.filter(function(i){return i!==s})}},assignSyncMedium:function(c){for(r=!0;n.length;){var s=n;n=[],s.forEach(c)}n={push:function(i){return c(i)},filter:function(){return n}}},assignMedium:function(c){r=!0;var s=[];if(n.length){var i=n;n=[],i.forEach(c),s=n}var f=function(){var d=s;s=[],d.forEach(c)},m=function(){return Promise.resolve().then(f)};m(),n={push:function(d){s.push(d),m()},filter:function(d){return s=s.filter(d),n}}}};return o}function Vt(e){e===void 0&&(e={});var t=Ht(null);return t.options=S({async:!0,ssr:!1},e),t}var Ve=function(e){var t=e.sideCar,n=He(e,["sideCar"]);if(!t)throw new Error("Sidecar: please provide `sideCar` property to import the right car");var r=t.read();if(!r)throw new Error("Sidecar medium not found");return a.createElement(r,S({},n))};Ve.isSideCarExport=!0;function Kt(e,t){return e.useMedium(t),Ve}var Ke=Vt(),ie=function(){},J=a.forwardRef(function(e,t){var n=a.useRef(null),r=a.useState({onScrollCapture:ie,onWheelCapture:ie,onTouchMoveCapture:ie}),o=r[0],c=r[1],s=e.forwardProps,i=e.children,f=e.className,m=e.removeScrollBar,d=e.enabled,u=e.shards,p=e.sideCar,h=e.noIsolation,D=e.inert,l=e.allowPinchZoom,v=e.as,g=v===void 0?"div":v,C=He(e,["forwardProps","children","className","removeScrollBar","enabled","shards","sideCar","noIsolation","inert","allowPinchZoom","as"]),b=p,$=Ut([n,t]),E=S(S({},C),o);return a.createElement(a.Fragment,null,d&&a.createElement(b,{sideCar:Ke,removeScrollBar:m,shards:u,noIsolation:h,inert:D,setCallbacks:c,allowPinchZoom:!!l,lockRef:n}),s?a.cloneElement(a.Children.only(i),S(S({},E),{ref:$})):a.createElement(g,S({},E,{className:f,ref:$}),i))});J.defaultProps={enabled:!0,removeScrollBar:!0,inert:!1};J.classNames={fullWidth:Q,zeroRight:G};var Me,zt=function(){if(Me)return Me;if(typeof __webpack_nonce__<"u")return __webpack_nonce__};function Xt(){if(!document)return null;var e=document.createElement("style");e.type="text/css";var t=zt();return t&&e.setAttribute("nonce",t),e}function Yt(e,t){e.styleSheet?e.styleSheet.cssText=t:e.appendChild(document.createTextNode(t))}function Gt(e){var t=document.head||document.getElementsByTagName("head")[0];t.appendChild(e)}var Qt=function(){var e=0,t=null;return{add:function(n){e==0&&(t=Xt())&&(Yt(t,n),Gt(t)),e++},remove:function(){e--,!e&&t&&(t.parentNode&&t.parentNode.removeChild(t),t=null)}}},Zt=function(){var e=Qt();return function(t,n){a.useEffect(function(){return e.add(t),function(){e.remove()}},[t&&n])}},ze=function(){var e=Zt(),t=function(n){var r=n.styles,o=n.dynamic;return e(r,o),null};return t},Jt={left:0,top:0,right:0,gap:0},se=function(e){return parseInt(e||"",10)||0},en=function(e){var t=window.getComputedStyle(document.body),n=t[e==="padding"?"paddingLeft":"marginLeft"],r=t[e==="padding"?"paddingTop":"marginTop"],o=t[e==="padding"?"paddingRight":"marginRight"];return[se(n),se(r),se(o)]},tn=function(e){if(e===void 0&&(e="margin"),typeof window>"u")return Jt;var t=en(e),n=document.documentElement.clientWidth,r=window.innerWidth;return{left:t[0],top:t[1],right:t[2],gap:Math.max(0,r-n+t[2]-t[0])}},nn=ze(),rn=function(e,t,n,r){var o=e.left,c=e.top,s=e.right,i=e.gap;return n===void 0&&(n="margin"),`
  .`.concat(kt,` {
   overflow: hidden `).concat(r,`;
   padding-right: `).concat(i,"px ").concat(r,`;
  }
  body {
    overflow: hidden `).concat(r,`;
    overscroll-behavior: contain;
    `).concat([t&&"position: relative ".concat(r,";"),n==="margin"&&`
    padding-left: `.concat(o,`px;
    padding-top: `).concat(c,`px;
    padding-right: `).concat(s,`px;
    margin-left:0;
    margin-top:0;
    margin-right: `).concat(i,"px ").concat(r,`;
    `),n==="padding"&&"padding-right: ".concat(i,"px ").concat(r,";")].filter(Boolean).join(""),`
  }
  
  .`).concat(G,` {
    right: `).concat(i,"px ").concat(r,`;
  }
  
  .`).concat(Q,` {
    margin-right: `).concat(i,"px ").concat(r,`;
  }
  
  .`).concat(G," .").concat(G,` {
    right: 0 `).concat(r,`;
  }
  
  .`).concat(Q," .").concat(Q,` {
    margin-right: 0 `).concat(r,`;
  }
  
  body {
    `).concat(Wt,": ").concat(i,`px;
  }
`)},on=function(e){var t=e.noRelative,n=e.noImportant,r=e.gapMode,o=r===void 0?"margin":r,c=a.useMemo(function(){return tn(o)},[o]);return a.createElement(nn,{styles:rn(c,!t,o,n?"":"!important")})},de=!1;if(typeof window<"u")try{var V=Object.defineProperty({},"passive",{get:function(){return de=!0,!0}});window.addEventListener("test",V,V),window.removeEventListener("test",V,V)}catch{de=!1}var I=de?{passive:!1}:!1,an=function(e){return e.tagName==="TEXTAREA"},Xe=function(e,t){var n=window.getComputedStyle(e);return n[t]!=="hidden"&&!(n.overflowY===n.overflowX&&!an(e)&&n[t]==="visible")},cn=function(e){return Xe(e,"overflowY")},sn=function(e){return Xe(e,"overflowX")},Le=function(e,t){var n=t;do{typeof ShadowRoot<"u"&&n instanceof ShadowRoot&&(n=n.host);var r=Ye(e,n);if(r){var o=Ge(e,n),c=o[1],s=o[2];if(c>s)return!0}n=n.parentNode}while(n&&n!==document.body);return!1},ln=function(e){var t=e.scrollTop,n=e.scrollHeight,r=e.clientHeight;return[t,n,r]},un=function(e){var t=e.scrollLeft,n=e.scrollWidth,r=e.clientWidth;return[t,n,r]},Ye=function(e,t){return e==="v"?cn(t):sn(t)},Ge=function(e,t){return e==="v"?ln(t):un(t)},dn=function(e,t){return e==="h"&&t==="rtl"?-1:1},fn=function(e,t,n,r,o){var c=dn(e,window.getComputedStyle(t).direction),s=c*r,i=n.target,f=t.contains(i),m=!1,d=s>0,u=0,p=0;do{var h=Ge(e,i),D=h[0],l=h[1],v=h[2],g=l-v-c*D;(D||g)&&Ye(e,i)&&(u+=g,p+=D),i=i.parentNode}while(!f&&i!==document.body||f&&(t.contains(i)||t===i));return(d&&(o&&u===0||!o&&s>u)||!d&&(o&&p===0||!o&&-s>p))&&(m=!0),m},K=function(e){return"changedTouches"in e?[e.changedTouches[0].clientX,e.changedTouches[0].clientY]:[0,0]},Ie=function(e){return[e.deltaX,e.deltaY]},Ne=function(e){return e&&"current"in e?e.current:e},vn=function(e,t){return e[0]===t[0]&&e[1]===t[1]},pn=function(e){return`
  .block-interactivity-`.concat(e,` {pointer-events: none;}
  .allow-interactivity-`).concat(e,` {pointer-events: all;}
`)},mn=0,N=[];function hn(e){var t=a.useRef([]),n=a.useRef([0,0]),r=a.useRef(),o=a.useState(mn++)[0],c=a.useState(function(){return ze()})[0],s=a.useRef(e);a.useEffect(function(){s.current=e},[e]),a.useEffect(function(){if(e.inert){document.body.classList.add("block-interactivity-".concat(o));var l=Ft([e.lockRef.current],(e.shards||[]).map(Ne),!0).filter(Boolean);return l.forEach(function(v){return v.classList.add("allow-interactivity-".concat(o))}),function(){document.body.classList.remove("block-interactivity-".concat(o)),l.forEach(function(v){return v.classList.remove("allow-interactivity-".concat(o))})}}},[e.inert,e.lockRef.current,e.shards]);var i=a.useCallback(function(l,v){if("touches"in l&&l.touches.length===2)return!s.current.allowPinchZoom;var g=K(l),C=n.current,b="deltaX"in l?l.deltaX:C[0]-g[0],$="deltaY"in l?l.deltaY:C[1]-g[1],E,F=l.target,T=Math.abs(b)>Math.abs($)?"h":"v";if("touches"in l&&T==="h"&&F.type==="range")return!1;var y=Le(T,F);if(!y)return!0;if(y?E=T:(E=T==="v"?"h":"v",y=Le(T,F)),!y)return!1;if(!r.current&&"changedTouches"in l&&(b||$)&&(r.current=E),!E)return!0;var M=r.current||E;return fn(M,v,l,M==="h"?b:$,!0)},[]),f=a.useCallback(function(l){var v=l;if(!(!N.length||N[N.length-1]!==c)){var g="deltaY"in v?Ie(v):K(v),C=t.current.filter(function(E){return E.name===v.type&&E.target===v.target&&vn(E.delta,g)})[0];if(C&&C.should){v.cancelable&&v.preventDefault();return}if(!C){var b=(s.current.shards||[]).map(Ne).filter(Boolean).filter(function(E){return E.contains(v.target)}),$=b.length>0?i(v,b[0]):!s.current.noIsolation;$&&v.cancelable&&v.preventDefault()}}},[]),m=a.useCallback(function(l,v,g,C){var b={name:l,delta:v,target:g,should:C};t.current.push(b),setTimeout(function(){t.current=t.current.filter(function($){return $!==b})},1)},[]),d=a.useCallback(function(l){n.current=K(l),r.current=void 0},[]),u=a.useCallback(function(l){m(l.type,Ie(l),l.target,i(l,e.lockRef.current))},[]),p=a.useCallback(function(l){m(l.type,K(l),l.target,i(l,e.lockRef.current))},[]);a.useEffect(function(){return N.push(c),e.setCallbacks({onScrollCapture:u,onWheelCapture:u,onTouchMoveCapture:p}),document.addEventListener("wheel",f,I),document.addEventListener("touchmove",f,I),document.addEventListener("touchstart",d,I),function(){N=N.filter(function(l){return l!==c}),document.removeEventListener("wheel",f,I),document.removeEventListener("touchmove",f,I),document.removeEventListener("touchstart",d,I)}},[]);var h=e.removeScrollBar,D=e.inert;return a.createElement(a.Fragment,null,D?a.createElement(c,{styles:pn(o)}):null,h?a.createElement(on,{gapMode:"margin"}):null)}const gn=Kt(Ke,hn);var Qe=a.forwardRef(function(e,t){return a.createElement(J,S({},e,{ref:t,sideCar:gn}))});Qe.classNames=J.classNames;const bn=Qe;var $n=function(e){if(typeof document>"u")return null;var t=Array.isArray(e)?e[0]:e;return t.ownerDocument.body},A=new WeakMap,z=new WeakMap,X={},le=0,Ze=function(e){return e&&(e.host||Ze(e.parentNode))},yn=function(e,t){return t.map(function(n){if(e.contains(n))return n;var r=Ze(n);return r&&e.contains(r)?r:(console.error("aria-hidden",n,"in not contained inside",e,". Doing nothing"),null)}).filter(function(n){return!!n})},En=function(e,t,n,r){var o=yn(t,Array.isArray(e)?e:[e]);X[n]||(X[n]=new WeakMap);var c=X[n],s=[],i=new Set,f=new Set(o),m=function(u){!u||i.has(u)||(i.add(u),m(u.parentNode))};o.forEach(m);var d=function(u){!u||f.has(u)||Array.prototype.forEach.call(u.children,function(p){if(i.has(p))d(p);else{var h=p.getAttribute(r),D=h!==null&&h!=="false",l=(A.get(p)||0)+1,v=(c.get(p)||0)+1;A.set(p,l),c.set(p,v),s.push(p),l===1&&D&&z.set(p,!0),v===1&&p.setAttribute(n,"true"),D||p.setAttribute(r,"true")}})};return d(t),i.clear(),le++,function(){s.forEach(function(u){var p=A.get(u)-1,h=c.get(u)-1;A.set(u,p),c.set(u,h),p||(z.has(u)||u.removeAttribute(r),z.delete(u)),h||u.removeAttribute(n)}),le--,le||(A=new WeakMap,A=new WeakMap,z=new WeakMap,X={})}},Cn=function(e,t,n){n===void 0&&(n="data-aria-hidden");var r=Array.from(Array.isArray(e)?e:[e]),o=t||$n(e);return o?(r.push.apply(r,Array.from(o.querySelectorAll("[aria-live]"))),En(r,o,n,"aria-hidden")):function(){return null}};const Je="Dialog",[et,Rr]=dt(Je),[_n,O]=et(Je),wn=e=>{const{__scopeDialog:t,children:n,open:r,defaultOpen:o,onOpenChange:c,modal:s=!0}=e,i=a.useRef(null),f=a.useRef(null),[m=!1,d]=pt({prop:r,defaultProp:o,onChange:c});return a.createElement(_n,{scope:t,triggerRef:i,contentRef:f,contentId:re(),titleId:re(),descriptionId:re(),open:m,onOpenChange:d,onOpenToggle:a.useCallback(()=>d(u=>!u),[d]),modal:s},n)},Dn="DialogTrigger",On=a.forwardRef((e,t)=>{const{__scopeDialog:n,...r}=e,o=O(Dn,n),c=U(t,o.triggerRef);return a.createElement(R.button,w({type:"button","aria-haspopup":"dialog","aria-expanded":o.open,"aria-controls":o.contentId,"data-state":ge(o.open)},r,{ref:c,onClick:P(e.onClick,o.onOpenToggle)}))}),tt="DialogPortal",[Sn,nt]=et(tt,{forceMount:void 0}),Rn=e=>{const{__scopeDialog:t,forceMount:n,children:r,container:o}=e,c=O(tt,t);return a.createElement(Sn,{scope:t,forceMount:n},a.Children.map(r,s=>a.createElement(he,{present:n||c.open},a.createElement(Nt,{asChild:!0,container:o},s))))},fe="DialogOverlay",Tn=a.forwardRef((e,t)=>{const n=nt(fe,e.__scopeDialog),{forceMount:r=n.forceMount,...o}=e,c=O(fe,e.__scopeDialog);return c.modal?a.createElement(he,{present:r||c.open},a.createElement(xn,w({},o,{ref:t}))):null}),xn=a.forwardRef((e,t)=>{const{__scopeDialog:n,...r}=e,o=O(fe,n);return a.createElement(bn,{as:ft,allowPinchZoom:!0,shards:[o.contentRef]},a.createElement(R.div,w({"data-state":ge(o.open)},r,{ref:t,style:{pointerEvents:"auto",...r.style}})))}),j="DialogContent",Pn=a.forwardRef((e,t)=>{const n=nt(j,e.__scopeDialog),{forceMount:r=n.forceMount,...o}=e,c=O(j,e.__scopeDialog);return a.createElement(he,{present:r||c.open},c.modal?a.createElement(Mn,w({},o,{ref:t})):a.createElement(Ln,w({},o,{ref:t})))}),Mn=a.forwardRef((e,t)=>{const n=O(j,e.__scopeDialog),r=a.useRef(null),o=U(t,n.contentRef,r);return a.useEffect(()=>{const c=r.current;if(c)return Cn(c)},[]),a.createElement(rt,w({},e,{ref:o,trapFocus:n.open,disableOutsidePointerEvents:!0,onCloseAutoFocus:P(e.onCloseAutoFocus,c=>{var s;c.preventDefault(),(s=n.triggerRef.current)===null||s===void 0||s.focus()}),onPointerDownOutside:P(e.onPointerDownOutside,c=>{const s=c.detail.originalEvent,i=s.button===0&&s.ctrlKey===!0;(s.button===2||i)&&c.preventDefault()}),onFocusOutside:P(e.onFocusOutside,c=>c.preventDefault())}))}),Ln=a.forwardRef((e,t)=>{const n=O(j,e.__scopeDialog),r=a.useRef(!1),o=a.useRef(!1);return a.createElement(rt,w({},e,{ref:t,trapFocus:!1,disableOutsidePointerEvents:!1,onCloseAutoFocus:c=>{var s;if((s=e.onCloseAutoFocus)===null||s===void 0||s.call(e,c),!c.defaultPrevented){var i;r.current||(i=n.triggerRef.current)===null||i===void 0||i.focus(),c.preventDefault()}r.current=!1,o.current=!1},onInteractOutside:c=>{var s,i;(s=e.onInteractOutside)===null||s===void 0||s.call(e,c),c.defaultPrevented||(r.current=!0,c.detail.originalEvent.type==="pointerdown"&&(o.current=!0));const f=c.target;((i=n.triggerRef.current)===null||i===void 0?void 0:i.contains(f))&&c.preventDefault(),c.detail.originalEvent.type==="focusin"&&o.current&&c.preventDefault()}}))}),rt=a.forwardRef((e,t)=>{const{__scopeDialog:n,trapFocus:r,onOpenAutoFocus:o,onCloseAutoFocus:c,...s}=e,i=O(j,n),f=a.useRef(null),m=U(t,f);return At(),a.createElement(a.Fragment,null,a.createElement(Rt,{asChild:!0,loop:!0,trapped:r,onMountAutoFocus:o,onUnmountAutoFocus:c},a.createElement(Dt,w({role:"dialog",id:i.contentId,"aria-describedby":i.descriptionId,"aria-labelledby":i.titleId,"data-state":ge(i.open)},s,{ref:m,onDismiss:()=>i.onOpenChange(!1)}))),!1)}),In="DialogTitle",Nn=a.forwardRef((e,t)=>{const{__scopeDialog:n,...r}=e,o=O(In,n);return a.createElement(R.h2,w({id:o.titleId},r,{ref:t}))}),An="DialogDescription",Fn=a.forwardRef((e,t)=>{const{__scopeDialog:n,...r}=e,o=O(An,n);return a.createElement(R.p,w({id:o.descriptionId},r,{ref:t}))}),kn="DialogClose",Wn=a.forwardRef((e,t)=>{const{__scopeDialog:n,...r}=e,o=O(kn,n);return a.createElement(R.button,w({type:"button"},r,{ref:t,onClick:P(e.onClick,()=>o.onOpenChange(!1))}))});function ge(e){return e?"open":"closed"}const Bn=wn,jn=On,Un=Rn,qn=Tn,Hn=Pn,Vn=Nn,Kn=Fn,zn=Wn,ve="horizontal",Xn=["horizontal","vertical"],ot=a.forwardRef((e,t)=>{const{decorative:n,orientation:r=ve,...o}=e,c=at(r)?r:ve,i=n?{role:"none"}:{"aria-orientation":c==="vertical"?c:void 0,role:"separator"};return a.createElement(R.div,w({"data-orientation":c},i,o,{ref:t}))});ot.propTypes={orientation(e,t,n){const r=e[t],o=String(r);return r&&!at(r)?new Error(Yn(o,n)):null}};function Yn(e,t){return`Invalid prop \`orientation\` of value \`${e}\` supplied to \`${t}\`, expected one of:
  - horizontal
  - vertical

Defaulting to \`${ve}\`.`}function at(e){return Xn.includes(e)}const Gn=ot;var ee={},ct={},q={},te={};Object.defineProperty(te,"__esModule",{value:!0});function Qn(e){return e.replace(/[A-Z]/g,function(t){return"-"+t.toLowerCase()}).toLowerCase()}te.default=Qn;var be={};Object.defineProperty(be,"__esModule",{value:!0});var Zn=te,Jn=" and ";function er(e){return typeof e=="string"?e:Object.entries(e).map(function(t){var n=t[0],r=t[1],o=Zn.default(n),c=r;return typeof c=="boolean"?c?o:"not "+o:(typeof c=="number"&&/[height|width]$/.test(o)&&(c=c+"px"),"("+o+": "+c+")")}).join(Jn)}be.default=er;var $e={};Object.defineProperty($e,"__esModule",{value:!0});function tr(){}$e.default=tr;Object.defineProperty(q,"__esModule",{value:!0});var nr=te;q.camelToHyphen=nr.default;var rr=be;q.queryObjectToString=rr.default;var or=$e;q.noop=or.default;(function(e){Object.defineProperty(e,"__esModule",{value:!0});var t=a,n=q;e.mockMediaQueryList={media:"",matches:!1,onchange:n.noop,addListener:n.noop,removeListener:n.noop,addEventListener:n.noop,removeEventListener:n.noop,dispatchEvent:function(o){return!0}};var r=function(o){return function(c,s){s===void 0&&(s=!1);var i=t.useState(s),f=i[0],m=i[1],d=n.queryObjectToString(c);return o(function(){var u=!0,p=typeof window>"u"?e.mockMediaQueryList:window.matchMedia(d),h=function(){u&&m(!!p.matches)};return p.addListener(h),m(p.matches),function(){u=!1,p.removeListener(h)}},[d]),f}};e.useMedia=r(t.useEffect),e.useMediaLayout=r(t.useLayoutEffect),e.default=e.useMedia})(ct);Object.defineProperty(ee,"__esModule",{value:!0});var ye=ct;ee.default=ye.default;var Y=ee.useMedia=ye.useMedia;ee.useMediaLayout=ye.useMediaLayout;var ar="rh21qc6",cr="rh21qc7",ir="rh21qc2",sr="rh21qc4",lr="rh21qc8",ur="rh21qc0",dr="rh21qc3 _1peap286 _1peap284",fr="rh21qc5",vr="rh21qc1";const it=a.createContext({open:!1}),pr={from:{opacity:.1,transform:"translate(-50%, -25%)"},enter:{opacity:1,transform:"translate(-50%, -50%)"},leave:{opacity:0,transform:"translate(-50%, -25%)"},config:{mass:.8,tension:140,friction:16,precision:.016,velocity:.015}},mr={from:{opacity:1,transform:"translate(0%, 100%) scale(1)"},enter:{opacity:1,transform:"translate(0%, 0%) scale(1)"},leave:{op25ity:1,transform:"translate(0%, 100%) scale(1)"},config:{tension:280,friction:30,precision:.013,velocity:.016}},Z=a.memo(a.forwardRef(({children:e,title:t,description:n},r)=>{const{open:o,size:c}=a.useContext(it),s=gt(o,c!=="sm"?pr:mr);return _(Un,{forceMount:!0,children:s((i,f)=>f?L(lt,{children:[_(qn,{className:ur}),_(Hn,{ref:r,children:L(bt.div,{style:i,className:ir,children:[L("div",{className:sr,children:[L("div",{className:fr,children:[_(Vn,{className:dr,children:t}),_(zn,{asChild:!0,children:_("button",{"aria-label":"Close",className:cr,children:_(yt,{className:lr})})})]}),n!==void 0?_(Kn,{children:n}):null,_(Gn,{className:ar})]}),_(ht,{orientation:"vertical",scrollbar:"all",children:e})]})})]}):null)})})),pe=a.memo(a.forwardRef(({className:e,...t},n)=>_(jn,{...t,ref:n,className:$t(vr,e)}))),me=a.memo(({children:e,...t})=>{const[n,r]=a.useState(t.open??!1),o=Y(H.xl),c=Y(H.lg),s=Y(H.sm),i=Y(H.md),f=a.useMemo(()=>{if(o)return"xl";if(c)return"lg";if(i)return"md";if(s)return"sm"},[c,i,s,o]),m=a.useCallback(u=>{var p;(p=t.onOpenChange)==null||p.call(t,u),r(t.open??u)},[t]),d=a.useMemo(()=>({open:t.open??n,size:f}),[n,t.open,f]);return _(it.Provider,{value:d,children:a.createElement(Bn,{...t,onOpenChange:m,key:f},e)})});try{Z.displayName="DialogContent",Z.__docgenInfo={description:"",displayName:"DialogContent",props:{title:{defaultValue:null,description:"",name:"title",required:!0,type:{name:"ReactNode"}},description:{defaultValue:null,description:"",name:"description",required:!1,type:{name:"ReactNode"}}}}}catch{}try{pe.displayName="DialogTrigger",pe.__docgenInfo={description:"",displayName:"DialogTrigger",props:{asChild:{defaultValue:null,description:"",name:"asChild",required:!1,type:{name:"boolean"}}}}}catch{}try{me.displayName="DialogRoot",me.__docgenInfo={description:"",displayName:"DialogRoot",props:{}}}catch{}const Tr={title:"components/Dialog",component:Z,argTypes:{title:{type:"string"},description:{type:"string"},open:{control:{type:"boolean"}}}},st=({open:e,...t})=>L(me,{open:e,children:[_(pe,{asChild:!0,children:_("button",{children:"open"})}),L(Z,{...t,title:t.title??"ダイアログ",children:[_("p",{children:"これはダイアログです。"}),L("div",{children:[_("button",{children:"ok"}),_("button",{children:"cancel"})]})]})]}),k=st.bind({});k.args={title:"ダイアログ"};const W=st.bind({});W.args={open:!0};var Ae,Fe,ke;k.parameters={...k.parameters,docs:{...(Ae=k.parameters)==null?void 0:Ae.docs,source:{originalSource:`({
  open,
  ...props
}) => {
  return <DialogRoot open={open}>
      <DialogTrigger asChild>
        <button>open</button>
      </DialogTrigger>

      <DialogContent {...props} title={props.title ?? "ダイアログ"}>
        <p>これはダイアログです。</p>

        <div>
          <button>ok</button>
          <button>cancel</button>
        </div>
      </DialogContent>
    </DialogRoot>;
}`,...(ke=(Fe=k.parameters)==null?void 0:Fe.docs)==null?void 0:ke.source}}};var We,Be,je;W.parameters={...W.parameters,docs:{...(We=W.parameters)==null?void 0:We.docs,source:{originalSource:`({
  open,
  ...props
}) => {
  return <DialogRoot open={open}>
      <DialogTrigger asChild>
        <button>open</button>
      </DialogTrigger>

      <DialogContent {...props} title={props.title ?? "ダイアログ"}>
        <p>これはダイアログです。</p>

        <div>
          <button>ok</button>
          <button>cancel</button>
        </div>
      </DialogContent>
    </DialogRoot>;
}`,...(je=(Be=W.parameters)==null?void 0:Be.docs)==null?void 0:je.source}}};const xr=["Default","Open"];export{k as Default,W as Open,xr as __namedExportsOrder,Tr as default};
//# sourceMappingURL=dialog.stories-c5807621.js.map
