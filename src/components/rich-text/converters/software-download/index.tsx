import { SoftwareDownloadGate } from '@components/software-download-gate';
import { referenceId } from '@lib/software/collect-software-ids';

import type { ConverterContext } from '../index';
import type { JSXConverters } from '@payloadcms/richtext-lexical/react';

import type { NodeTypes } from '../types';

// Renders the `software-download` block: looks the referenced product up in the
// loader-supplied map and shows its gate. Products with zero releases are absent from
// the map (and render nothing) — matching the "no release, no gate" rule.
export const createSoftwareDownloadBlockConverters = ({ softwareDownloads, turnstileSiteKey }: ConverterContext): NonNullable<JSXConverters<NodeTypes>['blocks']> => ({
  'software-download': ({ node }) => {
    const id = referenceId(node.fields.software);
    if (id === undefined) return null;
    const download = softwareDownloads.get(id);
    if (download === undefined) return null;
    return <SoftwareDownloadGate software={download} turnstileSiteKey={turnstileSiteKey} />;
  },
});
