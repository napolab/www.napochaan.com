import { err as errResult, errAsync, fromPromise, fromThrowable, ok as okResult, okAsync } from 'neverthrow';

import { BodyValidationError, MediaNotFoundError, PayloadOperationError, UnsupportedBlockError } from '../../../errors';
import { blockSyntaxHelp, extractBlockMediaIDs, hasNonRoundTrippableTables, hasUnsupportedBlocks, validateBlockFences } from '../../../markdown';
import { mapTextSegments, splitCodeFences } from '../../../markdown/code-fences';
import { hasNonEmptyParens, isRoundTrippableAlt, parseInlineNodes, serializeImageRef, serializeInlineNodes } from '../../../markdown/image-ref';
import { applyLinkNewTabPolicy } from '../../../markdown/link-newtab';
import { tableSyntaxHelp, validateTableSyntax } from '../../../markdown/table-syntax';
import { createRawRefHint } from '../../raw-ref-hints';

import type { McpToolError } from '../../../errors';
import type { MarkdownCodec } from '../../../markdown';
import type { ImageNode, ImageRef, InlineNode } from '../../../markdown/image-ref';
import type { MediaHit } from '../../raw-ref-hints';
import type { Blog, User } from '@payload-types';
import type { Result, ResultAsync } from 'neverthrow';
import type { Payload } from 'payload';

// ===== 本文 Markdown パイプライン(blog / works 共通) =====
// create_post / update_post / get_post が持っていた本文処理(生 URL 画像の拒否、
// ![media:<id>](alt) の alt 同期、block フェンス検証、table 構文検証、サイト内 media URL の
// placeholder 正規化、newTab ポリシー)を body 型ジェネリクスで共用する。
// blog 固有の要素(toSummary、findPost、thumbnail 必須 等)は各 tool モジュール側に残す。

// blog / works の richText body は同じ lexical editor features で生成されるため型も同型。
// hasUnsupportedBlocks / applyLinkNewTabPolicy が Blog['body'] で型付けされているので、
// それを pipeline が扱う body 型の下限にする(works は NonNullable<Work['body']> を渡す)。
export type LexicalBody = Blog['body'];

// create_post / update_post の bodyMarkdown 説明。標準 Markdown に加えて、
// 単一画像プレースホルダと、登録済み block(image-row 等)の非標準フェンス構文を
// LLM に教える(block の構文は registry の blockSyntaxHelp から集約)。
export const BODY_MARKDOWN_HELP = [
  '本文 Markdown。見出し・リスト・強調・リンク等の標準 Markdown が使える。',
  '画像は必ず media 参照で書く: ![media:<id>](alt)。alt は必須で、画像の内容を具体的に説明する日本語テキスト(ファイル名の流用は不可、")" は使えない)。',
  'alt を書き換えて保存すると media 側の alt が更新され、その画像を使う全記事に反映される。',
  '生 URL 画像(![alt](https://...))は不可 — 先に upload_media で登録すること。サイト内 media URL は拒否時のエラーが対応する media id と置き換え先を提示する。',
  '既存の画像を使うときは list_media で id と alt を確認する。',
  'リンクは [テキスト](URL) 形式で書く(裸の URL はリンクにならない)。外部サイトへのリンクは自動で別タブ(newTab)になり、サイト内リンクは相対 URL(/blog/... 等)で書くと同タブになる。target 指定の構文はない。',
  '',
  blockSyntaxHelp(),
  tableSyntaxHelp,
  '',
  'なお image-row フェンス内セルの括弧は caption であり alt ではない(セルの alt は media 側の alt が使われる)。',
].join('\n');

export type VerifyMediaExists = (id: number) => ResultAsync<boolean, PayloadOperationError>;
type ToLexicalSafe<TBody extends LexicalBody> = (markdown: string) => Result<TBody, PayloadOperationError>;
type ToMarkdownSafe<TBody extends LexicalBody> = (data: TBody) => Result<string, PayloadOperationError>;
type FindMediaByFilename = (filename: string) => ResultAsync<MediaHit | undefined, PayloadOperationError>;
type FindMediaAltsByIDs = (ids: number[]) => ResultAsync<ReadonlyMap<number, string>, PayloadOperationError>;

