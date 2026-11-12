'use client';

import { Pill, useListQuery } from '@payloadcms/ui';

import type { DefaultCellComponentProps } from 'payload';

// The home page renders the first HOME_COUNT gallery rows (by order). This badge
// marks them in the admin list and updates in REAL TIME while dragging — it reads
// the live list order from useListQuery, not a server-computed value.
const HOME_COUNT = 6;

export const GalleryHomeBadgeCell = ({ rowData }: DefaultCellComponentProps) => {
  const { data } = useListQuery();
  const docs = (data?.docs ?? []) as ReadonlyArray<{ id: number | string }>;
  const index = docs.findIndex((doc) => doc.id === rowData.id);

  if (index < 0 || index >= HOME_COUNT) return null;

  return (
    <Pill size="small" pillStyle="success">
      top
    </Pill>
  );
};
