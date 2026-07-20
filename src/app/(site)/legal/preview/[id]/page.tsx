import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';

import { LegalDocumentView } from '../../[slug]/_components/legal-document';

import { LivePreviewListener } from '@components/live-preview';
import { findLegalDocumentDraftById } from '@lib/payload/legal-documents';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

// Draft 専用 Live Preview ルート。常に動的 — autosave で流れる最新 draft を毎リクエスト
// 再取得し、prerender もキャッシュもしない。secret ゲートの /next/preview handshake が
// draft mode を有効化した後のみ到達可能で、そうでなければ 404(draft を漏らさない)。
export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

type Props = {
  params: Params;
};

const LegalPreviewPage = async ({ params }: Props) => {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return notFound();

  const { id } = await params;
  const doc = await findLegalDocumentDraftById(id);
  if (doc === undefined) return notFound();

  return (
    <>
      <LivePreviewListener />
      <LegalDocumentView title={doc.title} effectiveAt={doc.effectiveAt} body={doc.body as unknown as SerializedEditorState} />
    </>
  );
};

export default LegalPreviewPage;
