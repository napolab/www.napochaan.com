var H=Object.defineProperty;var i=(r,e)=>H(r,"name",{value:e,configurable:!0});import{Z as z,a0 as U,a7 as L,a8 as B,a9 as W,aa as G,c as b,g as K,j as V,k as D,n as N,u as k,d as F}from"./iframe-28b35100.js";import{m as Y}from"./make-decorator-c45ea6e6.js";var Z="actions",q="storybook/actions",J="".concat(q,"/action-event"),Q=z,X=U,rr=L,tr=B,er=G,nr=W;Q({target:"Object",stat:!0,sham:!X},{getOwnPropertyDescriptors:i(function(e){for(var t=tr(e),n=er.f,a=rr(t),o={},u=0,c,s;a.length>u;)s=n(t,c=a[u++]),s!==void 0&&nr(o,c,s);return o},"getOwnPropertyDescriptors")});var m,A=typeof b<"u"&&(b.crypto||b.msCrypto);if(A&&A.getRandomValues){var S=new Uint8Array(16);m=i(function(){return A.getRandomValues(S),S},"whatwgRNG")}if(!m){var E=new Array(16);m=i(function(){for(var r=0,e;r<16;r++)r&3||(e=Math.random()*4294967296),E[r]=e>>>((r&3)<<3)&255;return E},"rng$1")}var ar=m,R=[];for(var y=0;y<256;++y)R[y]=(y+256).toString(16).substr(1);function or(r,e){var t=e||0,n=R;return n[r[t++]]+n[r[t++]]+n[r[t++]]+n[r[t++]]+"-"+n[r[t++]]+n[r[t++]]+"-"+n[r[t++]]+n[r[t++]]+"-"+n[r[t++]]+n[r[t++]]+"-"+n[r[t++]]+n[r[t++]]+n[r[t++]]+n[r[t++]]+n[r[t++]]+n[r[t++]]}i(or,"bytesToUuid$1");var ir=or,cr=ar,ur=ir;function sr(r,e,t){var n=e&&t||0;typeof r=="string"&&(e=r=="binary"?new Array(16):null,r=null),r=r||{};var a=r.random||(r.rng||cr)();if(a[6]=a[6]&15|64,a[8]=a[8]&63|128,e)for(var o=0;o<16;++o)e[n+o]=a[o];return e||ur(a)}i(sr,"v4");var lr=sr;const fr=K(lr);var O={depth:10,clearOnStoryChange:!0,limit:50};function h(r){"@babel/helpers - typeof";return h=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},h(r)}i(h,"_typeof");var vr=i(function r(e,t){var n=Object.getPrototypeOf(e);return!n||t(n)?n:r(n,t)},"findProto"),pr=i(function(e){return!!(h(e)==="object"&&e&&vr(e,function(t){return/^Synthetic(?:Base)?Event$/.test(t.constructor.name)})&&typeof e.persist=="function")},"isReactSyntheticEvent"),yr=i(function(e){if(pr(e)){var t=Object.create(e.constructor.prototype,Object.getOwnPropertyDescriptors(e));t.persist();var n=Object.getOwnPropertyDescriptor(t,"view"),a=n==null?void 0:n.value;return h(a)==="object"&&(a==null?void 0:a.constructor.name)==="Window"&&Object.defineProperty(t,"view",Object.assign({},n,{value:Object.create(a.constructor.prototype)})),t}return e},"serializeArg");function dr(r){var e=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},t=Object.assign({},O,e),n=i(function(){for(var o=V.getChannel(),u=fr(),c=5,s=arguments.length,f=new Array(s),l=0;l<s;l++)f[l]=arguments[l];var v=f.map(yr),g=f.length>1?v:v[0],p={id:u,count:0,data:{name:r,args:g},options:Object.assign({},t,{maxDepth:c+(t.depth||3),allowFunction:t.allowFunction||!1})};o.emit(J,p)},"actionHandler");return n}i(dr,"action");function mr(r,e){return Ar(r)||br(r,e)||gr(r,e)||hr()}i(mr,"_slicedToArray$1");function hr(){throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}i(hr,"_nonIterableRest$1");function gr(r,e){if(r){if(typeof r=="string")return I(r,e);var t=Object.prototype.toString.call(r).slice(8,-1);if(t==="Object"&&r.constructor&&(t=r.constructor.name),t==="Map"||t==="Set")return Array.from(r);if(t==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t))return I(r,e)}}i(gr,"_unsupportedIterableToArray$1");function I(r,e){(e==null||e>r.length)&&(e=r.length);for(var t=0,n=new Array(e);t<e;t++)n[t]=r[t];return n}i(I,"_arrayLikeToArray$1");function br(r,e){var t=r==null?null:typeof Symbol<"u"&&r[Symbol.iterator]||r["@@iterator"];if(t!=null){var n=[],a=!0,o=!1,u,c;try{for(t=t.call(r);!(a=(u=t.next()).done)&&(n.push(u.value),!(e&&n.length===e));a=!0);}catch(s){o=!0,c=s}finally{try{!a&&t.return!=null&&t.return()}finally{if(o)throw c}}return n}}i(br,"_iterableToArrayLimit$1");function Ar(r){if(Array.isArray(r))return r}i(Ar,"_arrayWithHoles$1");var T=i(function(){for(var e=O,t=arguments.length,n=new Array(t),a=0;a<t;a++)n[a]=arguments[a];var o=n;if(o.length===1&&Array.isArray(o[0])){var u=o,c=mr(u,1);o=c[0]}o.length!==1&&typeof o[o.length-1]!="string"&&(e=Object.assign({},O,o.pop()));var s=o[0];(o.length!==1||typeof s=="string")&&(s={},o.forEach(function(l){s[l]=l}));var f={};return Object.keys(s).forEach(function(l){f[l]=dr(s[l],e)}),f},"actions");D(function(){},"decorate.* is no longer supported as of Storybook 6.0.");var x;function Or(r){return Sr(r)||jr(r)||M(r)||wr()}i(Or,"_toConsumableArray");function wr(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}i(wr,"_nonIterableSpread");function jr(r){if(typeof Symbol<"u"&&r[Symbol.iterator]!=null||r["@@iterator"]!=null)return Array.from(r)}i(jr,"_iterableToArray");function Sr(r){if(Array.isArray(r))return w(r)}i(Sr,"_arrayWithoutHoles");function Er(r,e){return e||(e=r.slice(0)),Object.freeze(Object.defineProperties(r,{raw:{value:Object.freeze(e)}}))}i(Er,"_taggedTemplateLiteral");function P(r,e){return xr(r)||Tr(r,e)||M(r,e)||Ir()}i(P,"_slicedToArray");function Ir(){throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}i(Ir,"_nonIterableRest");function M(r,e){if(r){if(typeof r=="string")return w(r,e);var t=Object.prototype.toString.call(r).slice(8,-1);if(t==="Object"&&r.constructor&&(t=r.constructor.name),t==="Map"||t==="Set")return Array.from(r);if(t==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t))return w(r,e)}}i(M,"_unsupportedIterableToArray");function w(r,e){(e==null||e>r.length)&&(e=r.length);for(var t=0,n=new Array(e);t<e;t++)n[t]=r[t];return n}i(w,"_arrayLikeToArray");function Tr(r,e){var t=r==null?null:typeof Symbol<"u"&&r[Symbol.iterator]||r["@@iterator"];if(t!=null){var n=[],a=!0,o=!1,u,c;try{for(t=t.call(r);!(a=(u=t.next()).done)&&(n.push(u.value),!(e&&n.length===e));a=!0);}catch(s){o=!0,c=s}finally{try{!a&&t.return!=null&&t.return()}finally{if(o)throw c}}return n}}i(Tr,"_iterableToArrayLimit");function xr(r){if(Array.isArray(r))return r}i(xr,"_arrayWithHoles");var _=N.document,$=N.Element,Pr=/^(\S+)\s*(.*)$/,_r=$!=null&&!$.prototype.matches,$r=_r?"msMatchesSelector":"matches",d=_&&_.getElementById("root"),Dr=i(function r(e,t){if(e[$r](t))return!0;var n=e.parentElement;return n?r(n,t):!1},"hasMatchInAncestry"),Nr=i(function(e){for(var t=arguments.length,n=new Array(t>1?t-1:0),a=1;a<t;a++)n[a-1]=arguments[a];var o=e.apply(void 0,n);return Object.entries(o).map(function(u){var c=P(u,2),s=c[0],f=c[1],l=s.match(Pr),v=P(l,3);v[0];var g=v[1],p=v[2];return{eventName:g,handler:i(function(j){(!p||Dr(j.target,p))&&f(j)},"handler")}})},"createHandlers"),C=D(function(r){for(var e=arguments.length,t=new Array(e>1?e-1:0),n=1;n<e;n++)t[n-1]=arguments[n];k(function(){if(d!=null){var a=Nr.apply(void 0,[r].concat(t));return a.forEach(function(o){var u=o.eventName,c=o.handler;return d.addEventListener(u,c)}),function(){return a.forEach(function(o){var u=o.eventName,c=o.handler;return d.removeEventListener(u,c)})}}},[d,r,t])},F(x||(x=Er([`
    withActions(options) is deprecated, please configure addon-actions using the addParameter api:

    addParameters({
      actions: {
        handles: options
      },
    });
  `])))),Rr=i(function(e,t){t&&C(e,t)},"applyDeprecatedOptions"),Ur=Y({name:"withActions",parameterName:Z,skipIfNoParametersOrOptions:!0,wrapper:i(function(e,t,n){var a=n.parameters,o=n.options;return Rr(T,o),a&&a.handles&&C.apply(void 0,[T].concat(Or(a.handles))),e(t)},"wrapper")});module&&module.hot&&module.hot.decline&&module.hot.decline();export{dr as a,Ur as w};
//# sourceMappingURL=index-68113ed6.js.map
