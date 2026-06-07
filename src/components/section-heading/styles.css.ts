import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  alignItems: 'baseline',
  gap: 'element',
  borderBottomWidth: 'default',
  borderBottomStyle: 'solid',
  borderBottomColor: 'fg.default',
  paddingBottom: '1.5',
});

export const no = css({
  fontFamily: 'mono',
  fontSize: 'sm',
  color: 'accent.text',
});

// The hover affordance is the scramble alone (no colour/underline shift), keeping
// the link in line with the site-wide treatment. Focus ring stays for keyboard.
export const more = css({
  marginInlineStart: 'auto',
  fontFamily: 'mono',
  fontSize: 'xs',
  whiteSpace: 'nowrap',
});
