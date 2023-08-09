var Ee=Object.defineProperty;var u=(e,t)=>Ee(e,"name",{value:t,configurable:!0});import{a as _e,j as x}from"./jsx-runtime-a0a4a613.js";import{a as Ie}from"./index-b6e2e9db.js";import{r,R as i,a as xe}from"./index-3b6510b3.js";import"./index-26e05046.js";import{d as M,a as O,c as A}from"./react-spring_web.modern-068060fd.js";import"./index-41fde349.js";import{v as S}from"./base.css-05c6c12e.js";/* empty css                              */import{c as ce}from"./createReactComponent-f2e20cf9.js";import"./iframe-d4975a8e.js";import"./make-decorator-0126e05f.js";import"./index-50ee27ec.js";var Te=ce("brightness-up","IconBrightnessUp",[["path",{d:"M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0",key:"svg-0"}],["path",{d:"M12 5l0 -2",key:"svg-1"}],["path",{d:"M17 7l1.4 -1.4",key:"svg-2"}],["path",{d:"M19 12l2 0",key:"svg-3"}],["path",{d:"M17 17l1.4 1.4",key:"svg-4"}],["path",{d:"M12 19l0 2",key:"svg-5"}],["path",{d:"M7 17l-1.4 1.4",key:"svg-6"}],["path",{d:"M6 12l-2 0",key:"svg-7"}],["path",{d:"M7 7l-1.4 -1.4",key:"svg-8"}]]),Se=ce("moon-stars","IconMoonStars",[["path",{d:"M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z",key:"svg-0"}],["path",{d:"M17 4a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2",key:"svg-1"}],["path",{d:"M19 11h2m-1 -1v2",key:"svg-2"}]]);function I(){return I=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var o=arguments[t];for(var n in o)Object.prototype.hasOwnProperty.call(o,n)&&(e[n]=o[n])}return e},I.apply(this,arguments)}u(I,"_extends$4");function H(e,t=[]){let o=[];function n(s,l){const a=r.createContext(l),d=o.length;o=[...o,l];function p(m){const{scope:v,children:h,...f}=m,b=(v==null?void 0:v[e][d])||a,E=r.useMemo(()=>f,Object.values(f));return r.createElement(b.Provider,{value:E},h)}u(p,"Provider");function g(m,v){const h=(v==null?void 0:v[e][d])||a,f=r.useContext(h);if(f)return f;if(l!==void 0)return l;throw new Error(`\`${m}\` must be used within \`${s}\``)}return u(g,"useContext"),p.displayName=s+"Provider",[p,g]}u(n,"$c512c27ab02ef895$export$fd42f52fd3ae1109");const c=u(()=>{const s=o.map(l=>r.createContext(l));return u(function(a){const d=(a==null?void 0:a[e])||s;return r.useMemo(()=>({[`__scope${e}`]:{...a,[e]:d}}),[a,d])},"useScope")},"createScope");return c.scopeName=e,[n,ye(c,...t)]}u(H,"$c512c27ab02ef895$export$50c7b4e9d9f19c1");function ye(...e){const t=e[0];if(e.length===1)return t;const o=u(()=>{const n=e.map(c=>({useScope:c(),scopeName:c.scopeName}));return u(function(s){const l=n.reduce((a,{useScope:d,scopeName:p})=>{const m=d(s)[`__scope${p}`];return{...a,...m}},{});return r.useMemo(()=>({[`__scope${t.scopeName}`]:l}),[l])},"useComposedScopes")},"createScope1");return o.scopeName=t.scopeName,o}u(ye,"$c512c27ab02ef895$var$composeContextScopes");function B(){return B=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var o=arguments[t];for(var n in o)Object.prototype.hasOwnProperty.call(o,n)&&(e[n]=o[n])}return e},B.apply(this,arguments)}u(B,"_extends$3");function G(){return G=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var o=arguments[t];for(var n in o)Object.prototype.hasOwnProperty.call(o,n)&&(e[n]=o[n])}return e},G.apply(this,arguments)}u(G,"_extends$2");function Pe(e,t){typeof e=="function"?e(t):e!=null&&(e.current=t)}u(Pe,"$6ed0406888f73fc4$var$setRef");function ae(...e){return t=>e.forEach(o=>Pe(o,t))}u(ae,"$6ed0406888f73fc4$export$43e446d32b3d21af");function U(...e){return r.useCallback(ae(...e),e)}u(U,"$6ed0406888f73fc4$export$c7b2cbe3552a0d05");const k=r.forwardRef((e,t)=>{const{children:o,...n}=e,c=r.Children.toArray(o),s=c.find(we);if(s){const l=s.props.children,a=c.map(d=>d===s?r.Children.count(l)>1?r.Children.only(null):r.isValidElement(l)?l.props.children:null:d);return r.createElement(q,G({},n,{ref:t}),r.isValidElement(l)?r.cloneElement(l,void 0,a):null)}return r.createElement(q,G({},n,{ref:t}),o)});k.displayName="Slot";const q=r.forwardRef((e,t)=>{const{children:o,...n}=e;return r.isValidElement(o)?r.cloneElement(o,{...Fe(n,o.props),ref:ae(t,o.ref)}):r.Children.count(o)>1?r.Children.only(null):null});q.displayName="SlotClone";const Re=u(({children:e})=>r.createElement(r.Fragment,null,e),"$5e63c961fc1ce211$export$d9f1ccf0bdb05d45");function we(e){return r.isValidElement(e)&&e.type===Re}u(we,"$5e63c961fc1ce211$var$isSlottable");function Fe(e,t){const o={...t};for(const n in t){const c=e[n],s=t[n];/^on[A-Z]/.test(n)?c&&s?o[n]=(...a)=>{s(...a),c(...a)}:c&&(o[n]=c):n==="style"?o[n]={...c,...s}:n==="className"&&(o[n]=[c,s].filter(Boolean).join(" "))}return{...e,...o}}u(Fe,"$5e63c961fc1ce211$var$mergeProps");const Me=["a","button","div","form","h2","h3","img","input","label","li","nav","ol","p","span","svg","ul"],R=Me.reduce((e,t)=>{const o=r.forwardRef((n,c)=>{const{asChild:s,...l}=n,a=s?k:t;return r.useEffect(()=>{window[Symbol.for("radix-ui")]=!0},[]),r.createElement(a,B({},l,{ref:c}))});return o.displayName=`Primitive.${t}`,{...e,[t]:o}},{});function w(){return w=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var o=arguments[t];for(var n in o)Object.prototype.hasOwnProperty.call(o,n)&&(e[n]=o[n])}return e},w.apply(this,arguments)}u(w,"_extends$1");function P(e,t,{checkForDefaultPrevented:o=!0}={}){return u(function(c){if(e==null||e(c),o===!1||!c.defaultPrevented)return t==null?void 0:t(c)},"handleEvent")}u(P,"$e42e1063c40fb3ef$export$b9ecd428b558ff10");function Oe(e){const t=e+"CollectionProvider",[o,n]=H(t),[c,s]=o(t,{collectionRef:{current:null},itemMap:new Map}),l=u(h=>{const{scope:f,children:b}=h,E=i.useRef(null),$=i.useRef(new Map).current;return i.createElement(c,{scope:f,itemMap:$,collectionRef:E},b)},"CollectionProvider"),a=e+"CollectionSlot",d=i.forwardRef((h,f)=>{const{scope:b,children:E}=h,$=s(a,b),C=U(f,$.collectionRef);return i.createElement(k,{ref:C},E)}),p=e+"CollectionItemSlot",g="data-radix-collection-item",m=i.forwardRef((h,f)=>{const{scope:b,children:E,...$}=h,C=i.useRef(null),F=U(f,C),T=s(p,b);return i.useEffect(()=>(T.itemMap.set(C,{ref:C,...$}),()=>void T.itemMap.delete(C))),i.createElement(k,{[g]:"",ref:F},E)});function v(h){const f=s(e+"CollectionConsumer",h);return i.useCallback(()=>{const E=f.collectionRef.current;if(!E)return[];const $=Array.from(E.querySelectorAll(`[${g}]`));return Array.from(f.itemMap.values()).sort((T,V)=>$.indexOf(T.ref.current)-$.indexOf(V.ref.current))},[f.collectionRef,f.itemMap])}return u(v,"useCollection"),[{Provider:l,Slot:d,ItemSlot:m},v,n]}u(Oe,"$e02a7d9cb1dc128c$export$c74125a8e3af6bb2");const Ae=Boolean(globalThis==null?void 0:globalThis.document)?r.useLayoutEffect:()=>{},Ge=xe["useId".toString()]||(()=>{});let ke=0;function Ne(e){const[t,o]=r.useState(Ge());return Ae(()=>{e||o(n=>n??String(ke++))},[e]),e||(t?`radix-${t}`:"")}u(Ne,"$1746a345f3d73bb7$export$f680877a34711e37");function J(e){const t=r.useRef(e);return r.useEffect(()=>{t.current=e}),r.useMemo(()=>(...o)=>{var n;return(n=t.current)===null||n===void 0?void 0:n.call(t,...o)},[])}u(J,"$b1b2314f5f9a1d84$export$25bec8c6f54ee79a");function N({prop:e,defaultProp:t,onChange:o=u(()=>{},"onChange")}){const[n,c]=De({defaultProp:t,onChange:o}),s=e!==void 0,l=s?e:n,a=J(o),d=r.useCallback(p=>{if(s){const m=typeof p=="function"?p(e):p;m!==e&&a(m)}else c(p)},[s,e,c,a]);return[l,d]}u(N,"$71cd76cc60e0454e$export$6f32135080cb4c3");function De({defaultProp:e,onChange:t}){const o=r.useState(e),[n]=o,c=r.useRef(n),s=J(t);return r.useEffect(()=>{c.current!==n&&(s(n),c.current=n)},[n,c,s]),o}u(De,"$71cd76cc60e0454e$var$useUncontrolledState");const Ve=r.createContext(void 0);function se(e){const t=r.useContext(Ve);return e||t||"ltr"}u(se,"$f631663db3294ace$export$b39126d51d94e6f3");const L="rovingFocusGroup.onEntryFocus",je={bubbles:!1,cancelable:!0},Q="RovingFocusGroup",[K,le,Le]=Oe(Q),[Be,ue]=H(Q,[Le]),[Ue,qe]=Be(Q),Ke=r.forwardRef((e,t)=>r.createElement(K.Provider,{scope:e.__scopeRovingFocusGroup},r.createElement(K.Slot,{scope:e.__scopeRovingFocusGroup},r.createElement(ze,w({},e,{ref:t}))))),ze=r.forwardRef((e,t)=>{const{__scopeRovingFocusGroup:o,orientation:n,loop:c=!1,dir:s,currentTabStopId:l,defaultCurrentTabStopId:a,onCurrentTabStopIdChange:d,onEntryFocus:p,...g}=e,m=r.useRef(null),v=U(t,m),h=se(s),[f=null,b]=N({prop:l,defaultProp:a,onChange:d}),[E,$]=r.useState(!1),C=J(p),F=le(o),T=r.useRef(!1),[V,W]=r.useState(0);return r.useEffect(()=>{const _=m.current;if(_)return _.addEventListener(L,C),()=>_.removeEventListener(L,C)},[C]),r.createElement(Ue,{scope:o,orientation:n,dir:h,loop:c,currentTabStopId:f,onItemFocus:r.useCallback(_=>b(_),[b]),onItemShiftTab:r.useCallback(()=>$(!0),[]),onFocusableItemAdd:r.useCallback(()=>W(_=>_+1),[]),onFocusableItemRemove:r.useCallback(()=>W(_=>_-1),[])},r.createElement(R.div,w({tabIndex:E||V===0?-1:0,"data-orientation":n},g,{ref:v,style:{outline:"none",...e.style},onMouseDown:P(e.onMouseDown,()=>{T.current=!0}),onFocus:P(e.onFocus,_=>{const $e=!T.current;if(_.target===_.currentTarget&&$e&&!E){const X=new CustomEvent(L,je);if(_.currentTarget.dispatchEvent(X),!X.defaultPrevented){const j=F().filter(y=>y.focusable),ve=j.find(y=>y.active),he=j.find(y=>y.id===f),Ce=[ve,he,...j].filter(Boolean).map(y=>y.ref.current);ie(Ce)}}T.current=!1}),onBlur:P(e.onBlur,()=>$(!1))})))}),Ye="RovingFocusGroupItem",Ze=r.forwardRef((e,t)=>{const{__scopeRovingFocusGroup:o,focusable:n=!0,active:c=!1,tabStopId:s,...l}=e,a=Ne(),d=s||a,p=qe(Ye,o),g=p.currentTabStopId===d,m=le(o),{onFocusableItemAdd:v,onFocusableItemRemove:h}=p;return r.useEffect(()=>{if(n)return v(),()=>h()},[n,v,h]),r.createElement(K.ItemSlot,{scope:o,id:d,focusable:n,active:c},r.createElement(R.span,w({tabIndex:g?0:-1,"data-orientation":p.orientation},l,{ref:t,onMouseDown:P(e.onMouseDown,f=>{n?p.onItemFocus(d):f.preventDefault()}),onFocus:P(e.onFocus,()=>p.onItemFocus(d)),onKeyDown:P(e.onKeyDown,f=>{if(f.key==="Tab"&&f.shiftKey){p.onItemShiftTab();return}if(f.target!==f.currentTarget)return;const b=Qe(f,p.orientation,p.dir);if(b!==void 0){f.preventDefault();let $=m().filter(C=>C.focusable).map(C=>C.ref.current);if(b==="last")$.reverse();else if(b==="prev"||b==="next"){b==="prev"&&$.reverse();const C=$.indexOf(f.currentTarget);$=p.loop?We($,C+1):$.slice(C+1)}setTimeout(()=>ie($))}})})))}),He={ArrowLeft:"prev",ArrowUp:"prev",ArrowRight:"next",ArrowDown:"next",PageUp:"first",Home:"first",PageDown:"last",End:"last"};function Je(e,t){return t!=="rtl"?e:e==="ArrowLeft"?"ArrowRight":e==="ArrowRight"?"ArrowLeft":e}u(Je,"$d7bdfb9eb0fdf311$var$getDirectionAwareKey");function Qe(e,t,o){const n=Je(e.key,o);if(!(t==="vertical"&&["ArrowLeft","ArrowRight"].includes(n))&&!(t==="horizontal"&&["ArrowUp","ArrowDown"].includes(n)))return He[n]}u(Qe,"$d7bdfb9eb0fdf311$var$getFocusIntent");function ie(e){const t=document.activeElement;for(const o of e)if(o===t||(o.focus(),document.activeElement!==t))return}u(ie,"$d7bdfb9eb0fdf311$var$focusFirst");function We(e,t){return e.map((o,n)=>e[(t+n)%e.length])}u(We,"$d7bdfb9eb0fdf311$var$wrapArray");const Xe=Ke,et=Ze;function z(){return z=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var o=arguments[t];for(var n in o)Object.prototype.hasOwnProperty.call(o,n)&&(e[n]=o[n])}return e},z.apply(this,arguments)}u(z,"_extends");const tt=r.forwardRef((e,t)=>{const{pressed:o,defaultPressed:n=!1,onPressedChange:c,...s}=e,[l=!1,a]=N({prop:o,onChange:c,defaultProp:n});return r.createElement(R.button,z({type:"button","aria-pressed":l,"data-state":l?"on":"off","data-disabled":e.disabled?"":void 0},s,{ref:t,onClick:P(e.onClick,()=>{e.disabled||a(!l)})}))}),D="ToggleGroup",[de,St]=H(D,[ue]),fe=ue(),ot=i.forwardRef((e,t)=>{const{type:o,...n}=e;if(o==="single"){const c=n;return i.createElement(nt,I({},c,{ref:t}))}if(o==="multiple"){const c=n;return i.createElement(rt,I({},c,{ref:t}))}throw new Error(`Missing prop \`type\` expected on \`${D}\``)}),[pe,me]=de(D),nt=i.forwardRef((e,t)=>{const{value:o,defaultValue:n,onValueChange:c=u(()=>{},"onValueChange"),...s}=e,[l,a]=N({prop:o,defaultProp:n,onChange:c});return i.createElement(pe,{scope:e.__scopeToggleGroup,type:"single",value:l?[l]:[],onItemActivate:a,onItemDeactivate:i.useCallback(()=>a(""),[a])},i.createElement(be,I({},s,{ref:t})))}),rt=i.forwardRef((e,t)=>{const{value:o,defaultValue:n,onValueChange:c=u(()=>{},"onValueChange"),...s}=e,[l=[],a]=N({prop:o,defaultProp:n,onChange:c}),d=i.useCallback(g=>a((m=[])=>[...m,g]),[a]),p=i.useCallback(g=>a((m=[])=>m.filter(v=>v!==g)),[a]);return i.createElement(pe,{scope:e.__scopeToggleGroup,type:"multiple",value:l,onItemActivate:d,onItemDeactivate:p},i.createElement(be,I({},s,{ref:t})))}),[ct,at]=de(D),be=i.forwardRef((e,t)=>{const{__scopeToggleGroup:o,disabled:n=!1,rovingFocus:c=!0,orientation:s,dir:l,loop:a=!0,...d}=e,p=fe(o),g=se(l),m={role:"group",dir:g,...d};return i.createElement(ct,{scope:o,rovingFocus:c,disabled:n},c?i.createElement(Xe,I({asChild:!0},p,{orientation:s,dir:g,loop:a}),i.createElement(R.div,I({},m,{ref:t}))):i.createElement(R.div,I({},m,{ref:t})))}),Y="ToggleGroupItem",st=i.forwardRef((e,t)=>{const o=me(Y,e.__scopeToggleGroup),n=at(Y,e.__scopeToggleGroup),c=fe(e.__scopeToggleGroup),s=o.value.includes(e.value),l=n.disabled||e.disabled,a={...e,pressed:s,disabled:l},d=i.useRef(null);return n.rovingFocus?i.createElement(et,I({asChild:!0},c,{focusable:!l,active:s,ref:d}),i.createElement(ee,I({},a,{ref:t}))):i.createElement(ee,I({},a,{ref:t}))}),ee=i.forwardRef((e,t)=>{const{__scopeToggleGroup:o,value:n,...c}=e,s=me(Y,o),l={role:"radio","aria-checked":e.pressed,"aria-pressed":void 0},a=s.type==="single"?l:void 0;return i.createElement(tt,I({},a,c,{ref:t,onPressedChange:d=>{d?s.onItemActivate(n):s.onItemDeactivate(n)}}))}),lt=ot,te=st,ut=u(e=>typeof e=="string"&&["dark","light"].includes(e),"isTheme");var oe="qutgt97",ne="qutgt98",it="qutgt93",re={dark:"qutgt95 qutgt94",light:"qutgt96 qutgt94"};const Z=r.forwardRef(({theme:e,defaultTheme:t,onChange:o,orientation:n},c)=>{const[s,l]=r.useState(t),a=e??s,[d,p]=r.useState(0);r.useEffect(()=>{const b=setTimeout(()=>{p(Date.now())},100);return()=>{clearTimeout(b)}},[]);const g=r.useCallback(b=>{ut(b)&&(l(b),o==null||o(b))},[o]),m=M({from:{transform:"scale(0)",background:"transparent"},transform:a==="light"?"scale(1)":"scale(0)",background:a==="light"?S.pallets.accent1:"transparent",config:A.gentle}),v=M({from:{color:S.pallets.disabled},color:a==="light"?S.pallets.black:S.pallets.disabled,config:A.gentle}),h=M({from:{transform:"scale(0)",background:"transparent"},transform:a==="dark"?"scale(1)":"scale(0)",background:a==="dark"?S.pallets.black:"transparent",config:A.gentle}),f=M({from:{color:S.pallets.disabled},get color(){return a==="dark"?S.pallets.accent1:S.pallets.disabled},config:A.gentle});return _e(lt,{type:"single",ref:c,defaultValue:t,value:a,onValueChange:g,orientation:n,loop:!0,className:it,children:[x(O.div,{className:re.light,style:m}),x(O.div,{className:re.dark,style:h}),x(O.div,{style:v,children:x(te,{value:"light","aria-label":"Light theme",className:oe,children:x(Te,{className:ne})})}),x(O.div,{style:f,children:x(te,{value:"dark","aria-label":"Dark theme",className:oe,children:x(Se,{className:ne})})})]},d)}),ge=r.memo(Z);try{Z.displayName="SwitchTheme",Z.__docgenInfo={description:"",displayName:"SwitchTheme",props:{theme:{defaultValue:null,description:"",name:"theme",required:!1,type:{name:"enum",value:[{value:'"dark"'},{value:'"light"'}]}},defaultTheme:{defaultValue:null,description:"",name:"defaultTheme",required:!1,type:{name:"enum",value:[{value:'"dark"'},{value:'"light"'}]}},onChange:{defaultValue:null,description:"",name:"onChange",required:!1,type:{name:"((theme: Theme) => void)"}},orientation:{defaultValue:null,description:"",name:"orientation",required:!1,type:{name:"enum",value:[{value:'"horizontal"'}]}}}}}catch{}const yt={title:"components/SwitchTheme",component:ge},dt=u(e=>x(ge,{...e,onChange:Ie("change")}),"Default");dt.args={defaultTheme:"light"};const Pt=["Default"];export{dt as Default,Pt as __namedExportsOrder,yt as default};
//# sourceMappingURL=switch-theme.stories-ce6c81dc.js.map