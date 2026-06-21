import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  gap: { base: '8', desktop: 'section' },
});

export const summary = css({
  fontSize: 'lg',
  color: 'fg.muted',
  lineHeight: 'relaxed',
});

export const termsHeading = css({
  fontSize: 'md',
  fontWeight: 'semibold',
  color: 'fg.default',
  marginBottom: '4',
});

export const srOnly = css({ srOnly: true });
