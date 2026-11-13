import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

export type ProfileSkillGroup = { category: string; items: readonly string[] };
export type ProfileContact = { label: string; handle: string; href: string };

export type Profile = {
  name: string;
  aka: string;
  now: string;
  team: string;
  tagline: string;
  bio?: SerializedEditorState;
  philosophy?: SerializedEditorState;
  love: readonly string[];
  skillGroups: readonly ProfileSkillGroup[];
  contacts: readonly ProfileContact[];
};
