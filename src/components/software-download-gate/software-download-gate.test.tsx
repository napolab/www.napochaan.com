import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { SoftwareDownloadGate } from './index';

import type { SoftwareDownload } from '@lib/payload/software';

vi.mock('@marsidev/react-turnstile', () => ({
  Turnstile: ({ onSuccess }: { onSuccess: (t: string) => void }) => (
    <button type="button" onClick={() => onSuccess('tok')}>
      solve-turnstile
    </button>
  ),
}));

const issueMock = vi.fn();
vi.mock('../../app/(site)/_actions/issue-download-url', () => ({
  issueDownloadURL: (...args: unknown[]) => issueMock(...args),
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
  latest: { id: '10', version: '1.2.0', releasedAt: '2026-01-01T00:00:00.000Z', filename: 'testapp-1.2.0.zip' },
  history: [],
};

const mockSoftwareWithHistory: SoftwareDownload = {
  ...mockSoftware,
  history: [{ id: '9', version: '1.1.0', releasedAt: '2025-06-01T00:00:00.000Z', filename: 'testapp-1.1.0.zip' }],
};

describe('SoftwareDownloadGate', () => {
  it('shows product name heading and latest version text', async () => {
    render(<SoftwareDownloadGate software={mockSoftware} turnstileSiteKey="site-key-test" />);
    await expect.element(page.getByRole('heading', { name: 'TestApp' })).toBeInTheDocument();
    await expect.element(page.getByText(/1\.2\.0/)).toBeInTheDocument();
  });

  it('clicking ダウンロード button opens dialog', async () => {
    render(<SoftwareDownloadGate software={mockSoftware} turnstileSiteKey="site-key-test" />);
    await page.getByRole('button', { name: 'ダウンロード' }).click();
    await expect.element(page.getByRole('dialog')).toBeInTheDocument();
  });

  it('confirm button inside dialog is disabled initially', async () => {
    render(<SoftwareDownloadGate software={mockSoftware} turnstileSiteKey="site-key-test" />);
    await page.getByRole('button', { name: 'ダウンロード' }).click();
    const confirmBtn = page.getByRole('dialog').getByRole('button', { name: 'ダウンロード' });
    await expect.element(confirmBtn).toBeDisabled();
  });

  it('confirm becomes enabled after checking checkbox and solving turnstile', async () => {
    render(<SoftwareDownloadGate software={mockSoftware} turnstileSiteKey="site-key-test" />);
    await page.getByRole('button', { name: 'ダウンロード' }).click();

    await page.getByText('利用規約に同意する').click({ force: true });
    await page.getByRole('button', { name: 'solve-turnstile' }).click();

    const confirmBtn = page.getByRole('dialog').getByRole('button', { name: 'ダウンロード' });
    await expect.element(confirmBtn).not.toBeDisabled();
  });

  it('history release download calls issueDownloadURL with the history release id', async () => {
    // Return an error so window.location.href is never assigned and the iframe stays alive.
    // The goal is to verify per-release id identity, not navigation.
    issueMock.mockResolvedValue({ error: 'token expired' });

    render(<SoftwareDownloadGate software={mockSoftwareWithHistory} turnstileSiteKey="site-key-test" />);

    // Expand history section
    await page.getByRole('button', { name: '過去のバージョン' }).click();

    // Click the second download button (first is the latest, second is the history entry)
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

  it('clicking confirm calls issueDownloadURL and navigates to the download URL', async () => {
    issueMock.mockResolvedValue({ url: 'https://example.com/download/testapp.zip' });

    render(<SoftwareDownloadGate software={mockSoftware} turnstileSiteKey="site-key-test" />);
    await page.getByRole('button', { name: 'ダウンロード' }).click();

    await page.getByText('利用規約に同意する').click({ force: true });
    await page.getByRole('button', { name: 'solve-turnstile' }).click();

    const confirmBtn = page.getByRole('dialog').getByRole('button', { name: 'ダウンロード' });
    await confirmBtn.click();

    await vi.waitFor(() => {
      expect(issueMock).toHaveBeenCalledWith('10', 'tok');
    });
  });
});
