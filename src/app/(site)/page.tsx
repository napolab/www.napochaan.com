import { FadeInHeading } from './_components/fade-in-heading';
import * as s from './styles.css';

// Revalidate hourly so OpenNext serves the page via ISR.
export const revalidate = 3600;

const HomePage = () => (
  <main id="main-content" className={s.main}>
    <FadeInHeading>napochaan</FadeInHeading>
    <p className={s.lead}>napochaan の個人サイト。Next.js + Payload CMS + Cloudflare Workers で構築されています。</p>
  </main>
);

export default HomePage;
