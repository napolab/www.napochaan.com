import"../sb-preview/runtime.js";(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))a(t);new MutationObserver(t=>{for(const e of t)if(e.type==="childList")for(const r of e.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&a(r)}).observe(document,{childList:!0,subtree:!0});function i(t){const e={};return t.integrity&&(e.integrity=t.integrity),t.referrerPolicy&&(e.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?e.credentials="include":t.crossOrigin==="anonymous"?e.credentials="omit":e.credentials="same-origin",e}function a(t){if(t.ep)return;t.ep=!0;const e=i(t);fetch(t.href,e)}})();const u="modulepreload",m=function(_){return"/www.napochaan.com/main/"+_},l={},o=function(s,i,a){if(!i||i.length===0)return s();const t=document.getElementsByTagName("link");return Promise.all(i.map(e=>{if(e=m(e),e in l)return;l[e]=!0;const r=e.endsWith(".css"),E=r?'[rel="stylesheet"]':"";if(!!a)for(let c=t.length-1;c>=0;c--){const O=t[c];if(O.href===e&&(!r||O.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${e}"]${E}`))return;const n=document.createElement("link");if(n.rel=r?"stylesheet":u,r||(n.as="script",n.crossOrigin=""),n.href=e,document.head.appendChild(n),r)return new Promise((c,O)=>{n.addEventListener("load",c),n.addEventListener("error",()=>O(new Error(`Unable to preload CSS for ${e}`)))})})).then(()=>s()).catch(e=>{const r=new Event("vite:preloadError",{cancelable:!0});if(r.payload=e,window.dispatchEvent(r),!r.defaultPrevented)throw e})},{createBrowserChannel:p}=__STORYBOOK_MODULE_CHANNELS__,{addons:R}=__STORYBOOK_MODULE_PREVIEW_API__,d=p({page:"preview"});R.setChannel(d);window.__STORYBOOK_ADDONS_CHANNEL__=d;window.CONFIG_TYPE==="DEVELOPMENT"&&(window.__STORYBOOK_SERVER_CHANNEL__=d);const w={"./src/components/wrapped-text/wrapped-text.stories.tsx":async()=>o(()=>import("./wrapped-text.stories-58b5c89e.js"),["assets/wrapped-text.stories-58b5c89e.js","assets/jsx-runtime-03b4ddbf.js","assets/index-76fb7be0.js","assets/_commonjsHelpers-de833af9.js","assets/wrapped-text.stories-dfd65bc0.css"]),"./src/components/switch-theme/switch-theme.stories.tsx":async()=>o(()=>import("./switch-theme.stories-e630a27c.js"),["assets/switch-theme.stories-e630a27c.js","assets/jsx-runtime-03b4ddbf.js","assets/index-76fb7be0.js","assets/_commonjsHelpers-de833af9.js","assets/chunk-AY7I2SME-c7b6cf8a.js","assets/extends-98964cd2.js","assets/index-b86e5f49.js","assets/index-d3ea75b5.js","assets/createReactComponent-097bd1e5.js","assets/index-8d47fad6.js","assets/react-spring_web.modern-317a0c13.js","assets/index-4a8ca7f7.js","assets/index-9b30f536.css","assets/styles.css.ts-37c42534.css","assets/base.css-05c6c12e.js","assets/switch-theme.stories-f9402824.css"]),"./src/components/square-image/square-image.stories.tsx":async()=>o(()=>import("./square-image.stories-d7731d0e.js"),["assets/square-image.stories-d7731d0e.js","assets/jsx-runtime-03b4ddbf.js","assets/index-76fb7be0.js","assets/_commonjsHelpers-de833af9.js","assets/index-5f030ac5.js","assets/index-7a80a9e0.css","assets/square-image.stories-f2d17242.css","assets/styles.css.ts-37c42534.css"]),"./src/components/show-case/show-case.stories.tsx":async()=>o(()=>import("./show-case.stories-06470a00.js"),["assets/show-case.stories-06470a00.js","assets/jsx-runtime-03b4ddbf.js","assets/index-76fb7be0.js","assets/_commonjsHelpers-de833af9.js","assets/base.css-05c6c12e.js","assets/styles.css.ts-37c42534.css","assets/react-spring_web.modern-317a0c13.js","assets/index-d3ea75b5.js","assets/index-65924874.js","assets/extends-98964cd2.js","assets/index-b86e5f49.js","assets/index-69f5b83e.css","assets/show-case.stories-d99f7053.css"]),"./src/components/scroll-area/scroll-area.stories.tsx":async()=>o(()=>import("./scroll-area.stories-cf73e27e.js"),["assets/scroll-area.stories-cf73e27e.js","assets/jsx-runtime-03b4ddbf.js","assets/index-76fb7be0.js","assets/_commonjsHelpers-de833af9.js","assets/base.css-05c6c12e.js","assets/styles.css.ts-37c42534.css","assets/index-65924874.js","assets/extends-98964cd2.js","assets/index-b86e5f49.js","assets/index-d3ea75b5.js","assets/index-69f5b83e.css"]),"./src/components/heading/heading.stories.tsx":async()=>o(()=>import("./heading.stories-d358904c.js"),["assets/heading.stories-d358904c.js","assets/jsx-runtime-03b4ddbf.js","assets/index-76fb7be0.js","assets/_commonjsHelpers-de833af9.js","assets/index-ad423806.js","assets/index-258bf6ea.js","assets/clsx-58cdbad4.js","assets/styles.css.ts-37c42534.css"]),"./src/components/dialog/dialog.stories.tsx":async()=>o(()=>import("./dialog.stories-4f4283d8.js"),["assets/dialog.stories-4f4283d8.js","assets/jsx-runtime-03b4ddbf.js","assets/index-76fb7be0.js","assets/_commonjsHelpers-de833af9.js","assets/extends-98964cd2.js","assets/index-b86e5f49.js","assets/index-d3ea75b5.js","assets/createReactComponent-097bd1e5.js","assets/index-8d47fad6.js","assets/index-65924874.js","assets/index-69f5b83e.css","assets/styles.css.ts-37c42534.css","assets/react-spring_web.modern-317a0c13.js","assets/clsx-58cdbad4.js","assets/dialog.stories-7993bbfe.css"]),"./src/components/budoux/budoux.stories.tsx":async()=>o(()=>import("./budoux.stories-1231bc99.js"),["assets/budoux.stories-1231bc99.js","assets/jsx-runtime-03b4ddbf.js","assets/index-76fb7be0.js","assets/_commonjsHelpers-de833af9.js","assets/index-ad423806.js","assets/index-258bf6ea.js","assets/clsx-58cdbad4.js","assets/styles.css.ts-37c42534.css","assets/index-5f030ac5.js","assets/index-7a80a9e0.css"])};async function f(_){return w[_]()}const{composeConfigs:P,PreviewWeb:T,ClientApi:L}=__STORYBOOK_MODULE_PREVIEW_API__,h=async()=>{const _=await Promise.all([o(()=>import("./config-60892395.js"),["assets/config-60892395.js","assets/index-76fb7be0.js","assets/_commonjsHelpers-de833af9.js","assets/_getPrototype-ff1d31a0.js","assets/index-d3ea75b5.js","assets/index-8d47fad6.js","assets/index-356e4a49.js"]),o(()=>import("./preview-87eac49b.js"),["assets/preview-87eac49b.js","assets/index-d37d4223.js"]),o(()=>import("./preview-e7211669.js"),[]),o(()=>import("./preview-980d6faf.js"),["assets/preview-980d6faf.js","assets/chunk-AY7I2SME-c7b6cf8a.js"]),o(()=>import("./preview-108c1c3c.js"),["assets/preview-108c1c3c.js","assets/index-356e4a49.js"]),o(()=>import("./preview-2059b184.js"),[]),o(()=>import("./preview-b8d6c68d.js"),["assets/preview-b8d6c68d.js","assets/index-356e4a49.js"]),o(()=>import("./preview-b3c37142.js"),[]),o(()=>import("./preview-da1174d7.js"),[]),o(()=>import("./preview-b0834833.js"),["assets/preview-b0834833.js","assets/jsx-runtime-03b4ddbf.js","assets/index-76fb7be0.js","assets/_commonjsHelpers-de833af9.js","assets/chunk-DMDGLPPZ-b3b44151.js","assets/index-4a8ca7f7.js","assets/index-9b30f536.css","assets/styles.css.ts-37c42534.css","assets/index-258bf6ea.js"])]);return P(_)};window.__STORYBOOK_PREVIEW__=window.__STORYBOOK_PREVIEW__||new T;window.__STORYBOOK_STORY_STORE__=window.__STORYBOOK_STORY_STORE__||window.__STORYBOOK_PREVIEW__.storyStore;window.__STORYBOOK_CLIENT_API__=window.__STORYBOOK_CLIENT_API__||new L({storyStore:window.__STORYBOOK_PREVIEW__.storyStore});window.__STORYBOOK_PREVIEW__.initialize({importFn:f,getProjectAnnotations:h});export{o as _};
//# sourceMappingURL=iframe-787270a4.js.map