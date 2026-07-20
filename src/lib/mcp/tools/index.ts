import { err as errResult, errAsync, fromPromise, fromThrowable, ok as okResult, okAsync } from 'neverthrow';
import { z } from 'zod';

import { dayjs } from '@utils/dayjs';
import { absoluteUrl } from '@utils/site-url';

import {
  BodyValidationError,
  ImageFetchError,
  ImageURLError,
  InvalidInputError,
  MediaNotFoundError,
  MimeTypeError,
  PayloadOperationError,
  PostNotFoundError,
  UnsupportedBlockError,
  UploadTooLargeError,
} from '../errors';
import { blockSyntaxHelp, extractBlockMediaIDs, hasNonRoundTrippableTables, hasUnsupportedBlocks, validateBlockFences } from '../markdown';
import { mapTextSegments, splitCodeFences } from '../markdown/code-fences';
import { hasNonEmptyParens, isRoundTrippableAlt, parseInlineNodes, serializeImageRef, serializeInlineNodes } from '../markdown/image-ref';
import { applyLinkNewTabPolicy } from '../markdown/link-newtab';
import { tableSyntaxHelp, validateTableSyntax } from '../markdown/table-syntax';
import { MAX_UPLOAD_BYTES, UPLOAD_URL_TTL_SECONDS, resolveMimetypeFromFilename, signUploadURLParams } from '../upload-url';

import { createRawRefHint } from './raw-ref-hints';
import { requireSlugAvailable } from './shared/require-slug-available';
import { ok, toToolError } from './shared/tool-result';

import type { McpToolError } from '../errors';
import type { MarkdownCodec } from '../markdown';
import type { ImageNode, ImageRef, InlineNode } from '../markdown/image-ref';
import type { MediaHit } from './raw-ref-hints';
import type { ToolResult } from './shared/tool-result';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Result, ResultAsync } from 'neverthrow';
import type { Blog, User } from '@payload-types';
import type { Payload } from 'payload';

export type BlogToolDeps = {
  payload: Payload;
  user: User;
  codec: MarkdownCodec<Blog['body']>;
  signingSecret: string;
  siteBaseUrl: string;
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// create_post / update_post の bodyMarkdown 説明。標準 Markdown に加えて、
// 単一画像プレースホルダと、登録済み block(image-row 等)の非標準フェンス構文を
// LLM に教える(block の構文は registry の blockSyntaxHelp から集約)。
const BODY_MARKDOWN_HELP = [
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

const UPLOAD_TOO_LARGE_MESSAGE = '画像が大きすぎます(上限 10MB)。縮小・圧縮してから再実行してください。';

// alt は本文中で ![media:<id>](alt) 表記のまま保存・往復する。alt regex が [^)]* の
// ため半角 ')' を含む alt は括弧を途中で閉じてしまい往復できない(get_post → write の
// 再送で alt が途中で切り詰められ、末尾が本文へ漏れ出す)。schema(zod .refine)側の
// 表明と同じ制約をここでも handler レベルで検証し、直接呼び出しでも防ぐ。
const ALT_CLOSE_PAREN_MESSAGE = 'alt に半角の ")" は使えません。全角の「）」を使ってください。';

const validateUploadAlt = (alt: string): Result<string, InvalidInputError> => (isRoundTrippableAlt(alt) ? okResult(alt) : errResult(new InvalidInputError(ALT_CLOSE_PAREN_MESSAGE)));

const toSummary = (doc: Blog) => ({
  id: doc.id,
  slug: doc.slug,
  title: doc.title,
  publishedAt: doc.publishedAt,
  status: doc._status ?? 'draft',
  excerpt: doc.excerpt,
});

type UploadSource = { data: Buffer; mimetype?: string };

type UploadInput = { kind: 'url'; url: string } | { kind: 'base64'; base64: string };

const parseUploadInput = (input: { url?: string; base64?: string }): Result<UploadInput, InvalidInputError> => {
  if (input.url !== undefined) return okResult({ kind: 'url', url: input.url });
  if (input.base64 !== undefined) return okResult({ kind: 'base64', base64: input.base64 });
  return errResult(new InvalidInputError('url か base64 のどちらかを指定してください。'));
};

const MIME_TYPE_ERROR_MESSAGE = 'MIME type を特定できません。filename に拡張子(jpg/png/webp/gif/avif)を付けて再実行してください。';

const resolveUploadMimetype = (source: UploadSource, filename: string): Result<string, MimeTypeError> => {
  const mimetype = source.mimetype ?? resolveMimetypeFromFilename(filename);
  if (mimetype === undefined) {
    return errResult(new MimeTypeError(MIME_TYPE_ERROR_MESSAGE));
  }
  return okResult(mimetype);
};

// create_upload_url は実バイトを持たないため resolveUploadMimetype(source ベース)は使えず、
// 拡張子だけを見て事前に拒否する(実際の MIME 判定は POST /api/media-upload 側で行う)。
const validateUploadFilenameExtension = (filename: string): Result<void, MimeTypeError> =>
  resolveMimetypeFromFilename(filename) === undefined ? errResult(new MimeTypeError(MIME_TYPE_ERROR_MESSAGE)) : okResult(undefined);

const isPrivateIPv4 = (hostname: string): boolean => {
  const octets = hostname.split('.');
  if (octets.length !== 4) return false;
  const parsed = octets.map((octet) => parseInt(octet, 10));
  const hasInvalidOctet = parsed.some((octet) => Number.isNaN(octet));
  if (hasInvalidOctet) return false;
  const [a, b] = parsed;
  if (a === undefined || b === undefined) return false;
  if (a === 127) return true; // loopback
  if (a === 10) return true; // private
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 169 && b === 254) return true; // link-local
  return false;
};

type URLValidator = (url: URL) => Result<URL, ImageURLError>;

const PRIVATE_HOST_MESSAGE = '内部ネットワークの URL は使用できません。公開されている画像の URL を指定してください。';

const rejectNonHTTPScheme: URLValidator = (url) => {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return errResult(new ImageURLError('http(s) 以外の URL は使用できません。公開されている画像の URL を指定してください。'));
  }
  return okResult(url);
};

