'use client';

import { Turnstile } from '@marsidev/react-turnstile';
import { useCallback, useState } from 'react';
import { Button as AriaButton, Checkbox, Dialog, DialogTrigger, Disclosure, DisclosurePanel, Heading, Modal, ModalOverlay } from 'react-aria-components';

import { Button } from '@components/button';
import { RichText } from '@components/rich-text';
import { dayjs } from '@utils/dayjs';

import { issueDownloadURL } from '../../app/(site)/_actions/issue-download-url';
import * as styles from './styles.css';

import type { SoftwareDownload, SoftwareRelease } from '@lib/payload/software';

const TURNSTILE_OPTIONS = { theme: 'auto', size: 'flexible' } as const;

type GateDialogProps = {
  release: SoftwareRelease;
  terms: SoftwareDownload['terms'];
  siteKey: string;
};

const GateDialog = ({ release, terms, siteKey }: GateDialogProps) => {
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
  }, [release.id, token]);

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
};

const DownloadButton = ({ release, terms, siteKey }: DownloadButtonProps) => {
  const [attempt, setAttempt] = useState(0);
  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (isOpen) setAttempt((n) => n + 1);
  }, []);

  return (
    <DialogTrigger onOpenChange={handleOpenChange}>
      <Button>ダウンロード</Button>
      <ModalOverlay className={styles.overlay} isDismissable>
        <Modal className={styles.modal}>
          <GateDialog key={attempt} release={release} terms={terms} siteKey={siteKey} />
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
};

export type SoftwareDownloadGateProps = {
  software: SoftwareDownload;
  turnstileSiteKey: string;
};

export const SoftwareDownloadGate = ({ software, turnstileSiteKey }: SoftwareDownloadGateProps) => (
  <section className={styles.root} aria-label={`${software.name} のダウンロード`}>
    <Heading level={3} className={styles.name}>
      {software.name}
    </Heading>
    <p className={styles.summary}>{software.summary}</p>
    <div className={styles.latestRow}>
      <span className={styles.badge}>最新 v{software.latest.version}</span>
      <DownloadButton release={software.latest} terms={software.terms} siteKey={turnstileSiteKey} />
    </div>
    {software.history.length === 0 ? null : (
      <Disclosure className={styles.history}>
        <Heading>
          <AriaButton slot="trigger" className={styles.historyTrigger}>
            過去のバージョン
          </AriaButton>
        </Heading>
        <DisclosurePanel>
          <ul className={styles.historyList}>
            {software.history.map((release) => (
              <li key={release.id} className={styles.historyItem}>
                <span>
                  v{release.version} · {dayjs(release.releasedAt).tz('Asia/Tokyo').format('YYYY.MM.DD')}
                </span>
                {release.changelog !== undefined ? <p className={styles.changelog}>{release.changelog}</p> : null}
                <DownloadButton release={release} terms={software.terms} siteKey={turnstileSiteKey} />
              </li>
            ))}
          </ul>
        </DisclosurePanel>
      </Disclosure>
    )}
  </section>
);
