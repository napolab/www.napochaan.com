import { GallerySection } from '../../../_components/gallery-section';
import { findGalleryList } from '@lib/cms/gallery';

export const GallerySectionLoader = async () => {
  const photos = await findGalleryList();

  return <GallerySection id="gallery" photos={photos} />;
};