// IPv6 literal (URL#hostname keeps brackets, e.g. "[::1]"; bare form also
// contains ":"). IPv4-mapped/link-local/unique-local IPv6 can alias private
// hosts (e.g. [::ffff:127.0.0.1]), so fail closed and reject all IPv6
// literals — public image URLs don't use them.
const rejectIPv6Literal: URLValidator = (url) => {
  if (url.hostname.includes(':')) return errResult(new ImageURLError(PRIVATE_HOST_MESSAGE));
  return okResult(url);
};

const rejectPrivateHost: URLValidator = (url) => {
  const lower = url.hostname.toLowerCase();
  if (lower === 'localhost') return errResult(new ImageURLError(PRIVATE_HOST_MESSAGE));
  if (lower.endsWith('.local')) return errResult(new ImageURLError(PRIVATE_HOST_MESSAGE));
  if (isPrivateIPv4(lower)) return errResult(new ImageURLError(PRIVATE_HOST_MESSAGE));
  return okResult(url);
};

const parseURL = fromThrowable(
  (value: string) => new URL(value),
  () => new ImageURLError('URL の形式が不正です。http(s) の画像 URL を指定してください。'),
);

// SSRF ガード: caller 供給 URL を fetch する前に、公開画像 URL として妥当かを検証する。
// 検証順は scheme → IPv6 literal → private host(小関数 + andThen 合成)。
const validateImageURL = (raw: string): Result<URL, ImageURLError> => parseURL(raw).andThen(rejectNonHTTPScheme).andThen(rejectIPv6Literal).andThen(rejectPrivateHost);

// リダイレクト経由の SSRF を防ぐため、302 等は追従せず失敗として扱う。
const fetchWithoutRedirect = (url: string): ResultAsync<Response, ImageFetchError> =>
  fromPromise(fetch(url, { redirect: 'error' }), () => new ImageFetchError('画像 URL の取得に失敗しました(リダイレクトまたはネットワークエラー)。リダイレクトしない最終 URL を直接指定してください。'));

const cancelBody = (body: Response['body']): ResultAsync<void, PayloadOperationError> => {
  if (body === null) return okAsync(undefined);
  return fromPromise(body.cancel(), (cause) => new PayloadOperationError('画像ストリームのキャンセルに失敗しました', { cause }));
};

// content-length ヘッダを信頼できない(未送信/嘘)場合に備え、実際の受信バイト数も
// readCapped 側で上限チェックする。再帰ヘルパーは `let` 禁止ルールに沿うための
// 累積アキュムレータ(chunks, total)を const 引数として引き回す。
const readCapped = (reader: ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>>, chunks: Uint8Array<ArrayBuffer>[], total: number): ResultAsync<Buffer, McpToolError> =>
  fromPromise(reader.read(), (cause) => new PayloadOperationError('画像ストリームの読み取りに失敗しました', { cause })).andThen(({ done, value }) => {
    if (done) return okAsync(Buffer.concat(chunks));
    const nextTotal = total + value.byteLength;
    if (nextTotal <= MAX_UPLOAD_BYTES) return readCapped(reader, [...chunks, value], nextTotal);
    return fromPromise(reader.cancel(), (cause) => new PayloadOperationError('画像ストリームのキャンセルに失敗しました', { cause })).andThen(() =>
      errAsync(new UploadTooLargeError(UPLOAD_TOO_LARGE_MESSAGE)),
    );
  });

