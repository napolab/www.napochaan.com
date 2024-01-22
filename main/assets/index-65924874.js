import{j as oe,a as O}from"./jsx-runtime-03b4ddbf.js";import{_ as p}from"./extends-98964cd2.js";import{r as t}from"./index-76fb7be0.js";import{b as A,$ as q,c as ne,d as le,e as _,f as P,a as E}from"./index-b86e5f49.js";import{r as ce}from"./index-d3ea75b5.js";/* empty css                              */function ae(e,o){return t.useReducer((r,l)=>{const n=o[r][l];return n??r},e)}const y=e=>{const{present:o,children:r}=e,l=se(o),n=typeof r=="function"?r({present:l.isPresent}):t.Children.only(r),c=A(l.ref,n.ref);return typeof r=="function"||l.isPresent?t.cloneElement(n,{ref:c}):null};y.displayName="Presence";function se(e){const[o,r]=t.useState(),l=t.useRef({}),n=t.useRef(e),c=t.useRef("none"),d=e?"mounted":"unmounted",[a,s]=ae(d,{mounted:{UNMOUNT:"unmounted",ANIMATION_OUT:"unmountSuspended"},unmountSuspended:{MOUNT:"mounted",ANIMATION_END:"unmounted"},unmounted:{MOUNT:"mounted"}});return t.useEffect(()=>{const i=I(l.current);c.current=a==="mounted"?i:"none"},[a]),q(()=>{const i=l.current,u=n.current;if(u!==e){const f=c.current,h=I(i);e?s("MOUNT"):h==="none"||(i==null?void 0:i.display)==="none"?s("UNMOUNT"):s(u&&f!==h?"ANIMATION_OUT":"UNMOUNT"),n.current=e}},[e,s]),q(()=>{if(o){const i=b=>{const h=I(l.current).includes(b.animationName);b.target===o&&h&&ce.flushSync(()=>s("ANIMATION_END"))},u=b=>{b.target===o&&(c.current=I(l.current))};return o.addEventListener("animationstart",u),o.addEventListener("animationcancel",i),o.addEventListener("animationend",i),()=>{o.removeEventListener("animationstart",u),o.removeEventListener("animationcancel",i),o.removeEventListener("animationend",i)}}else s("ANIMATION_END")},[o,s]),{isPresent:["mounted","unmountSuspended"].includes(a),ref:t.useCallback(i=>{i&&(l.current=getComputedStyle(i)),r(i)},[])}}function I(e){return(e==null?void 0:e.animationName)||"none"}function ie(e,[o,r]){return Math.min(r,Math.max(o,e))}function de(e,o){return t.useReducer((r,l)=>{const n=o[r][l];return n??r},e)}const j="ScrollArea",[G,qe]=ne(j),[ue,S]=G(j),fe=t.forwardRef((e,o)=>{const{__scopeScrollArea:r,type:l="hover",dir:n,scrollHideDelay:c=600,...d}=e,[a,s]=t.useState(null),[i,u]=t.useState(null),[b,f]=t.useState(null),[h,v]=t.useState(null),[T,X]=t.useState(null),[g,N]=t.useState(0),[Y,L]=t.useState(0),[z,R]=t.useState(!1),[D,M]=t.useState(!1),m=A(o,C=>s(C)),$=le(n);return t.createElement(ue,{scope:r,type:l,dir:$,scrollHideDelay:c,scrollArea:a,viewport:i,onViewportChange:u,content:b,onContentChange:f,scrollbarX:h,onScrollbarXChange:v,scrollbarXEnabled:z,onScrollbarXEnabledChange:R,scrollbarY:T,onScrollbarYChange:X,scrollbarYEnabled:D,onScrollbarYEnabledChange:M,onCornerWidthChange:N,onCornerHeightChange:L},t.createElement(_.div,p({dir:$},d,{ref:m,style:{position:"relative","--radix-scroll-area-corner-width":g+"px","--radix-scroll-area-corner-height":Y+"px",...e.style}})))}),be="ScrollAreaViewport",he=t.forwardRef((e,o)=>{const{__scopeScrollArea:r,children:l,...n}=e,c=S(be,r),d=t.useRef(null),a=A(o,d,c.onViewportChange);return t.createElement(t.Fragment,null,t.createElement("style",{dangerouslySetInnerHTML:{__html:"[data-radix-scroll-area-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}[data-radix-scroll-area-viewport]::-webkit-scrollbar{display:none}"}}),t.createElement(_.div,p({"data-radix-scroll-area-viewport":""},n,{ref:a,style:{overflowX:c.scrollbarXEnabled?"scroll":"hidden",overflowY:c.scrollbarYEnabled?"scroll":"hidden",...e.style}}),t.createElement("div",{ref:c.onContentChange,style:{minWidth:"100%",display:"table"}},l)))}),w="ScrollAreaScrollbar",me=t.forwardRef((e,o)=>{const{forceMount:r,...l}=e,n=S(w,e.__scopeScrollArea),{onScrollbarXEnabledChange:c,onScrollbarYEnabledChange:d}=n,a=e.orientation==="horizontal";return t.useEffect(()=>(a?c(!0):d(!0),()=>{a?c(!1):d(!1)}),[a,c,d]),n.type==="hover"?t.createElement(pe,p({},l,{ref:o,forceMount:r})):n.type==="scroll"?t.createElement(ve,p({},l,{ref:o,forceMount:r})):n.type==="auto"?t.createElement(J,p({},l,{ref:o,forceMount:r})):n.type==="always"?t.createElement(F,p({},l,{ref:o})):null}),pe=t.forwardRef((e,o)=>{const{forceMount:r,...l}=e,n=S(w,e.__scopeScrollArea),[c,d]=t.useState(!1);return t.useEffect(()=>{const a=n.scrollArea;let s=0;if(a){const i=()=>{window.clearTimeout(s),d(!0)},u=()=>{s=window.setTimeout(()=>d(!1),n.scrollHideDelay)};return a.addEventListener("pointerenter",i),a.addEventListener("pointerleave",u),()=>{window.clearTimeout(s),a.removeEventListener("pointerenter",i),a.removeEventListener("pointerleave",u)}}},[n.scrollArea,n.scrollHideDelay]),t.createElement(y,{present:r||c},t.createElement(J,p({"data-state":c?"visible":"hidden"},l,{ref:o})))}),ve=t.forwardRef((e,o)=>{const{forceMount:r,...l}=e,n=S(w,e.__scopeScrollArea),c=e.orientation==="horizontal",d=U(()=>s("SCROLL_END"),100),[a,s]=de("hidden",{hidden:{SCROLL:"scrolling"},scrolling:{SCROLL_END:"idle",POINTER_ENTER:"interacting"},interacting:{SCROLL:"interacting",POINTER_LEAVE:"idle"},idle:{HIDE:"hidden",SCROLL:"scrolling",POINTER_ENTER:"interacting"}});return t.useEffect(()=>{if(a==="idle"){const i=window.setTimeout(()=>s("HIDE"),n.scrollHideDelay);return()=>window.clearTimeout(i)}},[a,n.scrollHideDelay,s]),t.useEffect(()=>{const i=n.viewport,u=c?"scrollLeft":"scrollTop";if(i){let b=i[u];const f=()=>{const h=i[u];b!==h&&(s("SCROLL"),d()),b=h};return i.addEventListener("scroll",f),()=>i.removeEventListener("scroll",f)}},[n.viewport,c,s,d]),t.createElement(y,{present:r||a!=="hidden"},t.createElement(F,p({"data-state":a==="hidden"?"hidden":"visible"},l,{ref:o,onPointerEnter:P(e.onPointerEnter,()=>s("POINTER_ENTER")),onPointerLeave:P(e.onPointerLeave,()=>s("POINTER_LEAVE"))})))}),J=t.forwardRef((e,o)=>{const r=S(w,e.__scopeScrollArea),{forceMount:l,...n}=e,[c,d]=t.useState(!1),a=e.orientation==="horizontal",s=U(()=>{if(r.viewport){const i=r.viewport.offsetWidth<r.viewport.scrollWidth,u=r.viewport.offsetHeight<r.viewport.scrollHeight;d(a?i:u)}},10);return x(r.viewport,s),x(r.content,s),t.createElement(y,{present:l||c},t.createElement(F,p({"data-state":c?"visible":"hidden"},n,{ref:o})))}),F=t.forwardRef((e,o)=>{const{orientation:r="vertical",...l}=e,n=S(w,e.__scopeScrollArea),c=t.useRef(null),d=t.useRef(0),[a,s]=t.useState({content:0,viewport:0,scrollbar:{size:0,paddingStart:0,paddingEnd:0}}),i=ee(a.viewport,a.content),u={...l,sizes:a,onSizesChange:s,hasThumb:i>0&&i<1,onThumbChange:f=>c.current=f,onThumbPointerUp:()=>d.current=0,onThumbPointerDown:f=>d.current=f};function b(f,h){return Ce(f,d.current,a,h)}return r==="horizontal"?t.createElement(Se,p({},u,{ref:o,onThumbPositionChange:()=>{if(n.viewport&&c.current){const f=n.viewport.scrollLeft,h=B(f,a,n.dir);c.current.style.transform=`translate3d(${h}px, 0, 0)`}},onWheelScroll:f=>{n.viewport&&(n.viewport.scrollLeft=f)},onDragScroll:f=>{n.viewport&&(n.viewport.scrollLeft=b(f,n.dir))}})):r==="vertical"?t.createElement($e,p({},u,{ref:o,onThumbPositionChange:()=>{if(n.viewport&&c.current){const f=n.viewport.scrollTop,h=B(f,a);c.current.style.transform=`translate3d(0, ${h}px, 0)`}},onWheelScroll:f=>{n.viewport&&(n.viewport.scrollTop=f)},onDragScroll:f=>{n.viewport&&(n.viewport.scrollTop=b(f))}})):null}),Se=t.forwardRef((e,o)=>{const{sizes:r,onSizesChange:l,...n}=e,c=S(w,e.__scopeScrollArea),[d,a]=t.useState(),s=t.useRef(null),i=A(o,s,c.onScrollbarXChange);return t.useEffect(()=>{s.current&&a(getComputedStyle(s.current))},[s]),t.createElement(Q,p({"data-orientation":"horizontal"},n,{ref:i,sizes:r,style:{bottom:0,left:c.dir==="rtl"?"var(--radix-scroll-area-corner-width)":0,right:c.dir==="ltr"?"var(--radix-scroll-area-corner-width)":0,"--radix-scroll-area-thumb-width":H(r)+"px",...e.style},onThumbPointerDown:u=>e.onThumbPointerDown(u.x),onDragScroll:u=>e.onDragScroll(u.x),onWheelScroll:(u,b)=>{if(c.viewport){const f=c.viewport.scrollLeft+u.deltaX;e.onWheelScroll(f),re(f,b)&&u.preventDefault()}},onResize:()=>{s.current&&c.viewport&&d&&l({content:c.viewport.scrollWidth,viewport:c.viewport.offsetWidth,scrollbar:{size:s.current.clientWidth,paddingStart:W(d.paddingLeft),paddingEnd:W(d.paddingRight)}})}}))}),$e=t.forwardRef((e,o)=>{const{sizes:r,onSizesChange:l,...n}=e,c=S(w,e.__scopeScrollArea),[d,a]=t.useState(),s=t.useRef(null),i=A(o,s,c.onScrollbarYChange);return t.useEffect(()=>{s.current&&a(getComputedStyle(s.current))},[s]),t.createElement(Q,p({"data-orientation":"vertical"},n,{ref:i,sizes:r,style:{top:0,right:c.dir==="ltr"?0:void 0,left:c.dir==="rtl"?0:void 0,bottom:"var(--radix-scroll-area-corner-height)","--radix-scroll-area-thumb-height":H(r)+"px",...e.style},onThumbPointerDown:u=>e.onThumbPointerDown(u.y),onDragScroll:u=>e.onDragScroll(u.y),onWheelScroll:(u,b)=>{if(c.viewport){const f=c.viewport.scrollTop+u.deltaY;e.onWheelScroll(f),re(f,b)&&u.preventDefault()}},onResize:()=>{s.current&&c.viewport&&d&&l({content:c.viewport.scrollHeight,viewport:c.viewport.offsetHeight,scrollbar:{size:s.current.clientHeight,paddingStart:W(d.paddingTop),paddingEnd:W(d.paddingBottom)}})}}))}),[we,K]=G(w),Q=t.forwardRef((e,o)=>{const{__scopeScrollArea:r,sizes:l,hasThumb:n,onThumbChange:c,onThumbPointerUp:d,onThumbPointerDown:a,onThumbPositionChange:s,onDragScroll:i,onWheelScroll:u,onResize:b,...f}=e,h=S(w,r),[v,T]=t.useState(null),X=A(o,m=>T(m)),g=t.useRef(null),N=t.useRef(""),Y=h.viewport,L=l.content-l.viewport,z=E(u),R=E(s),D=U(b,10);function M(m){if(g.current){const $=m.clientX-g.current.left,C=m.clientY-g.current.top;i({x:$,y:C})}}return t.useEffect(()=>{const m=$=>{const C=$.target;(v==null?void 0:v.contains(C))&&z($,L)};return document.addEventListener("wheel",m,{passive:!1}),()=>document.removeEventListener("wheel",m,{passive:!1})},[Y,v,L,z]),t.useEffect(R,[l,R]),x(v,D),x(h.content,D),t.createElement(we,{scope:r,scrollbar:v,hasThumb:n,onThumbChange:E(c),onThumbPointerUp:E(d),onThumbPositionChange:R,onThumbPointerDown:E(a)},t.createElement(_.div,p({},f,{ref:X,style:{position:"absolute",...f.style},onPointerDown:P(e.onPointerDown,m=>{m.button===0&&(m.target.setPointerCapture(m.pointerId),g.current=v.getBoundingClientRect(),N.current=document.body.style.webkitUserSelect,document.body.style.webkitUserSelect="none",M(m))}),onPointerMove:P(e.onPointerMove,M),onPointerUp:P(e.onPointerUp,m=>{const $=m.target;$.hasPointerCapture(m.pointerId)&&$.releasePointerCapture(m.pointerId),document.body.style.webkitUserSelect=N.current,g.current=null})})))}),V="ScrollAreaThumb",ge=t.forwardRef((e,o)=>{const{forceMount:r,...l}=e,n=K(V,e.__scopeScrollArea);return t.createElement(y,{present:r||n.hasThumb},t.createElement(Ee,p({ref:o},l)))}),Ee=t.forwardRef((e,o)=>{const{__scopeScrollArea:r,style:l,...n}=e,c=S(V,r),d=K(V,r),{onThumbPositionChange:a}=d,s=A(o,b=>d.onThumbChange(b)),i=t.useRef(),u=U(()=>{i.current&&(i.current(),i.current=void 0)},100);return t.useEffect(()=>{const b=c.viewport;if(b){const f=()=>{if(u(),!i.current){const h=xe(b,a);i.current=h,a()}};return a(),b.addEventListener("scroll",f),()=>b.removeEventListener("scroll",f)}},[c.viewport,u,a]),t.createElement(_.div,p({"data-state":d.hasThumb?"visible":"hidden"},n,{ref:s,style:{width:"var(--radix-scroll-area-thumb-width)",height:"var(--radix-scroll-area-thumb-height)",...l},onPointerDownCapture:P(e.onPointerDownCapture,b=>{const h=b.target.getBoundingClientRect(),v=b.clientX-h.left,T=b.clientY-h.top;d.onThumbPointerDown({x:v,y:T})}),onPointerUp:P(e.onPointerUp,d.onThumbPointerUp)}))}),Z="ScrollAreaCorner",Pe=t.forwardRef((e,o)=>{const r=S(Z,e.__scopeScrollArea),l=!!(r.scrollbarX&&r.scrollbarY);return r.type!=="scroll"&&l?t.createElement(Ae,p({},e,{ref:o})):null}),Ae=t.forwardRef((e,o)=>{const{__scopeScrollArea:r,...l}=e,n=S(Z,r),[c,d]=t.useState(0),[a,s]=t.useState(0),i=!!(c&&a);return x(n.scrollbarX,()=>{var u;const b=((u=n.scrollbarX)===null||u===void 0?void 0:u.offsetHeight)||0;n.onCornerHeightChange(b),s(b)}),x(n.scrollbarY,()=>{var u;const b=((u=n.scrollbarY)===null||u===void 0?void 0:u.offsetWidth)||0;n.onCornerWidthChange(b),d(b)}),i?t.createElement(_.div,p({},l,{ref:o,style:{width:c,height:a,position:"absolute",right:n.dir==="ltr"?0:void 0,left:n.dir==="rtl"?0:void 0,bottom:0,...e.style}})):null});function W(e){return e?parseInt(e,10):0}function ee(e,o){const r=e/o;return isNaN(r)?0:r}function H(e){const o=ee(e.viewport,e.content),r=e.scrollbar.paddingStart+e.scrollbar.paddingEnd,l=(e.scrollbar.size-r)*o;return Math.max(l,18)}function Ce(e,o,r,l="ltr"){const n=H(r),c=n/2,d=o||c,a=n-d,s=r.scrollbar.paddingStart+d,i=r.scrollbar.size-r.scrollbar.paddingEnd-a,u=r.content-r.viewport,b=l==="ltr"?[0,u]:[u*-1,0];return te([s,i],b)(e)}function B(e,o,r="ltr"){const l=H(o),n=o.scrollbar.paddingStart+o.scrollbar.paddingEnd,c=o.scrollbar.size-n,d=o.content-o.viewport,a=c-l,s=r==="ltr"?[0,d]:[d*-1,0],i=ie(e,s);return te([0,d],[0,a])(i)}function te(e,o){return r=>{if(e[0]===e[1]||o[0]===o[1])return o[0];const l=(o[1]-o[0])/(e[1]-e[0]);return o[0]+l*(r-e[0])}}function re(e,o){return e>0&&e<o}const xe=(e,o=()=>{})=>{let r={left:e.scrollLeft,top:e.scrollTop},l=0;return function n(){const c={left:e.scrollLeft,top:e.scrollTop},d=r.left!==c.left,a=r.top!==c.top;(d||a)&&o(),r=c,l=window.requestAnimationFrame(n)}(),()=>window.cancelAnimationFrame(l)};function U(e,o){const r=E(e),l=t.useRef(0);return t.useEffect(()=>()=>window.clearTimeout(l.current),[]),t.useCallback(()=>{window.clearTimeout(l.current),l.current=window.setTimeout(r,o)},[r,o])}function x(e,o){const r=E(o);q(()=>{let l=0;if(e){const n=new ResizeObserver(()=>{cancelAnimationFrame(l),l=window.requestAnimationFrame(r)});return n.observe(e),()=>{window.cancelAnimationFrame(l),n.unobserve(e)}}},[e,r])}const Te=fe,Re=he,_e=me,ye=ge,Ne=Pe;var Le={horizontal:"qozret2 qozret1",vertical:"qozret3 qozret1"},ze={horizontal:"qozret6 qozret5",vertical:"qozret7 qozret5"},De="qozret8",Me="qozret4";const k=t.forwardRef(({orientation:e,children:o,scrollbar:r},l)=>oe(Te,{ref:l,className:Le[e],children:[O(Re,{className:Me,children:o}),O(_e,{orientation:e,className:ze[e],forceMount:r==="all"?!0:void 0,children:O(ye,{className:De})}),O(Ne,{})]})),Ve=t.memo(k);try{k.displayName="ScrollArea",k.__docgenInfo={description:"",displayName:"ScrollArea",props:{orientation:{defaultValue:null,description:"",name:"orientation",required:!0,type:{name:"enum",value:[{value:'"horizontal"'},{value:'"vertical"'}]}},scrollbar:{defaultValue:null,description:"",name:"scrollbar",required:!1,type:{name:"enum",value:[{value:'"all"'},{value:'"hover"'}]}}}}}catch{}export{y as $,Ve as S};
//# sourceMappingURL=index-65924874.js.map