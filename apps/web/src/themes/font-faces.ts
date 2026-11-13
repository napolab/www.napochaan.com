// Hashed /_astro/ URL of the @font-face stylesheet. Imported with `?url` (not as a
// side-effect CSS import) so Vite emits it as its own asset instead of bundling it
// into the render-blocking layout CSS; the site layout links it non-blocking.
import href from './font-faces.css?url';

export const fontFacesHref: string = href;
