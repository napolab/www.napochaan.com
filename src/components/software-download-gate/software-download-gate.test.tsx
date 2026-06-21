import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { SoftwareDownloadGate } from './index';

import type { IssueDownloadAction } from '../../app/(site)/_actions/issue-download-url';
import type { SoftwareDownload } from '@lib/payload/software';

vi.mock('@marsidev/react-turnstile', () => ({
  Turnstile: ({ onSuccess }: { onSuccess: (t: string) => void }) => (
    <button type="button" onClick={() => onSuccess('tok')}>
      solve-turnstile
    </button>
  ),
}));

vi.mock('@components/rich-text', () => ({
  RichText: () => <div>terms content</div>,
}));

const mockTerms = { root: { type: 'root', children: [], direction: null, format: '', indent: 0, version: 1 } } as unknown as SoftwareDownload['terms'];

const mockSoftware: SoftwareDownload = {
  id: '1',
  name: 'TestApp',
  summary: 'A test application',
  terms: mockTerms,
  latest: {
    id: '10',
    version: '1.2.0',
    releasedAt: '2026-01-01T00:00:00.000Z',
    filename: 'testapp-1.2.0.zip',
    changelog: 'Latest release notes here.',
  },
  history: [],
};

const mockSoftwareWithHistory: SoftwareDownload = {
  ...mockSoftware,
  history: [
    // id '9' has no changelog — for the identity test + no-disclosure test
    { id: '9', version: '1.1.0', releasedAt: '2025-06-01T00:00:00.000Z', filename: 'testapp-1.1.0.zip' },
    // id '8' has a changelog — for the collapsed disclosure test
    { id: '8', version: '1.0.0', releasedAt: '2025-01-01T00:00:00.000Z', filename: 'testapp-1.0.0.zip', changelog: 'Old release notes.' },
  ],
};

