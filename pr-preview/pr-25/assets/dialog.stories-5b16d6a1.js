var it=Object.defineProperty;var i=(e,t)=>it(e,"name",{value:t,configurable:!0});import{j as O,F as we,a as I}from"./jsx-runtime-36446d03.js";import{r as a}from"./index-f45f1866.js";import{$ as j,a as B,b as R,c as P,d as st,e as lt,f as ut}from"./index.module-b22c5365.js";import{$ as dt,a as ne,c as ft}from"./createReactComponent-d0837e76.js";import{R as vt}from"./index-78c31820.js";import{$ as $e,S as pt}from"./index-c9ef19a5.js";import{G as mt,i as ht}from"./index-b3fec81d.js";/* empty css                              */import{c as gt}from"./clsx-705c78bf.js";import"./iframe-f179948d.js";import"./index-50ee27ec.js";function S(){return S=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},S.apply(this,arguments)}i(S,"_extends$4");function le(){return le=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},le.apply(this,arguments)}i(le,"_extends$3");function bt(e,t=globalThis==null?void 0:globalThis.document){const n=j(e);a.useEffect(()=>{const r=i(o=>{o.key==="Escape"&&n(o)},"handleKeyDown");return t.addEventListener("keydown",r),()=>t.removeEventListener("keydown",r)},[n,t])}i(bt,"$addc16e1bbe58fd0$export$3a72a57244d6e765");const ue="dismissableLayer.update",$t="dismissableLayer.pointerDownOutside",yt="dismissableLayer.focusOutside";let Se;const Et=a.createContext({layers:new Set,layersWithOutsidePointerEventsDisabled:new Set,branches:new Set}),Ct=a.forwardRef((e,t)=>{var n;const{disableOutsidePointerEvents:r=!1,onEscapeKeyDown:o,onPointerDownOutside:c,onFocusOutside:l,onInteractOutside:s,onDismiss:v,...g}=e,f=a.useContext(Et),[d,m]=a.useState(null),h=(n=d==null?void 0:d.ownerDocument)!==null&&n!==void 0?n:globalThis==null?void 0:globalThis.document,[,w]=a.useState({}),u=B(t,$=>m($)),p=Array.from(f.layers),[b]=[...f.layersWithOutsidePointerEventsDisabled].slice(-1),y=p.indexOf(b),E=d?p.indexOf(d):-1,_=f.layersWithOutsidePointerEventsDisabled.size>0,C=E>=y,k=Ot($=>{const M=$.target,_e=[...f.branches].some(te=>te.contains(M));!C||_e||(c==null||c($),s==null||s($),$.defaultPrevented||v==null||v())},h),T=_t($=>{const M=$.target;[...f.branches].some(te=>te.contains(M))||(l==null||l($),s==null||s($),$.defaultPrevented||v==null||v())},h);return bt($=>{E===f.layers.size-1&&(o==null||o($),!$.defaultPrevented&&v&&($.preventDefault(),v()))},h),a.useEffect(()=>{if(d)return r&&(f.layersWithOutsidePointerEventsDisabled.size===0&&(Se=h.body.style.pointerEvents,h.body.style.pointerEvents="none"),f.layersWithOutsidePointerEventsDisabled.add(d)),f.layers.add(d),xe(),()=>{r&&f.layersWithOutsidePointerEventsDisabled.size===1&&(h.body.style.pointerEvents=Se)}},[d,h,r,f]),a.useEffect(()=>()=>{d&&(f.layers.delete(d),f.layersWithOutsidePointerEventsDisabled.delete(d),xe())},[d,f]),a.useEffect(()=>{const $=i(()=>w({}),"handleUpdate");return document.addEventListener(ue,$),()=>document.removeEventListener(ue,$)},[]),a.createElement(R.div,le({},g,{ref:u,style:{pointerEvents:_?C?"auto":"none":void 0,...e.style},onFocusCapture:P(e.onFocusCapture,T.onFocusCapture),onBlurCapture:P(e.onBlurCapture,T.onBlurCapture),onPointerDownCapture:P(e.onPointerDownCapture,k.onPointerDownCapture)}))});function Ot(e,t=globalThis==null?void 0:globalThis.document){const n=j(e),r=a.useRef(!1),o=a.useRef(()=>{});return a.useEffect(()=>{const c=i(s=>{if(s.target&&!r.current){let g=function(){We($t,n,v,{discrete:!0})};i(g,"handleAndDispatchPointerDownOutsideEvent");const v={originalEvent:s};s.pointerType==="touch"?(t.removeEventListener("click",o.current),o.current=g,t.addEventListener("click",o.current,{once:!0})):g()}r.current=!1},"handlePointerDown"),l=window.setTimeout(()=>{t.addEventListener("pointerdown",c)},0);return()=>{window.clearTimeout(l),t.removeEventListener("pointerdown",c),t.removeEventListener("click",o.current)}},[t,n]),{onPointerDownCapture:()=>r.current=!0}}i(Ot,"$5cb92bef7577960e$var$usePointerDownOutside");function _t(e,t=globalThis==null?void 0:globalThis.document){const n=j(e),r=a.useRef(!1);return a.useEffect(()=>{const o=i(c=>{c.target&&!r.current&&We(yt,n,{originalEvent:c},{discrete:!1})},"handleFocus");return t.addEventListener("focusin",o),()=>t.removeEventListener("focusin",o)},[t,n]),{onFocusCapture:()=>r.current=!0,onBlurCapture:()=>r.current=!1}}i(_t,"$5cb92bef7577960e$var$useFocusOutside");function xe(){const e=new CustomEvent(ue);document.dispatchEvent(e)}i(xe,"$5cb92bef7577960e$var$dispatchUpdate");function We(e,t,n,{discrete:r}){const o=n.originalEvent.target,c=new CustomEvent(e,{bubbles:!1,cancelable:!0,detail:n});t&&o.addEventListener(e,t,{once:!0}),r?st(o,c):o.dispatchEvent(c)}i(We,"$5cb92bef7577960e$var$handleAndDispatchCustomEvent");function de(){return de=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},de.apply(this,arguments)}i(de,"_extends$2");const re="focusScope.autoFocusOnMount",oe="focusScope.autoFocusOnUnmount",De={bubbles:!1,cancelable:!0},wt=a.forwardRef((e,t)=>{const{loop:n=!1,trapped:r=!1,onMountAutoFocus:o,onUnmountAutoFocus:c,...l}=e,[s,v]=a.useState(null),g=j(o),f=j(c),d=a.useRef(null),m=B(t,u=>v(u)),h=a.useRef({paused:!1,pause(){this.paused=!0},resume(){this.paused=!1}}).current;a.useEffect(()=>{if(r){let u=function(b){if(h.paused||!s)return;const y=b.target;s.contains(y)?d.current=y:L(d.current,{select:!0})},p=function(b){h.paused||!s||s.contains(b.relatedTarget)||L(d.current,{select:!0})};return i(u,"handleFocusIn"),i(p,"handleFocusOut"),document.addEventListener("focusin",u),document.addEventListener("focusout",p),()=>{document.removeEventListener("focusin",u),document.removeEventListener("focusout",p)}}},[r,s,h.paused]),a.useEffect(()=>{if(s){Te.add(h);const u=document.activeElement;if(!s.contains(u)){const b=new CustomEvent(re,De);s.addEventListener(re,g),s.dispatchEvent(b),b.defaultPrevented||(St(Pt(Be(s)),{select:!0}),document.activeElement===u&&L(s))}return()=>{s.removeEventListener(re,g),setTimeout(()=>{const b=new CustomEvent(oe,De);s.addEventListener(oe,f),s.dispatchEvent(b),b.defaultPrevented||L(u??document.body,{select:!0}),s.removeEventListener(oe,f),Te.remove(h)},0)}}},[s,g,f,h]);const w=a.useCallback(u=>{if(!n&&!r||h.paused)return;const p=u.key==="Tab"&&!u.altKey&&!u.ctrlKey&&!u.metaKey,b=document.activeElement;if(p&&b){const y=u.currentTarget,[E,_]=xt(y);E&&_?!u.shiftKey&&b===_?(u.preventDefault(),n&&L(E,{select:!0})):u.shiftKey&&b===E&&(u.preventDefault(),n&&L(_,{select:!0})):b===y&&u.preventDefault()}},[n,r,h.paused]);return a.createElement(R.div,de({tabIndex:-1},l,{ref:m,onKeyDown:w}))});function St(e,{select:t=!1}={}){const n=document.activeElement;for(const r of e)if(L(r,{select:t}),document.activeElement!==n)return}i(St,"$d3863c46a17e8a28$var$focusFirst");function xt(e){const t=Be(e),n=Re(t,e),r=Re(t.reverse(),e);return[n,r]}i(xt,"$d3863c46a17e8a28$var$getTabbableEdges");function Be(e){const t=[],n=document.createTreeWalker(e,NodeFilter.SHOW_ELEMENT,{acceptNode:r=>{const o=r.tagName==="INPUT"&&r.type==="hidden";return r.disabled||r.hidden||o?NodeFilter.FILTER_SKIP:r.tabIndex>=0?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP}});for(;n.nextNode();)t.push(n.currentNode);return t}i(Be,"$d3863c46a17e8a28$var$getTabbableCandidates");function Re(e,t){for(const n of e)if(!Dt(n,{upTo:t}))return n}i(Re,"$d3863c46a17e8a28$var$findVisible");function Dt(e,{upTo:t}){if(getComputedStyle(e).visibility==="hidden")return!0;for(;e;){if(t!==void 0&&e===t)return!1;if(getComputedStyle(e).display==="none")return!0;e=e.parentElement}return!1}i(Dt,"$d3863c46a17e8a28$var$isHidden");function Rt(e){return e instanceof HTMLInputElement&&"select"in e}i(Rt,"$d3863c46a17e8a28$var$isSelectableInput");function L(e,{select:t=!1}={}){if(e&&e.focus){const n=document.activeElement;e.focus({preventScroll:!0}),e!==n&&Rt(e)&&t&&e.select()}}i(L,"$d3863c46a17e8a28$var$focus");const Te=Tt();function Tt(){let e=[];return{add(t){const n=e[0];t!==n&&(n==null||n.pause()),e=Pe(e,t),e.unshift(t)},remove(t){var n;e=Pe(e,t),(n=e[0])===null||n===void 0||n.resume()}}}i(Tt,"$d3863c46a17e8a28$var$createFocusScopesStack");function Pe(e,t){const n=[...e],r=n.indexOf(t);return r!==-1&&n.splice(r,1),n}i(Pe,"$d3863c46a17e8a28$var$arrayRemove");function Pt(e){return e.filter(t=>t.tagName!=="A")}i(Pt,"$d3863c46a17e8a28$var$removeLinks");function fe(){return fe=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},fe.apply(this,arguments)}i(fe,"_extends$1");const Mt=a.forwardRef((e,t)=>{var n;const{container:r=globalThis==null||(n=globalThis.document)===null||n===void 0?void 0:n.body,...o}=e;return r?vt.createPortal(a.createElement(R.div,fe({},o,{ref:t})),r):null});let ae=0;function Lt(){a.useEffect(()=>{var e,t;const n=document.querySelectorAll("[data-radix-focus-guard]");return document.body.insertAdjacentElement("afterbegin",(e=n[0])!==null&&e!==void 0?e:Me()),document.body.insertAdjacentElement("beforeend",(t=n[1])!==null&&t!==void 0?t:Me()),ae++,()=>{ae===1&&document.querySelectorAll("[data-radix-focus-guard]").forEach(r=>r.remove()),ae--}},[])}i(Lt,"$3db38b7d1fb3fe6a$export$b7ece24a22aeda8c");function Me(){const e=document.createElement("span");return e.setAttribute("data-radix-focus-guard",""),e.tabIndex=0,e.style.cssText="outline: none; opacity: 0; position: fixed; pointer-events: none",e}i(Me,"$3db38b7d1fb3fe6a$var$createFocusGuard");var D=i(function(){return D=Object.assign||i(function(t){for(var n,r=1,o=arguments.length;r<o;r++){n=arguments[r];for(var c in n)Object.prototype.hasOwnProperty.call(n,c)&&(t[c]=n[c])}return t},"__assign"),D.apply(this,arguments)},"__assign");function Ue(e,t){var n={};for(var r in e)Object.prototype.hasOwnProperty.call(e,r)&&t.indexOf(r)<0&&(n[r]=e[r]);if(e!=null&&typeof Object.getOwnPropertySymbols=="function")for(var o=0,r=Object.getOwnPropertySymbols(e);o<r.length;o++)t.indexOf(r[o])<0&&Object.prototype.propertyIsEnumerable.call(e,r[o])&&(n[r[o]]=e[r[o]]);return n}i(Ue,"__rest");function It(e,t,n){if(n||arguments.length===2)for(var r=0,o=t.length,c;r<o;r++)(c||!(r in t))&&(c||(c=Array.prototype.slice.call(t,0,r)),c[r]=t[r]);return e.concat(c||Array.prototype.slice.call(t))}i(It,"__spreadArray");var G="right-scroll-bar-position",Y="width-before-scroll-bar",At="with-scroll-bars-hidden",Nt="--removed-body-scroll-bar-size";function Ft(e,t){return typeof e=="function"?e(t):e&&(e.current=t),e}i(Ft,"assignRef");function kt(e,t){var n=a.useState(function(){return{value:e,callback:t,facade:{get current(){return n.value},set current(r){var o=n.value;o!==r&&(n.value=r,n.callback(r,o))}}}})[0];return n.callback=t,n.facade}i(kt,"useCallbackRef");function jt(e,t){return kt(t||null,function(n){return e.forEach(function(r){return Ft(r,n)})})}i(jt,"useMergeRefs");function Wt(e){return e}i(Wt,"ItoI");function Bt(e,t){t===void 0&&(t=Wt);var n=[],r=!1,o={read:function(){if(r)throw new Error("Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.");return n.length?n[n.length-1]:e},useMedium:function(c){var l=t(c,r);return n.push(l),function(){n=n.filter(function(s){return s!==l})}},assignSyncMedium:function(c){for(r=!0;n.length;){var l=n;n=[],l.forEach(c)}n={push:function(s){return c(s)},filter:function(){return n}}},assignMedium:function(c){r=!0;var l=[];if(n.length){var s=n;n=[],s.forEach(c),l=n}var v=i(function(){var f=l;l=[],f.forEach(c)},"executeQueue"),g=i(function(){return Promise.resolve().then(v)},"cycle");g(),n={push:function(f){l.push(f),g()},filter:function(f){return l=l.filter(f),n}}}};return o}i(Bt,"innerCreateMedium");function Ut(e){e===void 0&&(e={});var t=Bt(null);return t.options=D({async:!0,ssr:!1},e),t}i(Ut,"createSidecarMedium");var qe=i(function(e){var t=e.sideCar,n=Ue(e,["sideCar"]);if(!t)throw new Error("Sidecar: please provide `sideCar` property to import the right car");var r=t.read();if(!r)throw new Error("Sidecar medium not found");return a.createElement(r,D({},n))},"SideCar$1");qe.isSideCarExport=!0;function qt(e,t){return e.useMedium(t),qe}i(qt,"exportSidecar");var He=Ut(),ce=i(function(){},"nothing"),Z=a.forwardRef(function(e,t){var n=a.useRef(null),r=a.useState({onScrollCapture:ce,onWheelCapture:ce,onTouchMoveCapture:ce}),o=r[0],c=r[1],l=e.forwardProps,s=e.children,v=e.className,g=e.removeScrollBar,f=e.enabled,d=e.shards,m=e.sideCar,h=e.noIsolation,w=e.inert,u=e.allowPinchZoom,p=e.as,b=p===void 0?"div":p,y=Ue(e,["forwardProps","children","className","removeScrollBar","enabled","shards","sideCar","noIsolation","inert","allowPinchZoom","as"]),E=m,_=jt([n,t]),C=D(D({},y),o);return a.createElement(a.Fragment,null,f&&a.createElement(E,{sideCar:He,removeScrollBar:g,shards:d,noIsolation:h,inert:w,setCallbacks:c,allowPinchZoom:!!u,lockRef:n}),l?a.cloneElement(a.Children.only(s),D(D({},C),{ref:_})):a.createElement(b,D({},C,{className:v,ref:_}),s))});Z.defaultProps={enabled:!0,removeScrollBar:!0,inert:!1};Z.classNames={fullWidth:Y,zeroRight:G};var Le,Ht=i(function(){if(Le)return Le;if(typeof __webpack_nonce__<"u")return __webpack_nonce__},"getNonce");function Vt(){if(!document)return null;var e=document.createElement("style");e.type="text/css";var t=Ht();return t&&e.setAttribute("nonce",t),e}i(Vt,"makeStyleTag");function Kt(e,t){e.styleSheet?e.styleSheet.cssText=t:e.appendChild(document.createTextNode(t))}i(Kt,"injectStyles");function zt(e){var t=document.head||document.getElementsByTagName("head")[0];t.appendChild(e)}i(zt,"insertStyleTag");var Xt=i(function(){var e=0,t=null;return{add:function(n){e==0&&(t=Vt())&&(Kt(t,n),zt(t)),e++},remove:function(){e--,!e&&t&&(t.parentNode&&t.parentNode.removeChild(t),t=null)}}},"stylesheetSingleton"),Gt=i(function(){var e=Xt();return function(t,n){a.useEffect(function(){return e.add(t),function(){e.remove()}},[t&&n])}},"styleHookSingleton"),Ve=i(function(){var e=Gt(),t=i(function(n){var r=n.styles,o=n.dynamic;return e(r,o),null},"Sheet");return t},"styleSingleton"),Yt={left:0,top:0,right:0,gap:0},ie=i(function(e){return parseInt(e||"",10)||0},"parse"),Qt=i(function(e){var t=window.getComputedStyle(document.body),n=t[e==="padding"?"paddingLeft":"marginLeft"],r=t[e==="padding"?"paddingTop":"marginTop"],o=t[e==="padding"?"paddingRight":"marginRight"];return[ie(n),ie(r),ie(o)]},"getOffset"),Zt=i(function(e){if(e===void 0&&(e="margin"),typeof window>"u")return Yt;var t=Qt(e),n=document.documentElement.clientWidth,r=window.innerWidth;return{left:t[0],top:t[1],right:t[2],gap:Math.max(0,r-n+t[2]-t[0])}},"getGapWidth"),Jt=Ve(),en=i(function(e,t,n,r){var o=e.left,c=e.top,l=e.right,s=e.gap;return n===void 0&&(n="margin"),`
  .`.concat(At,` {
   overflow: hidden `).concat(r,`;
   padding-right: `).concat(s,"px ").concat(r,`;
  }
  body {
    overflow: hidden `).concat(r,`;
    overscroll-behavior: contain;
    `).concat([t&&"position: relative ".concat(r,";"),n==="margin"&&`
    padding-left: `.concat(o,`px;
    padding-top: `).concat(c,`px;
    padding-right: `).concat(l,`px;
    margin-left:0;
    margin-top:0;
    margin-right: `).concat(s,"px ").concat(r,`;
    `),n==="padding"&&"padding-right: ".concat(s,"px ").concat(r,";")].filter(Boolean).join(""),`
  }
  
  .`).concat(G,` {
    right: `).concat(s,"px ").concat(r,`;
  }
  
  .`).concat(Y,` {
    margin-right: `).concat(s,"px ").concat(r,`;
  }
  
  .`).concat(G," .").concat(G,` {
    right: 0 `).concat(r,`;
  }
  
  .`).concat(Y," .").concat(Y,` {
    margin-right: 0 `).concat(r,`;
  }
  
  body {
    `).concat(Nt,": ").concat(s,`px;
  }
`)},"getStyles"),tn=i(function(e){var t=e.noRelative,n=e.noImportant,r=e.gapMode,o=r===void 0?"margin":r,c=a.useMemo(function(){return Zt(o)},[o]);return a.createElement(Jt,{styles:en(c,!t,o,n?"":"!important")})},"RemoveScrollBar"),ve=!1;if(typeof window<"u")try{var q=Object.defineProperty({},"passive",{get:function(){return ve=!0,!0}});window.addEventListener("test",q,q),window.removeEventListener("test",q,q)}catch{ve=!1}var A=ve?{passive:!1}:!1,nn=i(function(e){return e.tagName==="TEXTAREA"},"alwaysContainsScroll"),Ke=i(function(e,t){var n=window.getComputedStyle(e);return n[t]!=="hidden"&&!(n.overflowY===n.overflowX&&!nn(e)&&n[t]==="visible")},"elementCanBeScrolled"),rn=i(function(e){return Ke(e,"overflowY")},"elementCouldBeVScrolled"),on=i(function(e){return Ke(e,"overflowX")},"elementCouldBeHScrolled"),Ie=i(function(e,t){var n=t;do{typeof ShadowRoot<"u"&&n instanceof ShadowRoot&&(n=n.host);var r=ze(e,n);if(r){var o=Xe(e,n),c=o[1],l=o[2];if(c>l)return!0}n=n.parentNode}while(n&&n!==document.body);return!1},"locationCouldBeScrolled"),an=i(function(e){var t=e.scrollTop,n=e.scrollHeight,r=e.clientHeight;return[t,n,r]},"getVScrollVariables"),cn=i(function(e){var t=e.scrollLeft,n=e.scrollWidth,r=e.clientWidth;return[t,n,r]},"getHScrollVariables"),ze=i(function(e,t){return e==="v"?rn(t):on(t)},"elementCouldBeScrolled"),Xe=i(function(e,t){return e==="v"?an(t):cn(t)},"getScrollVariables"),sn=i(function(e,t){return e==="h"&&t==="rtl"?-1:1},"getDirectionFactor"),ln=i(function(e,t,n,r,o){var c=sn(e,window.getComputedStyle(t).direction),l=c*r,s=n.target,v=t.contains(s),g=!1,f=l>0,d=0,m=0;do{var h=Xe(e,s),w=h[0],u=h[1],p=h[2],b=u-p-c*w;(w||b)&&ze(e,s)&&(d+=b,m+=w),s=s.parentNode}while(!v&&s!==document.body||v&&(t.contains(s)||t===s));return(f&&(o&&d===0||!o&&l>d)||!f&&(o&&m===0||!o&&-l>m))&&(g=!0),g},"handleScroll"),H=i(function(e){return"changedTouches"in e?[e.changedTouches[0].clientX,e.changedTouches[0].clientY]:[0,0]},"getTouchXY"),Ae=i(function(e){return[e.deltaX,e.deltaY]},"getDeltaXY"),Ne=i(function(e){return e&&"current"in e?e.current:e},"extractRef"),un=i(function(e,t){return e[0]===t[0]&&e[1]===t[1]},"deltaCompare"),dn=i(function(e){return`
  .block-interactivity-`.concat(e,` {pointer-events: none;}
  .allow-interactivity-`).concat(e,` {pointer-events: all;}
`)},"generateStyle"),fn=0,N=[];function vn(e){var t=a.useRef([]),n=a.useRef([0,0]),r=a.useRef(),o=a.useState(fn++)[0],c=a.useState(function(){return Ve()})[0],l=a.useRef(e);a.useEffect(function(){l.current=e},[e]),a.useEffect(function(){if(e.inert){document.body.classList.add("block-interactivity-".concat(o));var u=It([e.lockRef.current],(e.shards||[]).map(Ne),!0).filter(Boolean);return u.forEach(function(p){return p.classList.add("allow-interactivity-".concat(o))}),function(){document.body.classList.remove("block-interactivity-".concat(o)),u.forEach(function(p){return p.classList.remove("allow-interactivity-".concat(o))})}}},[e.inert,e.lockRef.current,e.shards]);var s=a.useCallback(function(u,p){if("touches"in u&&u.touches.length===2)return!l.current.allowPinchZoom;var b=H(u),y=n.current,E="deltaX"in u?u.deltaX:y[0]-b[0],_="deltaY"in u?u.deltaY:y[1]-b[1],C,k=u.target,T=Math.abs(E)>Math.abs(_)?"h":"v";if("touches"in u&&T==="h"&&k.type==="range")return!1;var $=Ie(T,k);if(!$)return!0;if($?C=T:(C=T==="v"?"h":"v",$=Ie(T,k)),!$)return!1;if(!r.current&&"changedTouches"in u&&(E||_)&&(r.current=C),!C)return!0;var M=r.current||C;return ln(M,p,u,M==="h"?E:_,!0)},[]),v=a.useCallback(function(u){var p=u;if(!(!N.length||N[N.length-1]!==c)){var b="deltaY"in p?Ae(p):H(p),y=t.current.filter(function(C){return C.name===p.type&&C.target===p.target&&un(C.delta,b)})[0];if(y&&y.should){p.cancelable&&p.preventDefault();return}if(!y){var E=(l.current.shards||[]).map(Ne).filter(Boolean).filter(function(C){return C.contains(p.target)}),_=E.length>0?s(p,E[0]):!l.current.noIsolation;_&&p.cancelable&&p.preventDefault()}}},[]),g=a.useCallback(function(u,p,b,y){var E={name:u,delta:p,target:b,should:y};t.current.push(E),setTimeout(function(){t.current=t.current.filter(function(_){return _!==E})},1)},[]),f=a.useCallback(function(u){n.current=H(u),r.current=void 0},[]),d=a.useCallback(function(u){g(u.type,Ae(u),u.target,s(u,e.lockRef.current))},[]),m=a.useCallback(function(u){g(u.type,H(u),u.target,s(u,e.lockRef.current))},[]);a.useEffect(function(){return N.push(c),e.setCallbacks({onScrollCapture:d,onWheelCapture:d,onTouchMoveCapture:m}),document.addEventListener("wheel",v,A),document.addEventListener("touchmove",v,A),document.addEventListener("touchstart",f,A),function(){N=N.filter(function(u){return u!==c}),document.removeEventListener("wheel",v,A),document.removeEventListener("touchmove",v,A),document.removeEventListener("touchstart",f,A)}},[]);var h=e.removeScrollBar,w=e.inert;return a.createElement(a.Fragment,null,w?a.createElement(c,{styles:dn(o)}):null,h?a.createElement(tn,{gapMode:"margin"}):null)}i(vn,"RemoveScrollSideCar");const pn=qt(He,vn);var Ge=a.forwardRef(function(e,t){return a.createElement(Z,D({},e,{ref:t,sideCar:pn}))});Ge.classNames=Z.classNames;const mn=Ge;var hn=i(function(e){if(typeof document>"u")return null;var t=Array.isArray(e)?e[0]:e;return t.ownerDocument.body},"getDefaultParent"),F=new WeakMap,V=new WeakMap,K={},se=0,Ye=i(function(e){return e&&(e.host||Ye(e.parentNode))},"unwrapHost"),gn=i(function(e,t){return t.map(function(n){if(e.contains(n))return n;var r=Ye(n);return r&&e.contains(r)?r:(console.error("aria-hidden",n,"in not contained inside",e,". Doing nothing"),null)}).filter(function(n){return Boolean(n)})},"correctTargets"),bn=i(function(e,t,n,r){var o=gn(t,Array.isArray(e)?e:[e]);K[n]||(K[n]=new WeakMap);var c=K[n],l=[],s=new Set,v=new Set(o),g=i(function(d){!d||s.has(d)||(s.add(d),g(d.parentNode))},"keep");o.forEach(g);var f=i(function(d){!d||v.has(d)||Array.prototype.forEach.call(d.children,function(m){if(s.has(m))f(m);else{var h=m.getAttribute(r),w=h!==null&&h!=="false",u=(F.get(m)||0)+1,p=(c.get(m)||0)+1;F.set(m,u),c.set(m,p),l.push(m),u===1&&w&&V.set(m,!0),p===1&&m.setAttribute(n,"true"),w||m.setAttribute(r,"true")}})},"deep");return f(t),s.clear(),se++,function(){l.forEach(function(d){var m=F.get(d)-1,h=c.get(d)-1;F.set(d,m),c.set(d,h),m||(V.has(d)||d.removeAttribute(r),V.delete(d)),h||d.removeAttribute(n)}),se--,se||(F=new WeakMap,F=new WeakMap,V=new WeakMap,K={})}},"applyAttributeToOthers"),$n=i(function(e,t,n){n===void 0&&(n="data-aria-hidden");var r=Array.from(Array.isArray(e)?e:[e]),o=t||hn(e);return o?(r.push.apply(r,Array.from(o.querySelectorAll("[aria-live]"))),bn(r,o,n,"aria-hidden")):function(){return null}},"hideOthers");const Qe="Dialog",[Ze,Dr]=lt(Qe),[yn,x]=Ze(Qe),En=i(e=>{const{__scopeDialog:t,children:n,open:r,defaultOpen:o,onOpenChange:c,modal:l=!0}=e,s=a.useRef(null),v=a.useRef(null),[g=!1,f]=dt({prop:r,defaultProp:o,onChange:c});return a.createElement(yn,{scope:t,triggerRef:s,contentRef:v,contentId:ne(),titleId:ne(),descriptionId:ne(),open:g,onOpenChange:f,onOpenToggle:a.useCallback(()=>f(d=>!d),[f]),modal:l},n)},"$5d3850c4d0b4e6c7$export$3ddf2d174ce01153"),Cn="DialogTrigger",On=a.forwardRef((e,t)=>{const{__scopeDialog:n,...r}=e,o=x(Cn,n),c=B(t,o.triggerRef);return a.createElement(R.button,S({type:"button","aria-haspopup":"dialog","aria-expanded":o.open,"aria-controls":o.contentId,"data-state":ye(o.open)},r,{ref:c,onClick:P(e.onClick,o.onOpenToggle)}))}),Je="DialogPortal",[_n,et]=Ze(Je,{forceMount:void 0}),wn=i(e=>{const{__scopeDialog:t,forceMount:n,children:r,container:o}=e,c=x(Je,t);return a.createElement(_n,{scope:t,forceMount:n},a.Children.map(r,l=>a.createElement($e,{present:n||c.open},a.createElement(Mt,{asChild:!0,container:o},l))))},"$5d3850c4d0b4e6c7$export$dad7c95542bacce0"),pe="DialogOverlay",Sn=a.forwardRef((e,t)=>{const n=et(pe,e.__scopeDialog),{forceMount:r=n.forceMount,...o}=e,c=x(pe,e.__scopeDialog);return c.modal?a.createElement($e,{present:r||c.open},a.createElement(xn,S({},o,{ref:t}))):null}),xn=a.forwardRef((e,t)=>{const{__scopeDialog:n,...r}=e,o=x(pe,n);return a.createElement(mn,{as:ut,allowPinchZoom:!0,shards:[o.contentRef]},a.createElement(R.div,S({"data-state":ye(o.open)},r,{ref:t,style:{pointerEvents:"auto",...r.style}})))}),W="DialogContent",Dn=a.forwardRef((e,t)=>{const n=et(W,e.__scopeDialog),{forceMount:r=n.forceMount,...o}=e,c=x(W,e.__scopeDialog);return a.createElement($e,{present:r||c.open},c.modal?a.createElement(Rn,S({},o,{ref:t})):a.createElement(Tn,S({},o,{ref:t})))}),Rn=a.forwardRef((e,t)=>{const n=x(W,e.__scopeDialog),r=a.useRef(null),o=B(t,n.contentRef,r);return a.useEffect(()=>{const c=r.current;if(c)return $n(c)},[]),a.createElement(tt,S({},e,{ref:o,trapFocus:n.open,disableOutsidePointerEvents:!0,onCloseAutoFocus:P(e.onCloseAutoFocus,c=>{var l;c.preventDefault(),(l=n.triggerRef.current)===null||l===void 0||l.focus()}),onPointerDownOutside:P(e.onPointerDownOutside,c=>{const l=c.detail.originalEvent,s=l.button===0&&l.ctrlKey===!0;(l.button===2||s)&&c.preventDefault()}),onFocusOutside:P(e.onFocusOutside,c=>c.preventDefault())}))}),Tn=a.forwardRef((e,t)=>{const n=x(W,e.__scopeDialog),r=a.useRef(!1);return a.createElement(tt,S({},e,{ref:t,trapFocus:!1,disableOutsidePointerEvents:!1,onCloseAutoFocus:o=>{var c;if((c=e.onCloseAutoFocus)===null||c===void 0||c.call(e,o),!o.defaultPrevented){var l;r.current||(l=n.triggerRef.current)===null||l===void 0||l.focus(),o.preventDefault()}r.current=!1},onInteractOutside:o=>{var c,l;(c=e.onInteractOutside)===null||c===void 0||c.call(e,o),o.defaultPrevented||(r.current=!0);const s=o.target;((l=n.triggerRef.current)===null||l===void 0?void 0:l.contains(s))&&o.preventDefault()}}))}),tt=a.forwardRef((e,t)=>{const{__scopeDialog:n,trapFocus:r,onOpenAutoFocus:o,onCloseAutoFocus:c,...l}=e,s=x(W,n),v=a.useRef(null),g=B(t,v);return Lt(),a.createElement(a.Fragment,null,a.createElement(wt,{asChild:!0,loop:!0,trapped:r,onMountAutoFocus:o,onUnmountAutoFocus:c},a.createElement(Ct,S({role:"dialog",id:s.contentId,"aria-describedby":s.descriptionId,"aria-labelledby":s.titleId,"data-state":ye(s.open)},l,{ref:g,onDismiss:()=>s.onOpenChange(!1)}))),!1)}),Pn="DialogTitle",Mn=a.forwardRef((e,t)=>{const{__scopeDialog:n,...r}=e,o=x(Pn,n);return a.createElement(R.h2,S({id:o.titleId},r,{ref:t}))}),Ln="DialogDescription",In=a.forwardRef((e,t)=>{const{__scopeDialog:n,...r}=e,o=x(Ln,n);return a.createElement(R.p,S({id:o.descriptionId},r,{ref:t}))}),An="DialogClose",Nn=a.forwardRef((e,t)=>{const{__scopeDialog:n,...r}=e,o=x(An,n);return a.createElement(R.button,S({type:"button"},r,{ref:t,onClick:P(e.onClick,()=>o.onOpenChange(!1))}))});function ye(e){return e?"open":"closed"}i(ye,"$5d3850c4d0b4e6c7$var$getState");const Fn=En,kn=On,jn=wn,Wn=Sn,Bn=Dn,Un=Mn,qn=In,Hn=Nn;function me(){return me=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},me.apply(this,arguments)}i(me,"_extends");const he="horizontal",Vn=["horizontal","vertical"],nt=a.forwardRef((e,t)=>{const{decorative:n,orientation:r=he,...o}=e,c=rt(r)?r:he,s=n?{role:"none"}:{"aria-orientation":c==="vertical"?c:void 0,role:"separator"};return a.createElement(R.div,me({"data-orientation":c},s,o,{ref:t}))});nt.propTypes={orientation(e,t,n){const r=e[t],o=String(r);return r&&!rt(r)?new Error(Kn(o,n)):null}};function Kn(e,t){return`Invalid prop \`orientation\` of value \`${e}\` supplied to \`${t}\`, expected one of:
  - horizontal
  - vertical

Defaulting to \`${he}\`.`}i(Kn,"$89eedd556c436f6a$var$getInvalidOrientationError");function rt(e){return Vn.includes(e)}i(rt,"$89eedd556c436f6a$var$isValidOrientation");const zn=nt;var Xn=ft("x","IconX",[["path",{d:"M18 6l-12 12",key:"svg-0"}],["path",{d:"M6 6l12 12",key:"svg-1"}]]),J={},ot={},U={},ee={};Object.defineProperty(ee,"__esModule",{value:!0});function Gn(e){return e.replace(/[A-Z]/g,function(t){return"-"+t.toLowerCase()}).toLowerCase()}i(Gn,"camelToHyphen");ee.default=Gn;var Ee={};Object.defineProperty(Ee,"__esModule",{value:!0});var Yn=ee,Qn=" and ";function Zn(e){return typeof e=="string"?e:Object.entries(e).map(function(t){var n=t[0],r=t[1],o=Yn.default(n),c=r;return typeof c=="boolean"?c?o:"not "+o:(typeof c=="number"&&/[height|width]$/.test(o)&&(c=c+"px"),"("+o+": "+c+")")}).join(Qn)}i(Zn,"queryObjectToString");Ee.default=Zn;var Ce={};Object.defineProperty(Ce,"__esModule",{value:!0});function Jn(){}i(Jn,"noop");Ce.default=Jn;Object.defineProperty(U,"__esModule",{value:!0});var er=ee;U.camelToHyphen=er.default;var tr=Ee;U.queryObjectToString=tr.default;var nr=Ce;U.noop=nr.default;(function(e){Object.defineProperty(e,"__esModule",{value:!0});var t=a,n=U;e.mockMediaQueryList={media:"",matches:!1,onchange:n.noop,addListener:n.noop,removeListener:n.noop,addEventListener:n.noop,removeEventListener:n.noop,dispatchEvent:function(o){return!0}};var r=i(function(o){return function(c,l){l===void 0&&(l=!1);var s=t.useState(l),v=s[0],g=s[1],f=n.queryObjectToString(c);return o(function(){var d=!0,m=typeof window>"u"?e.mockMediaQueryList:window.matchMedia(f),h=i(function(){d&&g(Boolean(m.matches))},"onChange");return m.addListener(h),g(m.matches),function(){d=!1,m.removeListener(h)}},[f]),v}},"createUseMedia");e.useMedia=r(t.useEffect),e.useMediaLayout=r(t.useLayoutEffect),e.default=e.useMedia})(ot);Object.defineProperty(J,"__esModule",{value:!0});var Oe=ot;J.default=Oe.default;var z=J.useMedia=Oe.useMedia;J.useMediaLayout=Oe.useMediaLayout;const Fe=1440,ke=1024,je=700,X={xl:`screen and (min-width: ${Fe}px)`,lg:`screen and (min-width: ${ke}px) and (max-width: ${Fe-1}px)`,md:`screen and (min-width: ${je}px) and (max-width: ${ke-1}px)`,sm:`screen and (max-width: ${je-1}px)`};var rr="rh21qc6",or="rh21qc7",ar="rh21qc2",cr="rh21qc4",ir="rh21qc8",sr="rh21qc0",lr="rh21qc3 _1peap286 _1peap284",ur="rh21qc5",dr="rh21qc1";const at=a.createContext({open:!1}),fr={from:{opacity:.1,transform:"translate(-50%, -25%)"},enter:{opacity:1,transform:"translate(-50%, -50%)"},leave:{opacity:0,transform:"translate(-50%, -25%)"},config:{mass:.8,tension:140,friction:16,precision:.016,velocity:.015}},vr={from:{opacity:1,transform:"translate(0%, 100%) scale(1)"},enter:{opacity:1,transform:"translate(0%, 0%) scale(1)"},leave:{op25ity:1,transform:"translate(0%, 100%) scale(1)"},config:{tension:280,friction:30,precision:.013,velocity:.016}},Q=a.memo(a.forwardRef(({children:e,title:t,description:n},r)=>{const{open:o,size:c}=a.useContext(at),l=mt(o,c!=="sm"?fr:vr);return O(jn,{forceMount:!0,children:l((s,v)=>O(we,{children:v?I(we,{children:[O(Wn,{className:sr}),O(Bn,{ref:r,children:I(ht.div,{style:s,className:ar,children:[I("div",{className:cr,children:[I("div",{className:ur,children:[O(Un,{className:lr,children:t}),O(Hn,{asChild:!0,children:O("button",{"aria-label":"Close",className:or,children:O(Xn,{className:ir})})})]}),n?O(qn,{children:n}):null,O(zn,{className:rr})]}),O(pt,{orientation:"vertical",scrollbar:"all",children:e})]})})]}):null}))})})),ge=a.memo(a.forwardRef(({className:e,...t},n)=>O(kn,{...t,ref:n,className:gt(dr,e)}))),be=a.memo(({children:e,...t})=>{const[n,r]=a.useState(t.open??!1),o=z(X.xl),c=z(X.lg),l=z(X.sm),s=z(X.md),v=a.useMemo(()=>{if(o)return"xl";if(c)return"lg";if(s)return"md";if(l)return"sm"},[c,s,l,o]),g=a.useCallback(d=>{var m;(m=t.onOpenChange)==null||m.call(t,d),r(t.open??d)},[t]),f=a.useMemo(()=>({open:t.open??n,size:v}),[n,t.open,v]);return O(at.Provider,{value:f,children:a.createElement(Fn,{...t,onOpenChange:g,key:v},e)})});try{Q.displayName="DialogContent",Q.__docgenInfo={description:"",displayName:"DialogContent",props:{title:{defaultValue:null,description:"",name:"title",required:!0,type:{name:"ReactNode"}},description:{defaultValue:null,description:"",name:"description",required:!1,type:{name:"ReactNode"}}}}}catch{}try{ge.displayName="DialogTrigger",ge.__docgenInfo={description:"",displayName:"DialogTrigger",props:{asChild:{defaultValue:null,description:"",name:"asChild",required:!1,type:{name:"boolean"}}}}}catch{}try{be.displayName="DialogRoot",be.__docgenInfo={description:"",displayName:"DialogRoot",props:{}}}catch{}const Rr={title:"components/Dialog",component:Q,argTypes:{title:{type:"string"},description:{type:"string"},open:{control:{type:"boolean"}}}},ct=i(({open:e,...t})=>I(be,{open:e,children:[O(ge,{asChild:!0,children:O("button",{children:"open"})}),I(Q,{...t,title:t.title||"ダイアログ",children:[O("p",{children:"これはダイアログです。"}),I("div",{children:[O("button",{children:"ok"}),O("button",{children:"cancel"})]})]})]}),"Template"),pr=ct.bind({});pr.args={title:"ダイアログ"};const mr=ct.bind({});mr.args={open:!0};const Tr=["Default","Open"];export{pr as Default,mr as Open,Tr as __namedExportsOrder,Rr as default};
//# sourceMappingURL=dialog.stories-5b16d6a1.js.map