export const verifyMediaExistsOrFail = (verifyMediaExists: VerifyMediaExists, id: number, notFoundMessage: string): ResultAsync<void, MediaNotFoundError | PayloadOperationError> =>
  verifyMediaExists(id).andThen((exists) => (exists ? okAsync(undefined) : errAsync(new MediaNotFoundError(notFoundMessage))));

const verifyAllMediaExist = (verifyMediaExists: VerifyMediaExists, ids: number[]): ResultAsync<void, McpToolError> => {
  const [firstID, ...restIDs] = ids;
  if (firstID === undefined) return okAsync(undefined);
  return verifyMediaExistsOrFail(verifyMediaExists, firstID, `image-row の media id=${firstID} が存在しません。upload_media で作成した id を使ってください。`).andThen(() =>
    verifyAllMediaExist(verifyMediaExists, restIDs),
  );
};

export const verifyThumbnailIfProvided = (verifyMediaExists: VerifyMediaExists, thumbnailMediaID: number | undefined): ResultAsync<void, McpToolError> => {
  if (thumbnailMediaID === undefined) return okAsync(undefined);
  return verifyMediaExistsOrFail(verifyMediaExists, thumbnailMediaID, `thumbnailMediaID=${thumbnailMediaID} の media が存在しません。`);
};

// ===== image-ref ノードパイプライン(parse -> transform/collect -> serialize) =====
// フェンス外の text セグメントだけを image-ref パーサに通す薄い合成層。個々の変換
// (media file → placeholder / alt 充填 / alt 除去 / 生 URL 判定)はこの上に定義する。
// ImageNode は image-ref/index.ts の共通定義を使う(raw-ref-hints も同じ型を参照するため)。

// フェンス外の image ノードだけを出現順に列挙する(image-row セル等のフェンス内構文は対象外)。
const collectImageNodes = (markdown: string): ImageNode[] =>
  splitCodeFences(markdown)
    .filter((segment) => segment.kind === 'text')
    .flatMap((segment) => parseInlineNodes(segment.text))
    .flatMap((node) => (node.kind === 'image' ? [node] : []));

// フェンス外の全 ImageRef を列挙する。
const collectImageRefs = (markdown: string): ImageRef[] => collectImageNodes(markdown).map((node) => node.ref);

// フェンス外の text セグメントを parse し、image ノードへの変換 fn を適用して再構成する。
// fn が undefined を返したら無変換(raw 温存)。変換したら serializeImageRef で再出力する。
const transformImageRefs = (markdown: string, fn: (ref: ImageRef) => ImageRef | undefined): string =>
  mapTextSegments(markdown, (text) =>
    serializeInlineNodes(
      parseInlineNodes(text).map((node): InlineNode => {
        if (node.kind !== 'image') return node;
        const nextRef = fn(node.ref);
        if (nextRef === undefined) return node;
        return { kind: 'image', raw: serializeImageRef(nextRef), ref: nextRef };
      }),
    ),
  );

// 生 URL 画像の raw 判定(旧 findRawImageRefs + isMediaPlaceholderRef フィルタの置換)。
// placeholder は alt の有無・内容によらず常に除外、mediaFile は常に raw、external は
// raw の括弧内容が非空のものだけ raw(hasNonEmptyParens が旧 RAW_IMAGE_REF `[^)]+` の
// 意味論を再現 — ![x]() のような空括弧の非 placeholder 参照は raw 扱いしない)。
const isRawImageRef = (node: ImageNode): boolean => {
  switch (node.ref.kind) {
    case 'placeholder':
      return false;
    case 'mediaFile':
      return true;
    case 'external':
      return hasNonEmptyParens(node.raw);
    default: {
      const _exhaustive: never = node.ref;
      throw new Error(`unhandled image ref: ${JSON.stringify(_exhaustive)}`);
    }
  }
};

