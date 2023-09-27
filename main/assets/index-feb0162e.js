var ne=Object.defineProperty;var h=(e,o)=>ne(e,"name",{value:o,configurable:!0});import{a as le,j as I}from"./jsx-runtime-4ceca8ef.js";import{r as t}from"./index-9aab58ca.js";import{a as C,g as V,e as ce,h as ae,b as y,c as A,$ as P}from"./index-a0393411.js";import{r as se}from"./index-1a33c536.js";/* empty css                              */function ie(e,o){return t.useReducer((r,l)=>{const n=o[r][l];return n??r},e)}h(ie,"$fe963b355347cc68$export$3e6543de14f8614f");const N=h(e=>{const{present:o,children:r}=e,l=de(o),n=typeof r=="function"?r({present:l.isPresent}):t.Children.only(r),c=C(l.ref,n.ref);return typeof r=="function"||l.isPresent?t.cloneElement(n,{ref:c}):null},"$921a889cee6df7e8$export$99c2b779aa4e8b8b");N.displayName="Presence";function de(e){const[o,r]=t.useState(),l=t.useRef({}),n=t.useRef(e),c=t.useRef("none"),d=e?"mounted":"unmounted",[a,s]=ie(d,{mounted:{UNMOUNT:"unmounted",ANIMATION_OUT:"unmountSuspended"},unmountSuspended:{MOUNT:"mounted",ANIMATION_END:"unmounted"},unmounted:{MOUNT:"mounted"}});return t.useEffect(()=>{const i=W(l.current);c.current=a==="mounted"?i:"none"},[a]),V(()=>{const i=l.current,u=n.current;if(u!==e){const f=c.current,m=W(i);e?s("MOUNT"):m==="none"||(i==null?void 0:i.display)==="none"?s("UNMOUNT"):s(u&&f!==m?"ANIMATION_OUT":"UNMOUNT"),n.current=e}},[e,s]),V(()=>{if(o){const i=h(b=>{const m=W(l.current).includes(b.animationName);b.target===o&&m&&se.flushSync(()=>s("ANIMATION_END"))},"handleAnimationEnd"),u=h(b=>{b.target===o&&(c.current=W(l.current))},"handleAnimationStart");return o.addEventListener("animationstart",u),o.addEventListener("animationcancel",i),o.addEventListener("animationend",i),()=>{o.removeEventListener("animationstart",u),o.removeEventListener("animationcancel",i),o.removeEventListener("animationend",i)}}else s("ANIMATION_END")},[o,s]),{isPresent:["mounted","unmountSuspended"].includes(a),ref:t.useCallback(i=>{i&&(l.current=getComputedStyle(i)),r(i)},[])}}h(de,"$921a889cee6df7e8$var$usePresence");function W(e){return(e==null?void 0:e.animationName)||"none"}h(W,"$921a889cee6df7e8$var$getAnimationName");function p(){return p=Object.assign?Object.assign.bind():function(e){for(var o=1;o<arguments.length;o++){var r=arguments[o];for(var l in r)Object.prototype.hasOwnProperty.call(r,l)&&(e[l]=r[l])}return e},p.apply(this,arguments)}h(p,"_extends");function ue(e,[o,r]){return Math.min(r,Math.max(o,e))}h(ue,"$ae6933e535247d3d$export$7d15b64cf5a3a4c4");function fe(e,o){return t.useReducer((r,l)=>{const n=o[r][l];return n??r},e)}h(fe,"$6c2e24571c90391f$export$3e6543de14f8614f");const G="ScrollArea",[J,Fe]=ce(G),[be,$]=J(G),he=t.forwardRef((e,o)=>{const{__scopeScrollArea:r,type:l="hover",dir:n,scrollHideDelay:c=600,...d}=e,[a,s]=t.useState(null),[i,u]=t.useState(null),[b,f]=t.useState(null),[m,S]=t.useState(null),[R,Y]=t.useState(null),[E,L]=t.useState(0),[q,z]=t.useState(0),[D,_]=t.useState(!1),[M,O]=t.useState(!1),v=C(o,x=>s(x)),g=ae(n);return t.createElement(be,{scope:r,type:l,dir:g,scrollHideDelay:c,scrollArea:a,viewport:i,onViewportChange:u,content:b,onContentChange:f,scrollbarX:m,onScrollbarXChange:S,scrollbarXEnabled:D,onScrollbarXEnabledChange:_,scrollbarY:R,onScrollbarYChange:Y,scrollbarYEnabled:M,onScrollbarYEnabledChange:O,onCornerWidthChange:L,onCornerHeightChange:z},t.createElement(y.div,p({dir:g},d,{ref:v,style:{position:"relative","--radix-scroll-area-corner-width":E+"px","--radix-scroll-area-corner-height":q+"px",...e.style}})))}),me="ScrollAreaViewport",pe=t.forwardRef((e,o)=>{const{__scopeScrollArea:r,children:l,...n}=e,c=$(me,r),d=t.useRef(null),a=C(o,d,c.onViewportChange);return t.createElement(t.Fragment,null,t.createElement("style",{dangerouslySetInnerHTML:{__html:"[data-radix-scroll-area-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}[data-radix-scroll-area-viewport]::-webkit-scrollbar{display:none}"}}),t.createElement(y.div,p({"data-radix-scroll-area-viewport":""},n,{ref:a,style:{overflowX:c.scrollbarXEnabled?"scroll":"hidden",overflowY:c.scrollbarYEnabled?"scroll":"hidden",...e.style}}),t.createElement("div",{ref:c.onContentChange,style:{minWidth:"100%",display:"table"}},l)))}),w="ScrollAreaScrollbar",ve=t.forwardRef((e,o)=>{const{forceMount:r,...l}=e,n=$(w,e.__scopeScrollArea),{onScrollbarXEnabledChange:c,onScrollbarYEnabledChange:d}=n,a=e.orientation==="horizontal";return t.useEffect(()=>(a?c(!0):d(!0),()=>{a?c(!1):d(!1)}),[a,c,d]),n.type==="hover"?t.createElement(Se,p({},l,{ref:o,forceMount:r})):n.type==="scroll"?t.createElement($e,p({},l,{ref:o,forceMount:r})):n.type==="auto"?t.createElement(K,p({},l,{ref:o,forceMount:r})):n.type==="always"?t.createElement(B,p({},l,{ref:o})):null}),Se=t.forwardRef((e,o)=>{const{forceMount:r,...l}=e,n=$(w,e.__scopeScrollArea),[c,d]=t.useState(!1);return t.useEffect(()=>{const a=n.scrollArea;let s=0;if(a){const i=h(()=>{window.clearTimeout(s),d(!0)},"handlePointerEnter"),u=h(()=>{s=window.setTimeout(()=>d(!1),n.scrollHideDelay)},"handlePointerLeave");return a.addEventListener("pointerenter",i),a.addEventListener("pointerleave",u),()=>{window.clearTimeout(s),a.removeEventListener("pointerenter",i),a.removeEventListener("pointerleave",u)}}},[n.scrollArea,n.scrollHideDelay]),t.createElement(N,{present:r||c},t.createElement(K,p({"data-state":c?"visible":"hidden"},l,{ref:o})))}),$e=t.forwardRef((e,o)=>{const{forceMount:r,...l}=e,n=$(w,e.__scopeScrollArea),c=e.orientation==="horizontal",d=X(()=>s("SCROLL_END"),100),[a,s]=fe("hidden",{hidden:{SCROLL:"scrolling"},scrolling:{SCROLL_END:"idle",POINTER_ENTER:"interacting"},interacting:{SCROLL:"interacting",POINTER_LEAVE:"idle"},idle:{HIDE:"hidden",SCROLL:"scrolling",POINTER_ENTER:"interacting"}});return t.useEffect(()=>{if(a==="idle"){const i=window.setTimeout(()=>s("HIDE"),n.scrollHideDelay);return()=>window.clearTimeout(i)}},[a,n.scrollHideDelay,s]),t.useEffect(()=>{const i=n.viewport,u=c?"scrollLeft":"scrollTop";if(i){let b=i[u];const f=h(()=>{const m=i[u];b!==m&&(s("SCROLL"),d()),b=m},"handleScroll");return i.addEventListener("scroll",f),()=>i.removeEventListener("scroll",f)}},[n.viewport,c,s,d]),t.createElement(N,{present:r||a!=="hidden"},t.createElement(B,p({"data-state":a==="hidden"?"hidden":"visible"},l,{ref:o,onPointerEnter:A(e.onPointerEnter,()=>s("POINTER_ENTER")),onPointerLeave:A(e.onPointerLeave,()=>s("POINTER_LEAVE"))})))}),K=t.forwardRef((e,o)=>{const r=$(w,e.__scopeScrollArea),{forceMount:l,...n}=e,[c,d]=t.useState(!1),a=e.orientation==="horizontal",s=X(()=>{if(r.viewport){const i=r.viewport.offsetWidth<r.viewport.scrollWidth,u=r.viewport.offsetHeight<r.viewport.scrollHeight;d(a?i:u)}},10);return T(r.viewport,s),T(r.content,s),t.createElement(N,{present:l||c},t.createElement(B,p({"data-state":c?"visible":"hidden"},n,{ref:o})))}),B=t.forwardRef((e,o)=>{const{orientation:r="vertical",...l}=e,n=$(w,e.__scopeScrollArea),c=t.useRef(null),d=t.useRef(0),[a,s]=t.useState({content:0,viewport:0,scrollbar:{size:0,paddingStart:0,paddingEnd:0}}),i=te(a.viewport,a.content),u={...l,sizes:a,onSizesChange:s,hasThumb:i>0&&i<1,onThumbChange:f=>c.current=f,onThumbPointerUp:()=>d.current=0,onThumbPointerDown:f=>d.current=f};function b(f,m){return Te(f,d.current,a,m)}return h(b,"getScrollPosition"),r==="horizontal"?t.createElement(ge,p({},u,{ref:o,onThumbPositionChange:()=>{if(n.viewport&&c.current){const f=n.viewport.scrollLeft,m=j(f,a,n.dir);c.current.style.transform=`translate3d(${m}px, 0, 0)`}},onWheelScroll:f=>{n.viewport&&(n.viewport.scrollLeft=f)},onDragScroll:f=>{n.viewport&&(n.viewport.scrollLeft=b(f,n.dir))}})):r==="vertical"?t.createElement(we,p({},u,{ref:o,onThumbPositionChange:()=>{if(n.viewport&&c.current){const f=n.viewport.scrollTop,m=j(f,a);c.current.style.transform=`translate3d(0, ${m}px, 0)`}},onWheelScroll:f=>{n.viewport&&(n.viewport.scrollTop=f)},onDragScroll:f=>{n.viewport&&(n.viewport.scrollTop=b(f))}})):null}),ge=t.forwardRef((e,o)=>{const{sizes:r,onSizesChange:l,...n}=e,c=$(w,e.__scopeScrollArea),[d,a]=t.useState(),s=t.useRef(null),i=C(o,s,c.onScrollbarXChange);return t.useEffect(()=>{s.current&&a(getComputedStyle(s.current))},[s]),t.createElement(Z,p({"data-orientation":"horizontal"},n,{ref:i,sizes:r,style:{bottom:0,left:c.dir==="rtl"?"var(--radix-scroll-area-corner-width)":0,right:c.dir==="ltr"?"var(--radix-scroll-area-corner-width)":0,"--radix-scroll-area-thumb-width":U(r)+"px",...e.style},onThumbPointerDown:u=>e.onThumbPointerDown(u.x),onDragScroll:u=>e.onDragScroll(u.x),onWheelScroll:(u,b)=>{if(c.viewport){const f=c.viewport.scrollLeft+u.deltaX;e.onWheelScroll(f),oe(f,b)&&u.preventDefault()}},onResize:()=>{s.current&&c.viewport&&d&&l({content:c.viewport.scrollWidth,viewport:c.viewport.offsetWidth,scrollbar:{size:s.current.clientWidth,paddingStart:H(d.paddingLeft),paddingEnd:H(d.paddingRight)}})}}))}),we=t.forwardRef((e,o)=>{const{sizes:r,onSizesChange:l,...n}=e,c=$(w,e.__scopeScrollArea),[d,a]=t.useState(),s=t.useRef(null),i=C(o,s,c.onScrollbarYChange);return t.useEffect(()=>{s.current&&a(getComputedStyle(s.current))},[s]),t.createElement(Z,p({"data-orientation":"vertical"},n,{ref:i,sizes:r,style:{top:0,right:c.dir==="ltr"?0:void 0,left:c.dir==="rtl"?0:void 0,bottom:"var(--radix-scroll-area-corner-height)","--radix-scroll-area-thumb-height":U(r)+"px",...e.style},onThumbPointerDown:u=>e.onThumbPointerDown(u.y),onDragScroll:u=>e.onDragScroll(u.y),onWheelScroll:(u,b)=>{if(c.viewport){const f=c.viewport.scrollTop+u.deltaY;e.onWheelScroll(f),oe(f,b)&&u.preventDefault()}},onResize:()=>{s.current&&c.viewport&&d&&l({content:c.viewport.scrollHeight,viewport:c.viewport.offsetHeight,scrollbar:{size:s.current.clientHeight,paddingStart:H(d.paddingTop),paddingEnd:H(d.paddingBottom)}})}}))}),[Ee,Q]=J(w),Z=t.forwardRef((e,o)=>{const{__scopeScrollArea:r,sizes:l,hasThumb:n,onThumbChange:c,onThumbPointerUp:d,onThumbPointerDown:a,onThumbPositionChange:s,onDragScroll:i,onWheelScroll:u,onResize:b,...f}=e,m=$(w,r),[S,R]=t.useState(null),Y=C(o,v=>R(v)),E=t.useRef(null),L=t.useRef(""),q=m.viewport,z=l.content-l.viewport,D=P(u),_=P(s),M=X(b,10);function O(v){if(E.current){const g=v.clientX-E.current.left,x=v.clientY-E.current.top;i({x:g,y:x})}}return h(O,"handleDragScroll"),t.useEffect(()=>{const v=h(g=>{const x=g.target;(S==null?void 0:S.contains(x))&&D(g,z)},"handleWheel");return document.addEventListener("wheel",v,{passive:!1}),()=>document.removeEventListener("wheel",v,{passive:!1})},[q,S,z,D]),t.useEffect(_,[l,_]),T(S,M),T(m.content,M),t.createElement(Ee,{scope:r,scrollbar:S,hasThumb:n,onThumbChange:P(c),onThumbPointerUp:P(d),onThumbPositionChange:_,onThumbPointerDown:P(a)},t.createElement(y.div,p({},f,{ref:Y,style:{position:"absolute",...f.style},onPointerDown:A(e.onPointerDown,v=>{v.button===0&&(v.target.setPointerCapture(v.pointerId),E.current=S.getBoundingClientRect(),L.current=document.body.style.webkitUserSelect,document.body.style.webkitUserSelect="none",O(v))}),onPointerMove:A(e.onPointerMove,O),onPointerUp:A(e.onPointerUp,v=>{const g=v.target;g.hasPointerCapture(v.pointerId)&&g.releasePointerCapture(v.pointerId),document.body.style.webkitUserSelect=L.current,E.current=null})})))}),F="ScrollAreaThumb",Pe=t.forwardRef((e,o)=>{const{forceMount:r,...l}=e,n=Q(F,e.__scopeScrollArea);return t.createElement(N,{present:r||n.hasThumb},t.createElement(Ae,p({ref:o},l)))}),Ae=t.forwardRef((e,o)=>{const{__scopeScrollArea:r,style:l,...n}=e,c=$(F,r),d=Q(F,r),{onThumbPositionChange:a}=d,s=C(o,b=>d.onThumbChange(b)),i=t.useRef(),u=X(()=>{i.current&&(i.current(),i.current=void 0)},100);return t.useEffect(()=>{const b=c.viewport;if(b){const f=h(()=>{if(u(),!i.current){const m=Re(b,a);i.current=m,a()}},"handleScroll");return a(),b.addEventListener("scroll",f),()=>b.removeEventListener("scroll",f)}},[c.viewport,u,a]),t.createElement(y.div,p({"data-state":d.hasThumb?"visible":"hidden"},n,{ref:s,style:{width:"var(--radix-scroll-area-thumb-width)",height:"var(--radix-scroll-area-thumb-height)",...l},onPointerDownCapture:A(e.onPointerDownCapture,b=>{const m=b.target.getBoundingClientRect(),S=b.clientX-m.left,R=b.clientY-m.top;d.onThumbPointerDown({x:S,y:R})}),onPointerUp:A(e.onPointerUp,d.onThumbPointerUp)}))}),ee="ScrollAreaCorner",Ce=t.forwardRef((e,o)=>{const r=$(ee,e.__scopeScrollArea),l=!!(r.scrollbarX&&r.scrollbarY);return r.type!=="scroll"&&l?t.createElement(xe,p({},e,{ref:o})):null}),xe=t.forwardRef((e,o)=>{const{__scopeScrollArea:r,...l}=e,n=$(ee,r),[c,d]=t.useState(0),[a,s]=t.useState(0),i=!!(c&&a);return T(n.scrollbarX,()=>{var u;const b=((u=n.scrollbarX)===null||u===void 0?void 0:u.offsetHeight)||0;n.onCornerHeightChange(b),s(b)}),T(n.scrollbarY,()=>{var u;const b=((u=n.scrollbarY)===null||u===void 0?void 0:u.offsetWidth)||0;n.onCornerWidthChange(b),d(b)}),i?t.createElement(y.div,p({},l,{ref:o,style:{width:c,height:a,position:"absolute",right:n.dir==="ltr"?0:void 0,left:n.dir==="rtl"?0:void 0,bottom:0,...e.style}})):null});function H(e){return e?parseInt(e,10):0}h(H,"$57acba87d6e25586$var$toInt");function te(e,o){const r=e/o;return isNaN(r)?0:r}h(te,"$57acba87d6e25586$var$getThumbRatio");function U(e){const o=te(e.viewport,e.content),r=e.scrollbar.paddingStart+e.scrollbar.paddingEnd,l=(e.scrollbar.size-r)*o;return Math.max(l,18)}h(U,"$57acba87d6e25586$var$getThumbSize");function Te(e,o,r,l="ltr"){const n=U(r),c=n/2,d=o||c,a=n-d,s=r.scrollbar.paddingStart+d,i=r.scrollbar.size-r.scrollbar.paddingEnd-a,u=r.content-r.viewport,b=l==="ltr"?[0,u]:[u*-1,0];return re([s,i],b)(e)}h(Te,"$57acba87d6e25586$var$getScrollPositionFromPointer");function j(e,o,r="ltr"){const l=U(o),n=o.scrollbar.paddingStart+o.scrollbar.paddingEnd,c=o.scrollbar.size-n,d=o.content-o.viewport,a=c-l,s=r==="ltr"?[0,d]:[d*-1,0],i=ue(e,s);return re([0,d],[0,a])(i)}h(j,"$57acba87d6e25586$var$getThumbOffsetFromScroll");function re(e,o){return r=>{if(e[0]===e[1]||o[0]===o[1])return o[0];const l=(o[1]-o[0])/(e[1]-e[0]);return o[0]+l*(r-e[0])}}h(re,"$57acba87d6e25586$var$linearScale");function oe(e,o){return e>0&&e<o}h(oe,"$57acba87d6e25586$var$isScrollingWithinScrollbarBounds");const Re=h((e,o=()=>{})=>{let r={left:e.scrollLeft,top:e.scrollTop},l=0;return h(function n(){const c={left:e.scrollLeft,top:e.scrollTop},d=r.left!==c.left,a=r.top!==c.top;(d||a)&&o(),r=c,l=window.requestAnimationFrame(n)},"loop")(),()=>window.cancelAnimationFrame(l)},"$57acba87d6e25586$var$addUnlinkedScrollListener");function X(e,o){const r=P(e),l=t.useRef(0);return t.useEffect(()=>()=>window.clearTimeout(l.current),[]),t.useCallback(()=>{window.clearTimeout(l.current),l.current=window.setTimeout(r,o)},[r,o])}h(X,"$57acba87d6e25586$var$useDebounceCallback");function T(e,o){const r=P(o);V(()=>{let l=0;if(e){const n=new ResizeObserver(()=>{cancelAnimationFrame(l),l=window.requestAnimationFrame(r)});return n.observe(e),()=>{window.cancelAnimationFrame(l),n.unobserve(e)}}},[e,r])}h(T,"$57acba87d6e25586$var$useResizeObserver");const _e=he,ye=pe,Ne=ve,Le=Pe,ze=Ce;var De={horizontal:"qozret2 qozret1",vertical:"qozret3 qozret1"},Me={horizontal:"qozret6 qozret5",vertical:"qozret7 qozret5"},Oe="qozret8",Ie="qozret4";const k=t.forwardRef(({orientation:e,children:o,scrollbar:r},l)=>le(_e,{ref:l,className:De[e],children:[I(ye,{className:Ie,children:o}),I(Ne,{orientation:e,className:Me[e],forceMount:r==="all"?!0:void 0,children:I(Le,{className:Oe})}),I(ze,{})]})),ke=t.memo(k);try{k.displayName="ScrollArea",k.__docgenInfo={description:"",displayName:"ScrollArea",props:{orientation:{defaultValue:null,description:"",name:"orientation",required:!0,type:{name:"enum",value:[{value:'"horizontal"'},{value:'"vertical"'}]}},scrollbar:{defaultValue:null,description:"",name:"scrollbar",required:!1,type:{name:"enum",value:[{value:'"all"'},{value:'"hover"'}]}}}}}catch{}export{N as $,ke as S};
//# sourceMappingURL=index-feb0162e.js.map