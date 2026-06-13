import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';

import { AdjacentNav } from '../../[slug]/_components/adjacent-nav';
import { RelatedWorks } from '../../[slug]/_components/related-works';
import { WorkDetail } from '../../[slug]/_components/work-detail';
import * as s from '../../[slug]/styles.css';
import { adjacentWorks } from '../../_lib/adjacent-works';
import { relatedWorks } from '../../_lib/related-works';

import { LivePreviewListener } from '@components/live-preview';
import { PageHeader } from '@components/page-header';
import { findWorkDraftById, findWorksList } from '@lib/payload/works';
import { absoluteUrl } from '@utils/site-url';

// Draft-only Live Preview route. Always dynamic — it must refetch the latest
// draft on every request (autosave streams edits) and is never prerendered or
// cached. Reachable only after the secret-gated handshake at `/next/preview`
// enables draft mode; without it, `isEnabled` is false and we 404 so drafts
// never leak. Adjacency/related use the published list — those only frame the
// draft being previewed.
export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

type Props = {
  params: Params;
};

// Mirror the public detail page's breadcrumb trail (kept out of component scope
// so the array isn't re-created as an inline JSX prop).
const buildCrumbs = (title: string) => [{ href: '/', label: 'home' }, { href: '/works', label: 'works' }, { label: title }];

const WorkPreviewPage = async ({ params }: Props) => {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return notFound();

  const { id } = await params;
  const work = await findWorkDraftById(id);
  if (work === undefined) return notFound();

  const works = await findWorksList();
  const { prev, next } = adjacentWorks(works, work.slug);
  const related = relatedWorks(works, work);
  const crumbs = buildCrumbs(work.title);

  return (
    // Renders inside the works segment's shared `<main>` (see `works/layout.tsx`).
    <>
      <LivePreviewListener />
      <PageHeader title={work.title} breadcrumbs={crumbs} titleTracking="tight" />
      <WorkDetail work={work} url={absoluteUrl(`/works/${id}`)} />
      {related.length > 0 ? (
        <>
          <hr className={s.divider} />
          <RelatedWorks works={related} />
        </>
      ) : null}
      <AdjacentNav prev={prev} next={next} />
    </>
  );
};

export default WorkPreviewPage;
