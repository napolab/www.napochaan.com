import { getCloudflareContext } from '@opennextjs/cloudflare';
import { notFound } from 'next/navigation';

import { BlogHero } from './_components/blog-hero';
import { BlogNav } from './_components/blog-nav';
import { Toc } from './_components/toc';
import { adjacentPosts } from '../_lib/adjacent-posts';
import * as s from './styles.css';

import { issueDownloadURL } from '../../_actions/issue-download-url';
import { findBlogBySlug, findBlogList } from '@lib/payload/blog';
import { findSoftwareDownloadsByIds } from '@lib/payload/software';
import { collectSoftwareIds } from '@lib/software/collect-software-ids';

import { PageHeader } from '@components/page-header';
import { QuoteShare } from '@components/quote-share';
import { RichText } from '@components/rich-text';
import { createJsxConverters } from '@components/rich-text/converters';
import { extractHeadings } from '@components/rich-text/toc';
import { ShareBar } from '@components/share-bar';
import { dayjs } from '@utils/dayjs';
import { absoluteUrl } from '@utils/site-url';
import { resolveDetailMetadata } from '@utils/seo/resolve-detail-metadata';

import type { Metadata } from 'next';

// Revalidate hourly — ISR. Detail pages are static (no searchParams), so this
// drives the static cache for the pre-rendered sample slugs.
export const revalidate = 3600;

export const generateStaticParams = async () => {
  const posts = await findBlogList();
  return posts.map((post) => ({ slug: post.slug }));
};

type Params = Promise<{ slug: string }>;

type Props = {
  params: Params;
};

// Build the breadcrumb trail outside the component scope so the array isn't
// re-created as an inline JSX prop (react-perf/jsx-no-new-array-as-prop).
const buildCrumbs = (title: string) => [{ href: '/', label: 'home' }, { href: '/blog', label: 'blog' }, { label: title }];

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { slug } = await params;
  const post = await findBlogBySlug(slug);
  if (post === undefined) return { title: 'blog', description: '記事' };

  return resolveDetailMetadata({
    docTitle: post.title,
    path: `/blog/${slug}`,
    seo: post.seo,
    body: post.body,
    descriptionCandidates: [post.excerpt],
    genericDescription: '記事',
    defaultImage: '/og-default.png',
  });
};

const BlogDetailPage = async ({ params }: Props) => {
  const { slug } = await params;
  const post = await findBlogBySlug(slug);
  if (post === undefined) notFound();

  const posts = await findBlogList();
  const { prev, next } = adjacentPosts(posts, slug);
  const headings = extractHeadings(post.body ?? null);
  const crumbs = buildCrumbs(post.title);
  const formattedDate = dayjs(post.date).tz('Asia/Tokyo').format('YYYY.MM.DD');
  const softwareIds = collectSoftwareIds(post.body);
  const softwareDownloads = await findSoftwareDownloadsByIds(softwareIds);
  const { env } = await getCloudflareContext({ async: true });
  const converters = createJsxConverters({ softwareDownloads, turnstileSiteKey: env.TURNSTILE_SITE_KEY, issueDownloadURL });

  // Renders inside the blog segment's shared `<main>` (see `blog/layout.tsx`).
  return (
    <>
      <PageHeader title={post.title} breadcrumbs={crumbs} kicker={`// ${post.readMin} min · ${formattedDate}`} titleTracking="tight" />
      {post.thumbnail === undefined ? null : <BlogHero thumbnail={post.thumbnail} title={post.title} caption={`blog / ${formattedDate}`} />}
      <div className={s.layout} data-toc-scope>
        <div className={s.tocCol}>
          <Toc headings={headings} />
        </div>
        <div className={s.bodyCol} data-toc-body>
          {post.body === undefined ? null : (
            <QuoteShare url={absoluteUrl(`/blog/${slug}`)} title={post.title}>
              <RichText data={post.body} converters={converters} />
            </QuoteShare>
          )}
        </div>
      </div>
      <ShareBar url={absoluteUrl(`/blog/${slug}`)} title={post.title} />
      <BlogNav prev={prev} next={next} />
    </>
  );
};

export default BlogDetailPage;
