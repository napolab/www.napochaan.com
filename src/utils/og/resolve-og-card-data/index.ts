import { clampTitle, type ClampedTitle } from '../clamp-title';
import { sectionLabel, type OgSection } from '../section-label';

// Title char budget tuned for the 432px info column at ~33px. The spike / first
// real render confirms the exact value; adjust here only.
const TITLE_MAX_CHARS = 24;

export type OgCardInput = {
  section: OgSection;
  title: string;
  meta: string;
  // Caller coerces Payload NULL → undefined at the boundary.
  imageUrl?: string;
};

export type OgCardData = {
  label: string;
  title: ClampedTitle;
  hasImage: boolean;
  imageUrl?: string;
  meta: string;
};

// Normalizes a detail record into the card's render inputs. Pure.
export const resolveOgCardData = (input: OgCardInput): OgCardData => {
  const hasImage = input.imageUrl !== undefined && input.imageUrl !== '';

  return {
    label: sectionLabel(input.section),
    title: clampTitle(input.title, TITLE_MAX_CHARS),
    hasImage,
    imageUrl: hasImage ? input.imageUrl : undefined,
    meta: input.meta,
  };
};
