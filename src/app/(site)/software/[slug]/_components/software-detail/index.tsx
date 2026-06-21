import { PageHeader } from '@components/page-header';
import { RichText } from '@components/rich-text';
import { SoftwareDownloadGate } from '@components/software-download-gate';

import * as s from './styles.css';

import type { IssueDownloadAction } from '../../../../_actions/issue-download-url';
import type { SoftwareDownload } from '@lib/payload/software';

type Props = { software: SoftwareDownload; turnstileSiteKey: string; issueDownloadURL: IssueDownloadAction };

const buildCrumbs = (name: string) => [{ href: '/', label: 'home' }, { label: name }];

export const SoftwareDetail = ({ software, turnstileSiteKey, issueDownloadURL }: Props) => (
  <>
    <PageHeader title={software.name} breadcrumbs={buildCrumbs(software.name)} kicker="// software" titleTracking="tight" />
    <main className={s.root}>
      <section aria-label="概要">
        <h2 className={s.srOnly}>概要</h2>
        <p className={s.summary}>{software.summary}</p>
      </section>
      <SoftwareDownloadGate software={software} turnstileSiteKey={turnstileSiteKey} issueDownloadURL={issueDownloadURL} />
      <section aria-label="利用規約">
        <h2 className={s.termsHeading}>利用規約</h2>
        <RichText data={software.terms} />
      </section>
    </main>
  </>
);
