import { css } from '@styled/css';

import { PageHeader } from '@components/page-header';
import { PageHeaderSkeleton } from '@components/page-header/skeleton';

const wrap = css({ display: 'flex', flexDirection: 'column', gap: 'section', p: 'page' });
const heading = css({ fontFamily: 'display', fontSize: 'h2' });
const caption = css({ fontFamily: 'mono', fontSize: 'xs', color: 'fg.muted', marginTop: 'element' });

const indexCrumbs = [{ href: '/', label: 'home' }, { label: 'archive' }] as const;
const detailCrumbs = [{ href: '/', label: 'home' }, { href: '/works', label: 'works' }, { label: 'night vol.13' }] as const;
const minimalCrumbs = [{ href: '/', label: 'home' }, { label: 'about' }] as const;
const skeletonCrumbs = ['home', 'archive'] as const;

const PageHeaderShowcase = () => {
  return (
    <main className={wrap}>
      <h1 className={heading}>PageHeader</h1>
      <section aria-label="Index-style header with every slot">
        <PageHeader
          title="archive"
          breadcrumbs={indexCrumbs}
          kicker="// archive — graphic·vj·flyer"
          lead="過去の制作物の記録。グリッドの上に並べた、影響と関係のログ。"
          annotation="35.6595 / 139.7006"
        />
        <p className={caption}>
          Full chrome: breadcrumb trail, mono <code>kicker</code>, hero-echo <code>h1</code>, blockquote <code>lead</code>, and the desktop-only coords <code>annotation</code>.
        </p>
      </section>
      <section aria-label="Detail-style header with breadcrumb and title only">
        <PageHeader title="night vol.13" breadcrumbs={detailCrumbs} />
        <p className={caption}>Minimal detail header — breadcrumb + title only.</p>
      </section>
      <section aria-label="Header without annotation">
        <PageHeader title="about" breadcrumbs={minimalCrumbs} kicker="// who · what · why" lead="napochaan のプロフィールと、いま夢中なこと。" />
        <p className={caption}>Kicker and lead present, no coords annotation.</p>
      </section>
      <section aria-label="Known-text loading skeleton">
        <PageHeaderSkeleton breadcrumbs={skeletonCrumbs} kicker="// archive — graphic·vj·flyer" title="archive" lead="過去の制作物の記録。グリッドの上に並べた、影響と関係のログ。" />
        <p className={caption}>
          Known-text <code>PageHeaderSkeleton</code> — passes the static labels per slot. Each placeholder masks the real text, so it reserves the exact width and height with zero JS measurement.
        </p>
      </section>
      <section aria-label="Dynamic loading skeleton">
        <PageHeaderSkeleton />
        <p className={caption}>
          Bare <code>PageHeaderSkeleton</code> — no props, every slot falls back to a one-line (<code>1lh</code>) bar at a percentage width. Mirrors the header rhythm (breadcrumb, kicker, title, lead,
          bottom rule) to prevent CLS while loading.
        </p>
      </section>
    </main>
  );
};

export default PageHeaderShowcase;
