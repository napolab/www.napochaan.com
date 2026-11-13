import { withAppProviders } from '@components/app-providers';

import { AboutWhoami } from './components/about-whoami';
import { BlogIndex } from './components/blog-index';
import { GallerySection } from './components/gallery-section';
import { Hero } from './components/hero';
import { LogSection } from './components/log-section';
import { NewsSection } from './components/news-section';
import { WorksSection } from './components/works-section';

// Home section islands, placed by src/pages/index.astro. In Next these sections were
// Server Components whose client leaves (ScrambleText, Link, EchoText, Image,
// Gallery …) hydrated in place; an Astro directive cannot reach inside a React tree,
// so each section is the island unit and takes only serializable props (data is
// fetched by the page, see ./load-home).
export const HeroIsland = withAppProviders(Hero);
export const AboutWhoamiIsland = withAppProviders(AboutWhoami);
export const NewsSectionIsland = withAppProviders(NewsSection);
export const WorksSectionIsland = withAppProviders(WorksSection);
export const LogSectionIsland = withAppProviders(LogSection);
export const GallerySectionIsland = withAppProviders(GallerySection);
export const BlogIndexIsland = withAppProviders(BlogIndex);