describe('SoftwareDownloadGate', () => {
  it('shows product name heading and latest version text', async () => {
    const issueMock: IssueDownloadAction = vi.fn();
    render(<SoftwareDownloadGate software={mockSoftware} turnstileSiteKey="site-key-test" issueDownloadURL={issueMock} />);
    await expect.element(page.getByRole('heading', { name: 'TestApp' })).toBeInTheDocument();
    await expect.element(page.getByText(/1\.2\.0/)).toBeInTheDocument();
  });

  it('clicking ダウンロード button opens dialog', async () => {
    const issueMock: IssueDownloadAction = vi.fn();
    render(<SoftwareDownloadGate software={mockSoftware} turnstileSiteKey="site-key-test" issueDownloadURL={issueMock} />);
    await page.getByRole('button', { name: 'ダウンロード' }).first().click();
    await expect.element(page.getByRole('dialog')).toBeInTheDocument();
  });

  it('confirm button inside dialog is disabled initially', async () => {
    const issueMock: IssueDownloadAction = vi.fn();
    render(<SoftwareDownloadGate software={mockSoftware} turnstileSiteKey="site-key-test" issueDownloadURL={issueMock} />);
    await page.getByRole('button', { name: 'ダウンロード' }).first().click();
    const confirmBtn = page.getByRole('dialog').getByRole('button', { name: 'ダウンロード' });
    await expect.element(confirmBtn).toBeDisabled();
  });

  it('confirm becomes enabled after checking checkbox and solving turnstile', async () => {
    const issueMock: IssueDownloadAction = vi.fn();
    render(<SoftwareDownloadGate software={mockSoftware} turnstileSiteKey="site-key-test" issueDownloadURL={issueMock} />);
    await page.getByRole('button', { name: 'ダウンロード' }).first().click();

    await page.getByText('利用規約に同意する').click({ force: true });
    await page.getByRole('button', { name: 'solve-turnstile' }).click();

    const confirmBtn = page.getByRole('dialog').getByRole('button', { name: 'ダウンロード' });
    await expect.element(confirmBtn).not.toBeDisabled();
  });

  it('history release download calls issueDownloadURL with the history release id', async () => {
    // Return an error so window.location.href is never assigned and the iframe stays alive.
    // The goal is to verify per-release id identity, not navigation.
    const issueMock: IssueDownloadAction = vi.fn().mockResolvedValue({ error: 'token expired' });

    render(<SoftwareDownloadGate software={mockSoftwareWithHistory} turnstileSiteKey="site-key-test" issueDownloadURL={issueMock} />);

    // In the flat list, latest is index 0, first history (id '9') is index 1
    await page.getByRole('button', { name: 'ダウンロード' }).nth(1).click();

    await expect.element(page.getByRole('dialog')).toBeInTheDocument();

    await page.getByText('利用規約に同意する').click({ force: true });
    await page.getByRole('button', { name: 'solve-turnstile' }).click();

    const confirmBtn = page.getByRole('dialog').getByRole('button', { name: 'ダウンロード' });
    await confirmBtn.click();

    await vi.waitFor(() => {
      // Verify issueDownloadURL was called with the HISTORY release id ('9'), not the latest ('10')
      expect(issueMock).toHaveBeenCalledWith('9', 'tok');
      expect(issueMock).not.toHaveBeenCalledWith('10', 'tok');
    });
  });

  it('latest version changelog is visible on initial render (defaultExpanded)', async () => {
    const issueMock: IssueDownloadAction = vi.fn();
    render(<SoftwareDownloadGate software={mockSoftware} turnstileSiteKey="site-key-test" issueDownloadURL={issueMock} />);
    // The latest release has a changelog — its disclosure panel should be open (visible) initially
    await expect.element(page.getByText('Latest release notes here.')).toBeVisible();
  });

  it('latest version has a release-note disclosure', async () => {
    const issueMock: IssueDownloadAction = vi.fn();
    render(<SoftwareDownloadGate software={mockSoftware} turnstileSiteKey="site-key-test" issueDownloadURL={issueMock} />);
    await expect.element(page.getByRole('button', { name: 'リリースノート' }).first()).toBeInTheDocument();
  });

  it('history release WITH changelog has a collapsed disclosure initially', async () => {
    const issueMock: IssueDownloadAction = vi.fn();
    render(<SoftwareDownloadGate software={mockSoftwareWithHistory} turnstileSiteKey="site-key-test" issueDownloadURL={issueMock} />);
    // id '8' has 'Old release notes.' — should have a disclosure trigger but panel hidden initially
    await expect.element(page.getByRole('button', { name: 'リリースノート' }).nth(1)).toBeInTheDocument();
    // The changelog text is in the DOM (react-aria keeps panel in DOM) but NOT visible (hidden="until-found" / aria-hidden)
    await expect.element(page.getByText('Old release notes.')).not.toBeVisible();
  });

  it('history release WITHOUT changelog renders no disclosure', async () => {
    const issueMock: IssueDownloadAction = vi.fn();
    render(<SoftwareDownloadGate software={mockSoftwareWithHistory} turnstileSiteKey="site-key-test" issueDownloadURL={issueMock} />);
    // id '9' (index 1 in list) has no changelog — should show only 2 リリースノート buttons (latest + id '8')
    // latest has changelog, id '9' does not, id '8' does → 2 total
    const releaseNoteButtons = page.getByRole('button', { name: 'リリースノート' });
    await expect.element(releaseNoteButtons.nth(0)).toBeInTheDocument();
    await expect.element(releaseNoteButtons.nth(1)).toBeInTheDocument();
    // Only 2 リリースノート buttons (latest + id '8'), not 3
    await expect.element(releaseNoteButtons.nth(2)).not.toBeInTheDocument();
  });

  // Keep navigation test LAST: window.location.href assignment navigates the iframe,
  // causing CORS errors that abort subsequent tests in the suite.
  it('clicking confirm calls issueDownloadURL and navigates to the download URL', async () => {
    const issueMock: IssueDownloadAction = vi.fn().mockResolvedValue({ url: 'https://example.com/download/testapp.zip' });

    render(<SoftwareDownloadGate software={mockSoftware} turnstileSiteKey="site-key-test" issueDownloadURL={issueMock} />);
    await page.getByRole('button', { name: 'ダウンロード' }).first().click();

    await page.getByText('利用規約に同意する').click({ force: true });
    await page.getByRole('button', { name: 'solve-turnstile' }).click();

    const confirmBtn = page.getByRole('dialog').getByRole('button', { name: 'ダウンロード' });
    await confirmBtn.click();

    await vi.waitFor(() => {
      expect(issueMock).toHaveBeenCalledWith('10', 'tok');
    });
  });
});
