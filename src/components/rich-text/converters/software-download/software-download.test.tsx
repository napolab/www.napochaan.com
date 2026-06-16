import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { createSoftwareDownloadBlockConverters } from './index';

import type { SoftwareDownload } from '@lib/payload/software';

vi.mock('@components/software-download-gate', () => ({
  SoftwareDownloadGate: ({ software }: { software: SoftwareDownload }) => <div>gate:{software.name}</div>,
}));

const terms = { root: { type: 'root', children: [], direction: null, format: '', indent: 0, version: 1 } } as never;
const download: SoftwareDownload = { id: '5', name: 'tool', summary: 's', terms, latest: { id: '1', version: '1.0.0', releasedAt: '2026-01-01', filename: 'a.zip' }, history: [] };

const renderBlock = (map: ReadonlyMap<string, SoftwareDownload>, software: unknown) => {
  const converters = createSoftwareDownloadBlockConverters({ softwareDownloads: map, turnstileSiteKey: 'site' });
  const converter = converters['software-download'];
  if (typeof converter !== 'function') throw new Error('software-download converter must be a function');
  const node = { fields: { blockType: 'software-download', software } } as never;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- minimal converter-arg stub
  return render(<>{converter({ node, childIndex: 0, converters: {}, nodesToJSX: () => [], parent: {} } as any)}</>);
};

describe('software-download converter', () => {
  it('renders the gate when the software id is in the map', async () => {
    renderBlock(new Map([['5', download]]), { id: 5 });
    await expect.element(page.getByText('gate:tool')).toBeInTheDocument();
  });

  it('renders nothing when the software has no releases (absent from map)', async () => {
    const { container } = await renderBlock(new Map(), { id: 5 });
    expect(container).toBeEmptyDOMElement();
  });
});
