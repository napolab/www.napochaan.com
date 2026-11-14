import { directContacts } from '../../../features/contact/contacts';
import { homeAbout } from '../../../features/home/about-sample';

// schema.org JSON-LD for the pages that describe an entity: the home page (WebSite +
// the site owner Person) and the detail pages (BlogPosting / CreativeWork). Pages pass
// a `StructuredDataInput` descriptor with their metadata; `buildMetadata` resolves it
// against the page's already-resolved canonical URL, description and OG image, so the
// JSON-LD never builds a second URL path. Person data is deploy-constant (no CMS read).

export type StructuredDataInput = { type: 'home' } | { type: 'blogPosting'; headline: string; datePublished: string } | { type: 'creativeWork'; name: string; dateCreated?: string };

// The resolved page facts the descriptor is combined with (all absolute URLs).
export type StructuredDataPage = {
  origin: string;
  url: string;
  description: string;
  image: string | undefined;
};

const CONTEXT = 'https://schema.org';
const SITE_NAME = 'napochaan';
const LANGUAGE = 'ja';

type PersonRef = { '@type': 'Person'; name: string; url: string };

type WebSiteNode = {
  '@type': 'WebSite';
  '@id': string;
  url: string;
  name: string;
  description: string;
  inLanguage: string;
  publisher: { '@id': string };
};

type PersonNode = PersonRef & {
  '@id': string;
  jobTitle: string;
  knowsAbout: readonly string[];
  image: string;
  sameAs: string[];
};

type HomeGraph = { '@context': string; '@graph': [WebSiteNode, PersonNode] };

type BlogPostingNode = {
  '@context': string;
  '@type': 'BlogPosting';
  headline: string;
  description: string;
  datePublished: string;
  inLanguage: string;
  url: string;
  mainEntityOfPage: string;
  image?: string;
  author: PersonRef;
};

type CreativeWorkNode = {
  '@context': string;
  '@type': 'CreativeWork';
  name: string;
  description: string;
  dateCreated?: string;
  inLanguage: string;
  url: string;
  image?: string;
  author: PersonRef;
};

export type JSONLD = HomeGraph | BlogPostingNode | CreativeWorkNode;

const personID = (origin: string): string => `${origin}/#person`;

// Profile URLs only: the mailto contact is not an identity page.
const sameAs = (): string[] => directContacts.map((contact) => contact.href).filter((href) => href.startsWith('https://'));

const author = (origin: string): PersonRef => ({ '@type': 'Person', name: SITE_NAME, url: origin });

const buildHome = (page: StructuredDataPage): HomeGraph => ({
  '@context': CONTEXT,
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${page.origin}/#website`,
      url: page.url,
      name: SITE_NAME,
      description: page.description,
      inLanguage: LANGUAGE,
      publisher: { '@id': personID(page.origin) },
    },
    {
      ...author(page.origin),
      '@id': personID(page.origin),
      jobTitle: homeAbout.now,
      knowsAbout: homeAbout.skills,
      image: `${page.origin}/icon.png`,
      sameAs: sameAs(),
    },
  ],
});

const optionalImage = (image: string | undefined): { image?: string } => (image === undefined ? {} : { image });

const buildBlogPosting = (input: Extract<StructuredDataInput, { type: 'blogPosting' }>, page: StructuredDataPage): BlogPostingNode => ({
  '@context': CONTEXT,
  '@type': 'BlogPosting',
  headline: input.headline,
  description: page.description,
  datePublished: input.datePublished,
  inLanguage: LANGUAGE,
  url: page.url,
  mainEntityOfPage: page.url,
  ...optionalImage(page.image),
  author: author(page.origin),
});

const buildCreativeWork = (input: Extract<StructuredDataInput, { type: 'creativeWork' }>, page: StructuredDataPage): CreativeWorkNode => ({
  '@context': CONTEXT,
  '@type': 'CreativeWork',
  name: input.name,
  description: page.description,
  ...(input.dateCreated === undefined ? {} : { dateCreated: input.dateCreated }),
  inLanguage: LANGUAGE,
  url: page.url,
  ...optionalImage(page.image),
  author: author(page.origin),
});

export const buildJSONLD = (input: StructuredDataInput, page: StructuredDataPage): JSONLD => {
  switch (input.type) {
    case 'home':
      return buildHome(page);
    case 'blogPosting':
      return buildBlogPosting(input, page);
    case 'creativeWork':
      return buildCreativeWork(input, page);
  }
};

// JSON for a `<script type="application/ld+json">` body: `<` is escaped so a CMS
// string like `</script>` cannot end the element (JSON.parse still reads it back).
export const serializeJSONLD = (value: JSONLD): string => JSON.stringify(value).replace(/</g, '\\u003c');