const collectRawImageRefNodes = (markdown: string): ImageNode[] => collectImageNodes(markdown).filter(isRawImageRef);

// alt に ')' を含む media doc は ![media:<id>](alt) 表記で往復できない(alt 正規表現が
// [^)]* のため ')' 以降が本文に漏れ出す)。get_post の alt 充填対象からはこれを除外し、
// 該当プレースホルダは ![media:<id>]() のまま返す — write 側の空 alt エラーで
// LLM に明示的な修正(alt の書き換え)を促し、syncMediaAlts による doc alt の
// 黙った切り詰め上書きを避ける。
const filterRoundTrippableAlts = (altByID: ReadonlyMap<number, string>): ReadonlyMap<number, string> => new Map([...altByID].filter(([, alt]) => isRoundTrippableAlt(alt)));

// filename → media hit(id + alt)の対応表を逐次 lookup で構築する(`let` 禁止のため acc を引き回す再帰)。
// 見つからない filename は黙ってスキップする — read 正規化は best-effort で失敗させず、
// write 側は「見つからない」ことを自分のエラーメッセージで伝えるため、ここでは失敗にしない。
const lookupFoundMedia = (findMediaByFilename: FindMediaByFilename, filenames: string[], acc: ReadonlyMap<string, MediaHit>): ResultAsync<ReadonlyMap<string, MediaHit>, PayloadOperationError> => {
  const [first, ...rest] = filenames;
  if (first === undefined) return okAsync(acc);
  return findMediaByFilename(first).andThen((hit) => lookupFoundMedia(findMediaByFilename, rest, hit === undefined ? acc : new Map([...acc, [first, hit]])));
};

// 本文中のサイト内 media 直リンクが参照する filename を重複排除して逐次 lookup し、
// 見つかったものだけの対応表を返す(read 正規化と write エラーメッセージの両方で使う)。
const collectMediaFileHits = (markdown: string, findMediaByFilename: FindMediaByFilename): ResultAsync<ReadonlyMap<string, MediaHit>, PayloadOperationError> => {
  const filenames = [...new Set(collectImageRefs(markdown).flatMap((ref) => (ref.kind === 'mediaFile' ? [ref.filename] : [])))];
  return lookupFoundMedia(findMediaByFilename, filenames, new Map());
};

// mediaFile ノードを alt 空の placeholder ノードへ変換する(hits に無い filename は
// undefined を返し raw 温存)。alt は空のまま返す — doc alt の充填は後段
// (get_post の fillPlaceholderAlts)の責務(旧 rewriteMediaFileRefs と同じ役割分担)。
const rewriteMediaFileRefsToPlaceholders = (markdown: string, hitByFilename: ReadonlyMap<string, MediaHit>): string =>
  transformImageRefs(markdown, (ref) => {
    if (ref.kind !== 'mediaFile') return undefined;
    const hit = hitByFilename.get(ref.filename);
    if (hit === undefined) return undefined;
    return { kind: 'placeholder', id: hit.id, rawID: `${hit.id}`, alt: '' };
  });

// placeholder の alt を doc の現在値で充填する(往復不能な alt / map に無い id は raw 温存)。
// rawID は ref を spread して保つため leading zeros 等の表記が壊れない。
const fillPlaceholderAlts = (markdown: string, altByID: ReadonlyMap<number, string>): string => {
  const roundTrippable = filterRoundTrippableAlts(altByID);
  return transformImageRefs(markdown, (ref) => {
    if (ref.kind !== 'placeholder') return undefined;
    const alt = roundTrippable.get(ref.id);
    if (alt === undefined) return undefined;
    return { ...ref, alt };
  });
};

// 全 placeholder の alt を空にする(Payload の import regex ![media:<id>]() は
// 空括弧のみマッチするため、Lexical 変換直前に必ず通す)。
const stripPlaceholderAlts = (markdown: string): string => transformImageRefs(markdown, (ref) => (ref.kind === 'placeholder' ? { ...ref, alt: '' } : undefined));

