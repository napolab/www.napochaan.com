import { describe, expect, it, vi } from 'vitest';

import { blogFeed } from './blog-fixtures';
import { newsFeed } from './news-fixtures';
import { worksFeed } from './works-fixtures';
import * as securityTxt from '../.well-known/security.txt';
import * as mediaFile from '../api/media/file/[filename]';
import * as llmsFullTxt from '../llms-full.txt';
import * as llmsTxt from '../llms.txt';
import * as robotsTxt from '../robots.txt';
import * as sitemapXML from '../sitemap.xml';
import { createFakeCMSBinding, createFakeCMSServices } from '../../__mocks__/cms-services';
import { renderEndpoint } from '../../test-utils/astro-container';
import { buildLLMsFullTxt } from '@utils/llms/build-llms-full-txt';
import { buildLLMsTxt } from '@utils/llms/build-llms-txt';
import { buildRobots } from '@utils/robots/build-robots';
import { serializeRobots } from '@utils/robots/serialize-robots';
import { buildSitemap } from '@utils/sitemap/build-sitemap';
import { serializeSitemap } from '@utils/sitemap/serialize-sitemap';

import type { Profile } from '../../features/about/profile';
import type { MediaFile } from '@napochaan/cms-api/services';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

const profile: Profile = { name: 'naporitan', aka: 'napochaan', now: 'x', team: 't', tagline: 'tg', love: [], skillGroups: [], contacts: [] };
const env = vi.hoisted(() => ({ current: {} as Partial<Cloudflare.Env> }));

vi.mock('@lib/request-context', () => ({ getRequestContext: () => ({ env: env.current }) }));
vi.mock('@lib/cms/blog', () => ({ findBlogList: vi.fn(async () => blogFeed) }));
vi.mock('@lib/cms/news', () => ({ findNewsList: vi.fn(async () => newsFeed) }));
vi.mock('@lib/cms/works', () => ({ findWorksList: vi.fn(async () => worksFeed) }));
vi.mock('@lib/cms/profile', () => ({ findProfile: vi.fn(async () => profile) }));

const asEndpoint = (mod: unknown) => mod as AstroComponentFactory;

const render = async (mod: unknown, pathname: string, params: Record<string, string> = {}) => {
  vi.stubEnv('BASE_URL', 'https://napochaan.com');
  return renderEndpoint(asEndpoint(mod), pathname, params);
};

const data = { baseUrl: 'https://napochaan.com', news: newsFeed, blog: blogFeed, works: worksFeed };

describe('text endpoints (bodies equal the Next builders for the same data)', () => {
  it('/llms.txt', async () => {
    const res = await render(llmsTxt, '/llms.txt');
    expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(await res.text()).toBe(buildLLMsTxt({ ...data, profile }));
  });

  it('/llms-full.txt', async () => {
    const res = await render(llmsFullTxt, '/llms-full.txt');
    expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(await res.text()).toBe(buildLLMsFullTxt({ ...data, profile }));
  });

  it('/sitemap.xml (Next metadata-route content type)', async () => {
    const res = await render(sitemapXML, '/sitemap.xml');
    expect(res.headers.get('content-type')).toBe('application/xml');
    const body = await res.text();
    expect(body).toBe(serializeSitemap(buildSitemap(data)));
    expect(body).toContain('<loc>https://napochaan.com/blog/a.b</loc>');
  });

  it('/robots.txt on production allows the site and points at the sitemap', async () => {
    const res = await render(robotsTxt, '/robots.txt');
    expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(await res.text()).toBe(serializeRobots(buildRobots({ baseUrl: 'https://napochaan.com', isProduction: true })));
  });

  it('/robots.txt on a non-production BASE_URL blocks everything', async () => {
    vi.stubEnv('BASE_URL', 'https://stg.napochaan.com');
    const res = await renderEndpoint(asEndpoint(robotsTxt), '/robots.txt');
    expect(await res.text()).toBe('User-Agent: *\nDisallow: /\n\n');
  });

  it('/.well-known/security.txt', async () => {
    const res = await render(securityTxt, '/.well-known/security.txt');
    expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    const body = await res.text();
    expect(body).toContain('Contact: mailto:contact@napochaan.com');
    expect(body).toMatch(/Expires: \d{4}-\d{2}-\d{2}T/);
  });
});

describe('/api/media/file/[filename]', () => {
  const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
  const requested = vi.fn<(filename: string) => void>();

  const useMedia = (files: Record<string, true>) => {
    requested.mockClear();
    const toFile = (): MediaFile => ({ body: new Response(PNG).body ?? new ReadableStream(), contentType: 'image/png', size: PNG.byteLength, etag: '"abc"' });
    const services = createFakeCMSServices({
      media: {
        file: async (filename) => {
          requested(filename);
          return files[filename] === true ? toFile() : undefined;
        },
      },
    });
    env.current = { CMS: createFakeCMSBinding(services) as unknown as Cloudflare.Env['CMS'] };
  };

  const call = async (filename: string) => render(mediaFile, `/api/media/file/${encodeURIComponent(filename)}`, { filename });

  it('streams the cms media body with its Content-Type, Content-Length and ETag (no Cache-Control: the worker fills MEDIA_POLICY)', async () => {
    useMedia({ 'a.png': true });
    const res = await call('a.png');
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/png');
    expect(res.headers.get('Content-Length')).toBe(`${PNG.byteLength}`);
    expect(res.headers.get('ETag')).toBe('"abc"');
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(PNG);
  });

  it('passes a cms 404 through as 404 with its JSON body', async () => {
    useMedia({});
    const res = await call('nope.png');
    expect(res.status).toBe(404);
    expect(await res.text()).toBe('{"error":"not_found"}');
  });

  // Astro decodes params with decodeURI, which keeps `%23` / `%3F` / `%2F` encoded; Next
  // handed the route the fully decoded segment. Found under wrangler dev.
  it('fully decodes reserved characters (%23) once, as Next did', async () => {
    useMedia({ 'x#y.png': true });
    const res = await render(mediaFile, '/api/media/file/x%23y.png', { filename: 'x%23y.png' });
    expect(res.status).toBe(200);
    expect(requested).toHaveBeenCalledWith('x#y.png');
  });

  it('hands cms the decoded filename exactly once even with spaces or non-ASCII', async () => {
    useMedia({ 'a b 写真.png': true });
    const res = await call('a b 写真.png');
    expect(res.status).toBe(200);
    expect(requested).toHaveBeenCalledWith('a b 写真.png');
  });
});
