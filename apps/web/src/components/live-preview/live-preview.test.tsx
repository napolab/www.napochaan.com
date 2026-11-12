import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { LivePreviewListener } from './index';

const refreshRouteOnSave = vi.hoisted(() => vi.fn());

// Stand-in that exposes the serverURL it was given, so the test can assert the
// origin the admin's save messages are matched against.
vi.mock('@payloadcms/live-preview-react', () => ({
  RefreshRouteOnSave: (props: { serverURL: string }) => {
    refreshRouteOnSave(props);
    return <span data-testid="refresh-route-on-save" data-server-url={props.serverURL} />;
  },
}));

describe('LivePreviewListener', () => {
  it('listens for save events from the given cms origin', async () => {
    render(<LivePreviewListener serverURL="https://cms-stg.napochaan.com" />);

    await expect.element(page.getByTestId('refresh-route-on-save')).toHaveAttribute('data-server-url', 'https://cms-stg.napochaan.com');
  });

  it('mounts nothing when the cms origin is not configured', async () => {
    refreshRouteOnSave.mockClear();
    render(<LivePreviewListener />);

    await expect.element(page.getByTestId('refresh-route-on-save')).not.toBeInTheDocument();
    expect(refreshRouteOnSave).not.toHaveBeenCalled();
  });
});
