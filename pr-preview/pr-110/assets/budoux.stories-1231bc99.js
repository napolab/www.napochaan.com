import{j as c,a as r}from"./jsx-runtime-03b4ddbf.js";import{r as d}from"./index-76fb7be0.js";import{S as g,H as l,A as u}from"./index-ad423806.js";import{B as v,b as x}from"./index-5f030ac5.js";import"./_commonjsHelpers-de833af9.js";import"./index-258bf6ea.js";import"./clsx-58cdbad4.js";/* empty css                              */const m=(n,t)=>{const[o,a]=d.useState(null),e=d.useMemo(()=>new ResizeObserver(([s])=>{a(s)}),[]);return d.useEffect(()=>{const s=n.current;if(s)return e.observe(s,t),()=>{e.observe(s)}},[e,t,n]),o},S={title:"components/Budoux",component:v,argTypes:{children:{type:"string"}}},i=n=>{const t=d.useRef(null),o=m(t),a=d.useRef(null),e=m(a);return c(g,{style:{padding:"1rem"},children:[r(l,{children:"Budoux vs Paragraph"}),c(u,{style:{marginBottom:"2rem"},children:[r(l,{children:"Budoux"}),r("div",{style:{overflow:"hidden",resize:"horizontal",width:(e==null?void 0:e.contentRect.width)??"100%"},ref:t,children:r(v,{...n})})]}),c(u,{children:[r(l,{children:"Paragraph"}),r("div",{style:{overflow:"hidden",resize:"horizontal",width:(o==null?void 0:o.contentRect.width)??"100%"},ref:a,children:r("p",{className:x,children:n.children})})]})]})};i.args={children:"吾輩は猫である。名前はまだ無い。どこで生れたかとんと見当がつかぬ。何でも薄暗いじめじめした所でニャーニャー泣いていた事だけは記憶している。吾輩はここで始めて人間というものを見た。しかもあとで聞くとそれは書生という人間中で一番獰悪な種族であったそうだ。この書生というのは時々我々を捕えて煮て食うという話である。しかしその当時は何という考もなかったから別段恐しいとも思わなかった。ただ彼の掌に載せられてスーと持ち上げられた時何だかフワフワした感じがあったばかりである。掌の上で少し落ちついて書生の顔を見たのがいわゆる人間というものの見始であろう。この時妙なものだと思った感じが今でも残っている。第一毛をもって装飾されべきはずの顔がつるつるしてまるで薬缶だ。その後猫にもだいぶ逢ったがこんな片輪には一度も出会わした事がない。のみならず顔の真中があまりに突起している。そうしてその穴の中から時々ぷうぷうと煙を"};var h,p,f;i.parameters={...i.parameters,docs:{...(h=i.parameters)==null?void 0:h.docs,source:{originalSource:`props => {
  const ref1 = useRef<HTMLDivElement>(null);
  const resize1 = useResizeObserver(ref1);
  const ref2 = useRef<HTMLDivElement>(null);
  const resize2 = useResizeObserver(ref2);
  return <Section style={{
    padding: "1rem"
  }}>
      <Heading>Budoux vs Paragraph</Heading>
      <Article style={{
      marginBottom: "2rem"
    }}>
        <Heading>Budoux</Heading>
        <div style={{
        overflow: "hidden",
        resize: "horizontal",
        width: resize2?.contentRect.width ?? "100%"
      }} ref={ref1}>
          <Budoux {...props}></Budoux>
        </div>
      </Article>

      <Article>
        <Heading>Paragraph</Heading>
        <div style={{
        overflow: "hidden",
        resize: "horizontal",
        width: resize1?.contentRect.width ?? "100%"
      }} ref={ref2}>
          <p className={styles.budouxRoot}>{props.children}</p>
        </div>
      </Article>
    </Section>;
}`,...(f=(p=i.parameters)==null?void 0:p.docs)==null?void 0:f.source}}};const E=["Default"];export{i as Default,E as __namedExportsOrder,S as default};
//# sourceMappingURL=budoux.stories-1231bc99.js.map