const handleFetchedImage = (response: Response): ResultAsync<UploadSource, McpToolError> => {
  if (!response.ok) {
    return errAsync(new ImageFetchError(`画像の取得に失敗しました (HTTP ${response.status})。URL を確認して再実行してください。`));
  }
  const contentLength = response.headers.get('content-length');
  if (contentLength !== null && parseInt(contentLength, 10) > MAX_UPLOAD_BYTES) {
    return cancelBody(response.body).andThen(() => errAsync(new UploadTooLargeError(UPLOAD_TOO_LARGE_MESSAGE)));
  }
  const contentType = response.headers.get('content-type');
  const mimetype = contentType !== null ? contentType.split(';')[0] : undefined;
  if (response.body === null) return okAsync({ data: Buffer.alloc(0), mimetype });
  return readCapped(response.body.getReader(), [], 0).map((data) => ({ data, mimetype }));
};

const resolveUploadFromURL = (url: string): ResultAsync<UploadSource, McpToolError> =>
  validateImageURL(url)
    .map(() => url)
    .asyncAndThen(fetchWithoutRedirect)
    .andThen(handleFetchedImage);

const resolveUploadFromBase64 = (base64: string): ResultAsync<UploadSource, UploadTooLargeError> => {
  const data = Buffer.from(base64, 'base64');
  if (data.byteLength > MAX_UPLOAD_BYTES) return errAsync(new UploadTooLargeError(UPLOAD_TOO_LARGE_MESSAGE));
  return okAsync({ data });
};

const resolveUploadSource = (input: { url?: string; base64?: string }): ResultAsync<UploadSource, McpToolError> =>
  parseUploadInput(input).asyncAndThen((source): ResultAsync<UploadSource, McpToolError> => {
    switch (source.kind) {
      case 'url':
        return resolveUploadFromURL(source.url);
      case 'base64':
        return resolveUploadFromBase64(source.base64);
      default: {
        const _exhaustive: never = source;
        throw new Error(`unhandled upload source: ${JSON.stringify(_exhaustive)}`);
      }
    }
  });

type PostQuery = { kind: 'id'; id: number } | { kind: 'slug'; slug: string };

const parsePostQuery = (input: { id?: number; slug?: string }): Result<PostQuery, InvalidInputError> => {
  if (input.id !== undefined) return okResult({ kind: 'id', id: input.id });
  if (input.slug !== undefined) return okResult({ kind: 'slug', slug: input.slug });
  return errResult(new InvalidInputError('id か slug のどちらかを指定してください。'));
};

type VerifyMediaExists = (id: number) => ResultAsync<boolean, PayloadOperationError>;
type ToLexicalSafe = (markdown: string) => Result<Blog['body'], PayloadOperationError>;
type ToMarkdownSafe = (data: Blog['body']) => Result<string, PayloadOperationError>;

const verifyMediaExistsOrFail = (verifyMediaExists: VerifyMediaExists, id: number, notFoundMessage: string): ResultAsync<void, MediaNotFoundError | PayloadOperationError> =>
  verifyMediaExists(id).andThen((exists) => (exists ? okAsync(undefined) : errAsync(new MediaNotFoundError(notFoundMessage))));

