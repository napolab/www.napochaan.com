import { createElement } from 'react';

import type { FC } from 'react';

const MockNextImage: FC<Record<string, unknown>> = (props) => {
  const { onLoad, placeholder, blurDataURL: _b, priority, quality, sizes, fill: _f, loader: _l, unoptimized: _u, overrideSrc: _o, ...rest } = props;

  return createElement('img', {
    ...rest,
    'data-testid': 'next-image',
    'data-placeholder': placeholder,
    'data-priority': priority === true ? 'true' : undefined,
    'data-quality': quality,
    'data-sizes': sizes,
    onLoad,
    alt: typeof rest.alt === 'string' ? rest.alt : '',
  });
};

export default MockNextImage;