// 本文 Markdown の生URL画像参照 + image-row フェンス構造 + cell media 実在性を検証し、
// 問題があれば LLM 向け回復指示メッセージを持つ Result を返す。
const validateBodyMarkdown = (bodyMarkdown: string, verifyMediaExists: VerifyMediaExists, findMediaByFilename: FindMediaByFilename): ResultAsync<void, McpToolError> => {
  const rawRefNodes = collectRawImageRefNodes(bodyMarkdown);
  if (rawRefNodes.length > 0) {
    return collectMediaFileHits(bodyMarkdown, findMediaByFilename).andThen((hitByFilename) => {
      const hint = createRawRefHint(hitByFilename);
      return errAsync(new BodyValidationError(`本文に生 URL の画像参照があります。画像は ![media:<id>](alt) 参照で書いてください:\n${rawRefNodes.map(hint).join('\n')}`));
    });
  }
  const [firstFenceError] = validateBlockFences(bodyMarkdown);
  if (firstFenceError !== undefined) return errAsync(new BodyValidationError(firstFenceError));

  const [firstTableError] = validateTableSyntax(bodyMarkdown);
  if (firstTableError !== undefined) return errAsync(new BodyValidationError(firstTableError));

  const mediaIDs = [...new Set(extractBlockMediaIDs(bodyMarkdown))];
  return verifyAllMediaExist(verifyMediaExists, mediaIDs);
};

// media id → 書かれた alt の対応表を蓄積する reduce ステップ(`let` 禁止)。
// 空 alt の id は emptyIDs に、同一 id への異なる alt は最初の 1 件だけ conflict に積む
// (以降の判定は emptyIDs/conflict の有無だけを見るため、2 件目以降は不要)。
type PlaceholderAltState = {
  altByID: ReadonlyMap<number, string>;
  emptyIDs: readonly number[];
  conflict: { id: number; altA: string; altB: string } | undefined;
};

const accumulatePlaceholderAlt = (state: PlaceholderAltState, placeholder: Extract<ImageRef, { kind: 'placeholder' }>): PlaceholderAltState => {
  if (placeholder.alt === '') {
    if (state.emptyIDs.includes(placeholder.id)) return state;
    return { ...state, emptyIDs: [...state.emptyIDs, placeholder.id] };
  }
  const existingAlt = state.altByID.get(placeholder.id);
  if (existingAlt === undefined) return { ...state, altByID: new Map([...state.altByID, [placeholder.id, placeholder.alt]]) };
  if (existingAlt === placeholder.alt) return state;
  if (state.conflict !== undefined) return state;
  return { ...state, conflict: { id: placeholder.id, altA: existingAlt, altB: placeholder.alt } };
};

// プレースホルダの alt を検証し、id → alt(書かれた値)の対応表を返す。
// 空 alt と、同一 id への異なる alt(どちらを doc に書くか決められない)を拒否する。
const validatePlaceholderAlts = (bodyMarkdown: string): Result<ReadonlyMap<number, string>, BodyValidationError> => {
  const placeholders = collectImageRefs(bodyMarkdown).filter((ref): ref is Extract<ImageRef, { kind: 'placeholder' }> => ref.kind === 'placeholder');
  const { altByID, emptyIDs, conflict } = placeholders.reduce(accumulatePlaceholderAlt, { altByID: new Map(), emptyIDs: [], conflict: undefined });
  const [firstEmptyID] = emptyIDs;
  if (firstEmptyID !== undefined) {
    return errResult(
      new BodyValidationError(
        `![media:${firstEmptyID}]() の alt が空です。画像の内容を具体的に説明する alt を括弧内に書いてください(例: ![media:${firstEmptyID}](ライブ会場で撮った VJ ブースの写真))。対象: media id=${emptyIDs.join(', ')}`,
      ),
    );
  }
  if (conflict !== undefined) {
    return errResult(new BodyValidationError(`media id=${conflict.id} に異なる alt が指定されています(「${conflict.altA}」「${conflict.altB}」)。同じ画像の alt は 1 つに統一してください。`));
  }
  return okResult(altByID);
};

