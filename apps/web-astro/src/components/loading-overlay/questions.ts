// The boot overlay's typewriter prompts — short existential questions the site
// asks the visitor while the typefaces load. The BootQuestion client island cycles
// through them in order, looping, via the useTypewriter hook (see ./boot-question).
//
// Single line each, uppercase to match the overlay's system-boot voice, and kept
// short enough to type out within the boot window. Add or reword freely — the
// cycle reads this array's length, so nothing else needs to change.
export const QUESTIONS = [
  'ARE YOU HERE FOR ONLY AN INSTANT?',
  'WHERE DOES FLESH END AND CIRCUIT BEGIN?',
  'WHO ARE YOU WHEN NO ONE OBSERVES?',
  'ARE YOU THE BODY, OR ONLY ITS TENANT?',
  'CAN YOU SEE YOURSELF?',
] as const;
