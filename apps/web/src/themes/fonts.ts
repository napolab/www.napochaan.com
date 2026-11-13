import './fonts.css';

// Class that defines the font CSS variables (--font-mplus1 and TITLE_JP_VAR) — set on
// the root <html> by the layout. The variable values live in ./fonts.css
// (render-blocking); the @font-face rules live in ./font-faces.css, which the layout
// links as a separate non-render-blocking stylesheet (fontFacesHref).
export const fontVariables = 'font-variables';
