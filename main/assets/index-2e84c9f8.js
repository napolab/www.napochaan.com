var K=Object.defineProperty;var d=(e,l)=>K(e,"name",{value:l,configurable:!0});import{j as I}from"./jsx-runtime-1f53b459.js";import{r,R as k}from"./index-73d99431.js";/* empty css                              */const C=["light","dark"],x="(prefers-color-scheme: dark)",R=typeof window>"u",j=r.createContext(void 0),V=d(e=>r.useContext(j)?k.createElement(r.Fragment,null,e.children):k.createElement(J,e),"$"),q=["light","dark"],J=d(({forcedTheme:e,disableTransitionOnChange:l=!1,enableSystem:t=!0,enableColorScheme:$=!0,storageKey:u="theme",themes:s=q,defaultTheme:n=t?"system":"light",attribute:y="data-theme",value:v,children:_,nonce:b})=>{const[c,i]=r.useState(()=>M(u,n)),[T,m]=r.useState(()=>M(u)),g=v?Object.values(v):s,E=r.useCallback(a=>{let o=a;if(!o)return;a==="system"&&t&&(o=N());const w=v?v[o]:o,L=l?F():null,S=document.documentElement;if(y==="class"?(S.classList.remove(...g),w&&S.classList.add(w)):w?S.setAttribute(y,w):S.removeAttribute(y),$){const A=C.includes(n)?n:null,P=C.includes(o)?o:A;S.style.colorScheme=P}L==null||L()},[]),h=r.useCallback(a=>{i(a);try{localStorage.setItem(u,a)}catch{}},[e]),f=r.useCallback(a=>{const o=N(a);m(o),c==="system"&&t&&!e&&E("system")},[c,e]);r.useEffect(()=>{const a=window.matchMedia(x);return a.addListener(f),f(a),()=>a.removeListener(f)},[f]),r.useEffect(()=>{const a=d(o=>{o.key===u&&h(o.newValue||n)},"e");return window.addEventListener("storage",a),()=>window.removeEventListener("storage",a)},[h]),r.useEffect(()=>{E(e??c)},[e,c]);const p=r.useMemo(()=>({theme:c,setTheme:h,forcedTheme:e,resolvedTheme:c==="system"?T:c,themes:t?[...s,"system"]:s,systemTheme:t?T:void 0}),[c,h,e,T,t,s]);return k.createElement(j.Provider,{value:p},k.createElement(z,{forcedTheme:e,disableTransitionOnChange:l,enableSystem:t,enableColorScheme:$,storageKey:u,themes:s,defaultTheme:n,attribute:y,value:v,children:_,attrs:g,nonce:b}),_)},"f"),z=r.memo(({forcedTheme:e,storageKey:l,attribute:t,enableSystem:$,enableColorScheme:u,defaultTheme:s,value:n,attrs:y,nonce:v})=>{const _=s==="system",b=t==="class"?`var d=document.documentElement,c=d.classList;c.remove(${y.map(m=>`'${m}'`).join(",")});`:`var d=document.documentElement,n='${t}',s='setAttribute';`,c=u?C.includes(s)&&s?`if(e==='light'||e==='dark'||!e)d.style.colorScheme=e||'${s}'`:"if(e==='light'||e==='dark')d.style.colorScheme=e":"",i=d((m,g=!1,E=!0)=>{const h=n?n[m]:m,f=g?m+"|| ''":`'${h}'`;let p="";return u&&E&&!g&&C.includes(m)&&(p+=`d.style.colorScheme = '${m}';`),t==="class"?p+=g||h?`c.add(${f})`:"null":h&&(p+=`d[s](n,${f})`),p},"$"),T=e?`!function(){${b}${i(e)}}()`:$?`!function(){try{${b}var e=localStorage.getItem('${l}');if('system'===e||(!e&&${_})){var t='${x}',m=window.matchMedia(t);if(m.media!==t||m.matches){${i("dark")}}else{${i("light")}}}else if(e){${n?`var x=${JSON.stringify(n)};`:""}${i(n?"x[e]":"e",!0)}}${_?"":"else{"+i(s,!1,!1)+"}"}${c}}catch(e){}}()`:`!function(){try{${b}var e=localStorage.getItem('${l}');if(e){${n?`var x=${JSON.stringify(n)};`:""}${i(n?"x[e]":"e",!0)}}else{${i(s,!1,!1)};}${c}}catch(t){}}();`;return k.createElement("script",{nonce:v,dangerouslySetInnerHTML:{__html:T}})},()=>!0),M=d((e,l)=>{if(R)return;let t;try{t=localStorage.getItem(e)||void 0}catch{}return t||l},"S"),F=d(()=>{const e=document.createElement("style");return e.appendChild(document.createTextNode("*{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}")),document.head.appendChild(e),()=>{window.getComputedStyle(document.body),setTimeout(()=>{document.head.removeChild(e)},1)}},"b"),N=d(e=>(e||(e=window.matchMedia(x)),e.matches?"dark":"light"),"p");var H="_1moigcl0";const O=d(({defaultTheme:e,theme:l,children:t})=>I(V,{attribute:"class",defaultTheme:e,forcedTheme:l,children:I("div",{className:H,children:t})}),"ThemeProvider");try{O.displayName="ThemeProvider",O.__docgenInfo={description:"",displayName:"ThemeProvider",props:{defaultTheme:{defaultValue:null,description:"",name:"defaultTheme",required:!1,type:{name:"enum",value:[{value:'"dark"'},{value:'"light"'}]}},theme:{defaultValue:null,description:"",name:"theme",required:!1,type:{name:"enum",value:[{value:'"dark"'},{value:'"light"'}]}}}}}catch{}export{O as T};
//# sourceMappingURL=index-2e84c9f8.js.map