// ===== update 系(resolveNextBody / buildBodyPatch) =====

export type NextBody<TBody extends LexicalBody> = { kind: 'skip' } | { kind: 'body'; body: TBody };
export type PrepareBody<TBody extends LexicalBody> = (bodyMarkdown: string) => ResultAsync<TBody, McpToolError>;

// resolveNextBody の拒否文言のうち collection ごとに変わる部分。
// subject は「この記事」のような本文の持ち主、otherFields は代わりに更新できるフィールドの例示。
export type UneditableWording = {
  subject: string;
  otherFields: string;
};

// 既定は blog の元文言(tools.test.ts が固定している)。works 等は自分の文言を deps.wording で渡す。
export const DEFAULT_UNEDITABLE_WORDING: UneditableWording = { subject: 'この記事', otherFields: 'title/excerpt 等' };

// update 系ツールの bodyMarkdown 差し替え可否を判定する。検証・alt 同期・Lexical 変換は
// prepareBody(create 系と共通のパイプライン)に委譲する。currentBody が無い(works の
// 本文未設定 doc — 呼び出し側が `doc.body ?? undefined` で境界を揃える)場合は
// 往復 guard の対象が無いのでそのまま prepareBody へ進む。
const resolveNextBody = <TBody extends LexicalBody>(
  bodyMarkdown: string | undefined,
  currentBody: TBody | undefined,
  prepareBody: PrepareBody<TBody>,
  wording: UneditableWording,
): ResultAsync<NextBody<TBody>, McpToolError> => {
  if (bodyMarkdown === undefined) return okAsync({ kind: 'skip' });
  if (currentBody !== undefined && hasUnsupportedBlocks(currentBody)) {
    return errAsync(
      new UnsupportedBlockError(
        `${wording.subject}の本文には MCP 非対応の block が含まれるため、bodyMarkdown での上書きはできません(既存 block が破壊されます)。${wording.otherFields}の他フィールドのみ更新するか、本文は admin UI で編集してください。`,
      ),
    );
  }
  if (currentBody !== undefined && hasNonRoundTrippableTables(currentBody)) {
    return errAsync(
      new UnsupportedBlockError(
        `${wording.subject}の本文には markdown に往復できない table(結合セル、または | を含むセル/行)が含まれるため、bodyMarkdown での上書きはできません。${wording.otherFields}の他フィールドのみ更新するか、本文は admin UI で編集してください。`,
      ),
    );
  }
  return prepareBody(bodyMarkdown).map((body): NextBody<TBody> => ({ kind: 'body', body }));
};

// IIFE 禁止ルールのため update 系ツール本体から切り出した名前付きヘルパ。
// NextBody を update data へのパッチ(spread 用の部分オブジェクト)に変換する。
export const buildBodyPatch = <TBody extends LexicalBody>(nextBody: NextBody<TBody>): Partial<{ body: TBody }> => {
  switch (nextBody.kind) {
    case 'skip':
      return {};
    case 'body':
      return { body: nextBody.body };
    default: {
      const _exhaustive: never = nextBody;
      throw new Error(`unhandled next body: ${JSON.stringify(_exhaustive)}`);
    }
  }
};

// ===== get 系(buildBodyPayload) =====

// get 系ツールが返す本文部分。editable なら Markdown を、そうでなければ理由文を返す。
export type BodyPayload = { bodyEditable: true; bodyMarkdown: string } | { bodyEditable: false; warning: string };

// bodyMarkdown 経由の編集を拒否すべき本文の理由文。undefined = 編集可。
const resolveUneditableWarning = (body: LexicalBody): string | undefined => {
  if (hasUnsupportedBlocks(body)) return '本文に MCP 非対応の block が含まれます。bodyMarkdown での更新は不可。本文編集は admin UI で行ってください。';
  if (hasNonRoundTrippableTables(body))
    return '本文に markdown へ往復できない table(結合セル、または | を含むセル/行)が含まれます。bodyMarkdown での更新は不可。本文編集は admin UI で行ってください。';

  return undefined;
};

