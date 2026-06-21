import { collectSoftwareIds } from '@lib/software/collect-software-ids';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

type BlogBody = { slug: string; body?: SerializedEditorState };

// Pure: which posts embed a given software id via a software-download block.
export const blogSlugsEmbeddingSoftware = (posts: readonly BlogBody[], softwareId: string): readonly string[] =>
  posts.filter((post) => collectSoftwareIds(post.body).includes(softwareId)).map((post) => post.slug);

// Loader: all blog slugs (published) whose body embeds the software id. Used by the
// release revalidate hook to bust the path-keyed ISR HTML of embedding articles.
// getPayloadClient is imported lazily so importing this module (e.g. in tests)
// does not trigger Cloudflare context resolution at module load time.
export const findBlogSlugsEmbeddingSoftware = async (softwareId: string): Promise<readonly string[]> => {
  const { getPayloadClient } = await import('../client');
  const payload = await getPayloadClient();
  const result = await payload.find({ collection: 'blog', where: { _status: { equals: 'published' } }, overrideAccess: true, limit: 0, depth: 0 });
  const posts = result.docs.map((doc) => ({ slug: `${doc.slug}`, body: doc.body as SerializedEditorState | undefined }));
  return blogSlugsEmbeddingSoftware(posts, softwareId);
};
