'use client';

import { Pill } from '@payloadcms/ui';

import type { DefaultCellComponentProps } from 'payload';

// Rendered in the gallery list view. `cellData` is the computed `homeTop` boolean
// (true for the first 6 rows by _order = the ones shown on the home page).
export const GalleryHomeBadgeCell = ({ cellData }: DefaultCellComponentProps) => {
  if (cellData !== true) return null;

  return <Pill pillStyle="success">top で表示</Pill>;
};
