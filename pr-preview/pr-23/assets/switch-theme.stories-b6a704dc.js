var ge=Object.defineProperty;var h=(e,t)=>ge(e,"name",{value:t,configurable:!0});import{a as $e,j as E}from"./jsx-runtime-66763e58.js";import{a as ve}from"./index-74139484.js";import{R as n,r as c}from"./index-3534c567.js";import{e as K,a as L,f as J,$ as he,b as w,c as S}from"./index.module-764022c1.js";import{c as te,$ as A,a as Ie}from"./createReactComponent-82dcaf12.js";import{$ as oe,v as x}from"./index.module-fb8e1414.js";import{J as M,i as G,m as k}from"./index-e306b0e8.js";import"./provider-52648ab7.js";/* empty css                            */import"./iframe-f1a88d1a.js";import"./make-decorator-5d477539.js";import"./index-491e85f6.js";import"./index-50ee27ec.js";var _e=te("brightness-up","IconBrightnessUp",[["path",{d:"M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0",key:"svg-0"}],["path",{d:"M12 5l0 -2",key:"svg-1"}],["path",{d:"M17 7l1.4 -1.4",key:"svg-2"}],["path",{d:"M19 12l2 0",key:"svg-3"}],["path",{d:"M17 17l1.4 1.4",key:"svg-4"}],["path",{d:"M12 19l0 2",key:"svg-5"}],["path",{d:"M7 17l-1.4 1.4",key:"svg-6"}],["path",{d:"M6 12l-2 0",key:"svg-7"}],["path",{d:"M7 7l-1.4 -1.4",key:"svg-8"}]]),Te=te("moon-stars","IconMoonStars",[["path",{d:"M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z",key:"svg-0"}],["path",{d:"M17 4a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2",key:"svg-1"}],["path",{d:"M19 11h2m-1 -1v2",key:"svg-2"}]]);function _(){return _=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var o=arguments[t];for(var r in o)Object.prototype.hasOwnProperty.call(o,r)&&(e[r]=o[r])}return e},_.apply(this,arguments)}h(_,"_extends$2");function P(){return P=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var o=arguments[t];for(var r in o)Object.prototype.hasOwnProperty.call(o,r)&&(e[r]=o[r])}return e},P.apply(this,arguments)}h(P,"_extends$1");function Ce(e){const t=e+"CollectionProvider",[o,r]=K(t),[s,l]=o(t,{collectionRef:{current:null},itemMap:new Map}),d=h(b=>{const{scope:u,children:v}=b,T=n.useRef(null),f=n.useRef(new Map).current;return n.createElement(s,{scope:u,itemMap:f,collectionRef:T},v)},"CollectionProvider"),a=e+"CollectionSlot",p=n.forwardRef((b,u)=>{const{scope:v,children:T}=b,f=l(a,v),m=L(u,f.collectionRef);return n.createElement(J,{ref:m},T)}),i=e+"CollectionItemSlot",g="data-radix-collection-item",$=n.forwardRef((b,u)=>{const{scope:v,children:T,...f}=b,m=n.useRef(null),F=L(u,m),R=l(i,v);return n.useEffect(()=>(R.itemMap.set(m,{ref:m,...f}),()=>void R.itemMap.delete(m))),n.createElement(J,{[g]:"",ref:F},T)});function C(b){const u=l(e+"CollectionConsumer",b);return n.useCallback(()=>{const T=u.collectionRef.current;if(!T)return[];const f=Array.from(T.querySelectorAll(`[${g}]`));return Array.from(u.itemMap.values()).sort((R,N)=>f.indexOf(R.ref.current)-f.indexOf(N.ref.current))},[u.collectionRef,u.itemMap])}return h(C,"useCollection"),[{Provider:d,Slot:p,ItemSlot:$},C,r]}h(Ce,"$e02a7d9cb1dc128c$export$c74125a8e3af6bb2");const V="rovingFocusGroup.onEntryFocus",Ee={bubbles:!1,cancelable:!0},z="RovingFocusGroup",[j,re,Re]=Ce(z),[xe,ne]=K(z,[Re]),[ye,Se]=xe(z),we=c.forwardRef((e,t)=>c.createElement(j.Provider,{scope:e.__scopeRovingFocusGroup},c.createElement(j.Slot,{scope:e.__scopeRovingFocusGroup},c.createElement(Pe,P({},e,{ref:t}))))),Pe=c.forwardRef((e,t)=>{const{__scopeRovingFocusGroup:o,orientation:r,loop:s=!1,dir:l,currentTabStopId:d,defaultCurrentTabStopId:a,onCurrentTabStopIdChange:p,onEntryFocus:i,...g}=e,$=c.useRef(null),C=L(t,$),b=oe(l),[u=null,v]=A({prop:d,defaultProp:a,onChange:p}),[T,f]=c.useState(!1),m=he(i),F=re(o),R=c.useRef(!1),[N,Y]=c.useState(0);return c.useEffect(()=>{const I=$.current;if(I)return I.addEventListener(V,m),()=>I.removeEventListener(V,m)},[m]),c.createElement(ye,{scope:o,orientation:r,dir:b,loop:s,currentTabStopId:u,onItemFocus:c.useCallback(I=>v(I),[v]),onItemShiftTab:c.useCallback(()=>f(!0),[]),onFocusableItemAdd:c.useCallback(()=>Y(I=>I+1),[]),onFocusableItemRemove:c.useCallback(()=>Y(I=>I-1),[])},c.createElement(w.div,P({tabIndex:T||N===0?-1:0,"data-orientation":r},g,{ref:C,style:{outline:"none",...e.style},onMouseDown:S(e.onMouseDown,()=>{R.current=!0}),onFocus:S(e.onFocus,I=>{const fe=!R.current;if(I.target===I.currentTarget&&fe&&!T){const H=new CustomEvent(V,Ee);if(I.currentTarget.dispatchEvent(H),!H.defaultPrevented){const D=F().filter(y=>y.focusable),pe=D.find(y=>y.active),me=D.find(y=>y.id===u),be=[pe,me,...D].filter(Boolean).map(y=>y.ref.current);ae(be)}}R.current=!1}),onBlur:S(e.onBlur,()=>f(!1))})))}),Fe="RovingFocusGroupItem",Me=c.forwardRef((e,t)=>{const{__scopeRovingFocusGroup:o,focusable:r=!0,active:s=!1,tabStopId:l,...d}=e,a=Ie(),p=l||a,i=Se(Fe,o),g=i.currentTabStopId===p,$=re(o),{onFocusableItemAdd:C,onFocusableItemRemove:b}=i;return c.useEffect(()=>{if(r)return C(),()=>b()},[r,C,b]),c.createElement(j.ItemSlot,{scope:o,id:p,focusable:r,active:s},c.createElement(w.span,P({tabIndex:g?0:-1,"data-orientation":i.orientation},d,{ref:t,onMouseDown:S(e.onMouseDown,u=>{r?i.onItemFocus(p):u.preventDefault()}),onFocus:S(e.onFocus,()=>i.onItemFocus(p)),onKeyDown:S(e.onKeyDown,u=>{if(u.key==="Tab"&&u.shiftKey){i.onItemShiftTab();return}if(u.target!==u.currentTarget)return;const v=Ae(u,i.orientation,i.dir);if(v!==void 0){u.preventDefault();let f=$().filter(m=>m.focusable).map(m=>m.ref.current);if(v==="last")f.reverse();else if(v==="prev"||v==="next"){v==="prev"&&f.reverse();const m=f.indexOf(u.currentTarget);f=i.loop?Oe(f,m+1):f.slice(m+1)}setTimeout(()=>ae(f))}})})))}),Ge={ArrowLeft:"prev",ArrowUp:"prev",ArrowRight:"next",ArrowDown:"next",PageUp:"first",Home:"first",PageDown:"last",End:"last"};function ke(e,t){return t!=="rtl"?e:e==="ArrowLeft"?"ArrowRight":e==="ArrowRight"?"ArrowLeft":e}h(ke,"$d7bdfb9eb0fdf311$var$getDirectionAwareKey");function Ae(e,t,o){const r=ke(e.key,o);if(!(t==="vertical"&&["ArrowLeft","ArrowRight"].includes(r))&&!(t==="horizontal"&&["ArrowUp","ArrowDown"].includes(r)))return Ge[r]}h(Ae,"$d7bdfb9eb0fdf311$var$getFocusIntent");function ae(e){const t=document.activeElement;for(const o of e)if(o===t||(o.focus(),document.activeElement!==t))return}h(ae,"$d7bdfb9eb0fdf311$var$focusFirst");function Oe(e,t){return e.map((o,r)=>e[(t+r)%e.length])}h(Oe,"$d7bdfb9eb0fdf311$var$wrapArray");const Ne=we,De=Me;function q(){return q=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var o=arguments[t];for(var r in o)Object.prototype.hasOwnProperty.call(o,r)&&(e[r]=o[r])}return e},q.apply(this,arguments)}h(q,"_extends");const Ve=c.forwardRef((e,t)=>{const{pressed:o,defaultPressed:r=!1,onPressedChange:s,...l}=e,[d=!1,a]=A({prop:o,onChange:s,defaultProp:r});return c.createElement(w.button,q({type:"button","aria-pressed":d,"data-state":d?"on":"off","data-disabled":e.disabled?"":void 0},l,{ref:t,onClick:S(e.onClick,()=>{e.disabled||a(!d)})}))}),O="ToggleGroup",[ce,it]=K(O,[ne]),se=ne(),Le=n.forwardRef((e,t)=>{const{type:o,...r}=e;if(o==="single"){const s=r;return n.createElement(je,_({},s,{ref:t}))}if(o==="multiple"){const s=r;return n.createElement(qe,_({},s,{ref:t}))}throw new Error(`Missing prop \`type\` expected on \`${O}\``)}),[le,de]=ce(O),je=n.forwardRef((e,t)=>{const{value:o,defaultValue:r,onValueChange:s=h(()=>{},"onValueChange"),...l}=e,[d,a]=A({prop:o,defaultProp:r,onChange:s});return n.createElement(le,{scope:e.__scopeToggleGroup,type:"single",value:d?[d]:[],onItemActivate:a,onItemDeactivate:n.useCallback(()=>a(""),[a])},n.createElement(ue,_({},l,{ref:t})))}),qe=n.forwardRef((e,t)=>{const{value:o,defaultValue:r,onValueChange:s=h(()=>{},"onValueChange"),...l}=e,[d=[],a]=A({prop:o,defaultProp:r,onChange:s}),p=n.useCallback(g=>a(($=[])=>[...$,g]),[a]),i=n.useCallback(g=>a(($=[])=>$.filter(C=>C!==g)),[a]);return n.createElement(le,{scope:e.__scopeToggleGroup,type:"multiple",value:d,onItemActivate:p,onItemDeactivate:i},n.createElement(ue,_({},l,{ref:t})))}),[Be,Ue]=ce(O),ue=n.forwardRef((e,t)=>{const{__scopeToggleGroup:o,disabled:r=!1,rovingFocus:s=!0,orientation:l,dir:d,loop:a=!0,...p}=e,i=se(o),g=oe(d),$={role:"group",dir:g,...p};return n.createElement(Be,{scope:o,rovingFocus:s,disabled:r},s?n.createElement(Ne,_({asChild:!0},i,{orientation:l,dir:g,loop:a}),n.createElement(w.div,_({},$,{ref:t}))):n.createElement(w.div,_({},$,{ref:t})))}),B="ToggleGroupItem",Ke=n.forwardRef((e,t)=>{const o=de(B,e.__scopeToggleGroup),r=Ue(B,e.__scopeToggleGroup),s=se(e.__scopeToggleGroup),l=o.value.includes(e.value),d=r.disabled||e.disabled,a={...e,pressed:l,disabled:d},p=n.useRef(null);return r.rovingFocus?n.createElement(De,_({asChild:!0},s,{focusable:!d,active:l,ref:p}),n.createElement(Q,_({},a,{ref:t}))):n.createElement(Q,_({},a,{ref:t}))}),Q=n.forwardRef((e,t)=>{const{__scopeToggleGroup:o,value:r,...s}=e,l=de(B,o),d={role:"radio","aria-checked":e.pressed,"aria-pressed":void 0},a=l.type==="single"?d:void 0;return n.createElement(Ve,_({},a,s,{ref:t,onPressedChange:p=>{p?l.onItemActivate(r):l.onItemDeactivate(r)}}))}),ze=Le,W=Ke,Ye=h(e=>typeof e=="string"&&["dark","light"].includes(e),"isTheme");var X="qutgt97",Z="qutgt98",He="qutgt93",ee={dark:"qutgt95 qutgt94",light:"qutgt96 qutgt94"};const U=c.forwardRef(({theme:e,defaultTheme:t,onChange:o,orientation:r},s)=>{const[l,d]=c.useState(t),a=e??l,p=c.useCallback(b=>{Ye(b)&&(d(b),o==null||o(b))},[o]),i=M({from:{transform:"scale(0)",background:"transparent"},transform:a==="light"?"scale(1)":"scale(0)",background:a==="light"?x.pallets.accent1:"transparent",config:k.gentle}),g=M({from:{color:x.pallets.disabled},color:a==="light"?x.pallets.black:x.pallets.disabled,config:k.gentle}),$=M({from:{transform:"scale(0)",background:"transparent"},transform:a==="dark"?"scale(1)":"scale(0)",background:a==="dark"?x.pallets.black:"transparent",config:k.gentle}),C=M({from:{color:x.pallets.disabled},color:a==="dark"?x.pallets.accent1:x.pallets.disabled,config:k.gentle});return $e(ze,{type:"single",ref:s,defaultValue:t,value:a,onValueChange:p,orientation:r,loop:!0,className:He,children:[E(G.div,{className:ee.light,style:i}),E(G.div,{className:ee.dark,style:$}),E(G.div,{style:g,children:E(W,{value:"light","aria-label":"Light theme",className:X,children:E(_e,{className:Z})})}),E(G.div,{style:C,children:E(W,{value:"dark","aria-label":"Dark theme",className:X,children:E(Te,{className:Z})})})]})}),ie=c.memo(U);try{U.displayName="SwitchTheme",U.__docgenInfo={description:"",displayName:"SwitchTheme",props:{theme:{defaultValue:null,description:"",name:"theme",required:!1,type:{name:"enum",value:[{value:'"dark"'},{value:'"light"'}]}},defaultTheme:{defaultValue:null,description:"",name:"defaultTheme",required:!1,type:{name:"enum",value:[{value:'"dark"'},{value:'"light"'}]}},onChange:{defaultValue:null,description:"",name:"onChange",required:!1,type:{name:"((theme: Theme) => void)"}},orientation:{defaultValue:null,description:"",name:"orientation",required:!1,type:{name:"enum",value:[{value:'"horizontal"'}]}}}}}catch{}const ft={title:"components/SwitchTheme",component:ie},Je=h(e=>E(ie,{...e,onChange:ve("change")}),"Default");Je.args={defaultTheme:"light"};const pt=["Default"];export{Je as Default,pt as __namedExportsOrder,ft as default};
//# sourceMappingURL=switch-theme.stories-b6a704dc.js.map
