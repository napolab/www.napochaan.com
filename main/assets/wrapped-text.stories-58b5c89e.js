import{a as t,j as m}from"./jsx-runtime-03b4ddbf.js";import{r as a}from"./index-76fb7be0.js";import"./_commonjsHelpers-de833af9.js";var _="fotw150";const s=a.forwardRef(({texts:e},i)=>t("span",{className:_,ref:i,children:e.map((o,n)=>m(a.Fragment,{children:[o,e.length===n-1?null:t("wbr",{})]},`${o}__${n}`))})),c=a.memo(s);try{s.displayName="WrappedText",s.__docgenInfo={description:"",displayName:"WrappedText",props:{texts:{defaultValue:null,description:"",name:"texts",required:!0,type:{name:"string[]"}}}}}catch{}const h={title:"components/WrappedText",component:c},u=e=>t("div",{style:{resize:"horizontal",overflow:"scroll",maxWidth:300,padding:16},children:t(c,{...e})}),r=u.bind({});r.args={texts:["Hello","World!"]};var p,l,d;r.parameters={...r.parameters,docs:{...(p=r.parameters)==null?void 0:p.docs,source:{originalSource:`args => <div style={{
  resize: "horizontal",
  overflow: "scroll",
  maxWidth: 300,
  padding: 16
}}>
    <WrappedText {...args} />
  </div>`,...(d=(l=r.parameters)==null?void 0:l.docs)==null?void 0:d.source}}};const W=["Default"];export{r as Default,W as __namedExportsOrder,h as default};
//# sourceMappingURL=wrapped-text.stories-58b5c89e.js.map
