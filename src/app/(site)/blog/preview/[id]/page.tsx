import { getCloudflareContext } from '@opennextjs/cloudflare';
import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';

import { BlogNav } from '../../[slug]/_components/blog-nav';
import { Toc } from '../../[slug]/_components/toc';
import * as s from '../../[slug]/styles.css';
import { adjacentPosts } from '../../_lib/adjacent-posts';

import { issueDownloadURL } from '../../../_actions/issue-download-url';
import { findBlogDraftById, findBlogList } from '@lib/payload/blog';
import { findSoftwareDownloadsByIds } from '@lib/payload/software';
import { collectSoftwareIds } from '@lib/software/collect-software-ids';

import { LivePreviewListener } from '@components/live-preview';
import { PageHeader } from '@components/page-header';
import { RichText } from '@components/rich-text';
import { createJsxConverters } from '@components/rich-text/converters';
import { extractHeadings } from '@components/rich-text/toc';
import { dayjs } from '@utils/dayjs';

// Draft-only Live Preview route. Always dynamic — it must refetch the latest
// draft on every request (autosave streams edits) and is never prerendered or
// cached. Reachable only after the secret-gated handshake at `/next/preview`
// enables draft mode; without it, `isEnabled` is false and we 404 so drafts
// never leak. Adjacency uses the published list — it only frames the draft
// being previewed.
export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

type Props = {
  params: Params;
};

const buildCrumbs = (title: string) => [{ href: '/', label: 'home' }, { href: '/blog', label: 'blog' }, { label: title }];

const BlogPreviewPage = async ({ params }: Props) => {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return notFound();

  const { id } = await params;
  const post = await findBlogDraftById(id);
  if (post === undefined) return notFound();

  const posts = await findBlogList();
  const { prev, next } = adjacentPosts(posts, post.slug);
  const headings = extractHeadings(post.body ?? null);
  const crumbs = buildCrumbs(post.title);
  const softwareIds = collectSoftwareIds(post.body);
  const softwareDownloads = await findSoftwareDownloadsByIds(softwareIds);
  const { env } = await getCloudflareContext({ async: true });
  const converters = createJsxConverters({ softwareDownloads, turnstileSiteKey: env.TURNSTILE_SITE_KEY, issueDownloadURL });

  // Renders inside the blog segment's shared `<main>` (see `blog/layout.tsx`).
  return (
    <>
      <LivePreviewListener />
      <PageHeader title={post.title} breadcrumbs={crumbs} kicker={`// ${post.readMin} min · ${dayjs(post.date).tz('Asia/Tokyo').format('YYYY.MM.DD')}`} titleTracking="tight" />
      <div className={s.layout}>
        <div className={s.tocCol}>
          <Toc headings={headings} />
        </div>
        <div className={s.bodyCol}>{post.body === undefined ? null : <RichText data={post.body} converters={converters} />}</div>
      </div>
      <BlogNav prev={prev} next={next} />
    </>
  );
};

export default BlogPreviewPage;
