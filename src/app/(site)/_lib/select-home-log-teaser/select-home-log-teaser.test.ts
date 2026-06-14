import { describe, expect, it } from 'vitest';

import { selectHomeLogTeaser } from '.';

import type { LogEntry } from '../../log/_lib/build-log-timeline';

// `date` is also used as the identity assertion below, so each entry's date is unique.
const entry = (date: string, upcoming: boolean): LogEntry => ({
  id: date,
  year: 2026,
  date,
  meta: 'VJ',
  title: date,
  upcoming,
});

const dates = (entries: readonly LogEntry[]): string[] => entries.map((e) => e.date);

describe('selectHomeLogTeaser', () => {
  // The timeline feeds entries in date-descending order (buildLogTimeline's output).
  it('returns the nearest upcoming entries in ascending order when upcoming fills the limit', () => {
    const entries = [entry('07.11', true), entry('07.10', true), entry('06.27', true), entry('06.19', true), entry('06.03', false)];

    expect(dates(selectHomeLogTeaser(entries, 3))).toEqual(['06.19', '06.27', '07.10']);
  });

  it('fills remaining slots with the most recent finished entries when upcoming is short', () => {
    const entries = [entry('06.27', true), entry('06.19', true), entry('06.03', false), entry('05.30', false), entry('05.06', false)];

    expect(dates(selectHomeLogTeaser(entries, 4))).toEqual(['06.19', '06.27', '06.03', '05.30']);
  });

  it('falls back to the most recent finished entries when nothing is upcoming', () => {
    const entries = [entry('06.03', false), entry('05.30', false), entry('05.06', false)];

    expect(dates(selectHomeLogTeaser(entries, 2))).toEqual(['06.03', '05.30']);
  });

  it('returns every entry (upcoming ascending, then finished) when the limit exceeds the total', () => {
    const entries = [entry('06.27', true), entry('06.19', true), entry('06.03', false)];

    expect(dates(selectHomeLogTeaser(entries, 10))).toEqual(['06.19', '06.27', '06.03']);
  });
});
