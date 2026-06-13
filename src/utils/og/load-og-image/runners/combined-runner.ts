import { devRunner } from './dev-runner';
import { externalRunner } from './external-runner';
import { serviceBindingRunner } from './service-binding-runner';

import type { OgImageContext, OgImageRunner } from '../types';

// Registry, tried in order; first match wins (mirrors worker fetchImage).
const runners: OgImageRunner[] = [externalRunner, devRunner, serviceBindingRunner];

export const resolveOgImage = async (ctx: OgImageContext): Promise<string | undefined> => {
  for (const runner of runners) {
    const result = await runner.run(ctx);
    if (result.isOk()) return result.value;
  }

  return undefined;
};
