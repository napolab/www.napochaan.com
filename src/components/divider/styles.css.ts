import { css } from '@styled/css';

export const root = css({
  borderColor: 'border.default',
  borderStyle: 'solid',
  alignSelf: 'stretch',
  '&[data-orientation="horizontal"]': {
    width: 'full',
    borderTopWidth: 'hairline',
    borderBottomWidth: 'none',
    borderLeftWidth: 'none',
    borderRightWidth: 'none',
  },
  '&[data-orientation="vertical"]': {
    alignSelf: 'stretch',
    borderLeftWidth: 'hairline',
    borderTopWidth: 'none',
    borderBottomWidth: 'none',
    borderRightWidth: 'none',
  },
  '&[data-variant="dashed"]': { borderStyle: 'dashed' },
});
