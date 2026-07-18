// Markdown をコードフェンス(``` で開閉)区間とそれ以外に分割する汎用プリミティブ。
// image-row フェンス(セル括弧は caption 用)やコードフェンス内の例示テキストを、
// プレースホルダ書き換え・URL 正規化などの文字列変換から保護するために使う。
// 行頭 ``` でトグルする素朴な規則(CommonMark のインデントフェンス等は非対応 — YAGNI)。
// 未クローズのフェンスは末尾までフェンス扱い(変換しない側に倒す)。

export type FenceSegment = { kind: 'fence' | 'text'; text: string };

const FENCE_TOGGLE = /^```/;

type Accumulator = { inFence: boolean; segments: { kind: FenceSegment['kind']; lines: string[] }[] };

// 直前セグメントが同種なら行を追記し、そうでなければ新規セグメントを積む。
const pushLine = (acc: Accumulator, kind: FenceSegment['kind'], line: string): Accumulator => {
  const [last, ...rest] = [...acc.segments].reverse();
  if (last !== undefined && last.kind === kind) {
    const updatedLast = { kind, lines: [...last.lines, line] };
    return { ...acc, segments: [...rest.reverse(), updatedLast] };
  }
  return { ...acc, segments: [...acc.segments, { kind, lines: [line] }] };
};

export const splitCodeFences = (markdown: string): FenceSegment[] => {
  const lines = markdown.split('\n');
  const result = lines.reduce<Accumulator>(
    (acc, line) => {
      const isToggleLine = FENCE_TOGGLE.test(line);
      // フェンス内(トグル行自身も含む)か、フェンス開始行かで所属セグメントを決める。
      const kind: FenceSegment['kind'] = acc.inFence || isToggleLine ? 'fence' : 'text';
      const next = pushLine(acc, kind, line);
      return { inFence: isToggleLine ? !acc.inFence : acc.inFence, segments: next.segments };
    },
    { inFence: false, segments: [] },
  );

  return result.segments.map(({ kind, lines: segmentLines }) => ({ kind, text: segmentLines.join('\n') }));
};

// fence セグメント内の各フェンスの「開始行」だけを列挙する。隣接するフェンス同士は
// splitCodeFences 上は 1 セグメントに融合するため、行を歩いてトグルを復元する
// (終了行 ``` を次のフェンスの開始と取り違えないため)。block plugin の
// validateFences がフェンス開始行(info string)を検証する用途で共有する
// (src/blocks/code/mcp-support, src/blocks/youtube-embed/mcp-support)。
export const fenceOpeningLines = (markdown: string): string[] =>
  splitCodeFences(markdown)
    .filter((segment) => segment.kind === 'fence')
    .flatMap(
      (segment) =>
        segment.text.split('\n').reduce<{ inFence: boolean; opens: string[] }>(
          (state, line) => {
            if (!FENCE_TOGGLE.test(line)) return state;
            if (state.inFence) return { inFence: false, opens: state.opens };

            return { inFence: true, opens: [...state.opens, line] };
          },
          { inFence: false, opens: [] },
        ).opens,
    );

// text セグメントだけに transform を適用して再結合する。fence セグメントは原文のまま。
// セグメントの text は行群を '\n' join したもの — 全セグメントを '\n' join すると元に戻る(可逆)。
export const mapTextSegments = (markdown: string, transform: (text: string) => string): string =>
  splitCodeFences(markdown)
    .map((segment) => (segment.kind === 'text' ? transform(segment.text) : segment.text))
    .join('\n');
