import { notFound } from 'next/navigation';

import { LegalDocumentView } from './_components/legal-document';

import { findLegalDocumentBySlug } from '@lib/payload/legal-documents';

import type { Metadata } from 'next';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

// ISR。詳細ページはオンデマンドで描画してキャッシュし、collection の afterChange hook が
// `/legal/{slug}` を revalidate する。Live Preview は持たないので draftMode に触らない。
export const revalidate = 3600;

// build phase は Payload を読めないため slug は空で始め、公開済み slug をオンデマンド ISR で配る。
export const generateStaticParams = (): { slug: string }[] => [];
export const dynamicParams = true;

type Params = Promise<{ slug: string }>;

type Props = {
  params: Params;
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { slug } = await params;
  const doc = await findLegalDocumentBySlug(slug);
  if (doc === undefined) notFound();

  return {
    title: doc.title,
    description: `napochaan のソフトウェアに関する${doc.title}`,
    // 検索流入を設計する文書ではなく、外部の販売ページから直リンクされる。本文中の内部リンクは
    // 辿らせたいので follow は残す。sitemap.ts / llms.txt にも意図的に載せていない。
    robots: { index: false, follow: true },
  };
};

const LegalDocumentPage = async ({ params }: Props) => {
  const { slug } = await params;
  const doc = await findLegalDocumentBySlug(slug);
  if (doc === undefined) notFound();

  return <LegalDocumentView title={doc.title} effectiveAt={doc.effectiveAt} body={doc.body as unknown as SerializedEditorState} />;
};

export default LegalDocumentPage;
