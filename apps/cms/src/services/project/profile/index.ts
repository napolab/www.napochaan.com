import { toLexicalJSON } from '../to-lexical-json';

import type { ProfileContactDTO, ProfileDTO, ProfileSkillGroupDTO } from '@napochaan/cms-api/services';
import type { Profile as ProfileGlobal } from '@payload-types';

const toValues = (rows: ProfileGlobal['love']): string[] => (rows ?? []).map((row) => row.value);

const toSkillGroups = (groups: ProfileGlobal['skillGroups']): ProfileSkillGroupDTO[] =>
  (groups ?? []).map((group) => ({ category: group.category, items: (group.items ?? []).map((item) => item.value) }));

const toContacts = (contacts: ProfileGlobal['contacts']): ProfileContactDTO[] => (contacts ?? []).map((contact) => ({ label: contact.label, handle: contact.handle, href: contact.href }));

// Maps the Payload `profile` global to `ProfileDTO`, flattening `{ value }` /
// `{ items: [{ value }] }` arrays into plain string arrays, coercing absent text to
// '' and leaving absent rich text out of the object. Pure.
export const projectProfile = (global: ProfileGlobal): ProfileDTO => {
  const bioJSON = toLexicalJSON(global.bio);
  const philosophyJSON = toLexicalJSON(global.philosophy);

  return {
    name: global.name,
    aka: global.aka ?? '',
    now: global.now ?? '',
    team: global.team ?? '',
    tagline: global.tagline ?? '',
    ...(bioJSON !== undefined && { bioJSON }),
    ...(philosophyJSON !== undefined && { philosophyJSON }),
    love: toValues(global.love),
    skillGroups: toSkillGroups(global.skillGroups),
    contacts: toContacts(global.contacts),
  };
};
