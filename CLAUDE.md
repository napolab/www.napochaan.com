## project setup rules

- pnpm で setup すること
- Cloudflare Worker を利用すること
- next.js, opennext, payloadcmsを利用すること
- opennext では ISR を利用すること
- seed は payload cms の bin に登録すること
- react-aria-components, panda css を利用すること
- pnpm fmt で pnpm oxlint, pnpm oxfmt --write を実行すること
- pnpm lint で pnpm oxlint, pnpm oxfmt --check を実行すること
- `@typescript/native-preview` を利用すること
- 実装をする前にライブラリについて知らないことがある時は context7, web で調査してから進めること。
- vitest を利用した TDD で実装すること
    - vitest は browser mode が良い気がする
- husky で commit 時に lint, typecheck を実行すること
- 勝手に commit しないこと
- 実装は小さいタスクに分けて実装すること。実装が終わったら difit を起動して私に review 依頼すること


## coding rules

- あなたは実装計画、ステークホルダーである私に対して要件のブレがなくなるまで AskUserQuestion で質問することに努め、実装は subagent に任せること
- 関数は単一責任で実装すること


## ui rules

- WCAG2.1 AA 基準を満たすように color token を設計すること
- UI は文脈に沿った内容にすること
    - 機械的なUIの利用は徹底的に避けること
    - 伝えたい情報はどんなものでその情報に適切な UI を常に考察、模索すること
    - ASCII ダイアグラムで提案すること
    - AskUserQuestion であなたが考えたパターンを私に提示してどれがいいか提案すること
- UI を作る時は以下の順番で実現を目指すこと。1が難しいなら2を2が難しいなら3をやる, 3 が難しいなら 4 をやる
  1. HTML + CSS で実装
  2. `react-aria-components` で実装
  3. 独自実装を行う前に UI の変更の提案をする
  4. 独自実装で UI を実装する

