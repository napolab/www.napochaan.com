var ae=Object.defineProperty;var f=(e,t)=>ae(e,"name",{value:t,configurable:!0});import{a as se,j as W}from"./jsx-runtime-a0a4a613.js";import{r}from"./index-3b6510b3.js";import{r as ie}from"./index-26e05046.js";/* empty css                              */function de(e,t){typeof e=="function"?e(t):e!=null&&(e.current=t)}f(de,"$6ed0406888f73fc4$var$setRef$1");function ue(...e){return t=>e.forEach(o=>de(o,t))}f(ue,"$6ed0406888f73fc4$export$43e446d32b3d21af$1");function fe(...e){return r.useCallback(ue(...e),e)}f(fe,"$6ed0406888f73fc4$export$c7b2cbe3552a0d05$1");const j=Boolean(globalThis==null?void 0:globalThis.document)?r.useLayoutEffect:()=>{};function be(e,t){return r.useReducer((o,c)=>{const n=t[o][c];return n??o},e)}f(be,"$fe963b355347cc68$export$3e6543de14f8614f");const N=f(e=>{const{present:t,children:o}=e,c=me(t),n=typeof o=="function"?o({present:c.isPresent}):r.Children.only(o),l=fe(c.ref,n.ref);return typeof o=="function"||c.isPresent?r.cloneElement(n,{ref:l}):null},"$921a889cee6df7e8$export$99c2b779aa4e8b8b");N.displayName="Presence";function me(e){const[t,o]=r.useState(),c=r.useRef({}),n=r.useRef(e),l=r.useRef("none"),a=e?"mounted":"unmounted",[s,i]=be(a,{mounted:{UNMOUNT:"unmounted",ANIMATION_OUT:"unmountSuspended"},unmountSuspended:{MOUNT:"mounted",ANIMATION_END:"unmounted"},unmounted:{MOUNT:"mounted"}});return r.useEffect(()=>{const d=U(c.current);l.current=s==="mounted"?d:"none"},[s]),j(()=>{const d=c.current,u=n.current;if(u!==e){const b=l.current,h=U(d);e?i("MOUNT"):h==="none"||(d==null?void 0:d.display)==="none"?i("UNMOUNT"):i(u&&b!==h?"ANIMATION_OUT":"UNMOUNT"),n.current=e}},[e,i]),j(()=>{if(t){const d=f(m=>{const h=U(c.current).includes(m.animationName);m.target===t&&h&&ie.flushSync(()=>i("ANIMATION_END"))},"handleAnimationEnd"),u=f(m=>{m.target===t&&(l.current=U(c.current))},"handleAnimationStart");return t.addEventListener("animationstart",u),t.addEventListener("animationcancel",d),t.addEventListener("animationend",d),()=>{t.removeEventListener("animationstart",u),t.removeEventListener("animationcancel",d),t.removeEventListener("animationend",d)}}else i("ANIMATION_END")},[t,i]),{isPresent:["mounted","unmountSuspended"].includes(s),ref:r.useCallback(d=>{d&&(c.current=getComputedStyle(d)),o(d)},[])}}f(me,"$921a889cee6df7e8$var$usePresence");function U(e){return(e==null?void 0:e.animationName)||"none"}f(U,"$921a889cee6df7e8$var$getAnimationName");function p(){return p=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var o=arguments[t];for(var c in o)Object.prototype.hasOwnProperty.call(o,c)&&(e[c]=o[c])}return e},p.apply(this,arguments)}f(p,"_extends");function he(e,t){typeof e=="function"?e(t):e!=null&&(e.current=t)}f(he,"$6ed0406888f73fc4$var$setRef");function G(...e){return t=>e.forEach(o=>he(o,t))}f(G,"$6ed0406888f73fc4$export$43e446d32b3d21af");function y(...e){return r.useCallback(G(...e),e)}f(y,"$6ed0406888f73fc4$export$c7b2cbe3552a0d05");const J=r.forwardRef((e,t)=>{const{children:o,...c}=e,n=r.Children.toArray(o),l=n.find($e);if(l){const a=l.props.children,s=n.map(i=>i===l?r.Children.count(a)>1?r.Children.only(null):r.isValidElement(a)?a.props.children:null:i);return r.createElement(k,p({},c,{ref:t}),r.isValidElement(a)?r.cloneElement(a,void 0,s):null)}return r.createElement(k,p({},c,{ref:t}),o)});J.displayName="Slot";const k=r.forwardRef((e,t)=>{const{children:o,...c}=e;return r.isValidElement(o)?r.cloneElement(o,{...ve(c,o.props),ref:t?G(t,o.ref):o.ref}):r.Children.count(o)>1?r.Children.only(null):null});k.displayName="SlotClone";const pe=f(({children:e})=>r.createElement(r.Fragment,null,e),"$5e63c961fc1ce211$export$d9f1ccf0bdb05d45");function $e(e){return r.isValidElement(e)&&e.type===pe}f($e,"$5e63c961fc1ce211$var$isSlottable");function ve(e,t){const o={...t};for(const c in t){const n=e[c],l=t[c];/^on[A-Z]/.test(c)?n&&l?o[c]=(...s)=>{l(...s),n(...s)}:n&&(o[c]=n):c==="style"?o[c]={...n,...l}:c==="className"&&(o[c]=[n,l].filter(Boolean).join(" "))}return{...e,...o}}f(ve,"$5e63c961fc1ce211$var$mergeProps");const Se=["a","button","div","form","h2","h3","img","input","label","li","nav","ol","p","span","svg","ul"],L=Se.reduce((e,t)=>{const o=r.forwardRef((c,n)=>{const{asChild:l,...a}=c,s=l?J:t;return r.useEffect(()=>{window[Symbol.for("radix-ui")]=!0},[]),r.createElement(s,p({},a,{ref:n}))});return o.displayName=`Primitive.${t}`,{...e,[t]:o}},{});function ge(e,t=[]){let o=[];function c(l,a){const s=r.createContext(a),i=o.length;o=[...o,a];function d(m){const{scope:b,children:h,...$}=m,E=(b==null?void 0:b[e][i])||s,R=r.useMemo(()=>$,Object.values($));return r.createElement(E.Provider,{value:R},h)}f(d,"Provider");function u(m,b){const h=(b==null?void 0:b[e][i])||s,$=r.useContext(h);if($)return $;if(a!==void 0)return a;throw new Error(`\`${m}\` must be used within \`${l}\``)}return f(u,"useContext"),d.displayName=l+"Provider",[d,u]}f(c,"$c512c27ab02ef895$export$fd42f52fd3ae1109");const n=f(()=>{const l=o.map(a=>r.createContext(a));return f(function(s){const i=(s==null?void 0:s[e])||l;return r.useMemo(()=>({[`__scope${e}`]:{...s,[e]:i}}),[s,i])},"useScope")},"createScope");return n.scopeName=e,[c,we(n,...t)]}f(ge,"$c512c27ab02ef895$export$50c7b4e9d9f19c1");function we(...e){const t=e[0];if(e.length===1)return t;const o=f(()=>{const c=e.map(n=>({useScope:n(),scopeName:n.scopeName}));return f(function(l){const a=c.reduce((s,{useScope:i,scopeName:d})=>{const m=i(l)[`__scope${d}`];return{...s,...m}},{});return r.useMemo(()=>({[`__scope${t.scopeName}`]:a}),[a])},"useComposedScopes")},"createScope1");return o.scopeName=t.scopeName,o}f(we,"$c512c27ab02ef895$var$composeContextScopes");function P(e){const t=r.useRef(e);return r.useEffect(()=>{t.current=e}),r.useMemo(()=>(...o)=>{var c;return(c=t.current)===null||c===void 0?void 0:c.call(t,...o)},[])}f(P,"$b1b2314f5f9a1d84$export$25bec8c6f54ee79a");const Ee=r.createContext(void 0);function Ce(e){const t=r.useContext(Ee);return e||t||"ltr"}f(Ce,"$f631663db3294ace$export$b39126d51d94e6f3");const Pe=Boolean(globalThis==null?void 0:globalThis.document)?r.useLayoutEffect:()=>{};function xe(e,[t,o]){return Math.min(o,Math.max(t,e))}f(xe,"$ae6933e535247d3d$export$7d15b64cf5a3a4c4");function x(e,t,{checkForDefaultPrevented:o=!0}={}){return f(function(n){if(e==null||e(n),o===!1||!n.defaultPrevented)return t==null?void 0:t(n)},"handleEvent")}f(x,"$e42e1063c40fb3ef$export$b9ecd428b558ff10");function Ae(e,t){return r.useReducer((o,c)=>{const n=t[o][c];return n??o},e)}f(Ae,"$6c2e24571c90391f$export$3e6543de14f8614f");const K="ScrollArea",[Q,nt]=ge(K),[Te,S]=Q(K),ye=r.forwardRef((e,t)=>{const{__scopeScrollArea:o,type:c="hover",dir:n,scrollHideDelay:l=600,...a}=e,[s,i]=r.useState(null),[d,u]=r.useState(null),[m,b]=r.useState(null),[h,$]=r.useState(null),[E,R]=r.useState(null),[C,D]=r.useState(0),[V,z]=r.useState(0),[M,_]=r.useState(!1),[O,I]=r.useState(!1),v=y(t,A=>i(A)),g=Ce(n);return r.createElement(Te,{scope:o,type:c,dir:g,scrollHideDelay:l,scrollArea:s,viewport:d,onViewportChange:u,content:m,onContentChange:b,scrollbarX:h,onScrollbarXChange:$,scrollbarXEnabled:M,onScrollbarXEnabledChange:_,scrollbarY:E,onScrollbarYChange:R,scrollbarYEnabled:O,onScrollbarYEnabledChange:I,onCornerWidthChange:D,onCornerHeightChange:z},r.createElement(L.div,p({dir:g},a,{ref:v,style:{position:"relative",["--radix-scroll-area-corner-width"]:C+"px",["--radix-scroll-area-corner-height"]:V+"px",...e.style}})))}),Re="ScrollAreaViewport",_e=r.forwardRef((e,t)=>{const{__scopeScrollArea:o,children:c,...n}=e,l=S(Re,o),a=r.useRef(null),s=y(t,a,l.onViewportChange);return r.createElement(r.Fragment,null,r.createElement("style",{dangerouslySetInnerHTML:{__html:"[data-radix-scroll-area-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}[data-radix-scroll-area-viewport]::-webkit-scrollbar{display:none}"}}),r.createElement(L.div,p({"data-radix-scroll-area-viewport":""},n,{ref:s,style:{overflowX:l.scrollbarXEnabled?"scroll":"hidden",overflowY:l.scrollbarYEnabled?"scroll":"hidden",...e.style}}),r.createElement("div",{ref:l.onContentChange,style:{minWidth:"100%",display:"table"}},c)))}),w="ScrollAreaScrollbar",Ne=r.forwardRef((e,t)=>{const{forceMount:o,...c}=e,n=S(w,e.__scopeScrollArea),{onScrollbarXEnabledChange:l,onScrollbarYEnabledChange:a}=n,s=e.orientation==="horizontal";return r.useEffect(()=>(s?l(!0):a(!0),()=>{s?l(!1):a(!1)}),[s,l,a]),n.type==="hover"?r.createElement(Le,p({},c,{ref:t,forceMount:o})):n.type==="scroll"?r.createElement(De,p({},c,{ref:t,forceMount:o})):n.type==="auto"?r.createElement(ee,p({},c,{ref:t,forceMount:o})):n.type==="always"?r.createElement(F,p({},c,{ref:t})):null}),Le=r.forwardRef((e,t)=>{const{forceMount:o,...c}=e,n=S(w,e.__scopeScrollArea),[l,a]=r.useState(!1);return r.useEffect(()=>{const s=n.scrollArea;let i=0;if(s){const d=f(()=>{window.clearTimeout(i),a(!0)},"handlePointerEnter"),u=f(()=>{i=window.setTimeout(()=>a(!1),n.scrollHideDelay)},"handlePointerLeave");return s.addEventListener("pointerenter",d),s.addEventListener("pointerleave",u),()=>{window.clearTimeout(i),s.removeEventListener("pointerenter",d),s.removeEventListener("pointerleave",u)}}},[n.scrollArea,n.scrollHideDelay]),r.createElement(N,{present:o||l},r.createElement(ee,p({"data-state":l?"visible":"hidden"},c,{ref:t})))}),De=r.forwardRef((e,t)=>{const{forceMount:o,...c}=e,n=S(w,e.__scopeScrollArea),l=e.orientation==="horizontal",a=Y(()=>i("SCROLL_END"),100),[s,i]=Ae("hidden",{hidden:{SCROLL:"scrolling"},scrolling:{SCROLL_END:"idle",POINTER_ENTER:"interacting"},interacting:{SCROLL:"interacting",POINTER_LEAVE:"idle"},idle:{HIDE:"hidden",SCROLL:"scrolling",POINTER_ENTER:"interacting"}});return r.useEffect(()=>{if(s==="idle"){const d=window.setTimeout(()=>i("HIDE"),n.scrollHideDelay);return()=>window.clearTimeout(d)}},[s,n.scrollHideDelay,i]),r.useEffect(()=>{const d=n.viewport,u=l?"scrollLeft":"scrollTop";if(d){let m=d[u];const b=f(()=>{const h=d[u];m!==h&&(i("SCROLL"),a()),m=h},"handleScroll");return d.addEventListener("scroll",b),()=>d.removeEventListener("scroll",b)}},[n.viewport,l,i,a]),r.createElement(N,{present:o||s!=="hidden"},r.createElement(F,p({"data-state":s==="hidden"?"hidden":"visible"},c,{ref:t,onPointerEnter:x(e.onPointerEnter,()=>i("POINTER_ENTER")),onPointerLeave:x(e.onPointerLeave,()=>i("POINTER_LEAVE"))})))}),ee=r.forwardRef((e,t)=>{const o=S(w,e.__scopeScrollArea),{forceMount:c,...n}=e,[l,a]=r.useState(!1),s=e.orientation==="horizontal",i=Y(()=>{if(o.viewport){const d=o.viewport.offsetWidth<o.viewport.scrollWidth,u=o.viewport.offsetHeight<o.viewport.scrollHeight;a(s?d:u)}},10);return T(o.viewport,i),T(o.content,i),r.createElement(N,{present:c||l},r.createElement(F,p({"data-state":l?"visible":"hidden"},n,{ref:t})))}),F=r.forwardRef((e,t)=>{const{orientation:o="vertical",...c}=e,n=S(w,e.__scopeScrollArea),l=r.useRef(null),a=r.useRef(0),[s,i]=r.useState({content:0,viewport:0,scrollbar:{size:0,paddingStart:0,paddingEnd:0}}),d=ne(s.viewport,s.content),u={...c,sizes:s,onSizesChange:i,hasThumb:Boolean(d>0&&d<1),onThumbChange:b=>l.current=b,onThumbPointerUp:()=>a.current=0,onThumbPointerDown:b=>a.current=b};function m(b,h){return Xe(b,a.current,s,h)}return f(m,"getScrollPosition"),o==="horizontal"?r.createElement(ze,p({},u,{ref:t,onThumbPositionChange:()=>{if(n.viewport&&l.current){const b=n.viewport.scrollLeft,h=Z(b,s,n.dir);l.current.style.transform=`translate3d(${h}px, 0, 0)`}},onWheelScroll:b=>{n.viewport&&(n.viewport.scrollLeft=b)},onDragScroll:b=>{n.viewport&&(n.viewport.scrollLeft=m(b,n.dir))}})):o==="vertical"?r.createElement(Me,p({},u,{ref:t,onThumbPositionChange:()=>{if(n.viewport&&l.current){const b=n.viewport.scrollTop,h=Z(b,s);l.current.style.transform=`translate3d(0, ${h}px, 0)`}},onWheelScroll:b=>{n.viewport&&(n.viewport.scrollTop=b)},onDragScroll:b=>{n.viewport&&(n.viewport.scrollTop=m(b))}})):null}),ze=r.forwardRef((e,t)=>{const{sizes:o,onSizesChange:c,...n}=e,l=S(w,e.__scopeScrollArea),[a,s]=r.useState(),i=r.useRef(null),d=y(t,i,l.onScrollbarXChange);return r.useEffect(()=>{i.current&&s(getComputedStyle(i.current))},[i]),r.createElement(re,p({"data-orientation":"horizontal"},n,{ref:d,sizes:o,style:{bottom:0,left:l.dir==="rtl"?"var(--radix-scroll-area-corner-width)":0,right:l.dir==="ltr"?"var(--radix-scroll-area-corner-width)":0,["--radix-scroll-area-thumb-width"]:X(o)+"px",...e.style},onThumbPointerDown:u=>e.onThumbPointerDown(u.x),onDragScroll:u=>e.onDragScroll(u.x),onWheelScroll:(u,m)=>{if(l.viewport){const b=l.viewport.scrollLeft+u.deltaX;e.onWheelScroll(b),le(b,m)&&u.preventDefault()}},onResize:()=>{i.current&&l.viewport&&a&&c({content:l.viewport.scrollWidth,viewport:l.viewport.offsetWidth,scrollbar:{size:i.current.clientWidth,paddingStart:H(a.paddingLeft),paddingEnd:H(a.paddingRight)}})}}))}),Me=r.forwardRef((e,t)=>{const{sizes:o,onSizesChange:c,...n}=e,l=S(w,e.__scopeScrollArea),[a,s]=r.useState(),i=r.useRef(null),d=y(t,i,l.onScrollbarYChange);return r.useEffect(()=>{i.current&&s(getComputedStyle(i.current))},[i]),r.createElement(re,p({"data-orientation":"vertical"},n,{ref:d,sizes:o,style:{top:0,right:l.dir==="ltr"?0:void 0,left:l.dir==="rtl"?0:void 0,bottom:"var(--radix-scroll-area-corner-height)",["--radix-scroll-area-thumb-height"]:X(o)+"px",...e.style},onThumbPointerDown:u=>e.onThumbPointerDown(u.y),onDragScroll:u=>e.onDragScroll(u.y),onWheelScroll:(u,m)=>{if(l.viewport){const b=l.viewport.scrollTop+u.deltaY;e.onWheelScroll(b),le(b,m)&&u.preventDefault()}},onResize:()=>{i.current&&l.viewport&&a&&c({content:l.viewport.scrollHeight,viewport:l.viewport.offsetHeight,scrollbar:{size:i.current.clientHeight,paddingStart:H(a.paddingTop),paddingEnd:H(a.paddingBottom)}})}}))}),[Oe,te]=Q(w),re=r.forwardRef((e,t)=>{const{__scopeScrollArea:o,sizes:c,hasThumb:n,onThumbChange:l,onThumbPointerUp:a,onThumbPointerDown:s,onThumbPositionChange:i,onDragScroll:d,onWheelScroll:u,onResize:m,...b}=e,h=S(w,o),[$,E]=r.useState(null),R=y(t,v=>E(v)),C=r.useRef(null),D=r.useRef(""),V=h.viewport,z=c.content-c.viewport,M=P(u),_=P(i),O=Y(m,10);function I(v){if(C.current){const g=v.clientX-C.current.left,A=v.clientY-C.current.top;d({x:g,y:A})}}return f(I,"handleDragScroll"),r.useEffect(()=>{const v=f(g=>{const A=g.target;($==null?void 0:$.contains(A))&&M(g,z)},"handleWheel");return document.addEventListener("wheel",v,{passive:!1}),()=>document.removeEventListener("wheel",v,{passive:!1})},[V,$,z,M]),r.useEffect(_,[c,_]),T($,O),T(h.content,O),r.createElement(Oe,{scope:o,scrollbar:$,hasThumb:n,onThumbChange:P(l),onThumbPointerUp:P(a),onThumbPositionChange:_,onThumbPointerDown:P(s)},r.createElement(L.div,p({},b,{ref:R,style:{position:"absolute",...b.style},onPointerDown:x(e.onPointerDown,v=>{v.button===0&&(v.target.setPointerCapture(v.pointerId),C.current=$.getBoundingClientRect(),D.current=document.body.style.webkitUserSelect,document.body.style.webkitUserSelect="none",I(v))}),onPointerMove:x(e.onPointerMove,I),onPointerUp:x(e.onPointerUp,v=>{const g=v.target;g.hasPointerCapture(v.pointerId)&&g.releasePointerCapture(v.pointerId),document.body.style.webkitUserSelect=D.current,C.current=null})})))}),q="ScrollAreaThumb",Ie=r.forwardRef((e,t)=>{const{forceMount:o,...c}=e,n=te(q,e.__scopeScrollArea);return r.createElement(N,{present:o||n.hasThumb},r.createElement(We,p({ref:t},c)))}),We=r.forwardRef((e,t)=>{const{__scopeScrollArea:o,style:c,...n}=e,l=S(q,o),a=te(q,o),{onThumbPositionChange:s}=a,i=y(t,m=>a.onThumbChange(m)),d=r.useRef(),u=Y(()=>{d.current&&(d.current(),d.current=void 0)},100);return r.useEffect(()=>{const m=l.viewport;if(m){const b=f(()=>{if(u(),!d.current){const h=Ye(m,s);d.current=h,s()}},"handleScroll");return s(),m.addEventListener("scroll",b),()=>m.removeEventListener("scroll",b)}},[l.viewport,u,s]),r.createElement(L.div,p({"data-state":a.hasThumb?"visible":"hidden"},n,{ref:i,style:{width:"var(--radix-scroll-area-thumb-width)",height:"var(--radix-scroll-area-thumb-height)",...c},onPointerDownCapture:x(e.onPointerDownCapture,m=>{const h=m.target.getBoundingClientRect(),$=m.clientX-h.left,E=m.clientY-h.top;a.onThumbPointerDown({x:$,y:E})}),onPointerUp:x(e.onPointerUp,a.onThumbPointerUp)}))}),oe="ScrollAreaCorner",Ue=r.forwardRef((e,t)=>{const o=S(oe,e.__scopeScrollArea),c=Boolean(o.scrollbarX&&o.scrollbarY);return o.type!=="scroll"&&c?r.createElement(He,p({},e,{ref:t})):null}),He=r.forwardRef((e,t)=>{const{__scopeScrollArea:o,...c}=e,n=S(oe,o),[l,a]=r.useState(0),[s,i]=r.useState(0),d=Boolean(l&&s);return T(n.scrollbarX,()=>{var u;const m=((u=n.scrollbarX)===null||u===void 0?void 0:u.offsetHeight)||0;n.onCornerHeightChange(m),i(m)}),T(n.scrollbarY,()=>{var u;const m=((u=n.scrollbarY)===null||u===void 0?void 0:u.offsetWidth)||0;n.onCornerWidthChange(m),a(m)}),d?r.createElement(L.div,p({},c,{ref:t,style:{width:l,height:s,position:"absolute",right:n.dir==="ltr"?0:void 0,left:n.dir==="rtl"?0:void 0,bottom:0,...e.style}})):null});function H(e){return e?parseInt(e,10):0}f(H,"$57acba87d6e25586$var$toInt");function ne(e,t){const o=e/t;return isNaN(o)?0:o}f(ne,"$57acba87d6e25586$var$getThumbRatio");function X(e){const t=ne(e.viewport,e.content),o=e.scrollbar.paddingStart+e.scrollbar.paddingEnd,c=(e.scrollbar.size-o)*t;return Math.max(c,18)}f(X,"$57acba87d6e25586$var$getThumbSize");function Xe(e,t,o,c="ltr"){const n=X(o),l=n/2,a=t||l,s=n-a,i=o.scrollbar.paddingStart+a,d=o.scrollbar.size-o.scrollbar.paddingEnd-s,u=o.content-o.viewport,m=c==="ltr"?[0,u]:[u*-1,0];return ce([i,d],m)(e)}f(Xe,"$57acba87d6e25586$var$getScrollPositionFromPointer");function Z(e,t,o="ltr"){const c=X(t),n=t.scrollbar.paddingStart+t.scrollbar.paddingEnd,l=t.scrollbar.size-n,a=t.content-t.viewport,s=l-c,i=o==="ltr"?[0,a]:[a*-1,0],d=xe(e,i);return ce([0,a],[0,s])(d)}f(Z,"$57acba87d6e25586$var$getThumbOffsetFromScroll");function ce(e,t){return o=>{if(e[0]===e[1]||t[0]===t[1])return t[0];const c=(t[1]-t[0])/(e[1]-e[0]);return t[0]+c*(o-e[0])}}f(ce,"$57acba87d6e25586$var$linearScale");function le(e,t){return e>0&&e<t}f(le,"$57acba87d6e25586$var$isScrollingWithinScrollbarBounds");const Ye=f((e,t=()=>{})=>{let o={left:e.scrollLeft,top:e.scrollTop},c=0;return f(function n(){const l={left:e.scrollLeft,top:e.scrollTop},a=o.left!==l.left,s=o.top!==l.top;(a||s)&&t(),o=l,c=window.requestAnimationFrame(n)},"loop")(),()=>window.cancelAnimationFrame(c)},"$57acba87d6e25586$var$addUnlinkedScrollListener");function Y(e,t){const o=P(e),c=r.useRef(0);return r.useEffect(()=>()=>window.clearTimeout(c.current),[]),r.useCallback(()=>{window.clearTimeout(c.current),c.current=window.setTimeout(o,t)},[o,t])}f(Y,"$57acba87d6e25586$var$useDebounceCallback");function T(e,t){const o=P(t);Pe(()=>{let c=0;if(e){const n=new ResizeObserver(()=>{cancelAnimationFrame(c),c=window.requestAnimationFrame(o)});return n.observe(e),()=>{window.cancelAnimationFrame(c),n.unobserve(e)}}},[e,o])}f(T,"$57acba87d6e25586$var$useResizeObserver");const Ve=ye,ke=_e,qe=Ne,Be=Ie,Fe=Ue;var je={horizontal:"qozret2 qozret1",vertical:"qozret3 qozret1"},Ze={horizontal:"qozret6 qozret5",vertical:"qozret7 qozret5"},Ge="qozret8",Je="qozret4";const B=r.forwardRef(({orientation:e,children:t,scrollbar:o},c)=>se(Ve,{ref:c,className:je[e],children:[W(ke,{className:Je,children:t}),W(qe,{orientation:e,className:Ze[e],forceMount:o==="all"?!0:void 0,children:W(Be,{className:Ge})}),W(Fe,{})]})),ct=r.memo(B);try{B.displayName="ScrollArea",B.__docgenInfo={description:"",displayName:"ScrollArea",props:{orientation:{defaultValue:null,description:"",name:"orientation",required:!0,type:{name:"enum",value:[{value:'"horizontal"'},{value:'"vertical"'}]}},scrollbar:{defaultValue:null,description:"",name:"scrollbar",required:!1,type:{name:"enum",value:[{value:'"all"'},{value:'"hover"'}]}}}}}catch{}export{N as $,ct as S};
//# sourceMappingURL=index-58b3af1e.js.map
