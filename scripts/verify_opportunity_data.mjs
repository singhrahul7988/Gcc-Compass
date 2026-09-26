import assert from 'node:assert/strict';
import { createServer } from 'vite';
const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  // This verifier loads server modules only; a browser dependency scan is unnecessary.
  optimizeDeps: { noDiscovery: true, include: [] },
});
try {
  const { buildOpportunities, reportedTeam, teamBand, activityDate } = await server.ssrLoadModule('/src/components/opportunityData.ts');
  const { gccRecords } = await server.ssrLoadModule('/src/data/index.ts');
  const actual = buildOpportunities(gccRecords);
  assert.ok(actual.length > 0);
  assert.equal(new Set(actual.map(item => item.company.gcc_id)).size, actual.length, 'One latest signal per company');
  assert.ok(actual.every(item => gccRecords.some(record => record.gcc_id === item.company.gcc_id)), 'Every row joins to actual directory data');
  assert.ok(actual.every(item => item.sourceUrl.startsWith('https://gccindex.in/company/')));
  assert.deepEqual(reportedTeam('Expanded to 55,000 sq ft. No headcount was disclosed.'), { teamSize: 'Not disclosed', teamNumber: null });
  assert.deepEqual(reportedTeam('Initially employing 50 staff.'), { teamSize: '50', teamNumber: 50 });
  assert.deepEqual(reportedTeam('A workforce of over 150 staff.'), { teamSize: '150+', teamNumber: 150 });
  assert.deepEqual(reportedTeam('A 200–300-seat delivery centre.'), { teamSize: '200–300', teamNumber: 200 });
  const company = { ...gccRecords[0], gcc_id: 'TEST', parent_company: 'Example Co', primary_city: 'Pune', cities: 'Pune, Bengaluru', functions: 'Unknown', headcount_band: '10,000+ people' };
  const event = { company_name: 'Example Co', profile_url: 'https://gccindex.in/company/example', event_type: 'pipeline', event_title: 'Intent announced', event_date: '1 Jan 2026', event_detail: 'Plans for an engineering centre in Pune.' };
  const signals = buildOpportunities([company], [event, { ...event, company_name: 'Company not in directory' }, { ...event, event_date: '2 Jan 2026', event_type: 'mca', event_title: 'Subsidiary incorporated' }, { ...event, event_date: '3 Jan 2026', event_type: 'news', event_title: 'Expansion — Bengaluru', event_detail: 'Expanded a Bengaluru engineering hub. Headcount not disclosed.' }], new Date('2026-01-04T00:00:00Z'));
  assert.equal(signals.length, 1);
  assert.deepEqual(signals[0].cities, ['Bengaluru']);
  assert.equal(signals[0].status, 'open');
  assert.equal(signals[0].teamSize, 'Not disclosed', 'Company headcount must not be presented as an opportunity team size');
  assert.equal(teamBand(signals[0]), 'unknown');
  assert.equal(signals[0].date, activityDate('3 Jan 2026'));
  assert.equal(buildOpportunities([company], [event], new Date('2026-01-04T00:00:00Z'))[0].status, 'upcoming');
  const lease = buildOpportunities([company], [{ ...event, event_title: 'Market Signal', event_detail: 'Leased office space in Pune with a security deposit.' }], new Date('2026-01-04T00:00:00Z'))[0];
  assert.equal(lease.status, 'open');
  assert.ok(!lease.focus.includes('Cybersecurity'), 'Financial security deposits are not cybersecurity capabilities');
  assert.ok(lease.focus.includes('Workplace'));
  console.log(JSON.stringify({ result: 'passed', dataBackedCompanies: actual.length, checks: ['directory join', 'latest signal deduplication', 'published sources', 'pipeline classification', 'location from announcement', 'reported team size', 'no invented opportunity headcount'] }, null, 2));
} finally { await server.close(); }