// ===== pipeline factory =====

export type BodyPipelineDeps<TBody extends LexicalBody> = {
  payload: Payload;
  user: User;
  codec: MarkdownCodec<TBody>;
  siteBaseUrl: string;
  // 省略時は blog の文言(DEFAULT_UNEDITABLE_WORDING)。
  wording?: UneditableWording;
};

export type BodyPipeline<TBody extends LexicalBody> = {
  // bodyMarkdown の全検証 → media doc alt 同期 → alt を空括弧に戻して Lexical 変換 → newTab ポリシー。
  prepareBody: PrepareBody<TBody>;
  // update 系ツール: bodyMarkdown 省略なら skip、既存本文が往復不能なら reject、それ以外は prepareBody。
  // 本文任意の collection(works)は Payload の null を呼び出し側で `?? undefined` に揃えて渡す。
  resolveNextBody: (bodyMarkdown: string | undefined, currentBody: TBody | undefined) => ResultAsync<NextBody<TBody>, McpToolError>;
  // get 系ツール: 本文を Markdown に正規化して返す(本文なしは空文字、往復不能なら warning)。
  buildBodyPayload: (body: TBody | undefined) => ResultAsync<BodyPayload, McpToolError>;
  // thumbnail 等、本文外の media 実在確認に呼び出し側が使う。
  verifyMediaExists: VerifyMediaExists;
};

