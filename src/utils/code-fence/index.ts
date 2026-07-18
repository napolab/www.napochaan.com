// コード文字列を Markdown フェンスで包むときのフェンス(バッククォート列)を返す。
// CommonMark ではフェンス内の行がフェンス記号そのものを含む場合、外側のフェンスを
// それより長くしないと早期終了して壊れる — 行頭のバッククォート連の最長長 + 1
// (最低 3)を採用する。行頭以外のバッククォートはフェンスを閉じないため無視。
export const fenceForCode = (code: string): string => {
  const longestRun = code.split('\n').reduce((max, line) => {
    const match = line.match(/^[ \t]*(`{3,})/);
    const run = match?.[1];

    return run === undefined ? max : Math.max(max, run.length);
  }, 0);

  return '`'.repeat(Math.max(3, longestRun + 1));
};
