import { hc } from 'hono/client';
import { expectTypeOf, it } from 'vitest';

import type { CMSAppType } from './index';
import type { GalleryPhotoDTO, NewsItemDTO, PostDTO, ProfileDTO, WorkRowDTO } from '../services/index';
import type { InferResponseType } from 'hono/client';

const client = hc<CMSAppType>('http://localhost');

it('infers public route response types', () => {
  expectTypeOf<InferResponseType<typeof client.blog.$get, 200>>().toEqualTypeOf<PostDTO[]>();
  expectTypeOf<InferResponseType<(typeof client.blog)[':slug']['$get'], 200>>().toEqualTypeOf<PostDTO>();
  expectTypeOf<InferResponseType<(typeof client.blog)[':slug']['$get'], 404>>().toEqualTypeOf<{ error: 'not_found' }>();
  expectTypeOf<InferResponseType<typeof client.news.$get, 200>>().toEqualTypeOf<NewsItemDTO[]>();
  expectTypeOf<InferResponseType<(typeof client.works)[':slug']['$get'], 200>>().toEqualTypeOf<WorkRowDTO>();
  expectTypeOf<InferResponseType<typeof client.gallery.$get, 200>>().toEqualTypeOf<GalleryPhotoDTO[]>();
  expectTypeOf<InferResponseType<typeof client.profile.$get, 200>>().toEqualTypeOf<ProfileDTO>();
});

it('infers draft route response types', () => {
  expectTypeOf<InferResponseType<(typeof client.drafts.blog)[':id']['$get'], 200>>().toEqualTypeOf<PostDTO>();
  expectTypeOf<InferResponseType<(typeof client.drafts.blog)[':id']['$get'], 403>>().toEqualTypeOf<{ error: 'forbidden' }>();
});
