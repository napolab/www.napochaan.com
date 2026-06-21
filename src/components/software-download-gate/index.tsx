'use client';

import { Turnstile } from '@marsidev/react-turnstile';
import { useCallback, useState } from 'react';
import { Button as AriaButton, Checkbox, Dialog, DialogTrigger, Disclosure, DisclosurePanel, Heading, Modal, ModalOverlay } from 'react-aria-components';

import { Button } from '@components/button';
import { RichText } from '@components/rich-text';
import { Tag } from '@components/tag';
import { dayjs } from '@utils/dayjs';

import { ChevronIcon } from './icons';
import * as styles from './styles.css';

import type { IssueDownloadAction } from '../../app/(site)/_actions/issue-download-url';
import type { SoftwareDownload, SoftwareRelease } from '@lib/payload/software';

const TURNSTILE_OPTIONS = { theme: 'auto', size: 'flexible' } as const;

type GateDialogProps = {
  release: SoftwareRelease;
  terms: SoftwareDownload['terms'];
  siteKey: string;
  issueDownloadURL: IssueDownloadAction;
};

const GateDialog = ({ release, terms, siteKey, issueDownloadURL }: GateDialogProps) => {
  const [agreed, setAgreed] = useState(false);
  const [token, setToken] = useState<string>();
  const [error, setError] = useState<string>();
  const clearToken = useCallback(() => setToken(undefined), []);

  const handleConfirm = useCallback(async () => {
    if (token === undefined) return;
    const result = await issueDownloadURL(release.id, token);
    if ('url' in result) {
      window.location.href = result.url;
      return;
    }
    setError(result.error);
  }, [release.id, token, issueDownloadURL]);

  return (
    <Dialog className={styles.dialog}>
      <Heading slot="title" className={styles.dialogTitle}>
        利用規約への同意
      </Heading>
      <div className={styles.termsRoot}>
        <RichText data={terms} />
      </div>
      {error !== undefined ? (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
      <Checkbox isSelected={agreed} onChange={setAgreed} className={styles.agree}>
        利用規約に同意する
      </Checkbox>
      <Turnstile siteKey={siteKey} onSuccess={setToken} onError={clearToken} onExpire={clearToken} options={TURNSTILE_OPTIONS} />
      <Button onPress={handleConfirm} isDisabled={!agreed || token === undefined}>
        ダウンロード
      </Button>
    </Dialog>
  );
};

type DownloadButtonProps = {
  release: SoftwareRelease;
  terms: SoftwareDownload['terms'];
  siteKey: string;
  issueDownloadURL: IssueDownloadAction;
};

const DownloadButton = ({ release, terms, siteKey, issueDownloadURL }: DownloadButtonProps) => {
  const [attempt, setAttempt] = useState(0);
  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (isOpen) setAttempt((n) => n + 1);
  }, []);

  return (
    <DialogTrigger onOpenChange={handleOpenChange}>
      <Button>ダウンロード</Button>
      <ModalOverlay className={styles.overlay} isDismissable>
        <Modal className={styles.modal}>
          <GateDialog key={attempt} release={release} terms={terms} siteKey={siteKey} issueDownloadURL={issueDownloadURL} />
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
};

type VersionRowProps = {
  release: SoftwareRelease;
  isLatest: boolean;
  terms: SoftwareDownload['terms'];
  siteKey: string;
  issueDownloadURL: IssueDownloadAction;
};

const VersionRow = ({ release, isLatest, terms, siteKey, issueDownloadURL }: VersionRowProps) => (
  <li className={styles.versionRow}>
    <div className={styles.versionRowHeader}>
      <div className={styles.versionMeta}>
        <span className={styles.versionLabel}>v{release.version}</span>
        {isLatest ? <Tag tone="blue">最新</Tag> : null}
        <span className={styles.versionDate}>{dayjs(release.releasedAt).tz('Asia/Tokyo').format('YYYY.MM.DD')}</span>
      </div>
      <div className={styles.downloadCell}>
        <DownloadButton release={release} terms={terms} siteKey={siteKey} issueDownloadURL={issueDownloadURL} />
      </div>
    </div>
    {release.changelog !== undefined ? (
      <Disclosure className={styles.releaseNoteDisclosure} defaultExpanded={isLatest}>
        {({ isExpanded }) => (
          <>
            <Heading>
              <AriaButton slot="trigger" className={styles.releaseNoteTrigger}>
                <ChevronIcon className={styles.chevron} data-expanded={isExpanded || undefined} />
                リリースノート
              </AriaButton>
            </Heading>
            <DisclosurePanel>
              <p className={styles.changelog}>{release.changelog}</p>
            </DisclosurePanel>
          </>
        )}
      </Disclosure>
    ) : null}
  </li>
);

export type SoftwareDownloadGateProps = {
  software: SoftwareDownload;
  turnstileSiteKey: string;
  issueDownloadURL: IssueDownloadAction;
};

export const SoftwareDownloadGate = ({ software, turnstileSiteKey, issueDownloadURL }: SoftwareDownloadGateProps) => {
  const versions = [software.latest, ...software.history];

  return (
    <section className={styles.root} aria-label={`${software.name} のダウンロード`}>
      <Heading level={3} className={styles.name}>
        {software.name}
      </Heading>
      <p className={styles.summary}>{software.summary}</p>
      <ul className={styles.versionList}>
        {versions.map((release) => (
          <VersionRow key={release.id} release={release} isLatest={release.id === software.latest.id} terms={software.terms} siteKey={turnstileSiteKey} issueDownloadURL={issueDownloadURL} />
        ))}
      </ul>
    </section>
  );
};
