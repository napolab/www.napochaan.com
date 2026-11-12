// Serialises a Lexical editor state (or Payload's NULL / absent) to the `*JSON`
// string the DTOs carry. The state is passed through verbatim — populated upload
// nodes keep their media (url/width/height/...) as-is. Pure.
export const toLexicalJSON = (state: unknown): string | undefined => {
  if (state === null || state === undefined) return undefined;

  return JSON.stringify(state);
};
