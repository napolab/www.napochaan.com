// Shared CMS contract: DTO types and service interfaces only. No implementation.
// DTOs mirror the web domain types field-for-field except that Lexical editor
// state is carried as a JSON string (`*JSON`) to keep Hono's response-type
// inference shallow.

export type MediaRefDTO = { src: string; width: number; height: number };
export type SeoDTO = { title?: string; description?: string; image?: string };

export type PostDTO = {
  id: string;
  slug: string;
  index: string;
  title: string;
  readMin: number;
  date: string;
  excerpt: string;
  thumbnail?: MediaRefDTO;
  bodyJSON?: string;
  seo?: SeoDTO;
};

export type NewsItemDTO = {
  id: string;
  slug: string;
  date: string;
  category: string;
  title: string;
  url?: string;
  bodyJSON?: string;
  seo?: SeoDTO;
};

export type WorkRowDTO = {
  id: string;
  slug: string;
  no: string;
  title: string;
  type: string;
  year: number;
  date?: string;
  url?: string;
  thumbnail?: MediaRefDTO;
  description?: string;
  bodyJSON?: string;
  seo?: SeoDTO;
};

export type GalleryPhotoDTO = { id: string; src: string; width: number; height: number; alt: string; caption?: string };
export type LogManualItemDTO = { id: string; title: string; date: string; meta: string; url?: string };

export type ProfileSkillGroupDTO = { category: string; items: string[] };
export type ProfileContactDTO = { label: string; handle: string; href: string };
export type ProfileDTO = {
  name: string;
  aka: string;
  now: string;
  team: string;
  tagline: string;
  bioJSON?: string;
  philosophyJSON?: string;
  love: string[];
  skillGroups: ProfileSkillGroupDTO[];
  contacts: ProfileContactDTO[];
};

export type MediaFile = { body: ReadableStream<Uint8Array>; contentType: string; size: number; etag: string };

export interface ContentService<List, Item> {
  list(): Promise<List[]>;
  bySlug(slug: string): Promise<Item | undefined>;
  draft(id: string): Promise<Item | undefined>;
}

export interface NewsService extends ContentService<NewsItemDTO, NewsItemDTO> {
  latest(limit: number): Promise<NewsItemDTO[]>;
}

export interface DraftListService<T> {
  list(): Promise<T[]>;
  draftList(): Promise<T[]>;
}

export interface CMSServices {
  blog: ContentService<PostDTO, PostDTO>;
  news: NewsService;
  works: ContentService<WorkRowDTO, WorkRowDTO>;
  gallery: DraftListService<GalleryPhotoDTO>;
  logs: DraftListService<LogManualItemDTO>;
  profile: { get(): Promise<ProfileDTO | undefined> };
  media: { file(filename: string): Promise<MediaFile | undefined> };
  preview: { verify(secret: string): boolean };
}
