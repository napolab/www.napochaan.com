import { referenceId } from '@lib/software/collect-software-ids';

import { getPayloadClient } from '../client';

// Authorizes a release for public download by publish status: returns the release
// file's R2 filename ONLY when the release exists AND its parent `software` is
// published. Releases of draft/unpublished software are NOT downloadable even with a
// valid signed URL (the gate is callable as a Server Action with any id, and a signed
// URL could outlive its software's publish state). Returns undefined for every
// non-downloadable case (missing release, no filename, missing/unpublished software).
export const findDownloadableReleaseFile = async (releaseId: string): Promise<string | undefined> => {
  const payload = await getPayloadClient();
  const release = await payload.findByID({ collection: 'software-release', id: releaseId, overrideAccess: true }).catch(() => undefined);
  if (release === undefined) return undefined;
  const filename = typeof release.filename === 'string' ? release.filename : undefined;
  if (filename === undefined) return undefined;
  const softwareId = referenceId(release.software);
  if (softwareId === undefined) return undefined;
  const software = await payload.findByID({ collection: 'software', id: softwareId, overrideAccess: true }).catch(() => undefined);
  if (software === undefined || software._status !== 'published') return undefined;
  return filename;
};

// Boolean convenience for the Server Action (UX: avoid minting a URL for a release
// that the GET route would reject anyway).
export const isReleaseDownloadable = async (releaseId: string): Promise<boolean> => (await findDownloadableReleaseFile(releaseId)) !== undefined;
