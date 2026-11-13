// Parity check: request the same URL list from two deployments of the site and compare
// status, Location, content-type, Cache-Control class, the head metadata of HTML pages
// (title, description, canonical, robots, og:*, twitter:*, h1), normalized bodies of the
// text endpoints (.md, RSS, llms, sitemap, robots, security.txt) and OG PNG dimensions.
//
//   node scripts/parity-check.mjs <baseA> <baseB> [--json]
//
// A is the reference (the Next app), B the candidate (this Astro app). Slugs are
// discovered from A's sitemap. Exit 1 on any mismatch not covered by
// scripts/parity/whitelist.mjs, or when A answers a probe with an unexpected status.
// Read-only: GET only, redirects are not followed.

import { applyWhitelist, buildRecord, diffRecords } from './parity/compare.mjs';
import { WHITELIST } from './parity/whitelist.mjs';
import { buildProbes, pickSectionSlugs, SECTIONS, sitemapPaths } from './parity-urls.mjs';
import { parseSitemapLocations } from './warm-cache/targets.mjs';

const USER_AGENT = 'napochaan-parity-check/1';
const CONCURRENCY = 4;

const [baseA, baseB] = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const asJSON = process.argv.includes('--json');
if (baseA === undefined || baseB === undefined) {
  console.error('usage: node scripts/parity-check.mjs <baseA> <baseB> [--json]');
  process.exit(2);
}

const fetchRecord = async (base, path) => {
  const response = await fetch(new URL(path, base), { redirect: 'manual', headers: { 'user-agent': USER_AGENT } });
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.startsWith('image/')) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    return buildRecord({ status: response.status, headers: response.headers, bytes });
  }
  const text = await response.text();
  return buildRecord({ status: response.status, headers: response.headers, text });
};

const discoverSlugs = async () => {
  const response = await fetch(new URL('/sitemap.xml', baseA), { headers: { 'user-agent': USER_AGENT } });
  if (!response.ok) throw new Error(`sitemap.xml on A answered ${response.status}`);
  const paths = sitemapPaths(parseSitemapLocations(await response.text()));
  return Object.fromEntries(SECTIONS.map((section) => [section, pickSectionSlugs(paths, section)]));
};

const compareProbe = async (probe) => {
  const [a, b] = await Promise.all([fetchRecord(baseA, probe.path), fetchRecord(baseB, probe.path)]);
  const { accepted, mismatches } = applyWhitelist(probe.path, diffRecords(a, b), WHITELIST);
  const unexpectedStatus = a.status !== `${probe.expect}`;
  return { probe, a, b, accepted, mismatches, unexpectedStatus };
};

const runPool = async (items, worker) => {
  const results = new Array(items.length);
  const queue = [...items.entries()];
  const next = async () => {
    const item = queue.shift();
    if (item === undefined) return;
    const [index, value] = item;
    results[index] = await worker(value);
    await next();
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, next));
  return results;
};

const truncate = (value) => {
  const text = `${value}`.replace(/\n/g, '⏎');
  return text.length > 90 ? `${text.slice(0, 87)}...` : text;
};

const resultStatus = (result) => {
  if (result.unexpectedStatus) return 'A-STATUS';
  if (result.mismatches.length > 0) return 'MISMATCH';
  if (result.accepted.length > 0) return 'OK*';
  return 'OK';
};

const printTable = (results) => {
  console.log(`parity: A=${baseA} B=${baseB}`);
  console.log('');
  console.log('| result | path | A status | B status | notes |');
  console.log('| --- | --- | --- | --- | --- |');
  for (const result of results) {
    const notes = [
      ...(result.unexpectedStatus ? [`A expected ${result.probe.expect}`] : []),
      ...result.mismatches.map((diff) => `${diff.field}: A=${truncate(diff.a)} / B=${truncate(diff.b)}`),
      ...result.accepted.map(({ diff, entry }) => `${diff.field} (whitelisted: ${entry.id})`),
    ];
    console.log(`| ${resultStatus(result)} | \`${result.probe.path}\` | ${result.a.status} | ${result.b.status} | ${notes.join('; ')} |`);
  }
};

const printBodyDiffs = (results) => {
  for (const result of results) {
    const body = result.mismatches.find((diff) => diff.field === 'body');
    if (body === undefined) continue;
    const linesA = `${body.a}`.split('\n');
    const linesB = `${body.b}`.split('\n');
    const index = linesA.findIndex((line, i) => line !== linesB[i]);
    console.log('');
    console.log(`body diff ${result.probe.path} (first differing line ${index + 1}):`);
    console.log(`  A: ${truncate(linesA[index] ?? '∅')}`);
    console.log(`  B: ${truncate(linesB[index] ?? '∅')}`);
  }
};

const main = async () => {
  const slugs = await discoverSlugs();
  const probes = buildProbes(slugs);
  const results = await runPool(probes, compareProbe);
  const usedIDs = new Set(results.flatMap((result) => result.accepted.map(({ entry }) => entry.id)));
  const unused = WHITELIST.filter((entry) => !usedIDs.has(entry.id));
  const failed = results.filter((result) => result.unexpectedStatus || result.mismatches.length > 0);

  if (asJSON) {
    console.log(JSON.stringify({ slugs, results, unused: unused.map((entry) => entry.id) }, null, 2));
  } else {
    console.log(`slugs: ${JSON.stringify(slugs)}`);
    printTable(results);
    printBodyDiffs(results);
    console.log('');
    console.log(`whitelist entries unused: ${unused.length === 0 ? 'none' : unused.map((entry) => entry.id).join(', ')}`);
    console.log(`probes: ${results.length}, failing: ${failed.length}, mismatched fields: ${results.reduce((sum, result) => sum + result.mismatches.length, 0)}`);
  }
  process.exit(failed.length === 0 ? 0 : 1);
};

await main();
