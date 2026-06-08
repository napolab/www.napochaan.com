import type { Profile, ProfileContact, ProfileSkillGroup } from '../../../../app/(site)/about/_lib/profile';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import type { Profile as ProfileGlobal } from '@payload-types';

const toValues = (rows: ProfileGlobal['love']): readonly string[] => (rows ?? []).map((row) => row.value);

const toSkillGroups = (groups: ProfileGlobal['skillGroups']): readonly ProfileSkillGroup[] =>
  (groups ?? []).map((group) => ({ category: group.category, items: (group.items ?? []).map((item) => item.value) }));

const toContacts = (contacts: ProfileGlobal['contacts']): readonly ProfileContact[] => (contacts ?? []).map((contact) => ({ label: contact.label, handle: contact.handle, href: contact.href }));

// Maps the Payload `profile` global to the site's Profile domain type, flattening
// `{ value }` / `{ items: [{ value }] }` arrays into plain string arrays and
// coercing absent text to '' and absent rich-text to undefined. Pure.
export const toProfile = (global: ProfileGlobal): Profile => ({
  name: global.name,
  aka: global.aka ?? '',
  now: global.now ?? '',
  team: global.team ?? '',
  tagline: global.tagline ?? '',
  bio: (global.bio ?? undefined) as SerializedEditorState | undefined,
  philosophy: (global.philosophy ?? undefined) as SerializedEditorState | undefined,
  love: toValues(global.love),
  skillGroups: toSkillGroups(global.skillGroups),
  contacts: toContacts(global.contacts),
});
