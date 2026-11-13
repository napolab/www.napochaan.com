import { withAppProviders } from '@components/app-providers';
import { Gallery } from '@components/gallery';
import { GalleryArchive } from '@components/gallery-archive';

// The two heaviest demos (client lightbox + images; the archive adds the BlankDim
// islands). Next code-split them with `dynamic(…, { ssr: false })`; here they are
// `client:only="react"` islands, so their JS only loads in the browser.
export const GalleryDemoIsland = withAppProviders(Gallery);
export const GalleryArchiveDemoIsland = withAppProviders(GalleryArchive);
