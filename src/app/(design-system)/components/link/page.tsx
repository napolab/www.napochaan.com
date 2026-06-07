import { css } from '@styled/css';

import { Link } from '@components/link';

const wrap = css({ display: 'flex', flexDirection: 'column', gap: 'block', p: 'page' });
const heading = css({ fontFamily: 'display', fontSize: 'h2' });
const section = css({ display: 'flex', flexDirection: 'column', gap: 'element' });
const row = css({ display: 'flex', gap: 'element', alignItems: 'center', flexWrap: 'wrap' });

const LinkShowcase = () => {
  return (
    <main className={wrap}>
      <h1 className={heading}>Link</h1>
      <section className={section}>
        <h2>Internal</h2>
        <div className={row}>
          <Link href="/works">作品一覧</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </section>
      <section className={section}>
        <h2>External</h2>
        <div className={row}>
          <Link href="https://github.com" target="_blank" rel="noreferrer">
            GitHub
          </Link>
          <Link href="https://twitter.com" target="_blank" rel="noreferrer">
            Twitter
          </Link>
        </div>
      </section>
      <section className={section}>
        <h2>tone</h2>
        <div className={row}>
          <Link href="/works" tone="accent">
            accent
          </Link>
          <Link href="/works" tone="muted">
            muted
          </Link>
          <Link href="/works" tone="default">
            default
          </Link>
          <Link href="/works" tone="subtle">
            subtle
          </Link>
        </div>
      </section>
      <section className={section}>
        <h2>underline</h2>
        <div className={row}>
          <Link href="/works" underline={false}>
            no underline
          </Link>
          <Link href="/works" tone="muted" underline={false}>
            quiet (muted, no underline)
          </Link>
          <Link href="/works" tone="default" underline={false}>
            default keeps underline
          </Link>
        </div>
      </section>
    </main>
  );
};

export default LinkShowcase;
