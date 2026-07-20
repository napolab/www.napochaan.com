'use client';

import { useField } from '@payloadcms/ui';

import { LegalPublicURLView } from './view';

// legal-documents 編集画面のサイドバーに刺さる `ui` フィールド。編集中の slug を
// useField で購読し、公開 URL リンクを描画する(表示ロジックは LegalPublicURLView)。
// admin と site は同一オリジンなので base は window.location.origin を使う — stg admin なら
// stg URL、prod admin なら prod URL が自然に出る。SSR 時は origin 空でプレースホルダになる。
export const LegalPublicURLField = () => {
  const { value } = useField<string>({ path: 'slug' });
  const origin = typeof window === 'undefined' ? '' : window.location.origin;

  return <LegalPublicURLView slug={typeof value === 'string' ? value : ''} origin={origin} />;
};
