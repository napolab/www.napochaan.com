var ct=Object.defineProperty;var s=(e,t)=>ct(e,"name",{value:t,configurable:!0});import{j as _,a as I,F as it}from"./jsx-runtime-63255f68.js";import{r as a}from"./index-2e0ef46d.js";import{$ as j,a as B,b as R,c as M,d as st,e as lt,f as ut}from"./index-9b21b1fe.js";import{$ as dt,a as ne,c as ft}from"./createReactComponent-eac322a6.js";import{R as vt}from"./index-1e6a67dc.js";import{$ as $e,S as pt}from"./index-ce0b001c.js";import{u as mt,a as ht}from"./react-spring_web.modern-1efb0a0b.js";/* empty css                              */import{c as gt}from"./clsx-705c78bf.js";import"./iframe-28b35100.js";import"./index-20ec0d9d.js";function D(){return D=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},D.apply(this,arguments)}s(D,"_extends$4");function le(){return le=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},le.apply(this,arguments)}s(le,"_extends$3");function bt(e,t=globalThis==null?void 0:globalThis.document){const n=j(e);a.useEffect(()=>{const r=s(o=>{o.key==="Escape"&&n(o)},"handleKeyDown");return t.addEventListener("keydown",r),()=>t.removeEventListener("keydown",r)},[n,t])}s(bt,"$addc16e1bbe58fd0$export$3a72a57244d6e765");const ue="dismissableLayer.update",$t="dismissableLayer.pointerDownOutside",yt="dismissableLayer.focusOutside";let we;const Et=a.createContext({layers:new Set,layersWithOutsidePointerEventsDisabled:new Set,branches:new Set}),Ct=a.forwardRef((e,t)=>{var n;const{disableOutsidePointerEvents:r=!1,onEscapeKeyDown:o,onPointerDownOutside:c,onFocusOutside:l,onInteractOutside:i,onDismiss:v,...h}=e,f=a.useContext(Et),[d,m]=a.useState(null),g=(n=d==null?void 0:d.ownerDocument)!==null&&n!==void 0?n:globalThis==null?void 0:globalThis.document,[,w]=a.useState({}),u=B(t,E=>m(E)),p=Array.from(f.layers),[b]=[...f.layersWithOutsidePointerEventsDisabled].slice(-1),O=p.indexOf(b),$=d?p.indexOf(d):-1,y=f.layersWithOutsidePointerEventsDisabled.size>0,C=$>=O,k=Ot(E=>{const L=E.target,_e=[...f.branches].some(te=>te.contains(L));!C||_e||(c==null||c(E),i==null||i(E),E.defaultPrevented||v==null||v())},g),T=_t(E=>{const L=E.target;[...f.branches].some(te=>te.contains(L))||(l==null||l(E),i==null||i(E),E.defaultPrevented||v==null||v())},g);return bt(E=>{$===f.layers.size-1&&(o==null||o(E),!E.defaultPrevented&&v&&(E.preventDefault(),v()))},g),a.useEffect(()=>{if(d)return r&&(f.layersWithOutsidePointerEventsDisabled.size===0&&(we=g.body.style.pointerEvents,g.body.style.pointerEvents="none"),f.layersWithOutsidePointerEventsDisabled.add(d)),f.layers.add(d),De(),()=>{r&&f.layersWithOutsidePointerEventsDisabled.size===1&&(g.body.style.pointerEvents=we)}},[d,g,r,f]),a.useEffect(()=>()=>{d&&(f.layers.delete(d),f.layersWithOutsidePointerEventsDisabled.delete(d),De())},[d,f]),a.useEffect(()=>{const E=s(()=>w({}),"handleUpdate");return document.addEventListener(ue,E),()=>document.removeEventListener(ue,E)},[]),a.createElement(R.div,le({},h,{ref:u,style:{pointerEvents:y?C?"auto":"none":void 0,...e.style},onFocusCapture:M(e.onFocusCapture,T.onFocusCapture),onBlurCapture:M(e.onBlurCapture,T.onBlurCapture),onPointerDownCapture:M(e.onPointerDownCapture,k.onPointerDownCapture)}))});function Ot(e,t=globalThis==null?void 0:globalThis.document){const n=j(e),r=a.useRef(!1),o=a.useRef(()=>{});return a.useEffect(()=>{const c=s(i=>{if(i.target&&!r.current){let h=function(){je($t,n,v,{discrete:!0})};s(h,"handleAndDispatchPointerDownOutsideEvent");const v={originalEvent:i};i.pointerType==="touch"?(t.removeEventListener("click",o.current),o.current=h,t.addEventListener("click",o.current,{once:!0})):h()}r.current=!1},"handlePointerDown"),l=window.setTimeout(()=>{t.addEventListener("pointerdown",c)},0);return()=>{window.clearTimeout(l),t.removeEventListener("pointerdown",c),t.removeEventListener("click",o.current)}},[t,n]),{onPointerDownCapture:()=>r.current=!0}}s(Ot,"$5cb92bef7577960e$var$usePointerDownOutside");function _t(e,t=globalThis==null?void 0:globalThis.document){const n=j(e),r=a.useRef(!1);return a.useEffect(()=>{const o=s(c=>{c.target&&!r.current&&je(yt,n,{originalEvent:c},{discrete:!1})},"handleFocus");return t.addEventListener("focusin",o),()=>t.removeEventListener("focusin",o)},[t,n]),{onFocusCapture:()=>r.current=!0,onBlurCapture:()=>r.current=!1}}s(_t,"$5cb92bef7577960e$var$useFocusOutside");function De(){const e=new CustomEvent(ue);document.dispatchEvent(e)}s(De,"$5cb92bef7577960e$var$dispatchUpdate");function je(e,t,n,{discrete:r}){const o=n.originalEvent.target,c=new CustomEvent(e,{bubbles:!1,cancelable:!0,detail:n});t&&o.addEventListener(e,t,{once:!0}),r?st(o,c):o.dispatchEvent(c)}s(je,"$5cb92bef7577960e$var$handleAndDispatchCustomEvent");function de(){return de=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},de.apply(this,arguments)}s(de,"_extends$2");const re="focusScope.autoFocusOnMount",oe="focusScope.autoFocusOnUnmount",Se={bubbles:!1,cancelable:!0},wt=a.forwardRef((e,t)=>{const{loop:n=!1,trapped:r=!1,onMountAutoFocus:o,onUnmountAutoFocus:c,...l}=e,[i,v]=a.useState(null),h=j(o),f=j(c),d=a.useRef(null),m=B(t,u=>v(u)),g=a.useRef({paused:!1,pause(){this.paused=!0},resume(){this.paused=!1}}).current;a.useEffect(()=>{if(r){let u=function($){if(g.paused||!i)return;const y=$.target;i.contains(y)?d.current=y:P(d.current,{select:!0})},p=function($){if(g.paused||!i)return;const y=$.relatedTarget;y!==null&&(i.contains(y)||P(d.current,{select:!0}))},b=function($){const y=document.activeElement;for(const C of $)C.removedNodes.length>0&&(i!=null&&i.contains(y)||P(i))};s(u,"handleFocusIn"),s(p,"handleFocusOut"),s(b,"handleMutations"),document.addEventListener("focusin",u),document.addEventListener("focusout",p);const O=new MutationObserver(b);return i&&O.observe(i,{childList:!0,subtree:!0}),()=>{document.removeEventListener("focusin",u),document.removeEventListener("focusout",p),O.disconnect()}}},[r,i,g.paused]),a.useEffect(()=>{if(i){Re.add(g);const u=document.activeElement;if(!i.contains(u)){const b=new CustomEvent(re,Se);i.addEventListener(re,h),i.dispatchEvent(b),b.defaultPrevented||(Dt(Pt(We(i)),{select:!0}),document.activeElement===u&&P(i))}return()=>{i.removeEventListener(re,h),setTimeout(()=>{const b=new CustomEvent(oe,Se);i.addEventListener(oe,f),i.dispatchEvent(b),b.defaultPrevented||P(u??document.body,{select:!0}),i.removeEventListener(oe,f),Re.remove(g)},0)}}},[i,h,f,g]);const w=a.useCallback(u=>{if(!n&&!r||g.paused)return;const p=u.key==="Tab"&&!u.altKey&&!u.ctrlKey&&!u.metaKey,b=document.activeElement;if(p&&b){const O=u.currentTarget,[$,y]=St(O);$&&y?!u.shiftKey&&b===y?(u.preventDefault(),n&&P($,{select:!0})):u.shiftKey&&b===$&&(u.preventDefault(),n&&P(y,{select:!0})):b===O&&u.preventDefault()}},[n,r,g.paused]);return a.createElement(R.div,de({tabIndex:-1},l,{ref:m,onKeyDown:w}))});function Dt(e,{select:t=!1}={}){const n=document.activeElement;for(const r of e)if(P(r,{select:t}),document.activeElement!==n)return}s(Dt,"$d3863c46a17e8a28$var$focusFirst");function St(e){const t=We(e),n=xe(t,e),r=xe(t.reverse(),e);return[n,r]}s(St,"$d3863c46a17e8a28$var$getTabbableEdges");function We(e){const t=[],n=document.createTreeWalker(e,NodeFilter.SHOW_ELEMENT,{acceptNode:r=>{const o=r.tagName==="INPUT"&&r.type==="hidden";return r.disabled||r.hidden||o?NodeFilter.FILTER_SKIP:r.tabIndex>=0?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP}});for(;n.nextNode();)t.push(n.currentNode);return t}s(We,"$d3863c46a17e8a28$var$getTabbableCandidates");function xe(e,t){for(const n of e)if(!xt(n,{upTo:t}))return n}s(xe,"$d3863c46a17e8a28$var$findVisible");function xt(e,{upTo:t}){if(getComputedStyle(e).visibility==="hidden")return!0;for(;e;){if(t!==void 0&&e===t)return!1;if(getComputedStyle(e).display==="none")return!0;e=e.parentElement}return!1}s(xt,"$d3863c46a17e8a28$var$isHidden");function Rt(e){return e instanceof HTMLInputElement&&"select"in e}s(Rt,"$d3863c46a17e8a28$var$isSelectableInput");function P(e,{select:t=!1}={}){if(e&&e.focus){const n=document.activeElement;e.focus({preventScroll:!0}),e!==n&&Rt(e)&&t&&e.select()}}s(P,"$d3863c46a17e8a28$var$focus");const Re=Tt();function Tt(){let e=[];return{add(t){const n=e[0];t!==n&&(n==null||n.pause()),e=Te(e,t),e.unshift(t)},remove(t){var n;e=Te(e,t),(n=e[0])===null||n===void 0||n.resume()}}}s(Tt,"$d3863c46a17e8a28$var$createFocusScopesStack");function Te(e,t){const n=[...e],r=n.indexOf(t);return r!==-1&&n.splice(r,1),n}s(Te,"$d3863c46a17e8a28$var$arrayRemove");function Pt(e){return e.filter(t=>t.tagName!=="A")}s(Pt,"$d3863c46a17e8a28$var$removeLinks");function fe(){return fe=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},fe.apply(this,arguments)}s(fe,"_extends$1");const Mt=a.forwardRef((e,t)=>{var n;const{container:r=globalThis==null||(n=globalThis.document)===null||n===void 0?void 0:n.body,...o}=e;return r?vt.createPortal(a.createElement(R.div,fe({},o,{ref:t})),r):null});let ae=0;function Lt(){a.useEffect(()=>{var e,t;const n=document.querySelectorAll("[data-radix-focus-guard]");return document.body.insertAdjacentElement("afterbegin",(e=n[0])!==null&&e!==void 0?e:Pe()),document.body.insertAdjacentElement("beforeend",(t=n[1])!==null&&t!==void 0?t:Pe()),ae++,()=>{ae===1&&document.querySelectorAll("[data-radix-focus-guard]").forEach(r=>r.remove()),ae--}},[])}s(Lt,"$3db38b7d1fb3fe6a$export$b7ece24a22aeda8c");function Pe(){const e=document.createElement("span");return e.setAttribute("data-radix-focus-guard",""),e.tabIndex=0,e.style.cssText="outline: none; opacity: 0; position: fixed; pointer-events: none",e}s(Pe,"$3db38b7d1fb3fe6a$var$createFocusGuard");var x=s(function(){return x=Object.assign||s(function(t){for(var n,r=1,o=arguments.length;r<o;r++){n=arguments[r];for(var c in n)Object.prototype.hasOwnProperty.call(n,c)&&(t[c]=n[c])}return t},"__assign"),x.apply(this,arguments)},"__assign");function Be(e,t){var n={};for(var r in e)Object.prototype.hasOwnProperty.call(e,r)&&t.indexOf(r)<0&&(n[r]=e[r]);if(e!=null&&typeof Object.getOwnPropertySymbols=="function")for(var o=0,r=Object.getOwnPropertySymbols(e);o<r.length;o++)t.indexOf(r[o])<0&&Object.prototype.propertyIsEnumerable.call(e,r[o])&&(n[r[o]]=e[r[o]]);return n}s(Be,"__rest");function It(e,t,n){if(n||arguments.length===2)for(var r=0,o=t.length,c;r<o;r++)(c||!(r in t))&&(c||(c=Array.prototype.slice.call(t,0,r)),c[r]=t[r]);return e.concat(c||Array.prototype.slice.call(t))}s(It,"__spreadArray");var Y="right-scroll-bar-position",G="width-before-scroll-bar",Nt="with-scroll-bars-hidden",At="--removed-body-scroll-bar-size";function Ft(e,t){return typeof e=="function"?e(t):e&&(e.current=t),e}s(Ft,"assignRef");function kt(e,t){var n=a.useState(function(){return{value:e,callback:t,facade:{get current(){return n.value},set current(r){var o=n.value;o!==r&&(n.value=r,n.callback(r,o))}}}})[0];return n.callback=t,n.facade}s(kt,"useCallbackRef");function jt(e,t){return kt(t||null,function(n){return e.forEach(function(r){return Ft(r,n)})})}s(jt,"useMergeRefs");function Wt(e){return e}s(Wt,"ItoI");function Bt(e,t){t===void 0&&(t=Wt);var n=[],r=!1,o={read:function(){if(r)throw new Error("Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.");return n.length?n[n.length-1]:e},useMedium:function(c){var l=t(c,r);return n.push(l),function(){n=n.filter(function(i){return i!==l})}},assignSyncMedium:function(c){for(r=!0;n.length;){var l=n;n=[],l.forEach(c)}n={push:function(i){return c(i)},filter:function(){return n}}},assignMedium:function(c){r=!0;var l=[];if(n.length){var i=n;n=[],i.forEach(c),l=n}var v=s(function(){var f=l;l=[],f.forEach(c)},"executeQueue"),h=s(function(){return Promise.resolve().then(v)},"cycle");h(),n={push:function(f){l.push(f),h()},filter:function(f){return l=l.filter(f),n}}}};return o}s(Bt,"innerCreateMedium");function Ut(e){e===void 0&&(e={});var t=Bt(null);return t.options=x({async:!0,ssr:!1},e),t}s(Ut,"createSidecarMedium");var Ue=s(function(e){var t=e.sideCar,n=Be(e,["sideCar"]);if(!t)throw new Error("Sidecar: please provide `sideCar` property to import the right car");var r=t.read();if(!r)throw new Error("Sidecar medium not found");return a.createElement(r,x({},n))},"SideCar$1");Ue.isSideCarExport=!0;function qt(e,t){return e.useMedium(t),Ue}s(qt,"exportSidecar");var qe=Ut(),ce=s(function(){},"nothing"),Z=a.forwardRef(function(e,t){var n=a.useRef(null),r=a.useState({onScrollCapture:ce,onWheelCapture:ce,onTouchMoveCapture:ce}),o=r[0],c=r[1],l=e.forwardProps,i=e.children,v=e.className,h=e.removeScrollBar,f=e.enabled,d=e.shards,m=e.sideCar,g=e.noIsolation,w=e.inert,u=e.allowPinchZoom,p=e.as,b=p===void 0?"div":p,O=Be(e,["forwardProps","children","className","removeScrollBar","enabled","shards","sideCar","noIsolation","inert","allowPinchZoom","as"]),$=m,y=jt([n,t]),C=x(x({},O),o);return a.createElement(a.Fragment,null,f&&a.createElement($,{sideCar:qe,removeScrollBar:h,shards:d,noIsolation:g,inert:w,setCallbacks:c,allowPinchZoom:!!u,lockRef:n}),l?a.cloneElement(a.Children.only(i),x(x({},C),{ref:y})):a.createElement(b,x({},C,{className:v,ref:y}),i))});Z.defaultProps={enabled:!0,removeScrollBar:!0,inert:!1};Z.classNames={fullWidth:G,zeroRight:Y};var Me,Ht=s(function(){if(Me)return Me;if(typeof __webpack_nonce__<"u")return __webpack_nonce__},"getNonce");function Vt(){if(!document)return null;var e=document.createElement("style");e.type="text/css";var t=Ht();return t&&e.setAttribute("nonce",t),e}s(Vt,"makeStyleTag");function Kt(e,t){e.styleSheet?e.styleSheet.cssText=t:e.appendChild(document.createTextNode(t))}s(Kt,"injectStyles");function zt(e){var t=document.head||document.getElementsByTagName("head")[0];t.appendChild(e)}s(zt,"insertStyleTag");var Xt=s(function(){var e=0,t=null;return{add:function(n){e==0&&(t=Vt())&&(Kt(t,n),zt(t)),e++},remove:function(){e--,!e&&t&&(t.parentNode&&t.parentNode.removeChild(t),t=null)}}},"stylesheetSingleton"),Yt=s(function(){var e=Xt();return function(t,n){a.useEffect(function(){return e.add(t),function(){e.remove()}},[t&&n])}},"styleHookSingleton"),He=s(function(){var e=Yt(),t=s(function(n){var r=n.styles,o=n.dynamic;return e(r,o),null},"Sheet");return t},"styleSingleton"),Gt={left:0,top:0,right:0,gap:0},ie=s(function(e){return parseInt(e||"",10)||0},"parse"),Qt=s(function(e){var t=window.getComputedStyle(document.body),n=t[e==="padding"?"paddingLeft":"marginLeft"],r=t[e==="padding"?"paddingTop":"marginTop"],o=t[e==="padding"?"paddingRight":"marginRight"];return[ie(n),ie(r),ie(o)]},"getOffset"),Zt=s(function(e){if(e===void 0&&(e="margin"),typeof window>"u")return Gt;var t=Qt(e),n=document.documentElement.clientWidth,r=window.innerWidth;return{left:t[0],top:t[1],right:t[2],gap:Math.max(0,r-n+t[2]-t[0])}},"getGapWidth"),Jt=He(),en=s(function(e,t,n,r){var o=e.left,c=e.top,l=e.right,i=e.gap;return n===void 0&&(n="margin"),`
  .`.concat(Nt,` {
   overflow: hidden `).concat(r,`;
   padding-right: `).concat(i,"px ").concat(r,`;
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
    margin-right: `).concat(i,"px ").concat(r,`;
    `),n==="padding"&&"padding-right: ".concat(i,"px ").concat(r,";")].filter(Boolean).join(""),`
  }
  
  .`).concat(Y,` {
    right: `).concat(i,"px ").concat(r,`;
  }
  
  .`).concat(G,` {
    margin-right: `).concat(i,"px ").concat(r,`;
  }
  
  .`).concat(Y," .").concat(Y,` {
    right: 0 `).concat(r,`;
  }
  
  .`).concat(G," .").concat(G,` {
    margin-right: 0 `).concat(r,`;
  }
  
  body {
    `).concat(At,": ").concat(i,`px;
  }
`)},"getStyles"),tn=s(function(e){var t=e.noRelative,n=e.noImportant,r=e.gapMode,o=r===void 0?"margin":r,c=a.useMemo(function(){return Zt(o)},[o]);return a.createElement(Jt,{styles:en(c,!t,o,n?"":"!important")})},"RemoveScrollBar"),ve=!1;if(typeof window<"u")try{var q=Object.defineProperty({},"passive",{get:function(){return ve=!0,!0}});window.addEventListener("test",q,q),window.removeEventListener("test",q,q)}catch{ve=!1}var N=ve?{passive:!1}:!1,nn=s(function(e){return e.tagName==="TEXTAREA"},"alwaysContainsScroll"),Ve=s(function(e,t){var n=window.getComputedStyle(e);return n[t]!=="hidden"&&!(n.overflowY===n.overflowX&&!nn(e)&&n[t]==="visible")},"elementCanBeScrolled"),rn=s(function(e){return Ve(e,"overflowY")},"elementCouldBeVScrolled"),on=s(function(e){return Ve(e,"overflowX")},"elementCouldBeHScrolled"),Le=s(function(e,t){var n=t;do{typeof ShadowRoot<"u"&&n instanceof ShadowRoot&&(n=n.host);var r=Ke(e,n);if(r){var o=ze(e,n),c=o[1],l=o[2];if(c>l)return!0}n=n.parentNode}while(n&&n!==document.body);return!1},"locationCouldBeScrolled"),an=s(function(e){var t=e.scrollTop,n=e.scrollHeight,r=e.clientHeight;return[t,n,r]},"getVScrollVariables"),cn=s(function(e){var t=e.scrollLeft,n=e.scrollWidth,r=e.clientWidth;return[t,n,r]},"getHScrollVariables"),Ke=s(function(e,t){return e==="v"?rn(t):on(t)},"elementCouldBeScrolled"),ze=s(function(e,t){return e==="v"?an(t):cn(t)},"getScrollVariables"),sn=s(function(e,t){return e==="h"&&t==="rtl"?-1:1},"getDirectionFactor"),ln=s(function(e,t,n,r,o){var c=sn(e,window.getComputedStyle(t).direction),l=c*r,i=n.target,v=t.contains(i),h=!1,f=l>0,d=0,m=0;do{var g=ze(e,i),w=g[0],u=g[1],p=g[2],b=u-p-c*w;(w||b)&&Ke(e,i)&&(d+=b,m+=w),i=i.parentNode}while(!v&&i!==document.body||v&&(t.contains(i)||t===i));return(f&&(o&&d===0||!o&&l>d)||!f&&(o&&m===0||!o&&-l>m))&&(h=!0),h},"handleScroll"),H=s(function(e){return"changedTouches"in e?[e.changedTouches[0].clientX,e.changedTouches[0].clientY]:[0,0]},"getTouchXY"),Ie=s(function(e){return[e.deltaX,e.deltaY]},"getDeltaXY"),Ne=s(function(e){return e&&"current"in e?e.current:e},"extractRef"),un=s(function(e,t){return e[0]===t[0]&&e[1]===t[1]},"deltaCompare"),dn=s(function(e){return`
  .block-interactivity-`.concat(e,` {pointer-events: none;}
  .allow-interactivity-`).concat(e,` {pointer-events: all;}
`)},"generateStyle"),fn=0,A=[];function vn(e){var t=a.useRef([]),n=a.useRef([0,0]),r=a.useRef(),o=a.useState(fn++)[0],c=a.useState(function(){return He()})[0],l=a.useRef(e);a.useEffect(function(){l.current=e},[e]),a.useEffect(function(){if(e.inert){document.body.classList.add("block-interactivity-".concat(o));var u=It([e.lockRef.current],(e.shards||[]).map(Ne),!0).filter(Boolean);return u.forEach(function(p){return p.classList.add("allow-interactivity-".concat(o))}),function(){document.body.classList.remove("block-interactivity-".concat(o)),u.forEach(function(p){return p.classList.remove("allow-interactivity-".concat(o))})}}},[e.inert,e.lockRef.current,e.shards]);var i=a.useCallback(function(u,p){if("touches"in u&&u.touches.length===2)return!l.current.allowPinchZoom;var b=H(u),O=n.current,$="deltaX"in u?u.deltaX:O[0]-b[0],y="deltaY"in u?u.deltaY:O[1]-b[1],C,k=u.target,T=Math.abs($)>Math.abs(y)?"h":"v";if("touches"in u&&T==="h"&&k.type==="range")return!1;var E=Le(T,k);if(!E)return!0;if(E?C=T:(C=T==="v"?"h":"v",E=Le(T,k)),!E)return!1;if(!r.current&&"changedTouches"in u&&($||y)&&(r.current=C),!C)return!0;var L=r.current||C;return ln(L,p,u,L==="h"?$:y,!0)},[]),v=a.useCallback(function(u){var p=u;if(!(!A.length||A[A.length-1]!==c)){var b="deltaY"in p?Ie(p):H(p),O=t.current.filter(function(C){return C.name===p.type&&C.target===p.target&&un(C.delta,b)})[0];if(O&&O.should){p.cancelable&&p.preventDefault();return}if(!O){var $=(l.current.shards||[]).map(Ne).filter(Boolean).filter(function(C){return C.contains(p.target)}),y=$.length>0?i(p,$[0]):!l.current.noIsolation;y&&p.cancelable&&p.preventDefault()}}},[]),h=a.useCallback(function(u,p,b,O){var $={name:u,delta:p,target:b,should:O};t.current.push($),setTimeout(function(){t.current=t.current.filter(function(y){return y!==$})},1)},[]),f=a.useCallback(function(u){n.current=H(u),r.current=void 0},[]),d=a.useCallback(function(u){h(u.type,Ie(u),u.target,i(u,e.lockRef.current))},[]),m=a.useCallback(function(u){h(u.type,H(u),u.target,i(u,e.lockRef.current))},[]);a.useEffect(function(){return A.push(c),e.setCallbacks({onScrollCapture:d,onWheelCapture:d,onTouchMoveCapture:m}),document.addEventListener("wheel",v,N),document.addEventListener("touchmove",v,N),document.addEventListener("touchstart",f,N),function(){A=A.filter(function(u){return u!==c}),document.removeEventListener("wheel",v,N),document.removeEventListener("touchmove",v,N),document.removeEventListener("touchstart",f,N)}},[]);var g=e.removeScrollBar,w=e.inert;return a.createElement(a.Fragment,null,w?a.createElement(c,{styles:dn(o)}):null,g?a.createElement(tn,{gapMode:"margin"}):null)}s(vn,"RemoveScrollSideCar");const pn=qt(qe,vn);var Xe=a.forwardRef(function(e,t){return a.createElement(Z,x({},e,{ref:t,sideCar:pn}))});Xe.classNames=Z.classNames;const mn=Xe;var hn=s(function(e){if(typeof document>"u")return null;var t=Array.isArray(e)?e[0]:e;return t.ownerDocument.body},"getDefaultParent"),F=new WeakMap,V=new WeakMap,K={},se=0,Ye=s(function(e){return e&&(e.host||Ye(e.parentNode))},"unwrapHost"),gn=s(function(e,t){return t.map(function(n){if(e.contains(n))return n;var r=Ye(n);return r&&e.contains(r)?r:(console.error("aria-hidden",n,"in not contained inside",e,". Doing nothing"),null)}).filter(function(n){return!!n})},"correctTargets"),bn=s(function(e,t,n,r){var o=gn(t,Array.isArray(e)?e:[e]);K[n]||(K[n]=new WeakMap);var c=K[n],l=[],i=new Set,v=new Set(o),h=s(function(d){!d||i.has(d)||(i.add(d),h(d.parentNode))},"keep");o.forEach(h);var f=s(function(d){!d||v.has(d)||Array.prototype.forEach.call(d.children,function(m){if(i.has(m))f(m);else{var g=m.getAttribute(r),w=g!==null&&g!=="false",u=(F.get(m)||0)+1,p=(c.get(m)||0)+1;F.set(m,u),c.set(m,p),l.push(m),u===1&&w&&V.set(m,!0),p===1&&m.setAttribute(n,"true"),w||m.setAttribute(r,"true")}})},"deep");return f(t),i.clear(),se++,function(){l.forEach(function(d){var m=F.get(d)-1,g=c.get(d)-1;F.set(d,m),c.set(d,g),m||(V.has(d)||d.removeAttribute(r),V.delete(d)),g||d.removeAttribute(n)}),se--,se||(F=new WeakMap,F=new WeakMap,V=new WeakMap,K={})}},"applyAttributeToOthers"),$n=s(function(e,t,n){n===void 0&&(n="data-aria-hidden");var r=Array.from(Array.isArray(e)?e:[e]),o=t||hn(e);return o?(r.push.apply(r,Array.from(o.querySelectorAll("[aria-live]"))),bn(r,o,n,"aria-hidden")):function(){return null}},"hideOthers");const Ge="Dialog",[Qe,xr]=lt(Ge),[yn,S]=Qe(Ge),En=s(e=>{const{__scopeDialog:t,children:n,open:r,defaultOpen:o,onOpenChange:c,modal:l=!0}=e,i=a.useRef(null),v=a.useRef(null),[h=!1,f]=dt({prop:r,defaultProp:o,onChange:c});return a.createElement(yn,{scope:t,triggerRef:i,contentRef:v,contentId:ne(),titleId:ne(),descriptionId:ne(),open:h,onOpenChange:f,onOpenToggle:a.useCallback(()=>f(d=>!d),[f]),modal:l},n)},"$5d3850c4d0b4e6c7$export$3ddf2d174ce01153"),Cn="DialogTrigger",On=a.forwardRef((e,t)=>{const{__scopeDialog:n,...r}=e,o=S(Cn,n),c=B(t,o.triggerRef);return a.createElement(R.button,D({type:"button","aria-haspopup":"dialog","aria-expanded":o.open,"aria-controls":o.contentId,"data-state":ye(o.open)},r,{ref:c,onClick:M(e.onClick,o.onOpenToggle)}))}),Ze="DialogPortal",[_n,Je]=Qe(Ze,{forceMount:void 0}),wn=s(e=>{const{__scopeDialog:t,forceMount:n,children:r,container:o}=e,c=S(Ze,t);return a.createElement(_n,{scope:t,forceMount:n},a.Children.map(r,l=>a.createElement($e,{present:n||c.open},a.createElement(Mt,{asChild:!0,container:o},l))))},"$5d3850c4d0b4e6c7$export$dad7c95542bacce0"),pe="DialogOverlay",Dn=a.forwardRef((e,t)=>{const n=Je(pe,e.__scopeDialog),{forceMount:r=n.forceMount,...o}=e,c=S(pe,e.__scopeDialog);return c.modal?a.createElement($e,{present:r||c.open},a.createElement(Sn,D({},o,{ref:t}))):null}),Sn=a.forwardRef((e,t)=>{const{__scopeDialog:n,...r}=e,o=S(pe,n);return a.createElement(mn,{as:ut,allowPinchZoom:!0,shards:[o.contentRef]},a.createElement(R.div,D({"data-state":ye(o.open)},r,{ref:t,style:{pointerEvents:"auto",...r.style}})))}),W="DialogContent",xn=a.forwardRef((e,t)=>{const n=Je(W,e.__scopeDialog),{forceMount:r=n.forceMount,...o}=e,c=S(W,e.__scopeDialog);return a.createElement($e,{present:r||c.open},c.modal?a.createElement(Rn,D({},o,{ref:t})):a.createElement(Tn,D({},o,{ref:t})))}),Rn=a.forwardRef((e,t)=>{const n=S(W,e.__scopeDialog),r=a.useRef(null),o=B(t,n.contentRef,r);return a.useEffect(()=>{const c=r.current;if(c)return $n(c)},[]),a.createElement(et,D({},e,{ref:o,trapFocus:n.open,disableOutsidePointerEvents:!0,onCloseAutoFocus:M(e.onCloseAutoFocus,c=>{var l;c.preventDefault(),(l=n.triggerRef.current)===null||l===void 0||l.focus()}),onPointerDownOutside:M(e.onPointerDownOutside,c=>{const l=c.detail.originalEvent,i=l.button===0&&l.ctrlKey===!0;(l.button===2||i)&&c.preventDefault()}),onFocusOutside:M(e.onFocusOutside,c=>c.preventDefault())}))}),Tn=a.forwardRef((e,t)=>{const n=S(W,e.__scopeDialog),r=a.useRef(!1),o=a.useRef(!1);return a.createElement(et,D({},e,{ref:t,trapFocus:!1,disableOutsidePointerEvents:!1,onCloseAutoFocus:c=>{var l;if((l=e.onCloseAutoFocus)===null||l===void 0||l.call(e,c),!c.defaultPrevented){var i;r.current||(i=n.triggerRef.current)===null||i===void 0||i.focus(),c.preventDefault()}r.current=!1,o.current=!1},onInteractOutside:c=>{var l,i;(l=e.onInteractOutside)===null||l===void 0||l.call(e,c),c.defaultPrevented||(r.current=!0,c.detail.originalEvent.type==="pointerdown"&&(o.current=!0));const v=c.target;((i=n.triggerRef.current)===null||i===void 0?void 0:i.contains(v))&&c.preventDefault(),c.detail.originalEvent.type==="focusin"&&o.current&&c.preventDefault()}}))}),et=a.forwardRef((e,t)=>{const{__scopeDialog:n,trapFocus:r,onOpenAutoFocus:o,onCloseAutoFocus:c,...l}=e,i=S(W,n),v=a.useRef(null),h=B(t,v);return Lt(),a.createElement(a.Fragment,null,a.createElement(wt,{asChild:!0,loop:!0,trapped:r,onMountAutoFocus:o,onUnmountAutoFocus:c},a.createElement(Ct,D({role:"dialog",id:i.contentId,"aria-describedby":i.descriptionId,"aria-labelledby":i.titleId,"data-state":ye(i.open)},l,{ref:h,onDismiss:()=>i.onOpenChange(!1)}))),!1)}),Pn="DialogTitle",Mn=a.forwardRef((e,t)=>{const{__scopeDialog:n,...r}=e,o=S(Pn,n);return a.createElement(R.h2,D({id:o.titleId},r,{ref:t}))}),Ln="DialogDescription",In=a.forwardRef((e,t)=>{const{__scopeDialog:n,...r}=e,o=S(Ln,n);return a.createElement(R.p,D({id:o.descriptionId},r,{ref:t}))}),Nn="DialogClose",An=a.forwardRef((e,t)=>{const{__scopeDialog:n,...r}=e,o=S(Nn,n);return a.createElement(R.button,D({type:"button"},r,{ref:t,onClick:M(e.onClick,()=>o.onOpenChange(!1))}))});function ye(e){return e?"open":"closed"}s(ye,"$5d3850c4d0b4e6c7$var$getState");const Fn=En,kn=On,jn=wn,Wn=Dn,Bn=xn,Un=Mn,qn=In,Hn=An;function me(){return me=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},me.apply(this,arguments)}s(me,"_extends");const he="horizontal",Vn=["horizontal","vertical"],tt=a.forwardRef((e,t)=>{const{decorative:n,orientation:r=he,...o}=e,c=nt(r)?r:he,i=n?{role:"none"}:{"aria-orientation":c==="vertical"?c:void 0,role:"separator"};return a.createElement(R.div,me({"data-orientation":c},i,o,{ref:t}))});tt.propTypes={orientation(e,t,n){const r=e[t],o=String(r);return r&&!nt(r)?new Error(Kn(o,n)):null}};function Kn(e,t){return`Invalid prop \`orientation\` of value \`${e}\` supplied to \`${t}\`, expected one of:
  - horizontal
  - vertical

Defaulting to \`${he}\`.`}s(Kn,"$89eedd556c436f6a$var$getInvalidOrientationError");function nt(e){return Vn.includes(e)}s(nt,"$89eedd556c436f6a$var$isValidOrientation");const zn=tt;var Xn=ft("x","IconX",[["path",{d:"M18 6l-12 12",key:"svg-0"}],["path",{d:"M6 6l12 12",key:"svg-1"}]]),J={},rt={},U={},ee={};Object.defineProperty(ee,"__esModule",{value:!0});function Yn(e){return e.replace(/[A-Z]/g,function(t){return"-"+t.toLowerCase()}).toLowerCase()}s(Yn,"camelToHyphen");ee.default=Yn;var Ee={};Object.defineProperty(Ee,"__esModule",{value:!0});var Gn=ee,Qn=" and ";function Zn(e){return typeof e=="string"?e:Object.entries(e).map(function(t){var n=t[0],r=t[1],o=Gn.default(n),c=r;return typeof c=="boolean"?c?o:"not "+o:(typeof c=="number"&&/[height|width]$/.test(o)&&(c=c+"px"),"("+o+": "+c+")")}).join(Qn)}s(Zn,"queryObjectToString");Ee.default=Zn;var Ce={};Object.defineProperty(Ce,"__esModule",{value:!0});function Jn(){}s(Jn,"noop");Ce.default=Jn;Object.defineProperty(U,"__esModule",{value:!0});var er=ee;U.camelToHyphen=er.default;var tr=Ee;U.queryObjectToString=tr.default;var nr=Ce;U.noop=nr.default;(function(e){Object.defineProperty(e,"__esModule",{value:!0});var t=a,n=U;e.mockMediaQueryList={media:"",matches:!1,onchange:n.noop,addListener:n.noop,removeListener:n.noop,addEventListener:n.noop,removeEventListener:n.noop,dispatchEvent:function(o){return!0}};var r=s(function(o){return function(c,l){l===void 0&&(l=!1);var i=t.useState(l),v=i[0],h=i[1],f=n.queryObjectToString(c);return o(function(){var d=!0,m=typeof window>"u"?e.mockMediaQueryList:window.matchMedia(f),g=s(function(){d&&h(!!m.matches)},"onChange");return m.addListener(g),h(m.matches),function(){d=!1,m.removeListener(g)}},[f]),v}},"createUseMedia");e.useMedia=r(t.useEffect),e.useMediaLayout=r(t.useLayoutEffect),e.default=e.useMedia})(rt);Object.defineProperty(J,"__esModule",{value:!0});var Oe=rt;J.default=Oe.default;var z=J.useMedia=Oe.useMedia;J.useMediaLayout=Oe.useMediaLayout;const Ae=1440,Fe=1024,ke=700,X={xl:`screen and (min-width: ${Ae}px)`,lg:`screen and (min-width: ${Fe}px) and (max-width: ${Ae-1}px)`,md:`screen and (min-width: ${ke}px) and (max-width: ${Fe-1}px)`,sm:`screen and (max-width: ${ke-1}px)`};var rr="rh21qc6",or="rh21qc7",ar="rh21qc2",cr="rh21qc4",ir="rh21qc8",sr="rh21qc0",lr="rh21qc3 _1peap286 _1peap284",ur="rh21qc5",dr="rh21qc1";const ot=a.createContext({open:!1}),fr={from:{opacity:.1,transform:"translate(-50%, -25%)"},enter:{opacity:1,transform:"translate(-50%, -50%)"},leave:{opacity:0,transform:"translate(-50%, -25%)"},config:{mass:.8,tension:140,friction:16,precision:.016,velocity:.015}},vr={from:{opacity:1,transform:"translate(0%, 100%) scale(1)"},enter:{opacity:1,transform:"translate(0%, 0%) scale(1)"},leave:{op25ity:1,transform:"translate(0%, 100%) scale(1)"},config:{tension:280,friction:30,precision:.013,velocity:.016}},Q=a.memo(a.forwardRef(({children:e,title:t,description:n},r)=>{const{open:o,size:c}=a.useContext(ot),l=mt(o,c!=="sm"?fr:vr);return _(jn,{forceMount:!0,children:l((i,v)=>v?I(it,{children:[_(Wn,{className:sr}),_(Bn,{ref:r,children:I(ht.div,{style:i,className:ar,children:[I("div",{className:cr,children:[I("div",{className:ur,children:[_(Un,{className:lr,children:t}),_(Hn,{asChild:!0,children:_("button",{"aria-label":"Close",className:or,children:_(Xn,{className:ir})})})]}),n!==void 0?_(qn,{children:n}):null,_(zn,{className:rr})]}),_(pt,{orientation:"vertical",scrollbar:"all",children:e})]})})]}):null)})})),ge=a.memo(a.forwardRef(({className:e,...t},n)=>_(kn,{...t,ref:n,className:gt(dr,e)}))),be=a.memo(({children:e,...t})=>{const[n,r]=a.useState(t.open??!1),o=z(X.xl),c=z(X.lg),l=z(X.sm),i=z(X.md),v=a.useMemo(()=>{if(o)return"xl";if(c)return"lg";if(i)return"md";if(l)return"sm"},[c,i,l,o]),h=a.useCallback(d=>{var m;(m=t.onOpenChange)==null||m.call(t,d),r(t.open??d)},[t]),f=a.useMemo(()=>({open:t.open??n,size:v}),[n,t.open,v]);return _(ot.Provider,{value:f,children:a.createElement(Fn,{...t,onOpenChange:h,key:v},e)})});try{Q.displayName="DialogContent",Q.__docgenInfo={description:"",displayName:"DialogContent",props:{title:{defaultValue:null,description:"",name:"title",required:!0,type:{name:"ReactNode"}},description:{defaultValue:null,description:"",name:"description",required:!1,type:{name:"ReactNode"}}}}}catch{}try{ge.displayName="DialogTrigger",ge.__docgenInfo={description:"",displayName:"DialogTrigger",props:{asChild:{defaultValue:null,description:"",name:"asChild",required:!1,type:{name:"boolean"}}}}}catch{}try{be.displayName="DialogRoot",be.__docgenInfo={description:"",displayName:"DialogRoot",props:{}}}catch{}const Rr={title:"components/Dialog",component:Q,argTypes:{title:{type:"string"},description:{type:"string"},open:{control:{type:"boolean"}}}},at=s(({open:e,...t})=>I(be,{open:e,children:[_(ge,{asChild:!0,children:_("button",{children:"open"})}),I(Q,{...t,title:t.title??"ダイアログ",children:[_("p",{children:"これはダイアログです。"}),I("div",{children:[_("button",{children:"ok"}),_("button",{children:"cancel"})]})]})]}),"Template"),pr=at.bind({});pr.args={title:"ダイアログ"};const mr=at.bind({});mr.args={open:!0};const Tr=["Default","Open"];export{pr as Default,mr as Open,Tr as __namedExportsOrder,Rr as default};
//# sourceMappingURL=dialog.stories-1bcfdb5a.js.map
