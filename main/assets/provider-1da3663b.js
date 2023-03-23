var K=Object.defineProperty;var d=(e,l)=>K(e,"name",{value:l,configurable:!0});import{j as I}from"./mics.css.ts.vanilla-2ee9b571.js";import{r,R as k}from"./index-e233b518.js";const C=["light","dark"],x="(prefers-color-scheme: dark)",R=typeof window>"u",j=r.createContext(void 0),V=d(e=>r.useContext(j)?k.createElement(r.Fragment,null,e.children):k.createElement(J,e),"$"),q=["light","dark"],J=d(({forcedTheme:e,disableTransitionOnChange:l=!1,enableSystem:t=!0,enableColorScheme:$=!0,storageKey:u="theme",themes:o=q,defaultTheme:n=t?"system":"light",attribute:y="data-theme",value:v,children:b,nonce:T})=>{const[c,i]=r.useState(()=>M(u,n)),[S,m]=r.useState(()=>M(u)),g=v?Object.values(v):o,E=r.useCallback(a=>{let s=a;if(!s)return;a==="system"&&t&&(s=N());const w=v?v[s]:s,L=l?F():null,_=document.documentElement;if(y==="class"?(_.classList.remove(...g),w&&_.classList.add(w)):w?_.setAttribute(y,w):_.removeAttribute(y),$){const A=C.includes(n)?n:null,P=C.includes(s)?s:A;_.style.colorScheme=P}L==null||L()},[]),h=r.useCallback(a=>{i(a);try{localStorage.setItem(u,a)}catch{}},[e]),f=r.useCallback(a=>{const s=N(a);m(s),c==="system"&&t&&!e&&E("system")},[c,e]);r.useEffect(()=>{const a=window.matchMedia(x);return a.addListener(f),f(a),()=>a.removeListener(f)},[f]),r.useEffect(()=>{const a=d(s=>{s.key===u&&h(s.newValue||n)},"e");return window.addEventListener("storage",a),()=>window.removeEventListener("storage",a)},[h]),r.useEffect(()=>{E(e??c)},[e,c]);const p=r.useMemo(()=>({theme:c,setTheme:h,forcedTheme:e,resolvedTheme:c==="system"?S:c,themes:t?[...o,"system"]:o,systemTheme:t?S:void 0}),[c,h,e,S,t,o]);return k.createElement(j.Provider,{value:p},k.createElement(z,{forcedTheme:e,disableTransitionOnChange:l,enableSystem:t,enableColorScheme:$,storageKey:u,themes:o,defaultTheme:n,attribute:y,value:v,children:b,attrs:g,nonce:T}),b)},"f"),z=r.memo(({forcedTheme:e,storageKey:l,attribute:t,enableSystem:$,enableColorScheme:u,defaultTheme:o,value:n,attrs:y,nonce:v})=>{const b=o==="system",T=t==="class"?`var d=document.documentElement,c=d.classList;c.remove(${y.map(m=>`'${m}'`).join(",")});`:`var d=document.documentElement,n='${t}',s='setAttribute';`,c=u?C.includes(o)&&o?`if(e==='light'||e==='dark'||!e)d.style.colorScheme=e||'${o}'`:"if(e==='light'||e==='dark')d.style.colorScheme=e":"",i=d((m,g=!1,E=!0)=>{const h=n?n[m]:m,f=g?m+"|| ''":`'${h}'`;let p="";return u&&E&&!g&&C.includes(m)&&(p+=`d.style.colorScheme = '${m}';`),t==="class"?p+=g||h?`c.add(${f})`:"null":h&&(p+=`d[s](n,${f})`),p},"$"),S=e?`!function(){${T}${i(e)}}()`:$?`!function(){try{${T}var e=localStorage.getItem('${l}');if('system'===e||(!e&&${b})){var t='${x}',m=window.matchMedia(t);if(m.media!==t||m.matches){${i("dark")}}else{${i("light")}}}else if(e){${n?`var x=${JSON.stringify(n)};`:""}${i(n?"x[e]":"e",!0)}}${b?"":"else{"+i(o,!1,!1)+"}"}${c}}catch(e){}}()`:`!function(){try{${T}var e=localStorage.getItem('${l}');if(e){${n?`var x=${JSON.stringify(n)};`:""}${i(n?"x[e]":"e",!0)}}else{${i(o,!1,!1)};}${c}}catch(t){}}();`;return k.createElement("script",{nonce:v,dangerouslySetInnerHTML:{__html:S}})},()=>!0),M=d((e,l)=>{if(R)return;let t;try{t=localStorage.getItem(e)||void 0}catch{}return t||l},"S"),F=d(()=>{const e=document.createElement("style");return e.appendChild(document.createTextNode("*{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}")),document.head.appendChild(e),()=>{window.getComputedStyle(document.body),setTimeout(()=>{document.head.removeChild(e)},1)}},"b"),N=d(e=>(e||(e=window.matchMedia(x)),e.matches?"dark":"light"),"p");var H="evv7r60";const O=d(({theme:e,defaultTheme:l,children:t})=>I(V,{attribute:"class",forcedTheme:e,defaultTheme:l,children:I("div",{className:H,children:t})}),"ThemeProvider");try{O.displayName="ThemeProvider",O.__docgenInfo={description:"",displayName:"ThemeProvider",props:{theme:{defaultValue:null,description:"",name:"theme",required:!1,type:{name:"enum",value:[{value:'"dark"'},{value:'"light"'}]}},defaultTheme:{defaultValue:null,description:"",name:"defaultTheme",required:!1,type:{name:"enum",value:[{value:'"dark"'},{value:'"light"'}]}}}}}catch{}export{O as T};
//# sourceMappingURL=provider-1da3663b.js.map
