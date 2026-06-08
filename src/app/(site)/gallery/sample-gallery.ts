import flyerBooth0424 from '../_assets/flyer-booth-0424.jpg';
import flyerBooth0523 from '../_assets/flyer-booth-0523.jpg';
import galleryFlyerAmbient from '../_assets/gallery-flyer-ambient.jpg';
import galleryFlyerDnb from '../_assets/gallery-flyer-dnb.jpg';
import galleryFlyerTechno from '../_assets/gallery-flyer-techno.jpg';
import galleryVrchatAvatar from '../_assets/gallery-vrchat-avatar.jpg';
import galleryVrchatBooth from '../_assets/gallery-vrchat-booth.jpg';
import galleryVrchatCrowd from '../_assets/gallery-vrchat-crowd.jpg';
import galleryVrchatFrame from '../_assets/gallery-vrchat-frame.jpg';
import galleryVrchatStage from '../_assets/gallery-vrchat-stage.jpg';
import galleryVrchatVertical from '../_assets/gallery-vrchat-vertical.jpg';
import vrchatAlice from '../_assets/vrchat-alice.jpg';
import vrchatGlitch from '../_assets/vrchat-glitch.jpg';
import vrchatSquare from '../_assets/vrchat-square.jpg';
import vrchatWide from '../_assets/vrchat-wide.jpg';

import type { GalleryPhoto } from './_components/gallery-archive';

// The structural shape of a static image import (next/image's StaticImageData),
// declared locally so this module never imports next/image directly (see images.md).
type ImportedImage = { src: string; width: number; height: number };

// Map a static image import + metadata into a GalleryPhoto. Intrinsic width/height
// come from the import, so the masonry packer can size cells without measuring images.
const photo = (image: ImportedImage, id: string, alt: string, caption: string): GalleryPhoto => ({
  id,
  src: image.src,
  width: image.width,
  height: image.height,
  alt,
  caption,
});

// Sample data — replaced by Payload CMS in a later plan. Ordered to interleave wide
// (span-2) shots with portraits and squares so the skyline packing reads varied.
export const galleryPhotos: GalleryPhoto[] = [
  photo(flyerBooth0424, '1', 'Booth² 2026.04.24 イベントフライヤー', 'flyer / 04.24'),
  photo(galleryVrchatStage, '2', 'VRChat ステージのレーザー演出', 'VRChat'),
  photo(vrchatSquare, '3', 'VRChat アバターのフレーミングポーズ', 'frame'),
  photo(galleryFlyerTechno, '4', 'booth2booth techno 回フライヤー', 'flyer'),
  photo(galleryVrchatCrowd, '5', 'VRChat フロアを埋めるアバターの群衆', 'VRChat'),
  photo(vrchatAlice, '6', 'VRChat アバター ALICE ポートレート', 'ALICE'),
  photo(galleryVrchatAvatar, '7', 'VRChat アバターのグリッチポートレート', 'avatar'),
  photo(galleryFlyerDnb, '8', 'booth2booth drum & bass 回フライヤー', 'flyer / DNB'),
  photo(galleryVrchatBooth, '9', 'VRChat の DJ ブース', 'VRChat'),
  photo(vrchatGlitch, '10', 'VRChat アバターのグリッチビジュアル', 'glitch'),
  photo(galleryVrchatFrame, '11', 'VRChat アバターのキメポーズ', 'frame'),
  photo(flyerBooth0523, '12', 'Booth² 2026.05.23 イベントフライヤー', 'flyer / 05.23'),
  photo(vrchatWide, '13', 'VRChat ライブ会場の光跡ショット', 'VRChat'),
  photo(galleryVrchatVertical, '14', 'VRChat 縦に伸びる青いレーザーの空間', 'VRChat'),
  photo(galleryFlyerAmbient, '15', 'booth2booth ambient 回フライヤー', 'flyer'),
];
