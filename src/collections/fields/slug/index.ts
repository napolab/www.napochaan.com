import type { Field } from 'payload';

// Lowercase alphanumerics in hyphen-separated groups. No leading/trailing/double
// hyphen, no uppercase, no underscore, no dots, no slashes.
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const REQUIRED_MESSAGE = 'スラッグは必須です。';
const FORMAT_MESSAGE = '小文字英数字とハイフンのみ使用できます（先頭・末尾・連続ハイフン不可）。';

// Pure validator, exported for unit testing. Payload calls it with (value, options);
// the second arg is ignored.
export const validateSlug = (value: string | string[] | null | undefined): true | string => {
  if (typeof value !== 'string' || value.length === 0) return REQUIRED_MESSAGE;
  if (!SLUG_PATTERN.test(value)) return FORMAT_MESSAGE;

  return true;
};

// Shared required+unique URL slug field. Added to works/news/blog so the
// validation contract lives in one place.
export const slugField = (): Field => ({
  name: 'slug',
  label: 'スラッグ (URL)',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  admin: {
    position: 'sidebar',
    description: 'URL に使う英数字の識別子。小文字英数字とハイフンのみ（例: napochaan-v3-0-0）。',
  },
  validate: validateSlug,
});
