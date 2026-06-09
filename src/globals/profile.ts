import { revalidateTagsAndPaths } from '../collections/hooks/revalidate';
import { CACHE_TAGS } from '@utils/cache-tags';

import type { GlobalConfig } from 'payload';

// Singleton profile powering /about. Busting CACHE_TAGS.profile purges the
// unstable_cache read; revalidatePath('/about') refreshes the ISR HTML.
export const Profile = {
  slug: 'profile',
  label: 'profile',
  access: {
    read: () => true,
    update: ({ req: { user } }) => user !== null,
  },
  versions: { drafts: { autosave: { interval: 375 } } },
  hooks: {
    afterChange: [() => revalidateTagsAndPaths([CACHE_TAGS.profile], ['/about'])],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'profile',
          fields: [
            { name: 'name', label: '名前', type: 'text', required: true },
            { name: 'aka', label: '別名', type: 'text' },
            { name: 'now', label: '現在', type: 'text' },
            { name: 'team', label: 'チーム', type: 'text' },
            { name: 'tagline', label: 'タグライン', type: 'text' },
            { name: 'bio', label: '自己紹介', type: 'richText' },
            { name: 'philosophy', label: '思想', type: 'richText' },
          ],
        },
        {
          label: 'Love & Skill',
          fields: [
            {
              name: 'love',
              label: '好きなジャンル',
              type: 'array',
              labels: { singular: 'ジャンル', plural: 'ジャンル' },
              fields: [{ name: 'value', label: '名称', type: 'text', required: true }],
            },
            {
              name: 'skillGroups',
              label: 'スキル',
              type: 'array',
              labels: { singular: 'スキル群', plural: 'スキル群' },
              fields: [
                { name: 'category', label: 'カテゴリ', type: 'text', required: true },
                {
                  name: 'items',
                  label: '項目',
                  type: 'array',
                  labels: { singular: '項目', plural: '項目' },
                  fields: [{ name: 'value', label: '名称', type: 'text', required: true }],
                },
              ],
            },
          ],
        },
        {
          label: 'Contact',
          fields: [
            {
              name: 'contacts',
              label: '連絡先',
              type: 'array',
              labels: { singular: '連絡先', plural: '連絡先' },
              fields: [
                { name: 'label', label: 'ラベル', type: 'text', required: true },
                { name: 'handle', label: 'ハンドル', type: 'text', required: true },
                { name: 'href', label: 'URL', type: 'text', required: true },
              ],
            },
          ],
        },
      ],
    },
  ],
} satisfies GlobalConfig;
