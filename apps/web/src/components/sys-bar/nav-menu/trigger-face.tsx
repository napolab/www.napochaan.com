// Shared by the placeholder trigger (initial bundle) and the react-aria MenuTrigger's
// Button (lazy chunk), so the swap between them changes neither the accessible name
// nor a pixel of the face.

// Names the trigger (and, through it, the popover/menu) so the decorative ≡ glyph
// never leaks into the accessible name.
export const MENU_LABEL = 'グローバルナビゲーション';

export const TriggerFace = () => (
  <>
    <span aria-hidden="true">≡</span> menu
  </>
);