const verifyAllMediaExist = (verifyMediaExists: VerifyMediaExists, ids: number[]): ResultAsync<void, McpToolError> => {
  const [firstID, ...restIDs] = ids;
  if (firstID === undefined) return okAsync(undefined);
  return verifyMediaExistsOrFail(verifyMediaExists, firstID, `image-row の media id=${firstID} が存在しません。upload_media で作成した id を使ってください。`).andThen(() =>
    verifyAllMediaExist(verifyMediaExists, restIDs),
  );
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

type FindMediaByFilename = (filename: string) => ResultAsync<MediaHit | undefined, PayloadOperationError>;
type FindMediaAltsByIDs = (ids: number[]) => ResultAsync<ReadonlyMap<number, string>, PayloadOperationError>;

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

type NextBody = { kind: 'skip' } | { kind: 'body'; body: Blog['body'] };
type PrepareBody = (bodyMarkdown: string) => ResultAsync<Blog['body'], McpToolError>;

// update_post の bodyMarkdown 差し替え可否を判定する。検証・alt 同期・Lexical 変換は
// prepareBody(create_post と共通のパイプライン)に委譲する。
const resolveNextBody = (bodyMarkdown: string | undefined, current: Blog, prepareBody: PrepareBody): ResultAsync<NextBody, McpToolError> => {
  if (bodyMarkdown === undefined) return okAsync({ kind: 'skip' });
  if (hasUnsupportedBlocks(current.body)) {
    return errAsync(
      new UnsupportedBlockError(
        'この記事の本文には MCP 非対応の block が含まれるため、bodyMarkdown での上書きはできません(既存 block が破壊されます)。title/excerpt 等の他フィールドのみ更新するか、本文は admin UI で編集してください。',
      ),
    );
  }
  if (hasNonRoundTrippableTables(current.body)) {
    return errAsync(
      new UnsupportedBlockError(
        'この記事の本文には markdown に往復できない table(結合セル、または | を含むセル/行)が含まれるため、bodyMarkdown での上書きはできません。title/excerpt 等の他フィールドのみ更新するか、本文は admin UI で編集してください。',
      ),
    );
  }
  return prepareBody(bodyMarkdown).map((body): NextBody => ({ kind: 'body', body }));
};

// IIFE 禁止ルールのため updatePost 本体から切り出した名前付きヘルパ。
// NextBody を update data へのパッチ(spread 用の部分オブジェクト)に変換する。
const buildBodyPatch = (nextBody: NextBody): Partial<Pick<Blog, 'body'>> => {
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

const verifyThumbnailIfProvided = (verifyMediaExists: VerifyMediaExists, thumbnailMediaID: number | undefined): ResultAsync<void, McpToolError> => {
  if (thumbnailMediaID === undefined) return okAsync(undefined);
  return verifyMediaExistsOrFail(verifyMediaExists, thumbnailMediaID, `thumbnailMediaID=${thumbnailMediaID} の media が存在しません。`);
};

export const createBlogToolHandlers = (deps: BlogToolDeps) => {
  const { payload, user, codec, signingSecret, siteBaseUrl } = deps;

  const toLexicalSafe: ToLexicalSafe = fromThrowable(
    (markdown: string) => codec.toLexical(markdown),
    (cause) => new PayloadOperationError('Markdown → Lexical 変換に失敗しました', { cause }),
  );

  const toMarkdownSafe: ToMarkdownSafe = fromThrowable(
    (data: Blog['body']) => codec.toMarkdown(data),
    (cause) => new PayloadOperationError('Lexical → Markdown 変換に失敗しました', { cause }),
  );

  // depth: 0 で読む — 既定 depth だと body 内の upload node が media doc に populate
  // され、convertLexicalToMarkdown が生 URL(![alt](url))として書き出してしまう。
  // これだと再送/検証で raw ref 扱いされ、往復編集が壊れる(![media:<id>]() が欲しい)。
  const findPost = (query: PostQuery): ResultAsync<Blog | null, PayloadOperationError> => {
    switch (query.kind) {
      case 'id':
        return fromPromise(
          payload.findByID({ collection: 'blog', id: query.id, draft: true, disableErrors: true, overrideAccess: false, user, depth: 0 }),
          (cause) => new PayloadOperationError('記事取得に失敗しました', { cause }),
        );
      case 'slug':
        return fromPromise(
          payload.find({ collection: 'blog', draft: true, where: { slug: { equals: query.slug } }, limit: 1, overrideAccess: false, user, depth: 0 }),
          (cause) => new PayloadOperationError('記事取得に失敗しました', { cause }),
        ).map(({ docs }) => docs[0] ?? null);
      default: {
        const _exhaustive: never = query;
        throw new Error(`unhandled post query: ${JSON.stringify(_exhaustive)}`);
      }
    }
  };

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

  // id 群 → 現在の alt の対応表(get_post の alt 充填 と write 側の同期先確認の両方で使う)。
  // ids が空なら問い合わせ不要(payload.find の where.id.in に空配列を渡す事故を避ける)。
  const findMediaAltsByIDs: FindMediaAltsByIDs = (ids) => {
    if (ids.length === 0) return okAsync(new Map());
    return fromPromise(
      payload.find({ collection: 'media', where: { id: { in: ids } }, limit: ids.length, overrideAccess: false, user, depth: 0 }),
      (cause) => new PayloadOperationError('media 取得に失敗しました', { cause }),
    ).map(({ docs }) => new Map(docs.map((doc) => [doc.id, doc.alt])));
  };

  // get_post が返す Markdown 中のサイト内 media 直リンクを ![media:<id>]() に正規化し、
  // プレースホルダの alt を doc の現在値で充填する(いずれもコードフェンス外のみ)。
  // admin UI 経由で raw 形のまま保存された既存記事でも LLM には常に「![media:<id>](alt)」の
  // 完成形を見せ、そのまま update_post へ書き戻せるようにする。対応 media が無い ref/id は
  // 原文のまま返す(get_post はここでは失敗させない — write 側の検証が回復指示を出す)。
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

  // media doc の alt 更新はここで即 commit される(呼び出し元の post 保存が後で失敗しても
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
  // create_post / update_post 共通の body 保存パイプライン。
  const prepareBody: PrepareBody = (bodyMarkdown) =>
    validateBodyMarkdown(bodyMarkdown, verifyMediaExists, findMediaByFilename)
      .andThen(() => validatePlaceholderAlts(bodyMarkdown))
      .andThen((writtenAltByID) => syncMediaAlts(writtenAltByID))
      .andThen(() => toLexicalSafe(stripPlaceholderAlts(bodyMarkdown)))
      .map((body) => applyLinkNewTabPolicy(body, siteBaseUrl));

  // bodyMarkdown 経由の編集を拒否すべき本文の理由文。undefined = 編集可。
  const resolveUneditableWarning = (body: Blog['body']): string | undefined => {
    if (hasUnsupportedBlocks(body)) return '本文に MCP 非対応の block が含まれます。bodyMarkdown での更新は不可。本文編集は admin UI で行ってください。';
    if (hasNonRoundTrippableTables(body))
      return '本文に markdown へ往復できない table(結合セル、または | を含むセル/行)が含まれます。bodyMarkdown での更新は不可。本文編集は admin UI で行ってください。';

    return undefined;
  };

  const buildGetPostPayload = (doc: Blog) => {
    const warning = resolveUneditableWarning(doc.body);
    if (warning !== undefined) {
      return okAsync({ ...toSummary(doc), bodyEditable: false, warning });
    }

    return toMarkdownSafe(doc.body)
      .asyncAndThen(normalizeBodyMarkdown)
      .map((bodyMarkdown) => ({ ...toSummary(doc), bodyEditable: true, bodyMarkdown }));
  };

  return {
    listPosts: (input: { status?: 'draft' | 'published'; limit?: number }): Promise<ToolResult> =>
      fromPromise(
        payload.find({
          collection: 'blog',
          draft: true,
          sort: '-publishedAt',
          limit: input.limit ?? 20,
          overrideAccess: false,
          user,
          ...(input.status !== undefined ? { where: { _status: { equals: input.status } } } : {}),
        }),
        (cause) => new PayloadOperationError('記事一覧取得に失敗しました', { cause }),
      )
        .map((result) => result.docs.map(toSummary))
        .match(ok, toToolError),

    listMedia: (input: { search?: string; limit?: number }): Promise<ToolResult> =>
      fromPromise(
        payload.find({
          collection: 'media',
          sort: '-createdAt',
          limit: input.limit ?? 20,
          overrideAccess: false,
          user,
          depth: 0,
          ...(input.search !== undefined ? { where: { or: [{ filename: { contains: input.search } }, { alt: { contains: input.search } }] } } : {}),
        }),
        (cause) => new PayloadOperationError('media 一覧取得に失敗しました', { cause }),
      )
        .map((result) =>
          result.docs.map((media) => ({
            id: media.id,
            filename: media.filename ?? undefined,
            alt: media.alt,
            url: media.url ?? undefined,
            width: media.width ?? undefined,
            height: media.height ?? undefined,
            mimeType: media.mimeType ?? undefined,
            // alt が ')' を含む doc は placeholder に埋め込まない(get_post の
            // filterRoundTrippableAlts と同じ往復制約) — 空 alt で返し、
            // write 側の空 alt エラーで LLM に alt の書き換えを促す。alt フィールド自体は
            // 生の doc alt のまま返す(情報として有用なため)。
            placeholder: isRoundTrippableAlt(media.alt) ? `![media:${media.id}](${media.alt})` : `![media:${media.id}]()`,
          })),
        )
        .match(ok, toToolError),

    getPost: (input: { id?: number; slug?: string }): Promise<ToolResult> =>
      parsePostQuery(input)
        .asyncAndThen(findPost)
        .andThen((doc) => (doc === null ? errAsync(new PostNotFoundError('記事が見つかりません。list_posts で id / slug を確認してください。')) : okAsync(doc)))
        .andThen(buildGetPostPayload)
        .match(ok, toToolError),

    uploadMedia: (input: { url?: string; base64?: string; alt: string; filename: string }): Promise<ToolResult> =>
      validateUploadAlt(input.alt)
        .asyncAndThen(() => resolveUploadSource(input))
        .andThen((source) => resolveUploadMimetype(source, input.filename).map((mimetype) => ({ source, mimetype })))
        .andThen(({ source, mimetype }) =>
          fromPromise(
            payload.create({
              collection: 'media',
              data: { alt: input.alt },
              file: { data: source.data, mimetype, name: input.filename, size: source.data.byteLength },
              overrideAccess: false,
              user,
            }),
            (cause) => new PayloadOperationError('media 作成に失敗しました', { cause }),
          ),
        )
        .map((media) => ({
          id: media.id,
          placeholder: `![media:${media.id}](${input.alt})`,
          url: media.url ?? undefined,
          note: '本文に画像を入れる場合は placeholder をそのまま貼る(括弧内は alt。変更すると media 側の alt も更新される)。thumbnail に使う場合は id を thumbnailMediaID に渡す。',
        }))
        .match(ok, toToolError),

    createUploadURL: (input: { filename: string; alt: string }): Promise<ToolResult> =>
      validateUploadAlt(input.alt)
        .andThen(() => validateUploadFilenameExtension(input.filename))
        .asyncAndThen(() => {
          const exp = Math.floor(Date.now() / 1000) + UPLOAD_URL_TTL_SECONDS;
          return fromPromise(
            signUploadURLParams(signingSecret, { userID: user.id, exp, filename: input.filename, alt: input.alt }),
            (cause) => new PayloadOperationError('署名の生成に失敗しました', { cause }),
          ).map((sig) => ({ exp, sig }));
        })
        .map(({ exp, sig }) => {
          const params = new URLSearchParams({ user: `${user.id}`, exp: `${exp}`, filename: input.filename, alt: input.alt, sig });
          const uploadURL = `${absoluteUrl('/api/media-upload')}?${params.toString()}`;
          return {
            uploadURL,
            method: 'POST',
            expiresAt: dayjs.unix(exp).tz('Asia/Tokyo').format(),
            curlExample: `curl -sS -X POST --data-binary @<ローカル画像のパス> '${uploadURL}'`,
            note: 'シェルで curlExample を実行する(@ の後を実ファイルパスに置換)。成功レスポンスの placeholder を本文にそのまま貼り、thumbnail には id を使う。上限 10MB、URL は発行から 10 分で失効。ワンタイムではないが期限内のみ有効。',
          };
        })
        .match(ok, toToolError),

    createPost: (input: { title: string; slug: string; excerpt: string; thumbnailMediaID: number; bodyMarkdown: string; publishedAt?: string }): Promise<ToolResult> =>
      // thumbnail 検証を prepareBody より先に行う: prepareBody は media doc alt 更新を
      // コミットする副作用を持つため、先に body を用意すると不正な thumbnailMediaID で
      // create が失敗した際に alt 変更だけが残ってしまう(update_post と揃えた順序)。
      // slug 重複チェックも同様に prepareBody より前 — 重複時に alt 副作用を走らせない。
      verifyMediaExistsOrFail(verifyMediaExists, input.thumbnailMediaID, `thumbnailMediaID=${input.thumbnailMediaID} の media が存在しません。upload_media で作成した id を指定してください。`)
        .andThen(() => requireSlugAvailable(payload, 'blog', input.slug, 'update_post'))
        .andThen(() => prepareBody(input.bodyMarkdown))
        .andThen((body) =>
          fromPromise(
            payload.create({
              collection: 'blog',
              draft: true,
              data: {
                title: input.title,
                slug: input.slug,
                excerpt: input.excerpt,
                thumbnail: input.thumbnailMediaID,
                publishedAt: input.publishedAt ?? dayjs().tz('Asia/Tokyo').format('YYYY-MM-DD'),
                body,
                _status: 'draft',
              },
              overrideAccess: false,
              user,
            }),
            (cause) => new PayloadOperationError('記事作成に失敗しました', { cause }),
          ),
        )
        .map((created) => ({
          id: created.id,
          slug: created.slug,
          status: 'draft',
          adminURL: absoluteUrl(`/admin/collections/blog/${created.id}`),
          note: 'draft として作成済み。admin UI の Live Preview で確認後、publish_post で公開する。',
        }))
        .match(ok, toToolError),

    updatePost: (input: { id: number; title?: string; slug?: string; excerpt?: string; thumbnailMediaID?: number; bodyMarkdown?: string; publishedAt?: string }): Promise<ToolResult> =>
      findPost({ kind: 'id', id: input.id })
        .andThen((current) => (current === null ? errAsync(new PostNotFoundError('記事が見つかりません。list_posts で id を確認してください。')) : okAsync(current)))
        .andThen((current) => verifyThumbnailIfProvided(verifyMediaExists, input.thumbnailMediaID).map(() => current))
        .andThen((current) => resolveNextBody(input.bodyMarkdown, current, prepareBody))
        .andThen((nextBody) =>
          fromPromise(
            payload.update({
              collection: 'blog',
              id: input.id,
              draft: true,
              data: {
                ...(input.title !== undefined ? { title: input.title } : {}),
                ...(input.slug !== undefined ? { slug: input.slug } : {}),
                ...(input.excerpt !== undefined ? { excerpt: input.excerpt } : {}),
                ...(input.thumbnailMediaID !== undefined ? { thumbnail: input.thumbnailMediaID } : {}),
                ...(input.publishedAt !== undefined ? { publishedAt: input.publishedAt } : {}),
                ...buildBodyPatch(nextBody),
              },
              overrideAccess: false,
              user,
            }),
            (cause) => new PayloadOperationError('記事更新に失敗しました', { cause }),
          ),
        )
        .map((updated) => ({
          id: updated.id,
          slug: updated.slug,
          status: 'draft version saved',
          adminURL: absoluteUrl(`/admin/collections/blog/${updated.id}`),
          note: '変更は draft version として保存済み。公開反映には publish_post が必要。',
        }))
        .match(ok, toToolError),

    publishPost: (input: { id: number }): Promise<ToolResult> =>
      fromPromise(
        payload.findByID({ collection: 'blog', id: input.id, draft: true, disableErrors: true, overrideAccess: false, user, depth: 0 }),
        (cause) => new PayloadOperationError('記事取得に失敗しました', { cause }),
      )
        .andThen((current) => (current === null ? errAsync(new PostNotFoundError('記事が見つかりません。list_posts で id を確認してください。')) : okAsync(current)))
        .andThen((current) => {
          // draft-promotion: versions.drafts が有効なため update_post の変更は
          // versions テーブルに積まれる。ここで bare `_status` だけを update すると
          // published 済みの main テーブル行の上に浅くマージされ、未公開の draft
          // 編集内容が黙って失われる。最新 draft を読み直し、全フィールドを
          // publishedステータス付きで再送することで最新内容を確実に公開する。
          const thumbnailID = typeof current.thumbnail === 'number' ? current.thumbnail : current.thumbnail.id;
          return fromPromise(
            payload.update({
              collection: 'blog',
              id: input.id,
              data: {
                title: current.title,
                slug: current.slug,
                excerpt: current.excerpt,
                thumbnail: thumbnailID,
                publishedAt: current.publishedAt,
                body: current.body,
                _status: 'published',
              },
              overrideAccess: false,
              user,
            }),
            (cause) => new PayloadOperationError('記事公開に失敗しました', { cause }),
          );
        })
        .map((updated) => ({
          id: updated.id,
          slug: updated.slug,
          title: updated.title,
          status: updated._status,
          url: absoluteUrl(`/blog/${updated.slug}`),
        }))
        .match(ok, toToolError),
  };
};

export const registerBlogTools = (server: McpServer, deps: BlogToolDeps): void => {
  const handlers = createBlogToolHandlers(deps);

  server.registerTool(
    'list_posts',
    {
      title: 'blog 記事一覧',
      description: 'blog の記事(draft 含む)を publishedAt 降順で一覧する。',
      inputSchema: {
        status: z.enum(['draft', 'published']).optional().describe('絞り込み。省略時は全件'),
        limit: z.number().int().min(1).max(50).optional().describe('最大件数(default 20)'),
      },
      annotations: { readOnlyHint: true },
    },
    handlers.listPosts,
  );

  server.registerTool(
    'list_media',
    {
      title: 'media 一覧',
      description:
        '登録済み media(画像)を新しい順に一覧する。search で filename / alt の部分一致検索。本文に既存画像を使うときはここで id と alt を確認し、返された placeholder(![media:<id>](alt))をそのまま貼る。',
      inputSchema: {
        search: z.string().min(1).optional().describe('filename / alt の部分一致キーワード。省略時は全件(新しい順)'),
        limit: z.number().int().min(1).max(50).optional().describe('最大件数(default 20)'),
      },
      annotations: { readOnlyHint: true },
    },
    handlers.listMedia,
  );

  server.registerTool(
    'get_post',
    {
      title: 'blog 記事取得',
      description: '記事 1 件を取得し、本文を Markdown で返す。bodyEditable=false の記事は本文更新不可。',
      inputSchema: {
        id: z.number().int().optional(),
        slug: z.string().optional(),
      },
      annotations: { readOnlyHint: true },
    },
    handlers.getPost,
  );

  server.registerTool(
    'upload_media',
    {
      title: '画像アップロード',
      description:
        '画像を media コレクションに登録し、本文用プレースホルダ ![media:<id>](alt) と thumbnail 用の id を返す。本文への画像埋め込み・thumbnail 指定の前に必ずこれを使う。サイズ上限は 10MB(超過時はエラーになるため事前に縮小・圧縮すること)。ローカルファイルパスから上げたい場合は create_upload_url を使う。',
      inputSchema: {
        url: z.string().url().optional().describe('取得元 URL(url か base64 のどちらか必須。ダウンロードサイズ上限 10MB)'),
        base64: z.string().optional().describe('画像バイナリの base64(デコード後サイズ上限 10MB)'),
        alt: z.string().min(1).refine(isRoundTrippableAlt, ALT_CLOSE_PAREN_MESSAGE).describe('代替テキスト(必須。半角 ")" は使用不可 — 全角「）」を使うこと)'),
        filename: z.string().min(1).describe('拡張子付きファイル名(例: cover.png)'),
      },
      annotations: { destructiveHint: false },
    },
    handlers.uploadMedia,
  );

  server.registerTool(
    'create_upload_url',
    {
      title: 'ローカルファイル用 upload URL 発行',
      description:
        'URL でも base64 でも渡せない手元のファイルを上げるときに使う。返る curlExample を Bash で実行するとアップロードされ、レスポンスに media id と placeholder が返る。url/base64 を直接渡せる場合は upload_media を使う。',
      inputSchema: {
        filename: z.string().min(1).describe('拡張子付きファイル名。jpg/jpeg/png/webp/gif/avif のみ'),
        alt: z.string().min(1).refine(isRoundTrippableAlt, ALT_CLOSE_PAREN_MESSAGE).describe('代替テキスト(必須。半角 ")" は使用不可 — 全角「）」を使うこと)'),
      },
      annotations: { destructiveHint: false },
    },
    handlers.createUploadURL,
  );

  server.registerTool(
    'create_post',
    {
      title: 'blog 記事作成(draft)',
      description: '記事を必ず draft として作成する(公開は publish_post のみ)。本文の画像・block 構文は bodyMarkdown フィールドの説明を参照。thumbnail は upload_media で作成した media の id。',
      inputSchema: {
        title: z.string().min(1),
        slug: z.string().regex(SLUG_PATTERN, '小文字英数字とハイフンのみ(先頭・末尾・連続ハイフン不可)'),
        excerpt: z.string().min(1).describe('本文冒頭の貼り付けではなく、記事を一言で説明する独立した要約'),
        thumbnailMediaID: z.number().int(),
        bodyMarkdown: z.string().min(1).describe(BODY_MARKDOWN_HELP),
        publishedAt: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional()
          .describe('YYYY-MM-DD。省略時は今日(Asia/Tokyo)'),
      },
      annotations: { destructiveHint: false },
    },
    handlers.createPost,
  );

  server.registerTool(
    'update_post',
    {
      title: 'blog 記事更新(draft 保存)',
      description: '指定フィールドのみ部分更新し draft version として保存する。bodyMarkdown 省略時は本文に触らない。',
      inputSchema: {
        id: z.number().int(),
        title: z.string().min(1).optional(),
        slug: z.string().regex(SLUG_PATTERN).optional(),
        excerpt: z.string().min(1).optional(),
        thumbnailMediaID: z.number().int().optional(),
        bodyMarkdown: z.string().min(1).optional().describe(BODY_MARKDOWN_HELP),
        publishedAt: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
      },
      annotations: { destructiveHint: false },
    },
    handlers.updatePost,
  );

  server.registerTool(
    'publish_post',
    {
      title: 'blog 記事公開',
      description: '記事を公開する(サイトに即反映される唯一の操作)。実行前にユーザーの明示的な意思を確認すること。',
      inputSchema: { id: z.number().int() },
      annotations: { destructiveHint: true, idempotentHint: true },
    },
    handlers.publishPost,
  );
};