export const createBodyPipeline = <TBody extends LexicalBody>(deps: BodyPipelineDeps<TBody>): BodyPipeline<TBody> => {
  const { payload, user, codec, siteBaseUrl } = deps;
  const wording = deps.wording ?? DEFAULT_UNEDITABLE_WORDING;

  const toLexicalSafe: ToLexicalSafe<TBody> = fromThrowable(
    (markdown: string) => codec.toLexical(markdown),
    (cause) => new PayloadOperationError('Markdown → Lexical 変換に失敗しました', { cause }),
  );

  const toMarkdownSafe: ToMarkdownSafe<TBody> = fromThrowable(
    (data: TBody) => codec.toMarkdown(data),
    (cause) => new PayloadOperationError('Lexical → Markdown 変換に失敗しました', { cause }),
  );

  const verifyMediaExists: VerifyMediaExists = (id) =>
    fromPromise(payload.findByID({ collection: 'media', id, disableErrors: true, overrideAccess: false, user }), (cause) => new PayloadOperationError('media 取得に失敗しました', { cause })).map(
      (media) => media !== null,
    );

  const findMediaByFilename: FindMediaByFilename = (filename) =>
    fromPromise(
      payload.find({ collection: 'media', where: { filename: { equals: filename } }, limit: 1, overrideAccess: false, user, depth: 0 }),
      (cause) => new PayloadOperationError('media 取得に失敗しました', { cause }),
    ).map(({ docs }) => {
      const [doc] = docs;
      return doc === undefined ? undefined : { id: doc.id, alt: doc.alt };
    });

  // id 群 → 現在の alt の対応表(get 系の alt 充填 と write 側の同期先確認の両方で使う)。
  // ids が空なら問い合わせ不要(payload.find の where.id.in に空配列を渡す事故を避ける)。
  const findMediaAltsByIDs: FindMediaAltsByIDs = (ids) => {
    if (ids.length === 0) return okAsync(new Map());
    return fromPromise(
      payload.find({ collection: 'media', where: { id: { in: ids } }, limit: ids.length, overrideAccess: false, user, depth: 0 }),
      (cause) => new PayloadOperationError('media 取得に失敗しました', { cause }),
    ).map(({ docs }) => new Map(docs.map((doc) => [doc.id, doc.alt])));
  };

  // get 系ツールが返す Markdown 中のサイト内 media 直リンクを ![media:<id>]() に正規化し、
  // プレースホルダの alt を doc の現在値で充填する(いずれもコードフェンス外のみ)。
  // admin UI 経由で raw 形のまま保存された既存 doc でも LLM には常に「![media:<id>](alt)」の
  // 完成形を見せ、そのまま update 系ツールへ書き戻せるようにする。対応 media が無い ref/id は
  // 原文のまま返す(get 系はここでは失敗させない — write 側の検証が回復指示を出す)。
  const normalizeBodyMarkdown = (bodyMarkdown: string): ResultAsync<string, McpToolError> =>
    collectMediaFileHits(bodyMarkdown, findMediaByFilename)
      .map((hits) => rewriteMediaFileRefsToPlaceholders(bodyMarkdown, hits))
      .andThen((rewritten) => {
        const ids = [...new Set(collectImageRefs(rewritten).flatMap((ref) => (ref.kind === 'placeholder' ? [ref.id] : [])))];
        return findMediaAltsByIDs(ids).map((altByID) => fillPlaceholderAlts(rewritten, altByID));
      });

  // 書かれた alt を media doc に同期する。doc に無い id はエラー、差分がある id だけ順次 update する。
  const updateMediaAltsSequentially = (diffs: readonly (readonly [number, string])[]): ResultAsync<void, McpToolError> => {
    const [first, ...rest] = diffs;
    if (first === undefined) return okAsync(undefined);
    const [id, alt] = first;
    return fromPromise(
      payload.update({ collection: 'media', id, data: { alt }, overrideAccess: false, user }),
      (cause) => new PayloadOperationError('media の alt 更新に失敗しました', { cause }),
    ).andThen(() => updateMediaAltsSequentially(rest));
  };

  // media doc の alt 更新はここで即 commit される(呼び出し元の doc 保存が後で失敗しても
  // ロールバックされない)。この非直感的な挙動はステークホルダー承認済みの設計。
  const syncMediaAlts = (writtenAltByID: ReadonlyMap<number, string>): ResultAsync<void, McpToolError> => {
    const ids = [...writtenAltByID.keys()];
    if (ids.length === 0) return okAsync(undefined);
    return findMediaAltsByIDs(ids).andThen((docAltByID) => {
      const missingIDs = ids.filter((id) => !docAltByID.has(id));
      const [firstMissingID] = missingIDs;
      if (firstMissingID !== undefined) {
        return errAsync(new BodyValidationError(`本文が参照する media id=${missingIDs.join(', ')} が存在しません。list_media で既存画像を確認するか、upload_media で登録してください。`));
      }
      const diffs = [...writtenAltByID].filter(([id, alt]) => docAltByID.get(id) !== alt);
      return updateMediaAltsSequentially(diffs);
    });
  };

  // bodyMarkdown の全検証 → media doc alt 同期 → alt を空括弧に戻して Lexical 変換。
  // create 系 / update 系共通の body 保存パイプライン。
  const prepareBody: PrepareBody<TBody> = (bodyMarkdown) =>
    validateBodyMarkdown(bodyMarkdown, verifyMediaExists, findMediaByFilename)
      .andThen(() => validatePlaceholderAlts(bodyMarkdown))
      .andThen((writtenAltByID) => syncMediaAlts(writtenAltByID))
      .andThen(() => toLexicalSafe(stripPlaceholderAlts(bodyMarkdown)))
      .map((body) => applyLinkNewTabPolicy(body, siteBaseUrl));

  // 本文が無い doc(works の body 未設定)は編集可・空 Markdown として返す。
  const buildBodyPayload = (body: TBody | undefined): ResultAsync<BodyPayload, McpToolError> => {
    if (body === undefined) return okAsync({ bodyEditable: true, bodyMarkdown: '' });

    const warning = resolveUneditableWarning(body);
    if (warning !== undefined) return okAsync({ bodyEditable: false, warning });

    return toMarkdownSafe(body)
      .asyncAndThen(normalizeBodyMarkdown)
      .map((bodyMarkdown) => ({ bodyEditable: true, bodyMarkdown }));
  };

  return {
    prepareBody,
    resolveNextBody: (bodyMarkdown, currentBody) => resolveNextBody(bodyMarkdown, currentBody, prepareBody, wording),
    buildBodyPayload,
    verifyMediaExists,
  };
};
