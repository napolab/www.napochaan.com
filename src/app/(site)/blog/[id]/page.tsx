import { notFound } from 'next/navigation';

import { BlogHero } from './_components/blog-hero';
import { BlogNav } from './_components/blog-nav';
import { Toc } from './_components/toc';
import { adjacentPosts } from '../_lib/adjacent-posts';
import * as s from './styles.css';

import { findBlogById, findBlogList } from '@lib/payload/blog';

import { PageHeader } from '@components/page-header';
import { RichText } from '@components/rich-text';
import { extractHeadings } from '@components/rich-text/toc';
import { ShareBar } from '@components/share-bar';
import { dayjs } from '@utils/dayjs';
import { absoluteUrl } from '@utils/site-url';
import { resolveDetailMetadata } from '@utils/seo/resolve-detail-metadata';

import type { Metadata } from 'next';

// Revalidate hourly — ISR. Detail pages are static (no searchParams), so this
// drives the static cache for the pre-rendered sample ids.
export const revalidate = 3600;

export const generateStaticParams = async () => {
  const posts = await findBlogList();
  return posts.map((post) => ({ id: post.id }));
};

type Params = Promise<{ id: string }>;

type Props = {
  params: Params;
};

// Build the breadcrumb trail outside the component scope so the array isn't
// re-created as an inline JSX prop (react-perf/jsx-no-new-array-as-prop).
const buildCrumbs = (title: string) => [{ href: '/', label: 'home' }, { href: '/blog', label: 'blog' }, { label: title }];

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { id } = await params;
  const post = await findBlogById(id);
  if (post === undefined) return { title: 'blog', description: '記事' };

  return resolveDetailMetadata({
    docTitle: post.title,
    path: `/blog/${id}`,
    seo: post.seo,
    body: post.body,
    descriptionCandidates: [post.excerpt],
    genericDescription: '記事',
    defaultImage: '/og-default.png',
  });
};

const BlogDetailPage = async ({ params }: Props) => {
  const { id } = await params;
  const post = await findBlogById(id);
  if (post === undefined) notFound();

  const posts = await findBlogList();
  const { prev, next } = adjacentPosts(posts, id);
  const headings = extractHeadings(post.body ?? null);
  const crumbs = buildCrumbs(post.title);
  const formattedDate = dayjs(post.date).tz('Asia/Tokyo').format('YYYY.MM.DD');

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
          {post.body === undefined ? null : <RichText data={post.body} />}
        </div>
      </div>
      <ShareBar url={absoluteUrl(`/blog/${id}`)} title={post.title} />
      <BlogNav prev={prev} next={next} />
    </>
  );
};

export default BlogDetailPage;
